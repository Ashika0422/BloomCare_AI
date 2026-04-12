from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from database import db
from models import User
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename

auth_bp = Blueprint('auth', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_registration(data):
    """Validate all registration fields. Returns list of error strings."""
    errors = []

    if not data.get('username') or len(data['username'].strip()) < 3:
        errors.append('Username must be at least 3 characters.')
    if not data.get('email') or '@' not in data['email']:
        errors.append('A valid email address is required.')
    if not data.get('password') or len(data['password']) < 6:
        errors.append('Password must be at least 6 characters.')
    if not data.get('full_name') or len(data['full_name'].strip()) < 2:
        errors.append('Full name is required.')

    age = data.get('age')
    try:
        age = int(age)
        if not (10 <= age <= 70):
            errors.append('Age must be between 10 and 70.')
    except (TypeError, ValueError):
        errors.append('Age must be a valid number.')

    trimester = data.get('trimester')
    try:
        trimester = int(trimester)
        if trimester not in (1, 2, 3):
            errors.append('Trimester must be 1, 2, or 3.')
    except (TypeError, ValueError):
        errors.append('Trimester must be 1, 2, or 3.')

    return errors


# ── Register ────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided.'}), 400

    # Validate
    errors = validate_registration(data)
    if errors:
        return jsonify({'success': False, 'errors': errors}), 422

    # Check duplicates
    if User.query.filter_by(username=data['username'].strip()).first():
        return jsonify({'success': False, 'errors': ['Username already taken.']}), 409
    if User.query.filter_by(email=data['email'].strip().lower()).first():
        return jsonify({'success': False, 'errors': ['Email already registered.']}), 409

    # Parse due_date
    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    # Create user
    user = User(
        username=data['username'].strip(),
        email=data['email'].strip().lower(),
        full_name=data['full_name'].strip(),
        age=int(data['age']),
        trimester=int(data['trimester']),
        due_date=due_date,
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    # Issue token immediately so user is logged in after registration
    token = create_access_token(identity=str(user.id))

    return jsonify({
        'success': True,
        'message': 'Account created successfully!',
        'token':   token,
        'user':    user.to_dict(),
    }), 201


# ── Login ────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided.'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required.'}), 400

    # Find by username OR email
    user = (
        User.query.filter_by(username=username).first() or
        User.query.filter_by(email=username.lower()).first()
    )

    if not user or not user.check_password(password):
        return jsonify({'success': False, 'error': 'Invalid username or password.'}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        'success': True,
        'message': f'Welcome back, {user.full_name}!',
        'token':   token,
        'user':    user.to_dict(),
    }), 200


# ── Get current user (me) ────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404
    return jsonify({'success': True, 'user': user.to_dict()}), 200


# ── Update profile ───────────────────────────────────────────
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided.'}), 400

    # Update allowed fields
    if 'full_name' in data and data['full_name'].strip():
        user.full_name = data['full_name'].strip()
    if 'age' in data:
        try:
            age = int(data['age'])
            if 10 <= age <= 70:
                user.age = age
        except (ValueError, TypeError):
            pass
    if 'trimester' in data:
        try:
            t = int(data['trimester'])
            if t in (1, 2, 3):
                user.trimester = t
        except (ValueError, TypeError):
            pass
    if 'due_date' in data and data['due_date']:
        try:
            user.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    # Change password
    if data.get('new_password'):
        if not data.get('current_password'):
            return jsonify({'success': False, 'error': 'Current password required.'}), 400
        if not user.check_password(data['current_password']):
            return jsonify({'success': False, 'error': 'Current password is incorrect.'}), 401
        if len(data['new_password']) < 6:
            return jsonify({'success': False, 'error': 'New password must be at least 6 characters.'}), 400
        user.set_password(data['new_password'])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Profile updated.', 'user': user.to_dict()}), 200


# ── Upload profile picture ───────────────────────────────────
@auth_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
def upload_picture():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected.'}), 400

    if not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'Invalid file type. Use PNG, JPG, or GIF.'}), 400

    # Delete old picture
    if user.profile_picture:
        old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], user.profile_picture)
        if os.path.exists(old_path):
            os.remove(old_path)

    # Save new picture
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    user.profile_picture = filename
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Profile picture updated.',
        'filename': filename,
    }), 200


# ── Serve uploaded files ─────────────────────────────────────
from flask import send_from_directory

@auth_bp.route('/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)


# ── Delete account ───────────────────────────────────────────
@auth_bp.route('/account', methods=['DELETE'])
@jwt_required()
def delete_account():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Account deleted.'}), 200
