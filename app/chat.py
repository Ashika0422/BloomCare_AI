from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, VitalLog
import json
import os
import urllib.request
import urllib.error

chat_bp = Blueprint('chat', __name__)

# ── API configuration ────────────────────────────────────────
GROQ_API_KEY   = os.environ.get('GROQ_API_KEY',   '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions'
GEMINI_URL  = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}'

GROQ_MODEL   = 'llama-3.1-70b-versatile'   # free, fast, excellent quality
GEMINI_MODEL = 'gemini-1.5-flash'

# ── Pregnancy system prompt ──────────────────────────────────
SYSTEM_PROMPT = """You are BloomCare AI — a warm, knowledgeable, and compassionate pregnancy health assistant. You help pregnant women understand their health, symptoms, nutrition, and wellness during pregnancy.

GUIDELINES:
- Always be warm, empathetic, and supportive. Pregnancy is a deeply personal experience.
- Provide accurate, evidence-based information about pregnancy health, nutrition, symptoms, and wellness.
- Structure responses clearly. Use bullet points, numbered lists, and **bold** text where appropriate.
- Keep responses focused and practical — avoid overly long answers.
- ALWAYS include a gentle reminder to consult a healthcare provider for personal medical decisions.
- NEVER provide diagnoses or prescribe treatments.
- Speak to the user by name when their name is provided in context.
- If asked about a high-risk symptom (severe bleeding, chest pain, sudden vision loss, severe headache, decreased fetal movement), immediately advise seeking emergency care.

TOPICS YOU EXCEL AT:
- Pregnancy nutrition and foods to avoid/include
- Common pregnancy symptoms and what is normal vs concerning
- Safe exercise during pregnancy
- Mental health and emotional wellbeing during pregnancy
- Birth preparation and what to expect
- Postpartum recovery basics
- Understanding prenatal test results (general info only)
- Sleep tips during pregnancy
- Managing morning sickness, back pain, swelling, fatigue

GUARDRAILS:
- Do NOT provide specific medication dosages or prescriptions
- Do NOT diagnose specific conditions
- Do NOT replace emergency medical advice
- Always encourage professional consultation for personal health decisions

Tone: warm, professional, encouraging. Use emojis sparingly for warmth."""


def build_user_context(user, latest_log=None):
    ctx = f"User: {user.full_name}, Age {user.age}, Trimester {user.trimester}"
    if user.due_date:
        ctx += f", Due date: {user.due_date}"
    if latest_log:
        ctx += (
            f". Latest vitals — Systolic BP: {latest_log.systolic_bp} mmHg, "
            f"Diastolic BP: {latest_log.diastolic_bp} mmHg, "
            f"Blood Glucose: {latest_log.blood_glucose} mmol/L, "
            f"Body Temp: {latest_log.body_temp}°F, "
            f"Heart Rate: {latest_log.heart_rate} bpm"
        )
        if latest_log.risk_level is not None:
            labels = {0: 'Low', 1: 'Mid', 2: 'High'}
            ctx += f". Risk level: {labels.get(latest_log.risk_level)} ({latest_log.confidence}% confidence)"
    return ctx


def inject_context(messages, user_ctx):
    """Prepend user context to the first user message."""
    result = []
    injected = False
    for m in messages:
        if m['role'] == 'user' and not injected:
            result.append({
                'role':    'user',
                'content': f"[My profile: {user_ctx}]\n\n{m['content']}",
            })
            injected = True
        else:
            result.append(m)
    return result


