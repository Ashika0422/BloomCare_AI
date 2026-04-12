from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, VitalLog
import joblib
import numpy as np
import os

predict_bp = Blueprint('predict', __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load model artifacts once at startup
try:
    model  = joblib.load(os.path.join(BASE_DIR, 'models', 'model.pkl'))
    scaler = joblib.load(os.path.join(BASE_DIR, 'models', 'scaler.pkl'))
    print("✓ ML model loaded")
except Exception as e:
    model  = None
    scaler = None
    print(f"⚠ Could not load model: {e}")

RISK_LABELS = {
    0: {
        'label':   'Low Risk',   'color': 'green', 'icon': '🟢',
        'message': 'Your vitals appear normal. Continue routine prenatal checkups.',
        'action':  'Maintain regular antenatal visits every 4 weeks.',
    },
    1: {
        'label':   'Mid Risk',   'color': 'orange', 'icon': '🟡',
        'message': 'Some indicators need monitoring. Consult your doctor soon.',
        'action':  'Schedule a checkup within the next 1–2 weeks.',
    },
    2: {
        'label':   'High Risk',  'color': 'red', 'icon': '🔴',
        'message': 'Critical indicators detected. Immediate medical attention advised.',
        'action':  'Please visit a hospital or contact your doctor immediately.',
    },
}

VALID_RANGES = {
    'systolicBP':   (70,  180),
    'diastolicBP':  (40,  120),
    'bloodGlucose': (1.0, 30.0),
    'bodyTemp':     (95.0,104.0),
    'heartRate':    (40,  120),
}

def validate_vitals(data):
    errors = []
    for field, (mn, mx) in VALID_RANGES.items():
        if field not in data:
            errors.append(f'Missing field: {field}')
            continue
        try:
            v = float(data[field])
            if not (mn <= v <= mx):
                errors.append(f'{field} must be between {mn} and {mx}.')
        except (ValueError, TypeError):
            errors.append(f'{field} must be a number.')
    return errors


@predict_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict():
    if not model or not scaler:
        return jsonify({'success': False, 'error': 'Model not loaded.'}), 503

    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided.'}), 400

    errors = validate_vitals(data)
    if errors:
        return jsonify({'success': False, 'errors': errors}), 422

    features = np.array([[
        float(user.age),
        float(data['systolicBP']),
        float(data['diastolicBP']),
        float(data['bloodGlucose']),
        float(data['bodyTemp']),
        float(data['heartRate']),
    ]])

    features_scaled  = scaler.transform(features)
    prediction       = int(model.predict(features_scaled)[0])
    probabilities    = model.predict_proba(features_scaled)[0]
    confidence       = round(float(probabilities[prediction]) * 100, 1)

    # Feature importance / explainability
    feature_names  = ['Age', 'Systolic BP', 'Diastolic BP', 'Blood Glucose', 'Body Temp', 'Heart Rate']
    importances    = model.feature_importances_
    feature_impact = [
        {'feature': name, 'impact': round(float(imp) * 100, 1)}
        for name, imp in zip(feature_names, importances)
    ]
    feature_impact.sort(key=lambda x: x['impact'], reverse=True)

    # Save to database
    log = VitalLog(
        user_id      = user_id,
        systolic_bp  = float(data['systolicBP']),
        diastolic_bp = float(data['diastolicBP']),
        blood_glucose= float(data['bloodGlucose']),
        body_temp    = float(data['bodyTemp']),
        heart_rate   = float(data['heartRate']),
        risk_level   = prediction,
        confidence   = confidence,
        prob_low     = round(float(probabilities[0]) * 100, 1),
        prob_mid     = round(float(probabilities[1]) * 100, 1),
        prob_high    = round(float(probabilities[2]) * 100, 1),
    )
    db.session.add(log)
    db.session.commit()

    risk_info = RISK_LABELS[prediction]

    return jsonify({
        'success':        True,
        'log_id':         log.id,
        'prediction':     prediction,
        'risk_label':     risk_info['label'],
        'risk_color':     risk_info['color'],
        'risk_icon':      risk_info['icon'],
        'message':        risk_info['message'],
        'action':         risk_info['action'],
        'confidence':     confidence,
        'input_received': {
            'Age':          user.age,
            'Systolic BP':  float(data['systolicBP']),
            'Diastolic BP': float(data['diastolicBP']),
            'Blood Glucose':float(data['bloodGlucose']),
            'Body Temp':    float(data['bodyTemp']),
            'Heart Rate':   float(data['heartRate']),
        },
        'feature_impact': feature_impact,
        'probabilities': {
            'low_risk':  round(float(probabilities[0]) * 100, 1),
            'mid_risk':  round(float(probabilities[1]) * 100, 1),
            'high_risk': round(float(probabilities[2]) * 100, 1),
        },
    }), 200


@predict_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    logs = (VitalLog.query
            .filter_by(user_id=user_id)
            .order_by(VitalLog.logged_at.desc())
            .limit(50).all())
    return jsonify({
        'success': True,
        'history': [l.to_dict() for l in logs],
        'total':   len(logs),
    }), 200
