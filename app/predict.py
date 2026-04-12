from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, VitalLog
import joblib
import numpy as np
import os

predict_bp = Blueprint('predict', __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

try:
    model  = joblib.load(os.path.join(BASE_DIR, 'models', 'model.pkl'))
    scaler = joblib.load(os.path.join(BASE_DIR, 'models', 'scaler.pkl'))
    print("✓ ML model loaded")
except Exception as e:
    model = scaler = None
    print(f"⚠ Model load failed: {e}")

RISK_LABELS = {
    0: {
        'label': 'Low Risk', 'color': 'green', 'icon': '🟢',
        'message': 'Your vitals appear within normal range. Continue routine prenatal checkups.',
        'action':  'Maintain regular antenatal visits every 4 weeks.',
        'urgency': 'routine',
    },
    1: {
        'label': 'Mid Risk', 'color': 'orange', 'icon': '🟡',
        'message': 'Some indicators need monitoring. Consult your doctor soon.',
        'action':  'Schedule a checkup within the next 1–2 weeks.',
        'urgency': 'soon',
    },
    2: {
        'label': 'High Risk', 'color': 'red', 'icon': '🔴',
        'message': 'Critical indicators detected. Immediate medical attention is strongly advised.',
        'action':  'Please visit a hospital or contact your doctor immediately.',
        'urgency': 'immediate',
    },
}

VALID_RANGES = {
    'systolicBP':   (70,  180),
    'diastolicBP':  (40,  120),
    'bloodGlucose': (1.0, 30.0),
    'bodyTemp':     (95.0,104.0),
    'heartRate':    (40,  120),
}

NORMAL_RANGES = {
    'systolicBP':   (90,  120),
    'diastolicBP':  (60,  80),
    'bloodGlucose': (3.9, 7.8),
    'bodyTemp':     (97.0,99.0),
    'heartRate':    (60,  100),
}

FEATURE_LABELS = {
    'systolicBP':   'Systolic BP',
    'diastolicBP':  'Diastolic BP',
    'bloodGlucose': 'Blood Glucose',
    'bodyTemp':     'Body Temperature',
    'heartRate':    'Heart Rate',
    'age':          'Maternal Age',
}

FEATURE_UNITS = {
    'systolicBP':   'mmHg',
    'diastolicBP':  'mmHg',
    'bloodGlucose': 'mmol/L',
    'bodyTemp':     '°F',
    'heartRate':    'bpm',
    'age':          'years',
}


def validate_vitals(data):
    errors = []
    for field, (mn, mx) in VALID_RANGES.items():
        if field not in data:
            errors.append(f'Missing: {field}')
            continue
        try:
            v = float(data[field])
            if not (mn <= v <= mx):
                errors.append(f'{field} must be {mn}–{mx}.')
        except (ValueError, TypeError):
            errors.append(f'{field} must be a number.')
    return errors


def get_parameter_status(field, value):
    """Returns whether a value is normal, high, or low."""
    if field not in NORMAL_RANGES:
        return 'normal'
    mn, mx = NORMAL_RANGES[field]
    if value < mn:
        return 'low'
    if value > mx:
        return 'high'
    return 'normal'


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

    age             = float(user.age)
    systolic_bp     = float(data['systolicBP'])
    diastolic_bp    = float(data['diastolicBP'])
    blood_glucose   = float(data['bloodGlucose'])
    body_temp       = float(data['bodyTemp'])
    heart_rate      = float(data['heartRate'])

    features        = np.array([[age, systolic_bp, diastolic_bp, blood_glucose, body_temp, heart_rate]])
    features_scaled = scaler.transform(features)
    prediction      = int(model.predict(features_scaled)[0])
    probabilities   = model.predict_proba(features_scaled)[0]
    confidence      = round(float(probabilities[prediction]) * 100, 1)

    # ── Feature importance × parameter deviation from normal ─
    importances    = model.feature_importances_
    feature_keys   = ['age', 'systolicBP', 'diastolicBP', 'bloodGlucose', 'bodyTemp', 'heartRate']
    feature_values = [age, systolic_bp, diastolic_bp, blood_glucose, body_temp, heart_rate]

    feature_impact = []
    for key, val, imp in zip(feature_keys, feature_values, importances):
        status = get_parameter_status(key, val)
        feature_impact.append({
            'key':    key,
            'label':  FEATURE_LABELS.get(key, key),
            'value':  round(val, 1),
            'unit':   FEATURE_UNITS.get(key, ''),
            'impact': round(float(imp) * 100, 1),
            'status': status,
        })
    feature_impact.sort(key=lambda x: x['impact'], reverse=True)

    # ── Save to DB ───────────────────────────────────────────
    log = VitalLog(
        user_id       = user_id,
        systolic_bp   = systolic_bp,
        diastolic_bp  = diastolic_bp,
        blood_glucose = blood_glucose,
        body_temp     = body_temp,
        heart_rate    = heart_rate,
        risk_level    = prediction,
        confidence    = confidence,
        prob_low      = round(float(probabilities[0]) * 100, 1),
        prob_mid      = round(float(probabilities[1]) * 100, 1),
        prob_high     = round(float(probabilities[2]) * 100, 1),
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
        'urgency':        risk_info['urgency'],
        'confidence':     confidence,
        'feature_impact': feature_impact,
        'probabilities': {
            'low_risk':  round(float(probabilities[0]) * 100, 1),
            'mid_risk':  round(float(probabilities[1]) * 100, 1),
            'high_risk': round(float(probabilities[2]) * 100, 1),
        },
        'logged_at': log.logged_at.isoformat(),
    }), 200


@predict_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    limit   = min(int(request.args.get('limit', 50)), 100)
    logs = (VitalLog.query
            .filter_by(user_id=user_id)
            .order_by(VitalLog.logged_at.desc())
            .limit(limit).all())
    return jsonify({
        'success': True,
        'history': [l.to_dict() for l in logs],
        'total':   len(logs),
    }), 200