# ── Groq: standard response ──────────────────────────────────
def call_groq(messages):
    """Call Groq API. Returns (reply_text, error_string)."""
    if not GROQ_API_KEY:
        return None, 'GROQ_API_KEY not set in .env'

    payload = json.dumps({
        'model':       GROQ_MODEL,
        'messages':    [{'role': 'system', 'content': SYSTEM_PROMPT}] + messages,
        'max_tokens':  1024,
        'temperature': 0.7,
    }).encode('utf-8')

    req = urllib.request.Request(
        GROQ_URL,
        data=payload,
        headers={
            'Content-Type':  'application/json',
            'Authorization': f'Bearer {GROQ_API_KEY}',
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data['choices'][0]['message']['content'], None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        try:
            err = json.loads(body)
            msg = err.get('error', {}).get('message', str(e))
        except Exception:
            msg = body[:200]
        return None, f'Groq error: {msg}'
    except Exception as e:
        return None, f'Groq connection error: {str(e)}'


# ── Groq: streaming generator ────────────────────────────────
def stream_groq(messages):
    """Generator that yields SSE chunks from Groq streaming API."""
    if not GROQ_API_KEY:
        yield f"data: {json.dumps({'error': 'GROQ_API_KEY not set in .env'})}\n\n"
        return

    payload = json.dumps({
        'model':       GROQ_MODEL,
        'messages':    [{'role': 'system', 'content': SYSTEM_PROMPT}] + messages,
        'max_tokens':  1024,
        'temperature': 0.7,
        'stream':      True,
    }).encode('utf-8')

    req = urllib.request.Request(
        GROQ_URL,
        data=payload,
        headers={
            'Content-Type':  'application/json',
            'Authorization': f'Bearer {GROQ_API_KEY}',
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            for raw_line in resp:
                line = raw_line.decode('utf-8').strip()
                if not line.startswith('data: '):
                    continue
                data_str = line[6:]
                if data_str == '[DONE]':
                    yield f"data: {json.dumps({'done': True})}\n\n"
                    return
                try:
                    data    = json.loads(data_str)
                    delta   = data['choices'][0].get('delta', {})
                    content = delta.get('content', '')
                    if content:
                        yield f"data: {json.dumps({'chunk': content})}\n\n"
                except (json.JSONDecodeError, KeyError, IndexError):
                    pass
        yield f"data: {json.dumps({'done': True})}\n\n"

    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        try:
            err_msg = json.loads(body).get('error', {}).get('message', str(e))
        except Exception:
            err_msg = body[:200]
        yield f"data: {json.dumps({'error': f'Groq error: {err_msg}'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


# ── Gemini: standard response (fallback) ─────────────────────
def call_gemini(messages):
    """Call Gemini API as fallback. Returns (reply_text, error_string)."""
    if not GEMINI_API_KEY:
        return None, 'GEMINI_API_KEY not set in .env'

    # Convert messages to Gemini format
    contents = []
    for m in messages:
        role = 'user' if m['role'] == 'user' else 'model'
        contents.append({'role': role, 'parts': [{'text': m['content']}]})

    # Inject system prompt as first user turn for Gemini
    system_turn = {
        'role':  'user',
        'parts': [{'text': f'System instructions: {SYSTEM_PROMPT}'}],
    }
    ack_turn = {
        'role':  'model',
        'parts': [{'text': 'Understood. I am BloomCare AI, ready to help.'}],
    }
    contents = [system_turn, ack_turn] + contents

    payload = json.dumps({
        'contents':         contents,
        'generationConfig': {'maxOutputTokens': 1024, 'temperature': 0.7},
    }).encode('utf-8')

    req = urllib.request.Request(
        f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}',
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data  = json.loads(resp.read())
            reply = data['candidates'][0]['content']['parts'][0]['text']
            return reply, None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        try:
            msg = json.loads(body).get('error', {}).get('message', str(e))
        except Exception:
            msg = body[:200]
        return None, f'Gemini error: {msg}'
    except Exception as e:
        return None, f'Gemini connection error: {str(e)}'


# ── Routes ───────────────────────────────────────────────────

@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def chat_message():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    data         = request.get_json() or {}
    messages_raw = data.get('messages', [])
    provider     = data.get('provider', 'groq')   # 'groq' | 'gemini'

    messages = [
        {'role': m['role'], 'content': str(m['content'])}
        for m in messages_raw[-20:]
        if m.get('role') in ('user', 'assistant') and m.get('content')
    ]

    if not messages or messages[-1]['role'] != 'user':
        return jsonify({'success': False, 'error': 'Last message must be from user.'}), 400

    latest_log = (VitalLog.query.filter_by(user_id=user_id)
                  .order_by(VitalLog.logged_at.desc()).first())
    user_ctx  = build_user_context(user, latest_log)
    messages  = inject_context(messages, user_ctx)

    reply, error = None, None

    if provider == 'gemini':
        reply, error = call_gemini(messages)
        if error:
            reply, error = call_groq(messages)   # fall back to Groq
    else:
        reply, error = call_groq(messages)
        if error:
            reply, error = call_gemini(messages)  # fall back to Gemini

    if error or not reply:
        return jsonify({
            'success': False,
            'error':   error or 'Both providers failed. Check your API keys in .env',
        }), 500

    return jsonify({'success': True, 'reply': reply}), 200


@chat_bp.route('/stream', methods=['POST'])
@jwt_required()
def chat_stream():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    data         = request.get_json() or {}
    messages_raw = data.get('messages', [])

    messages = [
        {'role': m['role'], 'content': str(m['content'])}
        for m in messages_raw[-20:]
        if m.get('role') in ('user', 'assistant') and m.get('content')
    ]

    if not messages or messages[-1]['role'] != 'user':
        return jsonify({'success': False, 'error': 'Last message must be from user.'}), 400

    latest_log = (VitalLog.query.filter_by(user_id=user_id)
                  .order_by(VitalLog.logged_at.desc()).first())
    user_ctx = build_user_context(user, latest_log)
    messages = inject_context(messages, user_ctx)

    return Response(
        stream_with_context(stream_groq(messages)),
        mimetype='text/event-stream',
        headers={
            'Cache-Control':               'no-cache',
            'X-Accel-Buffering':           'no',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
    )


@chat_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggestions():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    base = [
        {'text': 'Foods to avoid during pregnancy',       'icon': '🥗'},
        {'text': 'What prenatal vitamins should I take',  'icon': '💊'},
        {'text': 'Tips for better sleep while pregnant',  'icon': '😴'},
        {'text': 'When to call my doctor urgently',       'icon': '📞'},
        {'text': 'How to manage stress during pregnancy', 'icon': '🧘'},
        {'text': 'Is it safe to travel while pregnant',   'icon': '✈️'},
    ]

    trimester_specific = {
        1: [
            {'text': "First trimester symptoms — what's normal?",    'icon': '🌱'},
            {'text': 'Foods that help with nausea and vomiting',      'icon': '🤢'},
            {'text': 'Is coffee safe in the first trimester?',        'icon': '☕'},
        ],
        2: [
            {'text': 'What to expect at my 20-week scan',             'icon': '🔬'},
            {'text': 'How to manage back pain in second trimester',   'icon': '🧘'},
            {'text': "Baby movement — what's normal now?",            'icon': '👶'},
        ],
        3: [
            {'text': 'How to prepare my birth plan',                  'icon': '📋'},
            {'text': 'Signs that labour is starting',                 'icon': '🏥'},
            {'text': 'Packing my hospital bag checklist',             'icon': '🎒'},
        ],
    }

    t = user.trimester if user else 2
    suggestions = trimester_specific.get(t, []) + base
    return jsonify({'success': True, 'suggestions': suggestions[:8]}), 200


@chat_bp.route('/providers', methods=['GET'])
@jwt_required()
def get_providers():
    """Tell the frontend which API keys are configured."""
    return jsonify({
        'success':  True,
        'groq':     bool(GROQ_API_KEY),
        'gemini':   bool(GEMINI_API_KEY),
        'any_ready': bool(GROQ_API_KEY or GEMINI_API_KEY),
    }), 200