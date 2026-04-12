from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, JournalEntry, DailyChecklist, VitalLog
from datetime import date, datetime, timedelta
from sqlalchemy import func

journal_bp = Blueprint('journal', __name__)


# ── Today's checklist ────────────────────────────────────────
@journal_bp.route('/checklist/today', methods=['GET'])
@jwt_required()
def get_today_checklist():
    user_id = int(get_jwt_identity())
    today   = date.today()

    checklist = DailyChecklist.query.filter_by(
        user_id=user_id, date=today
    ).first()

    if not checklist:
        # Auto-create today's entry
        checklist = DailyChecklist(user_id=user_id, date=today)
        db.session.add(checklist)
        db.session.commit()

    return jsonify({'success': True, 'checklist': checklist.to_dict()}), 200


@journal_bp.route('/checklist/today', methods=['PUT'])
@jwt_required()
def update_today_checklist():
    user_id = int(get_jwt_identity())
    today   = date.today()
    data    = request.get_json() or {}

    checklist = DailyChecklist.query.filter_by(
        user_id=user_id, date=today
    ).first()

    if not checklist:
        checklist = DailyChecklist(user_id=user_id, date=today)
        db.session.add(checklist)

    # Update only provided fields
    bool_fields  = ['vitamins_taken', 'water_goal_met', 'stress_managed', 'exercise_done']
    float_fields = ['sleep_hours', 'water_liters']

    for f in bool_fields:
        if f in data:
            setattr(checklist, f, bool(data[f]))
    for f in float_fields:
        if f in data:
            try:
                setattr(checklist, f, float(data[f]))
            except (TypeError, ValueError):
                pass

    db.session.commit()
    return jsonify({'success': True, 'checklist': checklist.to_dict()}), 200


# ── Journal entries ──────────────────────────────────────────
@journal_bp.route('/entries', methods=['GET'])
@jwt_required()
def get_entries():
    user_id = int(get_jwt_identity())

    # Optional query params
    limit = min(int(request.args.get('limit', 30)), 100)
    page  = max(int(request.args.get('page',  1)),  1)

    entries = (JournalEntry.query
               .filter_by(user_id=user_id)
               .order_by(JournalEntry.date.desc(), JournalEntry.created_at.desc())
               .limit(limit).offset((page - 1) * limit)
               .all())

    total = JournalEntry.query.filter_by(user_id=user_id).count()

    return jsonify({
        'success': True,
        'entries': [e.to_dict() for e in entries],
        'total':   total,
        'page':    page,
    }), 200


@journal_bp.route('/entries', methods=['POST'])
@jwt_required()
def create_entry():
    user_id = int(get_jwt_identity())
    data    = request.get_json() or {}

    mood = data.get('mood', '').strip()
    if mood not in ('Happy', 'Sad', 'Calm', 'Anxious', 'Tired', 'Excited', 'Grateful'):
        return jsonify({'success': False, 'error': 'Invalid mood value.'}), 422

    entry_date = date.today()
    if data.get('date'):
        try:
            entry_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    entry = JournalEntry(
        user_id      = user_id,
        date         = entry_date,
        mood         = mood,
        text_content = data.get('text_content', '').strip(),
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({'success': True, 'entry': entry.to_dict()}), 201


@journal_bp.route('/entries/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_entry(entry_id):
    user_id = int(get_jwt_identity())
    entry   = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()

    if not entry:
        return jsonify({'success': False, 'error': 'Entry not found.'}), 404

    data = request.get_json() or {}
    if 'mood' in data and data['mood'] in ('Happy', 'Sad', 'Calm', 'Anxious', 'Tired', 'Excited', 'Grateful'):
        entry.mood = data['mood']
    if 'text_content' in data:
        entry.text_content = data['text_content'].strip()

    db.session.commit()
    return jsonify({'success': True, 'entry': entry.to_dict()}), 200


@journal_bp.route('/entries/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry(entry_id):
    user_id = int(get_jwt_identity())
    entry   = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()

    if not entry:
        return jsonify({'success': False, 'error': 'Entry not found.'}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Entry deleted.'}), 200


# ── Dashboard summary (main hub data) ───────────────────────
@journal_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    today   = date.today()

    # ── Streak: consecutive days with a journal entry ────────
    streak = 0
    check_date = today
    while True:
        exists = JournalEntry.query.filter_by(
            user_id=user_id, date=check_date
        ).first()
        if not exists:
            break
        streak     += 1
        check_date -= timedelta(days=1)

    # ── Mood distribution last 7 days ───────────────────────
    week_ago = today - timedelta(days=6)
    mood_rows = (
        db.session.query(JournalEntry.mood, func.count(JournalEntry.mood))
        .filter(
            JournalEntry.user_id == user_id,
            JournalEntry.date    >= week_ago,
        )
        .group_by(JournalEntry.mood)
        .all()
    )
    mood_summary = {row[0]: row[1] for row in mood_rows}

    # ── Last risk prediction ─────────────────────────────────
    last_log = (VitalLog.query
                .filter_by(user_id=user_id)
                .order_by(VitalLog.logged_at.desc())
                .first())

    # ── Total predictions ────────────────────────────────────
    total_predictions = VitalLog.query.filter_by(user_id=user_id).count()

    # ── Days since registration ──────────────────────────────
    days_tracking = (today - user.created_at.date()).days + 1

    # ── Weeks pregnant estimate (from trimester if no due date) ─
    weeks_pregnant = None
    if user.due_date:
        days_remaining = (user.due_date - today).days
        total_days     = 280   # 40 weeks
        weeks_pregnant = max(0, round((total_days - days_remaining) / 7))

    # ── Journal entries this week ────────────────────────────
    entries_this_week = JournalEntry.query.filter(
        JournalEntry.user_id == user_id,
        JournalEntry.date    >= week_ago,
    ).count()

    return jsonify({
        'success': True,
        'summary': {
            'streak':            streak,
            'mood_summary':      mood_summary,
            'last_risk':         last_log.to_dict() if last_log else None,
            'total_predictions': total_predictions,
            'days_tracking':     days_tracking,
            'weeks_pregnant':    weeks_pregnant,
            'entries_this_week': entries_this_week,
            'trimester':         user.trimester,
            'due_date':          user.due_date.isoformat() if user.due_date else None,
        }
    }), 200


# ── Mood calendar (last 30 days) ─────────────────────────────
@journal_bp.route('/mood-calendar', methods=['GET'])
@jwt_required()
def get_mood_calendar():
    user_id  = int(get_jwt_identity())
    today    = date.today()
    month_ago = today - timedelta(days=29)

    entries = (JournalEntry.query
               .filter(
                   JournalEntry.user_id == user_id,
                   JournalEntry.date    >= month_ago,
               )
               .order_by(JournalEntry.date.asc())
               .all())

    calendar = {}
    for e in entries:
        calendar[e.date.isoformat()] = {
            'mood':  e.mood,
            'has_text': bool(e.text_content),
        }

    return jsonify({'success': True, 'calendar': calendar}), 200
