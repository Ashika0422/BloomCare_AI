from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, VitalLog, JournalEntry, Medicine, Goal, DailyChecklist
from datetime import datetime, date, timedelta
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)


def require_admin():
    """Returns (user, error_response) — call at start of every admin route."""
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return None, (jsonify({'success': False, 'error': 'User not found.'}), 404)
    if not user.is_admin:
        return None, (jsonify({'success': False, 'error': 'Admin access required.'}), 403)
    return user, None


# ── Platform overview stats ──────────────────────────────────
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_platform_stats():
    admin, err = require_admin()
    if err: return err

    today    = date.today()
    week_ago = today - timedelta(days=7)

    total_users       = User.query.count()
    new_users_week    = User.query.filter(User.created_at >= week_ago).count()
    total_predictions = VitalLog.query.filter(VitalLog.risk_level.isnot(None)).count()
    total_journals    = JournalEntry.query.count()
    total_medicines   = Medicine.query.count()
    total_goals       = Goal.query.count()

    # Risk distribution across ALL users
    risk_rows = (
        db.session.query(VitalLog.risk_level, func.count(VitalLog.risk_level))
        .filter(VitalLog.risk_level.isnot(None))
        .group_by(VitalLog.risk_level)
        .all()
    )
    risk_dist = {0: 0, 1: 0, 2: 0}
    for level, count in risk_rows:
        risk_dist[level] = count

    # Trimester distribution
    trim_rows = (
        db.session.query(User.trimester, func.count(User.id))
        .group_by(User.trimester)
        .all()
    )
    trim_dist = {1: 0, 2: 0, 3: 0}
    for trim, count in trim_rows:
        if trim in trim_dist:
            trim_dist[trim] = count

    # Daily active users (last 7 days — users with at least one vital log)
    daily_active = (
        db.session.query(
            func.date(VitalLog.logged_at).label('day'),
            func.count(func.distinct(VitalLog.user_id)).label('users'),
        )
        .filter(VitalLog.logged_at >= week_ago)
        .group_by(func.date(VitalLog.logged_at))
        .all()
    )
    daily_activity = [
        {'date': str(row.day), 'users': row.users}
        for row in daily_active
    ]

    # Mood distribution (all time)
    mood_rows = (
        db.session.query(JournalEntry.mood, func.count(JournalEntry.mood))
        .group_by(JournalEntry.mood)
        .all()
    )
    mood_dist = {row[0]: row[1] for row in mood_rows}

    return jsonify({
        'success': True,
        'stats': {
            'total_users':       total_users,
            'new_users_week':    new_users_week,
            'total_predictions': total_predictions,
            'total_journals':    total_journals,
            'total_medicines':   total_medicines,
            'total_goals':       total_goals,
            'risk_distribution': risk_dist,
            'trim_distribution': trim_dist,
            'daily_activity':    daily_activity,
            'mood_distribution': mood_dist,
        },
    }), 200


# ── User list with search & filter ──────────────────────────
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    admin, err = require_admin()
    if err: return err

    search    = request.args.get('search', '').strip()
    trimester = request.args.get('trimester')
    risk      = request.args.get('risk')
    page      = max(int(request.args.get('page', 1)), 1)
    per_page  = min(int(request.args.get('per_page', 20)), 100)

    query = User.query

    if search:
        like = f'%{search}%'
        query = query.filter(
            (User.full_name.ilike(like)) |
            (User.email.ilike(like))     |
            (User.username.ilike(like))
        )
    if trimester:
        try:
            query = query.filter_by(trimester=int(trimester))
        except ValueError:
            pass

    users = query.order_by(User.created_at.desc()).all()

    # Enrich with prediction count and last risk
    result = []
    for u in users:
        last_log   = (VitalLog.query
                      .filter_by(user_id=u.id)
                      .order_by(VitalLog.logged_at.desc())
                      .first())
        pred_count = VitalLog.query.filter_by(user_id=u.id).count()

        # Risk filter (post-query)
        if risk is not None:
            try:
                if last_log is None or last_log.risk_level != int(risk):
                    continue
            except ValueError:
                pass

        user_dict                 = u.to_dict()
        user_dict['pred_count']   = pred_count
        user_dict['last_risk']    = last_log.risk_level    if last_log else None
        user_dict['last_conf']    = last_log.confidence    if last_log else None
        user_dict['last_pred_at'] = last_log.logged_at.isoformat() if last_log else None
        result.append(user_dict)

    # Manual pagination after enrichment
    total   = len(result)
    start   = (page - 1) * per_page
    end     = start + per_page
    paged   = result[start:end]

    return jsonify({
        'success':  True,
        'users':    paged,
        'total':    total,
        'page':     page,
        'per_page': per_page,
        'pages':    max(1, -(-total // per_page)),
    }), 200


# ── Single user detail for admin ────────────────────────────
@admin_bp.route('/users/<int:uid>', methods=['GET'])
@jwt_required()
def get_user_detail(uid):
    admin, err = require_admin()
    if err: return err

    user = User.query.get(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    logs = (VitalLog.query
            .filter_by(user_id=uid)
            .order_by(VitalLog.logged_at.desc())
            .limit(20).all())

    journals = (JournalEntry.query
                .filter_by(user_id=uid)
                .order_by(JournalEntry.date.desc())
                .limit(10).all())

    # Risk trend
    risk_trend = [
        {'date': l.logged_at.isoformat(), 'risk': l.risk_level, 'conf': l.confidence}
        for l in reversed(logs)
        if l.risk_level is not None
    ]

    return jsonify({
        'success':    True,
        'user':       user.to_dict(),
        'logs':       [l.to_dict() for l in logs],
        'journals':   [j.to_dict() for j in journals],
        'risk_trend': risk_trend,
    }), 200


# ── Toggle admin status ──────────────────────────────────────
@admin_bp.route('/users/<int:uid>/toggle-admin', methods=['PATCH'])
@jwt_required()
def toggle_admin(uid):
    admin, err = require_admin()
    if err: return err

    if uid == int(get_jwt_identity()):
        return jsonify({'success': False, 'error': 'Cannot change your own admin status.'}), 400

    user = User.query.get(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    user.is_admin = not user.is_admin
    db.session.commit()
    return jsonify({'success': True, 'is_admin': user.is_admin}), 200


# ── Delete user ──────────────────────────────────────────────
@admin_bp.route('/users/<int:uid>', methods=['DELETE'])
@jwt_required()
def delete_user(uid):
    admin, err = require_admin()
    if err: return err

    if uid == int(get_jwt_identity()):
        return jsonify({'success': False, 'error': 'Cannot delete yourself.'}), 400

    user = User.query.get(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': f'User {user.username} deleted.'}), 200


# ── Make self admin (first-time setup helper) ────────────────
@admin_bp.route('/make-admin', methods=['POST'])
@jwt_required()
def make_self_admin():
    """
    One-time setup endpoint: promotes the calling user to admin.
    Disabled once any admin exists on the platform.
    """
    existing_admin = User.query.filter_by(is_admin=True).first()
    if existing_admin:
        return jsonify({
            'success': False,
            'error': 'An admin already exists. Contact them to grant admin access.',
        }), 403

    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    user.is_admin = True
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'{user.full_name} is now an admin.',
        'user':    user.to_dict(),
    }), 200