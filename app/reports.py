from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, VitalLog, JournalEntry, DailyChecklist, Goal
from database import db
from datetime import date, timedelta
from sqlalchemy import func
from reportlab.lib import colors
import io
import os

reports_bp = Blueprint('reports', __name__)

# ── Try importing ReportLab ──────────────────────────────────
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table,
        TableStyle, HRFlowable, KeepTogether,
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

RISK_LABELS = {0: 'Low Risk', 1: 'Mid Risk', 2: 'High Risk'}
RISK_COLORS_RL = {
    0: colors.HexColor('#2D7A4F'),
    1: colors.HexColor('#9A6B1A'),
    2: colors.HexColor('#8A00F3'),
}


def build_pdf_report(user, logs, journals, checklist_stats, goals):
    """Build a PDF report and return it as a BytesIO buffer."""
    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2.5 * cm, bottomMargin=2 * cm,
        title=f"BabyBloom Health Report – {user.full_name}",
    )

    styles  = getSampleStyleSheet()
    story   = []
    W, H    = A4
    usable  = W - 4 * cm

    # ── Custom styles ────────────────────────────────────────
    rose     = colors.HexColor('#8A00F3')
    slate    = colors.HexColor('#2C3E50')
    midgray  = colors.HexColor('#546A7B')
    lightbg  = colors.HexColor('#FDF6F8')
    border   = colors.HexColor('#E8C4CC')

    h1 = ParagraphStyle('H1', parent=styles['Normal'],
                         fontSize=22, textColor=slate,
                         fontName='Helvetica-Bold', spaceAfter=4, leading=28)
    h2 = ParagraphStyle('H2', parent=styles['Normal'],
                         fontSize=14, textColor=rose,
                         fontName='Helvetica-Bold', spaceAfter=4,
                         spaceBefore=14, leading=18)
    h3 = ParagraphStyle('H3', parent=styles['Normal'],
                         fontSize=11, textColor=slate,
                         fontName='Helvetica-Bold', spaceAfter=2, leading=14)
    body = ParagraphStyle('Body', parent=styles['Normal'],
                          fontSize=10, textColor=midgray, leading=15)
    small = ParagraphStyle('Small', parent=styles['Normal'],
                           fontSize=8, textColor=midgray, leading=12)
    caption = ParagraphStyle('Caption', parent=styles['Normal'],
                             fontSize=8, textColor=colors.HexColor('#8FA3B1'),
                             leading=12, alignment=TA_CENTER)

    def hr():
        return HRFlowable(width='100%', thickness=0.5,
                          color=border, spaceAfter=8, spaceBefore=4)

    # ── Cover header ─────────────────────────────────────────
    cover_data = [[
        Paragraph('🌸 BabyBloom AI', ParagraphStyle(
            'Brand', parent=styles['Normal'],
            fontSize=11, textColor=rose, fontName='Helvetica-Bold')),
        Paragraph(
            f"Generated {date.today().strftime('%B %d, %Y')}",
            ParagraphStyle('Date', parent=styles['Normal'],
                           fontSize=9, textColor=midgray,
                           alignment=TA_RIGHT)),
    ]]
    cover_tbl = Table(cover_data, colWidths=[usable * 0.6, usable * 0.4])
    cover_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), lightbg),
        ('ROUNDEDCORNERS', [8]),
        ('TOPPADDING',    (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING',   (0, 0), (-1, -1), 14),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 14),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(cover_tbl)
    story.append(Spacer(1, 0.4 * cm))

    # Title
    story.append(Paragraph('Pregnancy Health Report', h1))
    story.append(Paragraph(user.full_name, ParagraphStyle(
        'Sub', parent=styles['Normal'],
        fontSize=13, textColor=midgray, fontName='Helvetica')))
    story.append(Spacer(1, 0.2 * cm))
    story.append(hr())

    # ── Patient profile ──────────────────────────────────────
    story.append(Paragraph('Patient Profile', h2))
    profile_data = [
        ['Full Name',  user.full_name,   'Username',   f'@{user.username}'],
        ['Age',        f'{user.age} years', 'Email',   user.email],
        ['Trimester',  f'Trimester {user.trimester}',
         'Due Date',   str(user.due_date) if user.due_date else 'Not set'],
        ['Account Since', user.created_at.strftime('%B %d, %Y'),
         'Total Predictions', str(len(logs))],
    ]

    pt = Table(profile_data, colWidths=[usable * 0.18, usable * 0.32,
                                         usable * 0.18, usable * 0.32])
    pt.setStyle(TableStyle([
        ('FONTNAME',      (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE',      (0, 0), (-1, -1), 9),
        ('FONTNAME',      (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME',      (2, 0), (2, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR',     (0, 0), (0, -1), rose),
        ('TEXTCOLOR',     (2, 0), (2, -1), rose),
        ('TEXTCOLOR',     (1, 0), (1, -1), slate),
        ('TEXTCOLOR',     (3, 0), (3, -1), slate),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [lightbg, colors.white]),
        ('TOPPADDING',    (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
        ('GRID',          (0, 0), (-1, -1), 0.3, border),
    ]))
    story.append(pt)
    story.append(Spacer(1, 0.3 * cm))

    # ── Risk summary ─────────────────────────────────────────
    if logs:
        story.append(Paragraph('Risk Assessment Summary', h2))

        pred_logs = [l for l in logs if l.risk_level is not None]
        if pred_logs:
            low   = sum(1 for l in pred_logs if l.risk_level == 0)
            mid   = sum(1 for l in pred_logs if l.risk_level == 1)
            high  = sum(1 for l in pred_logs if l.risk_level == 2)
            total = len(pred_logs)
            last  = pred_logs[0]

            risk_summary = [
                ['Metric',             'Value'],
                ['Total Predictions',  str(total)],
                ['Low Risk (%)',        f'{low} ({round(low/total*100)}%)'],
                ['Mid Risk (%)',        f'{mid} ({round(mid/total*100)}%)'],
                ['High Risk (%)',       f'{high} ({round(high/total*100)}%)'],
                ['Latest Result',       RISK_LABELS.get(last.risk_level, '—')],
                ['Latest Confidence',   f'{last.confidence}%' if last.confidence else '—'],
                ['Latest Date',         last.logged_at.strftime('%b %d, %Y %H:%M')],
            ]
            rs = Table(risk_summary, colWidths=[usable * 0.45, usable * 0.55])
            rs.setStyle(TableStyle([
                ('BACKGROUND',    (0, 0), (-1, 0), rose),
                ('TEXTCOLOR',     (0, 0), (-1, 0), colors.white),
                ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME',      (0, 1), (0, -1), 'Helvetica-Bold'),
                ('TEXTCOLOR',     (0, 1), (0, -1), midgray),
                ('FONTNAME',      (1, 1), (1, -1), 'Helvetica'),
                ('FONTSIZE',      (0, 0), (-1, -1), 9),
                ('ROWBACKGROUNDS',(0, 1), (-1, -1), [colors.white, lightbg]),
                ('TOPPADDING',    (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING',   (0, 0), (-1, -1), 10),
                ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
                ('GRID',          (0, 0), (-1, -1), 0.3, border),
            ]))
            story.append(rs)
            story.append(Spacer(1, 0.3 * cm))

        # Recent vital logs table
        story.append(Paragraph('Recent Vital Sign Readings (last 10)', h3))
        story.append(Spacer(1, 0.15 * cm))

        headers = ['Date', 'Sys BP', 'Dia BP', 'Glucose', 'Temp', 'HR', 'Risk', 'Conf']
        rows    = [headers]
        for log in logs[:10]:
            risk_label = RISK_LABELS.get(log.risk_level, '—') if log.risk_level is not None else '—'
            rows.append([
                log.logged_at.strftime('%b %d %H:%M'),
                str(log.systolic_bp),
                str(log.diastolic_bp),
                str(log.blood_glucose),
                str(log.body_temp),
                str(log.heart_rate),
                risk_label,
                f'{log.confidence}%' if log.confidence else '—',
            ])

        col_w = [usable * w for w in [0.16, 0.1, 0.1, 0.1, 0.1, 0.08, 0.22, 0.14]]
        vt = Table(rows, colWidths=col_w)
        ts = [
            ('BACKGROUND',    (0, 0), (-1, 0), slate),
            ('TEXTCOLOR',     (0, 0), (-1, 0), colors.white),
            ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE',      (0, 0), (-1, -1), 8),
            ('FONTNAME',      (0, 1), (-1, -1), 'Helvetica'),
            ('ROWBACKGROUNDS',(0, 1), (-1, -1), [colors.white, lightbg]),
            ('TOPPADDING',    (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING',   (0, 0), (-1, -1), 5),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 5),
            ('GRID',          (0, 0), (-1, -1), 0.3, border),
        ]
        # Colour risk cells
        for i, row in enumerate(rows[1:], start=1):
            risk_text = row[6]
            if 'High' in risk_text:
                ts.append(('TEXTCOLOR', (6, i), (6, i), RISK_COLORS_RL[2]))
            elif 'Mid' in risk_text:
                ts.append(('TEXTCOLOR', (6, i), (6, i), RISK_COLORS_RL[1]))
            elif 'Low' in risk_text:
                ts.append(('TEXTCOLOR', (6, i), (6, i), RISK_COLORS_RL[0]))

        vt.setStyle(TableStyle(ts))
        story.append(vt)

    story.append(Spacer(1, 0.3 * cm))

    # ── Wellness summary ─────────────────────────────────────
    if checklist_stats:
        story.append(Paragraph('Weekly Wellness Summary', h2))
        wdata = [
            ['Habit',                  'Days This Week', 'Rate'],
            ['Vitamins taken',          str(checklist_stats.get('vitamins_days', 0)),
             f"{round(checklist_stats.get('vitamins_days', 0)/7*100)}%"],
            ['Water goal met',          str(checklist_stats.get('water_days', 0)),
             f"{round(checklist_stats.get('water_days', 0)/7*100)}%"],
            ['Stress managed',          str(checklist_stats.get('stress_days', 0)),
             f"{round(checklist_stats.get('stress_days', 0)/7*100)}%"],
            ['Exercise done',           str(checklist_stats.get('exercise_days', 0)),
             f"{round(checklist_stats.get('exercise_days', 0)/7*100)}%"],
            ['Avg sleep',               f"{checklist_stats.get('avg_sleep', 0):.1f} hrs", '—'],
            ['Avg water intake',        f"{checklist_stats.get('avg_water', 0):.1f} L",   '—'],
        ]
        wt = Table(wdata, colWidths=[usable * 0.5, usable * 0.25, usable * 0.25])
        wt.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, 0), rose),
            ('TEXTCOLOR',     (0, 0), (-1, 0), colors.white),
            ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME',      (0, 1), (0, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR',     (0, 1), (0, -1), midgray),
            ('FONTSIZE',      (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS',(0, 1), (-1, -1), [colors.white, lightbg]),
            ('TOPPADDING',    (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING',   (0, 0), (-1, -1), 10),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
            ('GRID',          (0, 0), (-1, -1), 0.3, border),
        ]))
        story.append(wt)
        story.append(Spacer(1, 0.3 * cm))

    # ── Goals ────────────────────────────────────────────────
    if goals:
        story.append(Paragraph('Active Goals', h2))
        gdata = [['Goal', 'Category', 'Progress', 'Status']]
        for g in goals[:10]:
            pct    = round(g.current_progress / g.target_value * 100) if g.target_value else 0
            status = 'Completed ✓' if pct >= 100 else f'{pct}%'
            gdata.append([g.title, g.category,
                          f'{g.current_progress}/{g.target_value}', status])

        gt = Table(gdata, colWidths=[usable * 0.4, usable * 0.2,
                                      usable * 0.2, usable * 0.2])
        gt.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, 0), slate),
            ('TEXTCOLOR',     (0, 0), (-1, 0), colors.white),
            ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE',      (0, 0), (-1, -1), 9),
            ('FONTNAME',      (0, 1), (-1, -1), 'Helvetica'),
            ('ROWBACKGROUNDS',(0, 1), (-1, -1), [colors.white, lightbg]),
            ('TOPPADDING',    (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING',   (0, 0), (-1, -1), 10),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
            ('GRID',          (0, 0), (-1, -1), 0.3, border),
        ]))
        story.append(gt)
        story.append(Spacer(1, 0.3 * cm))

    # ── Disclaimer ───────────────────────────────────────────
    story.append(hr())
    story.append(Paragraph(
        '<b>Medical Disclaimer:</b> This report is generated by BabyBloom AI for '
        'educational and informational purposes only. It does not constitute medical '
        'advice, diagnosis, or treatment. Always consult a qualified healthcare '
        'provider for any pregnancy-related health concerns.',
        ParagraphStyle('Disclaimer', parent=styles['Normal'],
                       fontSize=7.5, textColor=colors.HexColor('#8FA3B1'),
                       leading=11, spaceBefore=4)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer


# ── Routes ───────────────────────────────────────────────────

@reports_bp.route('/my', methods=['GET'])
@jwt_required()
def my_report():
    """Generate a PDF report for the logged-in user."""
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    if not REPORTLAB_AVAILABLE:
        return jsonify({
            'success': False,
            'error':   'ReportLab is not installed. Run: pip install reportlab',
        }), 500

    logs      = VitalLog.query.filter_by(user_id=user_id).order_by(VitalLog.logged_at.desc()).limit(20).all()
    journals  = JournalEntry.query.filter_by(user_id=user_id).order_by(JournalEntry.date.desc()).limit(10).all()
    goals     = Goal.query.filter_by(user_id=user_id).all()

    # Checklist stats (last 7 days)
    today    = date.today()
    week_ago = today - timedelta(days=6)
    chklists = DailyChecklist.query.filter(
        DailyChecklist.user_id == user_id,
        DailyChecklist.date    >= week_ago,
    ).all()

    checklist_stats = {
        'vitamins_days': sum(1 for c in chklists if c.vitamins_taken),
        'water_days':    sum(1 for c in chklists if c.water_goal_met),
        'stress_days':   sum(1 for c in chklists if c.stress_managed),
        'exercise_days': sum(1 for c in chklists if c.exercise_done),
        'avg_sleep':     (sum(c.sleep_hours or 0 for c in chklists) / max(1, len(chklists))),
        'avg_water':     (sum(c.water_liters or 0 for c in chklists) / max(1, len(chklists))),
    }

    pdf_buffer = build_pdf_report(user, logs, journals, checklist_stats, goals)
    filename   = f"babybloom_report_{user.username}_{today}.pdf"

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf',
    )


@reports_bp.route('/user/<int:uid>', methods=['GET'])
@jwt_required()
def user_report(uid):
    """Admin: generate PDF for any user."""
    caller_id = int(get_jwt_identity())
    caller    = User.query.get(caller_id)

    if not caller or not caller.is_admin:
        return jsonify({'success': False, 'error': 'Admin access required.'}), 403

    if not REPORTLAB_AVAILABLE:
        return jsonify({
            'success': False,
            'error':   'ReportLab is not installed. Run: pip install reportlab',
        }), 500

    user = User.query.get(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404

    logs      = VitalLog.query.filter_by(user_id=uid).order_by(VitalLog.logged_at.desc()).limit(20).all()
    journals  = JournalEntry.query.filter_by(user_id=uid).order_by(JournalEntry.date.desc()).limit(10).all()
    goals     = Goal.query.filter_by(user_id=uid).all()

    today    = date.today()
    week_ago = today - timedelta(days=6)
    chklists = DailyChecklist.query.filter(
        DailyChecklist.user_id == uid,
        DailyChecklist.date    >= week_ago,
    ).all()

    checklist_stats = {
        'vitamins_days': sum(1 for c in chklists if c.vitamins_taken),
        'water_days':    sum(1 for c in chklists if c.water_goal_met),
        'stress_days':   sum(1 for c in chklists if c.stress_managed),
        'exercise_days': sum(1 for c in chklists if c.exercise_done),
        'avg_sleep':     (sum(c.sleep_hours or 0 for c in chklists) / max(1, len(chklists))),
        'avg_water':     (sum(c.water_liters or 0 for c in chklists) / max(1, len(chklists))),
    }

    pdf_buffer = build_pdf_report(user, logs, journals, checklist_stats, goals)
    filename   = f"babybloom_report_{user.username}_{today}.pdf"

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf',
    )


@reports_bp.route('/check', methods=['GET'])
@jwt_required()
def check_reportlab():
    """Tell the frontend if PDF generation is available."""
    return jsonify({'available': REPORTLAB_AVAILABLE}), 200