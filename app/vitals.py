from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import VitalLog, User
from datetime import datetime, timedelta
from sqlalchemy import func

vitals_bp = Blueprint('vitals', __name__)

VITAL_FIELDS = ['systolic_bp', 'diastolic_bp', 'blood_glucose', 'body_temp', 'heart_rate']

NORMAL_RANGES = {
    'systolic_bp':   {'min': 90,  'max': 120, 'unit': 'mmHg',   'label': 'Systolic BP'},
    'diastolic_bp':  {'min': 60,  'max': 80,  'unit': 'mmHg',   'label': 'Diastolic BP'},
    'blood_glucose': {'min': 3.9, 'max': 7.8, 'unit': 'mmol/L', 'label': 'Blood Glucose'},
    'body_temp':     {'min': 97.0,'max': 99.0,'unit': '°F',     'label': 'Body Temp'},
    'heart_rate':    {'min': 60,  'max': 100, 'unit': 'bpm',    'label': 'Heart Rate'},
}


# ── Full history with optional limit ────────────────────────
@vitals_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    limit   = min(int(request.args.get('limit', 20)), 100)
    page    = max(int(request.args.get('page', 1)), 1)

    total = VitalLog.query.filter_by(user_id=user_id).count()
    logs = (VitalLog.query
            .filter_by(user_id=user_id)
            .order_by(VitalLog.logged_at.desc())
            .limit(limit)
            .offset((page - 1) * limit)
            .all())

    return jsonify({
        'success': True,
        'history': [l.to_dict() for l in logs],
        'total':   total,
        'page':    page,
        'pages':   max(1, (total + limit - 1) // limit),
    }), 200


# ── Trend data for charts (last N readings per vital) ────────
@vitals_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_trends():
    user_id = int(get_jwt_identity())
    limit   = min(int(request.args.get('limit', 15)), 50)

    logs = (VitalLog.query
            .filter_by(user_id=user_id)
            .order_by(VitalLog.logged_at.desc())
            .limit(limit)
            .all())
    logs = list(reversed(logs))

    # Build time-series arrays per vital
    trend_data = {field: [] for field in VITAL_FIELDS}
    timestamps = []

    for log in logs:
        timestamps.append(log.logged_at.strftime('%b %d %H:%M'))
        for field in VITAL_FIELDS:
            trend_data[field].append(round(getattr(log, field), 1))

    # Latest reading status (normal / high / low)
    latest_status = {}
    if logs:
        last = logs[-1]
        for field, ranges in NORMAL_RANGES.items():
            val = getattr(last, field)
            if val < ranges['min']:
                status = 'low'
            elif val > ranges['max']:
                status = 'high'
            else:
                status = 'normal'
            latest_status[field] = {
                'value':  round(val, 1),
                'status': status,
                'unit':   ranges['unit'],
                'label':  ranges['label'],
                'min':    ranges['min'],
                'max':    ranges['max'],
            }

    return jsonify({
        'success':       True,
        'trend_data':    trend_data,
        'timestamps':    timestamps,
        'latest_status': latest_status,
        'count':         len(logs),
    }), 200


# ── Single latest reading ────────────────────────────────────
@vitals_bp.route('/latest', methods=['GET'])
@jwt_required()
def get_latest():
    user_id = int(get_jwt_identity())
    log = (VitalLog.query
           .filter_by(user_id=user_id)
           .order_by(VitalLog.logged_at.desc())
           .first())

    return jsonify({
        'success': True,
        'latest':  log.to_dict() if log else None,
    }), 200


# ── Risk distribution summary ────────────────────────────────
@vitals_bp.route('/risk-summary', methods=['GET'])
@jwt_required()
def get_risk_summary():
    user_id = int(get_jwt_identity())

    rows = (db.session.query(VitalLog.risk_level, func.count(VitalLog.risk_level))
            .filter(VitalLog.user_id == user_id, VitalLog.risk_level.isnot(None))
            .group_by(VitalLog.risk_level)
            .all())

    distribution = {0: 0, 1: 0, 2: 0}
    for risk_level, count in rows:
        distribution[risk_level] = count

    total = sum(distribution.values())

    # Trend: last 5 vs previous 5
    recent = (VitalLog.query
              .filter_by(user_id=user_id)
              .filter(VitalLog.risk_level.isnot(None))
              .order_by(VitalLog.logged_at.desc())
              .limit(10).all())

    recent_avg  = None
    previous_avg = None
    if len(recent) >= 5:
        recent_avg   = sum(l.risk_level for l in recent[:5])  / 5
    if len(recent) == 10:
        previous_avg = sum(l.risk_level for l in recent[5:]) / 5

    trend = 'stable'
    if recent_avg is not None and previous_avg is not None:
        if recent_avg < previous_avg - 0.1:
            trend = 'improving'
        elif recent_avg > previous_avg + 0.1:
            trend = 'worsening'

    return jsonify({
        'success':      True,
        'distribution': distribution,
        'total':        total,
        'trend':        trend,
    }), 200