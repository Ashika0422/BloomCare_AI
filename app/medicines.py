from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Medicine
from datetime import datetime, date

medicines_bp = Blueprint('medicines', __name__)

VALID_FREQUENCIES = ['Daily', 'Weekly', 'Twice Daily', 'Every Other Day', 'As Needed']
DAYS_OF_WEEK      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']


def validate_medicine(data):
    errors = []
    if not data.get('medicine_name', '').strip():
        errors.append('Medicine name is required.')
    if not data.get('time_to_take', '').strip():
        errors.append('Time to take is required.')
    freq = data.get('frequency', '')
    if freq not in VALID_FREQUENCIES:
        errors.append(f'Frequency must be one of: {", ".join(VALID_FREQUENCIES)}')
    if freq == 'Weekly':
        days = data.get('days_of_week', [])
        if not days:
            errors.append('Select at least one day for weekly medicines.')
        invalid = [d for d in days if d not in DAYS_OF_WEEK]
        if invalid:
            errors.append(f'Invalid days: {", ".join(invalid)}')
    return errors


# ── Get all medicines ────────────────────────────────────────
@medicines_bp.route('/', methods=['GET'])
@jwt_required()
def get_medicines():
    user_id    = int(get_jwt_identity())
    active_only = request.args.get('active', 'false').lower() == 'true'

    query = Medicine.query.filter_by(user_id=user_id)
    if active_only:
        query = query.filter_by(is_active=True)

    meds = query.order_by(Medicine.time_to_take.asc()).all()
    return jsonify({'success': True, 'medicines': [m.to_dict() for m in meds]}), 200


# ── Get today's medicines with taken status ──────────────────
@medicines_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today():
    user_id   = int(get_jwt_identity())
    today     = date.today()
    today_str = today.strftime('%a')[:3]   # 'Mon', 'Tue', etc.

    active_meds = Medicine.query.filter_by(user_id=user_id, is_active=True).all()
    today_meds  = []

    for med in active_meds:
        include = False
        if med.frequency in ('Daily', 'Twice Daily', 'As Needed'):
            include = True
        elif med.frequency == 'Every Other Day':
            # Simple alternating logic based on day number
            day_num = (today - date(2024, 1, 1)).days
            include = day_num % 2 == 0
        elif med.frequency == 'Weekly' and med.days_of_week:
            days = [d.strip() for d in med.days_of_week.split(',')]
            include = today_str in days

        if include:
            med_dict          = med.to_dict()
            med_dict['taken'] = False   # client tracks taken state via localStorage
            today_meds.append(med_dict)

    today_meds.sort(key=lambda m: m['time_to_take'])
    return jsonify({'success': True, 'today': today_meds, 'date': today.isoformat()}), 200


# ── Add medicine ─────────────────────────────────────────────
@medicines_bp.route('/', methods=['POST'])
@jwt_required()
def add_medicine():
    user_id = int(get_jwt_identity())
    data    = request.get_json() or {}

    errors = validate_medicine(data)
    if errors:
        return jsonify({'success': False, 'errors': errors}), 422

    days_str = None
    if data.get('frequency') == 'Weekly' and data.get('days_of_week'):
        days_str = ','.join(data['days_of_week'])

    med = Medicine(
        user_id       = user_id,
        medicine_name = data['medicine_name'].strip(),
        time_to_take  = data['time_to_take'].strip(),
        frequency     = data['frequency'],
        days_of_week  = days_str,
        notes         = data.get('notes', '').strip() or None,
        is_active     = True,
    )
    db.session.add(med)
    db.session.commit()

    return jsonify({'success': True, 'medicine': med.to_dict()}), 201


# ── Update medicine ──────────────────────────────────────────
@medicines_bp.route('/<int:med_id>', methods=['PUT'])
@jwt_required()
def update_medicine(med_id):
    user_id = int(get_jwt_identity())
    med     = Medicine.query.filter_by(id=med_id, user_id=user_id).first()
    if not med:
        return jsonify({'success': False, 'error': 'Medicine not found.'}), 404

    data = request.get_json() or {}

    if 'medicine_name' in data and data['medicine_name'].strip():
        med.medicine_name = data['medicine_name'].strip()
    if 'time_to_take' in data and data['time_to_take'].strip():
        med.time_to_take = data['time_to_take'].strip()
    if 'frequency' in data and data['frequency'] in VALID_FREQUENCIES:
        med.frequency = data['frequency']
    if 'days_of_week' in data:
        med.days_of_week = ','.join(data['days_of_week']) if data['days_of_week'] else None
    if 'notes' in data:
        med.notes = data['notes'].strip() or None
    if 'is_active' in data:
        med.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify({'success': True, 'medicine': med.to_dict()}), 200


# ── Toggle active/inactive ───────────────────────────────────
@medicines_bp.route('/<int:med_id>/toggle', methods=['PATCH'])
@jwt_required()
def toggle_medicine(med_id):
    user_id = int(get_jwt_identity())
    med     = Medicine.query.filter_by(id=med_id, user_id=user_id).first()
    if not med:
        return jsonify({'success': False, 'error': 'Medicine not found.'}), 404

    med.is_active = not med.is_active
    db.session.commit()
    return jsonify({'success': True, 'is_active': med.is_active}), 200


# ── Delete medicine ──────────────────────────────────────────
@medicines_bp.route('/<int:med_id>', methods=['DELETE'])
@jwt_required()
def delete_medicine(med_id):
    user_id = int(get_jwt_identity())
    med     = Medicine.query.filter_by(id=med_id, user_id=user_id).first()
    if not med:
        return jsonify({'success': False, 'error': 'Medicine not found.'}), 404

    db.session.delete(med)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Medicine deleted.'}), 200