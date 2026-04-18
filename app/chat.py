from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, VitalLog
import json
import os

chat_bp = Blueprint('chat', __name__)

# ── API keys ─────────────────────────────────────────────────
GROQ_API_KEY   = os.environ.get('GROQ_API_KEY',   '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

GROQ_MODEL = os.environ.get('GROQ_MODEL', 'llama-3.1-8b-instant')

# ── Load Groq official SDK ───────────────────────────────────
# This fixes error 1010 — urllib was blocked by Cloudflare,
# the official SDK uses proper headers that pass through.
try:
    from groq import Groq
    groq_client    = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
    GROQ_AVAILABLE = bool(GROQ_API_KEY)
    print("✓ Groq SDK ready")
except ImportError:
    groq_client    = None
    GROQ_AVAILABLE = False
    print("⚠ groq not installed — run: pip install groq==0.11.0")
except Exception as e:
    groq_client    = None
    GROQ_AVAILABLE = False
    print(f"⚠ Groq init failed: {e}")

# ── Load Gemini SDK (fallback) ───────────────────────────────
try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
    GEMINI_AVAILABLE = bool(GEMINI_API_KEY)
    print("✓ Gemini SDK ready")
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠ google-generativeai not installed — run: pip install google-generativeai")

# ── System prompt ─────────────────────────────────────────────
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
    result   = []
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


# ── Groq streaming via official SDK ──────────────────────────
def stream_groq(messages):
    """Yields SSE chunks using the official Groq SDK (no Cloudflare issues)."""
    if not groq_client:
        yield f"data: {json.dumps({'error': 'Groq not configured. Run: pip install groq==0.11.0 and set GROQ_API_KEY in .env'})}\n\n"
        return

    try:
        stream = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{'role': 'system', 'content': SYSTEM_PROMPT}] + messages,
            max_tokens=1024,
            temperature=0.7,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta
            if hasattr(delta, 'content') and delta.content:
                yield f"data: {json.dumps({'chunk': delta.content})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as e:
        error_msg = str(e)
        print(f"Groq streaming error: {error_msg}")
        yield f"data: {json.dumps({'error': f'Groq error: {error_msg}'})}\n\n"


# ── Groq non-streaming via official SDK ──────────────────────
def call_groq(messages):
    """Returns (reply_text, error_string)."""
    if not groq_client:
        return None, 'Groq not configured.'
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{'role': 'system', 'content': SYSTEM_PROMPT}] + messages,
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content, None
    except Exception as e:
        return None, f'Groq error: {str(e)}'


# ── Gemini via official SDK (fallback) ───────────────────────
def call_gemini(messages):
    """Returns (reply_text, error_string)."""
    if not GEMINI_AVAILABLE:
        return None, 'Gemini not configured.'
    try:
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=SYSTEM_PROMPT,
        )
        # Build history (all but last message)
        history = []
        for m in messages[:-1]:
            role = 'user' if m['role'] == 'user' else 'model'
            history.append({'role': role, 'parts': [m['content']]})

        chat     = model.start_chat(history=history)
        response = chat.send_message(messages[-1]['content'])
        return response.text, None
    except Exception as e:
        return None, f'Gemini error: {str(e)}'


def gemini_sse(messages):
    """Wraps Gemini response as SSE stream (simulated chunking)."""
    reply, error = call_gemini(messages)
    if error:
        yield f"data: {json.dumps({'error': error})}\n\n"
        return
    # Send in word chunks to simulate streaming
    words = reply.split(' ')
    buf   = ''
    for i, word in enumerate(words):
        buf += word + ' '
        if (i + 1) % 6 == 0:
            yield f"data: {json.dumps({'chunk': buf})}\n\n"
            buf = ''
    if buf:
        yield f"data: {json.dumps({'chunk': buf})}\n\n"
    yield f"data: {json.dumps({'done': True})}\n\n"


# ── Routes ────────────────────────────────────────────────────

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

    latest_log = (VitalLog.query
                  .filter_by(user_id=user_id)
                  .order_by(VitalLog.logged_at.desc())
                  .first())
    user_ctx = build_user_context(user, latest_log)
    messages = inject_context(messages, user_ctx)

    # Use Groq if available, otherwise fall back to Gemini
    if GROQ_AVAILABLE and groq_client:
        generator = stream_groq(messages)
    elif GEMINI_AVAILABLE:
        generator = gemini_sse(messages)
    else:
        def no_provider():
            yield f"data: {json.dumps({'error': 'No AI provider configured. Add GROQ_API_KEY or GEMINI_API_KEY to your .env and restart Flask.'})}\n\n"
        generator = no_provider()

    return Response(
        stream_with_context(generator),
        mimetype='text/event-stream',
        headers={
            'Cache-Control':               'no-cache',
            'X-Accel-Buffering':           'no',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
    )


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def chat_message():
    """Non-streaming fallback."""
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    data         = request.get_json() or {}
    messages_raw = data.get('messages', [])
    provider     = data.get('provider', 'groq')

    messages = [
        {'role': m['role'], 'content': str(m['content'])}
        for m in messages_raw[-20:]
        if m.get('role') in ('user', 'assistant') and m.get('content')
    ]

    if not messages or messages[-1]['role'] != 'user':
        return jsonify({'success': False, 'error': 'Last message must be from user.'}), 400

    latest_log = (VitalLog.query
                  .filter_by(user_id=user_id)
                  .order_by(VitalLog.logged_at.desc())
                  .first())
    user_ctx = build_user_context(user, latest_log)
    messages = inject_context(messages, user_ctx)

    if provider == 'gemini':
        reply, error = call_gemini(messages)
        if error:
            reply, error = call_groq(messages)
    else:
        reply, error = call_groq(messages)
        if error:
            reply, error = call_gemini(messages)

    if error or not reply:
        return jsonify({
            'success': False,
            'error':   error or 'Both providers failed. Check API keys in .env',
        }), 500

    return jsonify({'success': True, 'reply': reply}), 200


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
            {'text': "First trimester symptoms — what's normal?",  'icon': '🌱'},
            {'text': 'Foods that help with nausea and vomiting',    'icon': '🤢'},
            {'text': 'Is coffee safe in the first trimester?',      'icon': '☕'},
        ],
        2: [
            {'text': 'What to expect at my 20-week scan',           'icon': '🔬'},
            {'text': 'Managing back pain in second trimester',      'icon': '🧘'},
            {'text': "Baby movement — what's normal now?",          'icon': '👶'},
        ],
        3: [
            {'text': 'How to prepare my birth plan',                'icon': '📋'},
            {'text': 'Signs that labour is starting',               'icon': '🏥'},
            {'text': 'Packing my hospital bag checklist',           'icon': '🎒'},
        ],
    }

    t = user.trimester if user else 2
    suggestions = trimester_specific.get(t, []) + base
    return jsonify({'success': True, 'suggestions': suggestions[:8]}), 200


@chat_bp.route('/providers', methods=['GET'])
@jwt_required()
def get_providers():
    return jsonify({
        'success':   True,
        'groq':      GROQ_AVAILABLE,
        'gemini':    GEMINI_AVAILABLE,
        'any_ready': GROQ_AVAILABLE or GEMINI_AVAILABLE,
    }), 200