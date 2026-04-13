from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Goal, DailyChecklist
from datetime import date, timedelta

goals_bp = Blueprint('goals', __name__)

VALID_CATEGORIES = [
    'Exercise', 'Nutrition', 'Mindfulness',
    'Sleep', 'Hydration', 'Medical', 'Personal', 'Other'
]


# ── Get all goals ────────────────────────────────────────────
@goals_bp.route('/', methods=['GET'])
@jwt_required()
def get_goals():
    user_id = int(get_jwt_identity())
    goals   = Goal.query.filter_by(user_id=user_id).order_by(Goal.created_at.desc()).all()
    return jsonify({'success': True, 'goals': [g.to_dict() for g in goals]}), 200


# ── Create goal ──────────────────────────────────────────────
@goals_bp.route('/', methods=['POST'])
@jwt_required()
def create_goal():
    user_id = int(get_jwt_identity())
    data    = request.get_json() or {}

    errors = []
    if not data.get('title', '').strip():
        errors.append('Goal title is required.')
    if data.get('category') not in VALID_CATEGORIES:
        errors.append(f'Category must be one of: {", ".join(VALID_CATEGORIES)}')
    try:
        target = int(data.get('target_value', 100))
        if not (1 <= target <= 1000):
            errors.append('Target value must be between 1 and 1000.')
    except (TypeError, ValueError):
        errors.append('Target value must be a number.')

    if errors:
        return jsonify({'success': False, 'errors': errors}), 422

    week_start = None
    if data.get('week_start'):
        try:
            week_start = date.fromisoformat(data['week_start'])
        except ValueError:
            pass
    if not week_start:
        today      = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday

    goal = Goal(
        user_id          = user_id,
        title            = data['title'].strip(),
        category         = data['category'],
        target_value     = int(data.get('target_value', 100)),
        current_progress = max(0, min(int(data.get('current_progress', 0)), int(data.get('target_value', 100)))),
        week_start       = week_start,
        is_daily_reset   = bool(data.get('is_daily_reset', False)),
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({'success': True, 'goal': goal.to_dict()}), 201


# ── Update goal progress ─────────────────────────────────────
@goals_bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal    = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'success': False, 'error': 'Goal not found.'}), 404

    data = request.get_json() or {}

    if 'title' in data and data['title'].strip():
        goal.title = data['title'].strip()
    if 'category' in data and data['category'] in VALID_CATEGORIES:
        goal.category = data['category']
    if 'target_value' in data:
        try:
            goal.target_value = max(1, int(data['target_value']))
        except (TypeError, ValueError):
            pass
    if 'current_progress' in data:
        try:
            goal.current_progress = max(0, min(int(data['current_progress']), goal.target_value))
        except (TypeError, ValueError):
            pass

    db.session.commit()
    return jsonify({'success': True, 'goal': goal.to_dict()}), 200


# ── Delete goal ──────────────────────────────────────────────
@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal    = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'success': False, 'error': 'Goal not found.'}), 404

    db.session.delete(goal)
    db.session.commit()
    return jsonify({'success': True}), 200


# ── Today's checklist (shared with journal module) ───────────
@goals_bp.route('/checklist/today', methods=['GET'])
@jwt_required()
def get_checklist():
    user_id = int(get_jwt_identity())
    today   = date.today()

    checklist = DailyChecklist.query.filter_by(user_id=user_id, date=today).first()
    if not checklist:
        checklist = DailyChecklist(user_id=user_id, date=today)
        db.session.add(checklist)
        db.session.commit()

    return jsonify({'success': True, 'checklist': checklist.to_dict()}), 200


@goals_bp.route('/checklist/today', methods=['PUT'])
@jwt_required()
def update_checklist():
    user_id   = int(get_jwt_identity())
    today     = date.today()
    data      = request.get_json() or {}

    checklist = DailyChecklist.query.filter_by(user_id=user_id, date=today).first()
    if not checklist:
        checklist = DailyChecklist(user_id=user_id, date=today)
        db.session.add(checklist)

    for f in ['vitamins_taken', 'water_goal_met', 'stress_managed', 'exercise_done']:
        if f in data:
            setattr(checklist, f, bool(data[f]))
    for f in ['sleep_hours', 'water_liters']:
        if f in data:
            try:
                setattr(checklist, f, float(data[f]))
            except (TypeError, ValueError):
                pass

    db.session.commit()
    return jsonify({'success': True, 'checklist': checklist.to_dict()}), 200


# ── Weekly stats ─────────────────────────────────────────────
@goals_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id   = int(get_jwt_identity())
    today     = date.today()
    week_ago  = today - timedelta(days=6)

    checklists = DailyChecklist.query.filter(
        DailyChecklist.user_id == user_id,
        DailyChecklist.date    >= week_ago,
    ).all()

    total_days     = len(checklists)
    vitamins_days  = sum(1 for c in checklists if c.vitamins_taken)
    water_days     = sum(1 for c in checklists if c.water_goal_met)
    stress_days    = sum(1 for c in checklists if c.stress_managed)
    exercise_days  = sum(1 for c in checklists if c.exercise_done)
    avg_sleep      = (
        sum(c.sleep_hours for c in checklists if c.sleep_hours)
        / max(1, sum(1 for c in checklists if c.sleep_hours))
    )
    avg_water      = (
        sum(c.water_liters for c in checklists if c.water_liters)
        / max(1, sum(1 for c in checklists if c.water_liters))
    )

    goals     = Goal.query.filter_by(user_id=user_id).all()
    completed = sum(1 for g in goals if g.current_progress >= g.target_value)

    return jsonify({
        'success': True,
        'stats': {
            'total_days':    total_days,
            'vitamins_days': vitamins_days,
            'water_days':    water_days,
            'stress_days':   stress_days,
            'exercise_days': exercise_days,
            'avg_sleep':     round(avg_sleep, 1),
            'avg_water':     round(avg_water, 1),
            'total_goals':   len(goals),
            'completed_goals': completed,
        },
    }), 200