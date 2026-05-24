"""
Genera una presentación PDF estilo diapositivas (landscape) dirigida
al equipo comercial / producto de Fiserv.

Estructura en dos partes:
  · PARTE 1 — Lo que ya tenemos construido.
  · PARTE 2 — Lo próximo a implementar.

Salida: docs/PITCH_FISERV_ATLAS_NEXUS.pdf
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, NextPageTemplate,
    Paragraph, Spacer, PageBreak,
    Table, TableStyle, ListFlowable, ListItem, Image,
)


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "docs" / "PITCH_FISERV_ATLAS_NEXUS.pdf"
ASSETS = ROOT / "docs" / "assets" / "mockups"
PAGE_W, PAGE_H = landscape(A4)


def img(name, width_cm, height_cm=None):
    path = ASSETS / name
    if height_cm:
        return Image(str(path), width=width_cm * cm, height=height_cm * cm)
    # Auto height from aspect ratio
    from PIL import Image as PILImage
    with PILImage.open(path) as im:
        ratio = im.height / im.width
    return Image(str(path), width=width_cm * cm, height=width_cm * ratio * cm)

# ─────────────────────────────────────────────────────────────
#  Paleta Fiserv
# ─────────────────────────────────────────────────────────────

FISERV_ORANGE = colors.HexColor("#FF6B00")
FISERV_ORANGE_DARK = colors.HexColor("#CC4F00")
FISERV_NAVY = colors.HexColor("#0B1F3A")
FISERV_NAVY_DARK = colors.HexColor("#061327")
INK = colors.HexColor("#0F172A")
SLATE = colors.HexColor("#334155")
MUTED = colors.HexColor("#64748B")
LINE = colors.HexColor("#E2E8F0")
CARD_BG = colors.HexColor("#F8FAFC")
GREEN = colors.HexColor("#16A34A")
BLUE = colors.HexColor("#2563EB")
AMBER = colors.HexColor("#F59E0B")
ROSE = colors.HexColor("#E11D48")


styles = getSampleStyleSheet()


def s(name, **kwargs):
    return ParagraphStyle(name=name, parent=styles["Normal"], **kwargs)


SLIDE_KICKER = s("Kicker", fontName="Helvetica-Bold", fontSize=10, leading=12,
                 textColor=FISERV_ORANGE, alignment=TA_LEFT, spaceAfter=2)
SLIDE_TITLE = s("STitle", fontName="Helvetica-Bold", fontSize=28, leading=32,
                textColor=INK, alignment=TA_LEFT, spaceAfter=4)
SLIDE_SUB = s("SSub", fontName="Helvetica", fontSize=13, leading=17,
              textColor=SLATE, alignment=TA_LEFT, spaceAfter=12)
BODY = s("Body", fontName="Helvetica", fontSize=12, leading=17,
         textColor=INK, alignment=TA_LEFT, spaceAfter=6)
LEAD = s("Lead", fontName="Helvetica", fontSize=15, leading=21,
         textColor=INK, alignment=TA_LEFT, spaceAfter=10)
BULLET = s("Bullet", fontName="Helvetica", fontSize=12, leading=16,
           textColor=INK, leftIndent=14, bulletIndent=2, spaceAfter=2)
SMALL = s("Small", fontName="Helvetica", fontSize=9.5, leading=12,
          textColor=MUTED)
CARD_TITLE = s("CardT", fontName="Helvetica-Bold", fontSize=12.5, leading=15,
               textColor=INK, spaceAfter=3)
CARD_BODY = s("CardB", fontName="Helvetica", fontSize=10.5, leading=14,
              textColor=SLATE, spaceAfter=0)
COVER_TITLE = s("CoverT", fontName="Helvetica-Bold", fontSize=54, leading=58,
                textColor=colors.white, alignment=TA_LEFT, spaceAfter=10)
COVER_SUB = s("CoverS", fontName="Helvetica", fontSize=18, leading=24,
              textColor=colors.white, alignment=TA_LEFT, spaceAfter=18)
COVER_META = s("CoverM", fontName="Helvetica", fontSize=11, leading=14,
               textColor=colors.white, alignment=TA_LEFT)
SECTION_KICKER = s("SecK", fontName="Helvetica-Bold", fontSize=12, leading=14,
                   textColor=colors.white, alignment=TA_LEFT, spaceAfter=10)
SECTION_TITLE = s("SecT", fontName="Helvetica-Bold", fontSize=48, leading=54,
                  textColor=colors.white, alignment=TA_LEFT, spaceAfter=8)
SECTION_SUB = s("SecS", fontName="Helvetica", fontSize=18, leading=24,
                textColor=colors.white, alignment=TA_LEFT)
BIG_NUMBER = s("BigN", fontName="Helvetica-Bold", fontSize=42, leading=46,
               textColor=FISERV_ORANGE, alignment=TA_CENTER, spaceAfter=4)
BIG_LABEL = s("BigL", fontName="Helvetica", fontSize=11, leading=14,
              textColor=SLATE, alignment=TA_CENTER)
QUOTE = s("Quote", fontName="Helvetica-Oblique", fontSize=14, leading=19,
          textColor=INK, alignment=TA_LEFT)


# ─────────────────────────────────────────────────────────────
#  Helpers visuales
# ─────────────────────────────────────────────────────────────

def p(text, st=BODY):
    return Paragraph(text, st)


def bullets(items, st=BULLET, color=FISERV_ORANGE):
    return ListFlowable(
        [ListItem(Paragraph(t, st), leftIndent=12, bulletColor=color) for t in items],
        bulletType="bullet", bulletFontSize=9, leftIndent=18, bulletOffsetY=-1,
    )


def card(title, body, width, height, accent=FISERV_ORANGE, bg=CARD_BG, title_color=INK):
    inner = [
        Paragraph(title, ParagraphStyle("ct", parent=CARD_TITLE, textColor=title_color)),
        Spacer(1, 0.12 * cm),
        Paragraph(body, CARD_BODY),
    ]
    t = Table([[inner]], colWidths=[width], rowHeights=[height])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEABOVE", (0, 0), (-1, 0), 3, accent),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def stat_card(number, label, width, height, color=FISERV_ORANGE):
    cell = [
        Paragraph(number, ParagraphStyle("bn", parent=BIG_NUMBER, textColor=color)),
        Paragraph(label, BIG_LABEL),
    ]
    t = Table([[cell]], colWidths=[width], rowHeights=[height])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def grid(cells, cols, col_widths, row_heights):
    rows = []
    for i in range(0, len(cells), cols):
        rows.append(cells[i:i + cols] + [""] * (cols - len(cells[i:i + cols])))
    t = Table(rows, colWidths=col_widths, rowHeights=row_heights)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


# ─────────────────────────────────────────────────────────────
#  Page chrome
# ─────────────────────────────────────────────────────────────

def cover_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(FISERV_NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(FISERV_ORANGE)
    canvas.rect(0, 0, 2.6 * cm, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(FISERV_ORANGE_DARK)
    canvas.circle(PAGE_W - 4 * cm, PAGE_H - 4 * cm, 3 * cm, fill=1, stroke=0)
    canvas.setFillColor(FISERV_ORANGE)
    canvas.circle(PAGE_W - 2 * cm, 2 * cm, 1.6 * cm, fill=1, stroke=0)
    canvas.restoreState()


def slide_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(FISERV_ORANGE)
    canvas.rect(0, PAGE_H - 0.35 * cm, PAGE_W, 0.35 * cm, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(1.5 * cm, 1.4 * cm, PAGE_W - 1.5 * cm, 1.4 * cm)
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.5 * cm, 0.9 * cm,
                      "Atlas Nexus  ·  Presentación para Fiserv  ·  Mayo 2026")
    canvas.drawRightString(PAGE_W - 1.5 * cm, 0.9 * cm, f"{doc.page}")
    canvas.restoreState()


def section_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(FISERV_NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(FISERV_ORANGE)
    canvas.rect(0, 0, PAGE_W, 0.6 * cm, fill=1, stroke=0)
    canvas.rect(0, PAGE_H - 0.6 * cm, PAGE_W, 0.6 * cm, fill=1, stroke=0)
    canvas.restoreState()


# ─────────────────────────────────────────────────────────────
#  Slides
# ─────────────────────────────────────────────────────────────

def slide_cover():
    return [
        Spacer(1, 4 * cm),
        p("ATLAS NEXUS", COVER_TITLE),
        p("Inteligencia accionable para el merchant moderno.", COVER_SUB),
        Spacer(1, 0.4 * cm),
        p("IA conversacional · Forecasting con ML · Insights accionables · Smart Receipt 2.0",
          COVER_META),
        p("Una capa de inteligencia agnóstica al POS, lista para distribuirse en el ecosistema Fiserv.",
          COVER_META),
        Spacer(1, 5.2 * cm),
        p("Mayo 2026  ·  Equipo Atlas Nexus  ·  Presentación para Fiserv",
          COVER_META),
    ]


def slide_section_intro_p1():
    return [
        Spacer(1, 5 * cm),
        p("PARTE 1", SECTION_KICKER),
        p("Lo que ya tenemos.", SECTION_TITLE),
        p("MVP funcional, demostrable y conectado a un POS real.",
          SECTION_SUB),
    ]


def slide_section_intro_p2():
    return [
        Spacer(1, 5 * cm),
        p("PARTE 2", SECTION_KICKER),
        p("Lo próximo a implementar.", SECTION_TITLE),
        p("Roadmap de ML, IA avanzada y go-to-market con Fiserv.",
          SECTION_SUB),
    ]


# ── PARTE 1 ──────────────────────────────────────────────────

def slide_problem():
    cards = [
        card("El dashboard del POS es básico",
             "Reportes y exports a Excel. No le dice al merchant <b>qué hacer</b> con esos números — solo se los muestra.",
             11 * cm, 4 * cm),
        card("No hay IA conversacional",
             "El merchant no puede preguntar <i>“¿por qué bajaron mis ventas?”</i> y obtener una respuesta razonada con su data real.",
             11 * cm, 4 * cm),
        card("Sin predicciones de stock",
             "El comercio chico no sabe cuánto comprar la semana que viene. Termina con faltantes o capital frenado en inventario.",
             11 * cm, 4 * cm),
        card("Clientes que se van sin avisar",
             "El POS no detecta churn temprano ni sugiere acción de retención. La data del comportamiento del cliente está, no se usa.",
             11 * cm, 4 * cm),
    ]
    return [
        p("EL PROBLEMA QUE RESOLVEMOS", SLIDE_KICKER),
        p("El comerciante moderno está sentado sobre data que no usa.", SLIDE_TITLE),
        p("4 dolores recurrentes que detectamos hablando con merchants reales en LATAM.",
          SLIDE_SUB),
        grid(cards, cols=2, col_widths=[12 * cm, 12 * cm],
             row_heights=[4.4 * cm, 4.4 * cm]),
    ]


def slide_what_is():
    cards = [
        card("IA Conversacional",
             "<i>“¿Cuál es mi producto estrella esta semana?”</i> → respuesta en castellano, con los números reales del comercio.",
             7.4 * cm, 4.6 * cm),
        card("Forecasting con XGBoost",
             "Predice demanda por producto a 7 días vista. Devuelve una lista de compras priorizada por urgencia.",
             7.4 * cm, 4.6 * cm),
        card("Alertas accionables",
             "Clientes en riesgo, productos sin movimiento, días sobre el promedio, avance de meta mensual.",
             7.4 * cm, 4.6 * cm),
    ]
    return [
        p("QUÉ ES ATLAS NEXUS", SLIDE_KICKER),
        p("Un acelerador de decisiones para el merchant.", SLIDE_TITLE),
        p("Tomamos las ventas, productos y clientes que ya están en el POS y los convertimos en respuestas y acciones — no en un reporte más.",
          SLIDE_SUB),
        Spacer(1, 0.3 * cm),
        grid(cards, cols=3, col_widths=[7.9 * cm, 7.9 * cm, 7.9 * cm],
             row_heights=[5 * cm]),
        Spacer(1, 0.6 * cm),
        p("“Un asesor de negocio que vive dentro del POS del comerciante, 24/7, "
          "que habla su idioma y le dice qué hacer hoy.”",
          QUOTE),
    ]


def slide_mvp_overview():
    # Left: hero image of laptop dashboard
    laptop = img("laptop_dashboard.png", width_cm=14.5)

    # Right: stacked feature mini-cards
    mini_cards_data = [
        ("Dashboard en vivo", "KPIs con deltas vs período previo, top productos, top clientes y timeline."),
        ("Briefing diario con IA", "Dato del día + insight + acción concreta. Llama 3.3 con contexto real."),
        ("Chat con tu negocio", "Preguntas en español con historial. Data real como contexto."),
        ("Forecasting + Stock", "XGBoost semanal por producto. Confianza calibrada."),
        ("Alertas automáticas", "Clientes en riesgo, productos sin movimiento, meta mensual."),
        ("Smart Receipt 2.0", "QR de cada venta → micrositio web → review + promo."),
    ]
    mini_cards = []
    for title, body in mini_cards_data:
        c = Table(
            [[Paragraph(f"<b>{title}</b>", CARD_TITLE)],
             [Paragraph(body, CARD_BODY)]],
            colWidths=[8.5 * cm],
        )
        c.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
            ("LINEBEFORE", (0, 0), (0, -1), 3, FISERV_ORANGE),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        mini_cards.append([c])

    cards_col = Table(mini_cards, colWidths=[8.5 * cm], rowHeights=[1.55 * cm] * 6)
    cards_col.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))

    layout = Table([[laptop, cards_col]],
                   colWidths=[15 * cm, 9 * cm])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 14),
    ]))

    return [
        p("LO QUE YA ESTÁ CONSTRUIDO", SLIDE_KICKER),
        p("MVP funcional, demostrable y en producción.", SLIDE_TITLE),
        p("Web + Backend + ML + IA + Android parcial. Todo dockerizado.", SLIDE_SUB),
        layout,
    ]


def slide_ai_detail():
    # Left: briefing card image
    briefing_img = img("briefing.png", width_cm=14)
    left_cell = [
        p("Briefing diario  ·  cada mañana", CARD_TITLE),
        Spacer(1, 0.2 * cm),
        briefing_img,
        Spacer(1, 0.2 * cm),
        p("Endpoint: <code>GET /insights/briefing</code>  ·  Llama 3.3 70B vía Groq",
          SMALL),
    ]

    # Right: phone chat
    phone = img("phone_chat.png", width_cm=6.5)
    right_cell = [
        p("Chat conversacional  ·  móvil + web", CARD_TITLE),
        Spacer(1, 0.15 * cm),
        Table([[phone]], colWidths=[8 * cm], rowHeights=[12 * cm]),
    ]

    t = Table([[left_cell, right_cell]], colWidths=[15 * cm, 9 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))

    return [
        p("IA CONVERSACIONAL  ·  DETALLE", SLIDE_KICKER),
        p("Briefing diario + chat — el merchant le pregunta a su data.",
          SLIDE_TITLE),
        p("Stack: Groq SDK + Llama 3.3 70B con prompts parametrizados por contexto real del comercio.",
          SLIDE_SUB),
        t,
    ]


def slide_forecasting_detail():
    laptop = img("laptop_forecasting.png", width_cm=15.5)

    rows = [
        ["Modelo",     "XGBoost 2.1"],
        ["Features",   "Lags, día, mes, tendencia, estacionalidad"],
        ["Fallback",   "Rolling mean si hay <4 semanas"],
        ["Output",     "Lista de compras priorizada"],
        ["Confianza",  "Semáforo verde / amarillo / rojo"],
        ["Endpoint",   "/forecasting/recommendations"],
    ]
    t = Table(rows, colWidths=[2.6 * cm, 5.5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), FISERV_ORANGE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, CARD_BG]),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
    ]))

    impact = [
        p("Impacto", CARD_TITLE),
        Spacer(1, 0.15 * cm),
        p("Menos faltantes, menos capital frenado en inventario. Especialmente útil en perecederos (cafetería, panadería, farmacia).",
          CARD_BODY),
        Spacer(1, 0.3 * cm),
        t,
    ]

    layout = Table([[laptop, impact]], colWidths=[16 * cm, 8 * cm])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 14),
    ]))

    return [
        p("FORECASTING CON ML  ·  DETALLE", SLIDE_KICKER),
        p("Predicción semanal por producto + lista de compras priorizada.",
          SLIDE_TITLE),
        p("XGBoost en producción. Fallback robusto para merchants nuevos sin histórico.",
          SLIDE_SUB),
        layout,
    ]


def slide_smart_receipt():
    phone = img("phone_receipt.png", width_cm=7)

    cards_data = [
        ("Para el merchant", "Cada venta tiene su URL pública. La comparte, la imprime con QR o la pega en redes.", FISERV_ORANGE),
        ("Para el cliente",   "Escanea el QR, ve detalle, deja reseña con estrellas y recibe promo personalizada.", BLUE),
        ("Para Atlas Nexus",  "Canal de retención propio + base de reviews. Cierra el loop venta → reseña → siguiente venta.", GREEN),
    ]
    card_rows = []
    for title, body, accent in cards_data:
        c = Table(
            [[Paragraph(f"<b>{title}</b>", CARD_TITLE)],
             [Paragraph(body, CARD_BODY)]],
            colWidths=[14.5 * cm],
        )
        c.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
            ("LINEBEFORE", (0, 0), (0, -1), 4, accent),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        card_rows.append([c])

    cards_col = Table(card_rows, colWidths=[14.5 * cm], rowHeights=[2.9 * cm] * 3)
    cards_col.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))

    layout = Table([[phone, cards_col]], colWidths=[8 * cm, 15.5 * cm])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 14),
    ]))

    return [
        p("SMART RECEIPT 2.0", SLIDE_KICKER),
        p("Cada ticket se convierte en un micrositio web.", SLIDE_TITLE),
        p("Una feature que ningún POS tradicional ofrece. Convierte el papelito en canal de marketing y retención.",
          SLIDE_SUB),
        layout,
    ]


def slide_stack():
    rows = [
        ["Frontend",          "React 18 · Vite 5 · Tailwind CSS · Recharts · Lucide"],
        ["Backend",           "Python 3 · FastAPI 0.115 · SQLAlchemy 2.0 · Pydantic"],
        ["Base de datos",     "PostgreSQL 15 (UUID, ENUMs, índices únicos, FKs)"],
        ["Autenticación",     "JWT (HS256) · bcrypt · refresh con gracia"],
        ["IA conversacional", "Groq SDK · Llama 3.3 70B versatile · prompts con data real"],
        ["Machine Learning",  "XGBoost 2.1 · scikit-learn · pandas · numpy"],
        ["Streaming",         "Server-Sent Events (sse-starlette)"],
        ["Integración POS",   "Cliente HTTP REST (httpx) + webhooks idempotentes"],
        ["DevOps",            "Docker + docker-compose · hot reload · volúmenes"],
        ["Mobile",            "Android nativo · Kotlin · Gradle KTS"],
    ]
    t = Table(rows, colWidths=[5 * cm, 18 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), FISERV_ORANGE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, CARD_BG]),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
    ]))
    return [
        p("STACK TECNOLÓGICO", SLIDE_KICKER),
        p("Arquitectura moderna, simple y lista para escalar.", SLIDE_TITLE),
        p("Stack elegido por madurez del ecosistema, costo operativo bajo y velocidad de iteración.",
          SLIDE_SUB),
        t,
    ]


def slide_integration_today():
    left = [
        p("Integración POS hoy", CARD_TITLE),
        Spacer(1, 0.2 * cm),
        p("Hoy estamos integrados con Clover como prueba de stack:", BODY),
        bullets([
            "<b>Pull manual</b>: botón <i>Sync</i> que trae las últimas N órdenes y las inserta idempotentemente.",
            "<b>Webhook</b>: recibe el evento y trae la orden completa.",
            "<b>Mapeo limpio</b>: orden POS → Sale + SaleItems internos, con auto-creación de productos.",
            "<b>Conversión correcta</b> de centavos, unitQty, métodos de pago, marcas y tipos de tarjeta.",
        ]),
        Spacer(1, 0.2 * cm),
        p("La capa de integración está abstraída por servicio — agregar otro POS es un adapter, no una reescritura.",
          SMALL),
    ]
    right_rows = [
        ["Endpoint POS",         "GET /v3/merchants/{mid}/orders"],
        ["Auth",                 "Bearer token (configurable)"],
        ["Webhook payload",      "{type, objectId}"],
        ["Idempotencia",         "order_id UNIQUE en sales"],
        ["Manejo de duplicados", "skipped si ya estaba importada"],
        ["Modelo final",         "Sale + items, listos para BI/IA/ML"],
    ]
    right_table = Table(right_rows, colWidths=[5 * cm, 6.5 * cm])
    right_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), FISERV_ORANGE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, CARD_BG]),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
    ]))
    right = [
        p("Pieza por pieza", CARD_TITLE),
        Spacer(1, 0.2 * cm),
        right_table,
    ]
    t = Table([[left, right]], colWidths=[13 * cm, 11 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return [
        p("INTEGRACIÓN POS  ·  ESTADO ACTUAL", SLIDE_KICKER),
        p("Ya leemos ventas reales de un POS productivo.", SLIDE_TITLE),
        p("Pull + webhook · Idempotente · Mapeo limpio. La integración con Clover prueba que el stack funciona end-to-end.",
          SLIDE_SUB),
        t,
    ]


# ── PARTE 2 ──────────────────────────────────────────────────

def slide_roadmap():
    rows = [
        ["Fase 1", "Cerrar app Android (Productos, Ventas, Insights, Forecasting, push)", "1–2 sem"],
        ["Fase 2", "Hardening: HMAC en webhook, OAuth, CI, tests, reset password, observabilidad", "2–3 sem"],
        ["Fase 3", "Multi-tenant + integración con Fiserv + sync completo", "3–4 sem"],
        ["Fase 3.5", "ML avanzado: Market Basket, RFM, Churn predictivo, anomalías", "1–2 sem"],
        ["Fase 4", "IA proactiva, precios dinámicos, fraude, IA por voz, generador de promos", "1–2 meses"],
        ["Fase 5", "WhatsApp Business, loyalty, mini-ecommerce, capital de trabajo, facturación electrónica", "2–3 meses"],
    ]
    t = Table(rows, colWidths=[2.6 * cm, 18 * cm, 2.6 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (0, -1), FISERV_ORANGE),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BACKGROUND", (2, 0), (2, -1), FISERV_NAVY),
        ("TEXTCOLOR", (2, 0), (2, -1), colors.white),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
        ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, CARD_BG]),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LINEBELOW", (1, 0), (1, -2), 0.3, LINE),
    ]))
    return [
        p("ROADMAP", SLIDE_KICKER),
        p("De MVP a producto distribuido en el ecosistema Fiserv.", SLIDE_TITLE),
        p("6 fases concatenadas. La fase 3 es la que nos pone en producción dentro del stack de Fiserv.",
          SLIDE_SUB),
        t,
    ]


def slide_ml_next():
    cards = [
        card("Market Basket + Lift",
             "“Quienes compran café también compran medialuna el 78% de las veces (lift 2.3x).” Combos sugeridos, sube ticket promedio 10–25%.",
             7.4 * cm, 5 * cm),
        card("Segmentación RFM + KMeans",
             "Agrupa clientes en VIP / Frecuentes / Ocasionales / Dormidos / Nuevos. Habilita marketing dirigido.",
             7.4 * cm, 5 * cm),
        card("Churn predictivo",
             "Reemplaza la regla actual (\">14 días sin comprar\") por XGBoost binario. Probabilidad de no volver en 30 días, intervención antes de que se vayan.",
             7.4 * cm, 5 * cm),
        card("Detección de anomalías",
             "Isolation Forest sobre ventas. Detecta fraudes potenciales, errores de carga, anomalías de inventario. Threshold ajustable.",
             7.4 * cm, 5 * cm),
        card("Velocity por producto",
             "Fast-movers vs slow-movers. Decisión clara de qué dejar de comprar y qué pedir más, complementa el forecasting.",
             7.4 * cm, 5 * cm),
        card("Cohortes de retención",
             "Tabla cohorte mes vs mes. Mide si las campañas funcionan, métrica core del tier Pro.",
             7.4 * cm, 5 * cm),
    ]
    return [
        p("PRÓXIMO ML AVANZADO  ·  FASE 3.5", SLIDE_KICKER),
        p("Modelos formales sobre la data transaccional.", SLIDE_TITLE),
        p("Cada modelo se traduce en una acción concreta sugerida al merchant.",
          SLIDE_SUB),
        grid(cards, cols=3,
             col_widths=[7.9 * cm, 7.9 * cm, 7.9 * cm],
             row_heights=[5.4 * cm, 5.4 * cm]),
    ]


def slide_ai_next():
    cards = [
        card("IA proactiva (push)",
             "El sistema le manda un insight al merchant sin que pregunte: “Hoy vas a vender 30% menos por la lluvia”, “Producto X en racha”.",
             10.8 * cm, 4.2 * cm),
        card("Generador de promos con IA",
             "“Mandale un 15% off por WhatsApp a tus 12 clientes en riesgo con texto personalizado a cada uno.” Cierra el ciclo detección → acción.",
             10.8 * cm, 4.2 * cm),
        card("IA por voz",
             "El comerciante le habla al celular y escucha la respuesta. Whisper → backend → TTS. Diferenciación para perfil no técnico.",
             10.8 * cm, 4.2 * cm),
        card("Precios dinámicos",
             "Sugerencia de precio por producto basada en elasticidad histórica + benchmarks del sector. Margen +3–8% por producto bien tuneado.",
             10.8 * cm, 4.2 * cm),
    ]
    return [
        p("PRÓXIMA IA AVANZADA  ·  FASE 4", SLIDE_KICKER),
        p("De respuestas a acciones — la IA empieza a moverle números al comercio.",
          SLIDE_TITLE),
        p("4 features que convierten Atlas Nexus de asesor pasivo a asesor que actúa.",
          SLIDE_SUB),
        grid(cards, cols=2,
             col_widths=[11.8 * cm, 11.8 * cm],
             row_heights=[4.6 * cm, 4.6 * cm]),
    ]


def slide_ops_next():
    cards = [
        card("Performance por vendedor",
             "Ranking de empleados por revenue, ticket promedio y conversión. Requiere sync de employees del POS.",
             7.4 * cm, 4 * cm),
        card("Análisis de mermas",
             "% de órdenes que terminan en void/refund. Razones más frecuentes. Requiere webhook de refunds/voids.",
             7.4 * cm, 4 * cm),
        card("LTV predicho por cliente",
             "Modelo BG/NBD + Gamma-Gamma. Predice valor total a 12 meses. Combinado con churn → “VIPs en riesgo”.",
             7.4 * cm, 4 * cm),
        card("Benchmarking entre comercios",
             "“Tu ticket promedio está en el percentil 60 entre cafeterías de tu zona.” Foso defensivo del producto.",
             7.4 * cm, 4 * cm),
        card("Estacionalidad + feriados",
             "Detección de picos recurrentes y aviso anticipado. Día de la madre, cumpleaños del local, días de cobro.",
             7.4 * cm, 4 * cm),
        card("Correlación clima ↔ ventas",
             "“Cuando llueve vendés 22% menos.” Ajuste de stock perecedero anticipado por pronóstico.",
             7.4 * cm, 4 * cm),
    ]
    return [
        p("INSIGHTS OPERACIONALES NUEVOS", SLIDE_KICKER),
        p("La próxima ola de insights, más allá del dashboard básico.", SLIDE_TITLE),
        p("Estos requieren multi-tenant + sync completo del POS. Habilitados por fase 3.",
          SLIDE_SUB),
        grid(cards, cols=3,
             col_widths=[7.9 * cm, 7.9 * cm, 7.9 * cm],
             row_heights=[4.4 * cm, 4.4 * cm]),
    ]


def slide_fiserv_fit():
    cards = [
        card("Capa de inteligencia agnóstica",
             "Atlas Nexus está construido para ser POS-agnostic. Hoy con Clover, mañana con cualquier merchant del stack Fiserv (Carat, Clover, IPS, etc.).",
             11.8 * cm, 5 * cm),
        card("Distribución por App Market",
             "Listo para integrarse en la base instalada de Fiserv. Onboarding desde la terminal, billing centralizado, trial configurable.",
             11.8 * cm, 5 * cm),
        card("Idioma + localización",
             "Español first, foco LATAM. Insights pensados para el merchant chico/mediano de la región — el que más necesita asesoramiento.",
             11.8 * cm, 5 * cm),
        card("Foco en valor para merchant",
             "Cada feature mueve un número: ticket promedio, retención, faltantes, capital frenado. No vendemos dashboards, vendemos resultados.",
             11.8 * cm, 5 * cm),
    ]
    return [
        p("CÓMO ENCAJA CON FISERV", SLIDE_KICKER),
        p("Una capa de inteligencia lista para distribuirse.", SLIDE_TITLE),
        p("Lo que Fiserv ya tiene: pagos, hardware, base instalada. Lo que sumamos nosotros: la capa de IA que convierte esa data en plata para el merchant.",
          SLIDE_SUB),
        grid(cards, cols=2,
             col_widths=[12.8 * cm, 12.8 * cm],
             row_heights=[5.4 * cm, 5.4 * cm]),
    ]


def slide_value_levers():
    stats = [
        stat_card("+10–25%", "ticket promedio<br/>con combos sugeridos", 5.7 * cm, 4 * cm,
                  color=FISERV_ORANGE),
        stat_card("+5–15%", "retención de clientes<br/>con churn predictivo", 5.7 * cm, 4 * cm,
                  color=BLUE),
        stat_card("–30%", "faltantes de stock<br/>con forecasting semanal", 5.7 * cm, 4 * cm,
                  color=GREEN),
        stat_card("–80%", "horas de análisis<br/>con briefing diario", 5.7 * cm, 4 * cm,
                  color=ROSE),
    ]
    return [
        p("VALOR PARA EL MERCHANT", SLIDE_KICKER),
        p("4 palancas que se traducen en plata.", SLIDE_TITLE),
        p("Cada feature está pensada para mover un número real del comercio. Rangos basados en benchmarks de retail + nuestros pilotos.",
          SLIDE_SUB),
        Spacer(1, 0.3 * cm),
        grid(stats, cols=4,
             col_widths=[6 * cm, 6 * cm, 6 * cm, 6 * cm],
             row_heights=[4.3 * cm]),
        Spacer(1, 0.6 * cm),
        p("<b>Tesis:</b> Fiserv monetizó pagos y hardware. El próximo escalón de valor para el merchant es la inteligencia sobre la data que ya genera. Atlas Nexus es esa capa.",
          LEAD),
    ]


def slide_asks():
    cards = [
        card("Acceso a partner tools",
             "Sandbox de desarrollo, documentación de OAuth / APIs Fiserv, guidelines de App Market review.",
             7.4 * cm, 4.6 * cm),
        card("Pilotos guiados",
             "5–10 merchants reales para validar onboarding < 5 min y medir lift en ticket promedio + retención.",
             7.4 * cm, 4.6 * cm),
        card("Co-marketing post-launch",
             "Featured listing en App Market, case study conjunto, presencia en eventos de partner / cliente.",
             7.4 * cm, 4.6 * cm),
    ]
    return [
        p("LO QUE PEDIMOS DE FISERV", SLIDE_KICKER),
        p("3 colaboraciones concretas para acelerar el go-to-market.", SLIDE_TITLE),
        p("Lo demás lo construimos nosotros.", SLIDE_SUB),
        grid(cards, cols=3,
             col_widths=[7.9 * cm, 7.9 * cm, 7.9 * cm],
             row_heights=[5 * cm]),
        Spacer(1, 0.5 * cm),
        p("<b>Próximo paso sugerido:</b> sesión técnica conjunta para definir alcance del piloto y stack de integración.",
          LEAD),
    ]


def slide_onboarding():
    # Visual: 4-step horizontal flow
    steps = [
        ("1", "Instalar", "Click \"Instalar Atlas Nexus\" desde la terminal Fiserv.", "5 s"),
        ("2", "Autorizar", "OAuth: el merchant da permiso para leer ventas y clientes.", "30 s"),
        ("3", "Sincronizar", "Atlas hace pull histórico de las últimas 4 semanas en background.", "1–2 min"),
        ("4", "Usar", "Briefing inicial generado con su data. Listo para usar.", "Inmediato"),
    ]
    step_cells = []
    for num, title, body, time in steps:
        # Circle with number
        circle_t = Table([[Paragraph(f"<b>{num}</b>",
                                     ParagraphStyle("n", parent=BODY,
                                                    fontSize=24, textColor=colors.white,
                                                    alignment=TA_CENTER))]],
                         colWidths=[1.6 * cm], rowHeights=[1.6 * cm])
        circle_t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), FISERV_ORANGE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ]))
        cell = [
            circle_t,
            Spacer(1, 0.3 * cm),
            p(f"<b>{title}</b>", CARD_TITLE),
            p(body, CARD_BODY),
            Spacer(1, 0.2 * cm),
            p(f"⏱  {time}", ParagraphStyle("t", parent=SMALL,
                                            textColor=FISERV_ORANGE, fontSize=11)),
        ]
        step_cells.append(cell)

    flow = Table([step_cells],
                 colWidths=[5.8 * cm, 5.8 * cm, 5.8 * cm, 5.8 * cm])
    flow.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
    ]))

    return [
        p("ONBOARDING", SLIDE_KICKER),
        p("De cero a primer insight en menos de 5 minutos.", SLIDE_TITLE),
        p("Autoservicio total. El merchant no necesita asistencia técnica ni configuración manual.",
          SLIDE_SUB),
        Spacer(1, 0.2 * cm),
        flow,
        Spacer(1, 0.5 * cm),
        p("<b>Hoy (MVP):</b> registro web + sync manual con asistencia técnica. <b>Fase 3 (objetivo Fiserv):</b> el flujo de arriba, 100% autoservicio.",
          LEAD),
    ]


def slide_scalability():
    cards = [
        card("Técnica  ·  miles de merchants sin reescribir",
             "Stack horizontal estándar (FastAPI + Postgres + Docker). ML batch nocturno = costo lineal por merchant. IA con cache + rate-limit por tier = costo controlado.",
             11.8 * cm, 5 * cm, accent=FISERV_ORANGE),
        card("Producto  ·  POS-agnostic + multi-vertical",
             "Capa de integración abstraída — sumar un POS nuevo es un adapter. El motor de insights no cambia entre retail / food / salud / farmacia.",
             11.8 * cm, 5 * cm, accent=BLUE),
        card("Geográfica  ·  español-first, expansión natural",
             "Foco LATAM (español). Portugués e inglés son traducción de prompts + ajuste de feriados/moneda — no es reescritura.",
             11.8 * cm, 5 * cm, accent=GREEN),
        card("Negocio  ·  distribución cautiva + pricing por tier",
             "App Market Fiserv = 0 CAC, sólo conversión. Pricing escalable Free → Pro → Business → Enterprise. Billing centralizado por Fiserv.",
             11.8 * cm, 5 * cm, accent=AMBER),
    ]
    return [
        p("ESCALABILIDAD", SLIDE_KICKER),
        p("4 ejes de crecimiento sin reescribir el producto.", SLIDE_TITLE),
        p("Pensado desde el día 1 para crecer en merchants, verticales, países y canales de monetización.",
          SLIDE_SUB),
        grid(cards, cols=2,
             col_widths=[12.8 * cm, 12.8 * cm],
             row_heights=[5.4 * cm, 5.4 * cm]),
    ]


def slide_closing():
    return [
        Spacer(1, 4.5 * cm),
        p("GRACIAS",
          ParagraphStyle("th", parent=COVER_TITLE, fontSize=60, textColor=colors.white)),
        Spacer(1, 0.3 * cm),
        p("Atlas Nexus — la capa de inteligencia para el merchant moderno.",
          ParagraphStyle("sub", parent=COVER_SUB, textColor=colors.white)),
        Spacer(1, 1.5 * cm),
        p("¿Conversamos sobre cómo avanzamos con Fiserv?",
          ParagraphStyle("q", parent=LEAD, textColor=colors.white,
                         fontSize=18, leading=24)),
    ]


# ─────────────────────────────────────────────────────────────
#  Build
# ─────────────────────────────────────────────────────────────

def build_pdf():
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=landscape(A4),
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
        topMargin=1.4 * cm, bottomMargin=1.7 * cm,
        title="Atlas Nexus — Presentación para Fiserv",
        author="Atlas Nexus",
    )

    frame = Frame(
        doc.leftMargin, doc.bottomMargin,
        PAGE_W - doc.leftMargin - doc.rightMargin,
        PAGE_H - doc.topMargin - doc.bottomMargin,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        showBoundary=0,
    )
    cover_frame = Frame(
        3.4 * cm, 1.5 * cm,
        PAGE_W - 3.4 * cm - 1.5 * cm,
        PAGE_H - 1.5 * cm - 1.5 * cm,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        showBoundary=0,
    )

    doc.addPageTemplates([
        PageTemplate(id="cover",   frames=[cover_frame], onPage=cover_chrome),
        PageTemplate(id="slide",   frames=[frame],       onPage=slide_chrome),
        PageTemplate(id="section", frames=[cover_frame], onPage=section_chrome),
        PageTemplate(id="closing", frames=[cover_frame], onPage=cover_chrome),
    ])

    story = []

    # 1 - Cover
    story += slide_cover()

    # Section divider — Parte 1
    story.append(NextPageTemplate("section"))
    story.append(PageBreak())
    story += slide_section_intro_p1()

    # Parte 1 — slides
    story.append(NextPageTemplate("slide"))
    story.append(PageBreak())
    story += slide_problem();              story.append(PageBreak())
    story += slide_what_is();              story.append(PageBreak())
    story += slide_mvp_overview();         story.append(PageBreak())
    story += slide_ai_detail();            story.append(PageBreak())
    story += slide_forecasting_detail();   story.append(PageBreak())
    story += slide_smart_receipt();        story.append(PageBreak())
    story += slide_onboarding();           story.append(PageBreak())
    story += slide_stack();                story.append(PageBreak())
    story += slide_integration_today()

    # Section divider — Parte 2
    story.append(NextPageTemplate("section"))
    story.append(PageBreak())
    story += slide_section_intro_p2()

    # Parte 2 — slides
    story.append(NextPageTemplate("slide"))
    story.append(PageBreak())
    story += slide_roadmap();              story.append(PageBreak())
    story += slide_ml_next();              story.append(PageBreak())
    story += slide_ai_next();              story.append(PageBreak())
    story += slide_ops_next();             story.append(PageBreak())
    story += slide_scalability();          story.append(PageBreak())
    story += slide_fiserv_fit();           story.append(PageBreak())
    story += slide_value_levers();         story.append(PageBreak())
    story += slide_asks()

    # Closing
    story.append(NextPageTemplate("closing"))
    story.append(PageBreak())
    story += slide_closing()

    doc.build(story)
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    build_pdf()
