"""
Genera una presentación PDF estilo diapositivas (landscape) dirigida
a ejecutivos de Clover: qué es Atlas Nexus, qué se hizo, cómo se
integra con Clover y qué viene.

Salida: docs/PITCH_CLOVER_ATLAS_NEXUS.pdf
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, ListFlowable, ListItem, KeepTogether, Image,
)
from reportlab.platypus.flowables import Flowable


OUTPUT = Path(__file__).resolve().parent.parent / "docs" / "PITCH_CLOVER_ATLAS_NEXUS.pdf"
PAGE_W, PAGE_H = landscape(A4)

# ─────────────────────────────────────────────────────────────
#  Paleta (alineada con la marca de Clover)
# ─────────────────────────────────────────────────────────────

CLOVER_GREEN = colors.HexColor("#00b140")      # verde Clover
DARK_GREEN   = colors.HexColor("#007a2c")
NIGHT        = colors.HexColor("#0b1620")
INK          = colors.HexColor("#0f172a")
SLATE        = colors.HexColor("#334155")
MUTED        = colors.HexColor("#64748b")
LIGHT        = colors.HexColor("#f1f5f9")
CARD_BG      = colors.HexColor("#f8fafc")
LINE         = colors.HexColor("#e2e8f0")
AMBER        = colors.HexColor("#f59e0b")
BLUE         = colors.HexColor("#1d4ed8")
ROSE         = colors.HexColor("#e11d48")


styles = getSampleStyleSheet()


def s(name, **kwargs):
    return ParagraphStyle(name=name, parent=styles["Normal"], **kwargs)


SLIDE_KICKER = s("Kicker", fontName="Helvetica-Bold", fontSize=10, leading=12,
                 textColor=CLOVER_GREEN, alignment=TA_LEFT, spaceAfter=2)
SLIDE_TITLE  = s("STitle", fontName="Helvetica-Bold", fontSize=28, leading=32,
                 textColor=INK, alignment=TA_LEFT, spaceAfter=4)
SLIDE_SUB    = s("SSub", fontName="Helvetica", fontSize=13, leading=17,
                 textColor=SLATE, alignment=TA_LEFT, spaceAfter=12)
BODY         = s("Body", fontName="Helvetica", fontSize=12, leading=17,
                 textColor=INK, alignment=TA_LEFT, spaceAfter=6)
BODY_W       = s("BodyW", fontName="Helvetica", fontSize=12, leading=17,
                 textColor=colors.white, alignment=TA_LEFT, spaceAfter=6)
LEAD         = s("Lead", fontName="Helvetica", fontSize=15, leading=21,
                 textColor=INK, alignment=TA_LEFT, spaceAfter=10)
BULLET       = s("Bullet", fontName="Helvetica", fontSize=12, leading=16,
                 textColor=INK, leftIndent=14, bulletIndent=2, spaceAfter=2)
SMALL        = s("Small", fontName="Helvetica", fontSize=9.5, leading=12,
                 textColor=MUTED)
SMALL_W      = s("SmallW", fontName="Helvetica", fontSize=10, leading=13,
                 textColor=colors.white, alignment=TA_LEFT)
CARD_TITLE   = s("CardT", fontName="Helvetica-Bold", fontSize=12.5, leading=15,
                 textColor=INK, spaceAfter=3)
CARD_BODY    = s("CardB", fontName="Helvetica", fontSize=10.5, leading=14,
                 textColor=SLATE, spaceAfter=0)
COVER_TITLE  = s("CoverT", fontName="Helvetica-Bold", fontSize=54, leading=58,
                 textColor=colors.white, alignment=TA_LEFT, spaceAfter=10)
COVER_SUB    = s("CoverS", fontName="Helvetica", fontSize=18, leading=24,
                 textColor=colors.white, alignment=TA_LEFT, spaceAfter=18)
COVER_META   = s("CoverM", fontName="Helvetica", fontSize=11, leading=14,
                 textColor=colors.white, alignment=TA_LEFT)
BIG_NUMBER   = s("BigN", fontName="Helvetica-Bold", fontSize=42, leading=46,
                 textColor=CLOVER_GREEN, alignment=TA_CENTER, spaceAfter=4)
BIG_LABEL    = s("BigL", fontName="Helvetica", fontSize=11, leading=14,
                 textColor=SLATE, alignment=TA_CENTER)
QUOTE        = s("Quote", fontName="Helvetica-Oblique", fontSize=14, leading=19,
                 textColor=INK, alignment=TA_LEFT)


# ─────────────────────────────────────────────────────────────
#  Helpers visuales
# ─────────────────────────────────────────────────────────────

def p(text, st=BODY):
    return Paragraph(text, st)


def bullets(items, st=BULLET, color=CLOVER_GREEN):
    return ListFlowable(
        [ListItem(Paragraph(t, st), leftIndent=12, bulletColor=color) for t in items],
        bulletType="bullet", bulletFontSize=9, leftIndent=18, bulletOffsetY=-1,
    )


def card(title, body, width, height, accent=CLOVER_GREEN, bg=CARD_BG, title_color=INK):
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


def stat_card(number, label, width, height, color=CLOVER_GREEN):
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
    """cells: list of flowables (or None), arranged row-major."""
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
#  Page chrome — distinto para cover vs slides
# ─────────────────────────────────────────────────────────────

def cover_chrome(canvas, doc):
    canvas.saveState()
    # Full background gradient-ish: solid dark + green accent block
    canvas.setFillColor(NIGHT)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(CLOVER_GREEN)
    canvas.rect(0, 0, 2.6 * cm, PAGE_H, fill=1, stroke=0)
    # Decorative circles
    canvas.setFillColor(DARK_GREEN)
    canvas.circle(PAGE_W - 4 * cm, PAGE_H - 4 * cm, 3 * cm, fill=1, stroke=0)
    canvas.setFillColor(CLOVER_GREEN)
    canvas.circle(PAGE_W - 2 * cm, 2 * cm, 1.6 * cm, fill=1, stroke=0)
    canvas.restoreState()


def slide_chrome(canvas, doc):
    canvas.saveState()
    # White background already (default)
    # Top brand strip
    canvas.setFillColor(CLOVER_GREEN)
    canvas.rect(0, PAGE_H - 0.35 * cm, PAGE_W, 0.35 * cm, fill=1, stroke=0)
    # Bottom footer line
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(1.5 * cm, 1.4 * cm, PAGE_W - 1.5 * cm, 1.4 * cm)
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.5 * cm, 0.9 * cm, "Atlas Nexus  ·  Pitch para Clover  ·  Mayo 2026")
    canvas.drawRightString(PAGE_W - 1.5 * cm, 0.9 * cm, f"{doc.page} / 16")
    canvas.restoreState()


def section_chrome(canvas, doc):
    """Section dividers — solid green background."""
    canvas.saveState()
    canvas.setFillColor(CLOVER_GREEN)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(DARK_GREEN)
    canvas.rect(0, PAGE_H - 0.8 * cm, PAGE_W, 0.8 * cm, fill=1, stroke=0)
    canvas.restoreState()


# ─────────────────────────────────────────────────────────────
#  Construcción de cada slide
# ─────────────────────────────────────────────────────────────

def slide_cover():
    return [
        Spacer(1, 4 * cm),
        p("ATLAS NEXUS", COVER_TITLE),
        p("La capa de inteligencia que le falta al ecosistema Clover", COVER_SUB),
        Spacer(1, 0.4 * cm),
        p("IA conversacional · Forecasting con ML · Insights accionables", COVER_META),
        p("Construido para merchants de Clover. Listo para el App Market.", COVER_META),
        Spacer(1, 5.5 * cm),
        p("Mayo 2026  ·  Equipo Atlas Nexus", COVER_META),
    ]


def slide_problem():
    cards = [
        card(
            "📊  El dashboard nativo es básico",
            "Clover muestra totales y exports a Excel. No le dice al comerciante <b>qué hacer</b> con esos números.",
            10.5 * cm, 4 * cm,
        ),
        card(
            "🧠  No hay IA conversacional",
            "Los merchants no pueden preguntar <i>“¿por qué bajaron mis ventas?”</i> y obtener una respuesta razonada con su data.",
            10.5 * cm, 4 * cm,
        ),
        card(
            "📦  Sin predicciones de stock",
            "El comerciante chico no sabe cuánto comprar la semana que viene. Termina con faltantes o con plata frenada en inventario.",
            10.5 * cm, 4 * cm,
        ),
        card(
            "🚪  Clientes se van sin avisar",
            "El POS no detecta clientes en riesgo de churn ni sugiere acciones de retención.",
            10.5 * cm, 4 * cm,
        ),
    ]
    body_table = grid(cards, cols=2, col_widths=[11.5 * cm, 11.5 * cm],
                      row_heights=[4.4 * cm, 4.4 * cm])
    return [
        p("EL PROBLEMA", SLIDE_KICKER),
        p("El comerciante chico de Clover está sentado sobre data que no usa.", SLIDE_TITLE),
        p("4 dolores recurrentes que detectamos hablando con merchants reales:", SLIDE_SUB),
        body_table,
    ]


def slide_what_is():
    cards = [
        card(
            "💬  IA Conversacional",
            "<i>“¿Cuál es mi producto estrella esta semana?”</i> → respuesta en castellano, con los números reales del comercio.",
            7.3 * cm, 4.4 * cm,
        ),
        card(
            "🔮  Forecasting con XGBoost",
            "Predice demanda por producto a 7 días vista. Devuelve una lista de compras priorizada por urgencia.",
            7.3 * cm, 4.4 * cm,
        ),
        card(
            "🚨  Alertas accionables",
            "Clientes en riesgo, productos sin movimiento, días por encima del promedio, avance de meta mensual.",
            7.3 * cm, 4.4 * cm,
        ),
    ]
    return [
        p("QUÉ ES ATLAS NEXUS", SLIDE_KICKER),
        p("Un acelerador de decisiones para merchants Clover.", SLIDE_TITLE),
        p("Tomamos las ventas, productos y clientes que ya están en Clover y los convertimos en respuestas y acciones — no en un reporte más.",
          SLIDE_SUB),
        Spacer(1, 0.3 * cm),
        grid(cards, cols=3, col_widths=[7.8 * cm, 7.8 * cm, 7.8 * cm],
             row_heights=[4.8 * cm]),
        Spacer(1, 0.6 * cm),
        p(
            "“Un asesor de negocio que vive dentro del Clover del comerciante, 24/7, "
            "que habla su idioma y le dice qué hacer hoy.”",
            QUOTE,
        ),
    ]


def slide_demo_overview():
    feature_cards = [
        card("Dashboard en vivo",
             "KPIs, deltas vs período anterior, gráficos de método de pago, marca de tarjeta, timeline, top productos y top clientes.",
             7.3 * cm, 4 * cm),
        card("Briefing diario IA",
             "Al abrir la app: dato del día + insight + acción concreta. Llama 3.3 con contexto del comercio.",
             7.3 * cm, 4 * cm),
        card("Chat con tu negocio",
             "Preguntas libres en español con historial. La IA tiene los datos reales como contexto.",
             7.3 * cm, 4 * cm),
        card("Forecasting + Stock",
             "XGBoost cuando hay ≥4 semanas de data, fallback rolling-mean cuando hay menos. Confianza calibrada.",
             7.3 * cm, 4 * cm),
        card("Sync Clover (1 click)",
             "Botón único que importa las últimas órdenes. Webhook idempotente para nuevas ventas.",
             7.3 * cm, 4 * cm),
        card("Tiempo real (SSE)",
             "Las ventas nuevas aparecen sin recargar. Listo para pantalla de caja.",
             7.3 * cm, 4 * cm),
    ]
    return [
        p("QUÉ ESTÁ CONSTRUIDO HOY", SLIDE_KICKER),
        p("MVP funcional, demostrable y conectado a Clover.", SLIDE_TITLE),
        p("Web + Backend + ML + IA + Android parcial. Todo dockerizado.", SLIDE_SUB),
        grid(feature_cards, cols=3,
             col_widths=[7.8 * cm, 7.8 * cm, 7.8 * cm],
             row_heights=[4.4 * cm, 4.4 * cm]),
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
        ["Integración POS",   "Cliente HTTP Clover REST v3 (httpx) + webhooks"],
        ["DevOps",            "Docker + docker-compose · hot reload · volúmenes"],
        ["Mobile",            "Android nativo · Kotlin · Gradle KTS"],
    ]
    t = Table(rows, colWidths=[5 * cm, 17.5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), CLOVER_GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, CARD_BG]),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
    ]))
    return [
        p("STACK", SLIDE_KICKER),
        p("Una arquitectura moderna, simple y lista para escalar.", SLIDE_TITLE),
        p("Tecnologías elegidas por madurez del ecosistema y por costo operativo bajo en early-stage.",
          SLIDE_SUB),
        t,
    ]


def slide_clover_today():
    left = [
        p("Integración Clover hoy", CARD_TITLE),
        Spacer(1, 0.2 * cm),
        p("Conectados al merchant de Clover con dos canales:", BODY),
        bullets([
            "<b>Pull manual</b> con un botón <i>Sync Clover</i>: trae las últimas N órdenes con <code>?expand=lineItems,payments</code> y las inserta idempotentemente.",
            "<b>Webhook</b> en <code>POST /clover/webhook</code>: recibe el evento y va a buscar la orden completa.",
            "<b>Mapeo</b> orden Clover → Sale + SaleItems de Atlas, con auto-creación de productos por nombre.",
            "<b>Conversión correcta</b> de centavos y unitQty Clover a precio y cantidad.",
            "<b>Detección de método de pago</b>: card (con type/brand) o QR.",
        ]),
    ]
    right_rows = [
        ["Endpoint Clover",      "GET /v3/merchants/{mid}/orders"],
        ["Auth",                 "Bearer token (1 merchant en .env)"],
        ["Webhook objeto",       "{type, objectId}"],
        ["Idempotencia",         "clover_order_id UNIQUE en sales"],
        ["Manejo de duplicados", "skipped si ya estaba importada"],
        ["Modelo final",         "Sale + items, listos para BI/IA/ML"],
    ]
    right_table = Table(right_rows, colWidths=[4.5 * cm, 7 * cm])
    right_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), DARK_GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, CARD_BG]),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
    ]))

    twocol = Table([[left, [p("Pieza por pieza", CARD_TITLE), Spacer(1, 0.2 * cm), right_table]]],
                   colWidths=[12 * cm, 11.5 * cm])
    twocol.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return [
        p("INTEGRACIÓN CLOVER · ESTADO ACTUAL", SLIDE_KICKER),
        p("Ya leemos ventas reales de Clover.", SLIDE_TITLE),
        p("Single-tenant. Pull + webhook. Idempotente. Mapeo limpio.", SLIDE_SUB),
        twocol,
    ]


def slide_section(title, kicker="VAMOS A LO INTERESANTE"):
    return [
        Spacer(1, 5.6 * cm),
        p(kicker, ParagraphStyle("sk", parent=SLIDE_KICKER, textColor=colors.white)),
        p(title, ParagraphStyle("st", parent=SLIDE_TITLE, textColor=colors.white, fontSize=36, leading=44)),
    ]


def slide_real_integration():
    steps = [
        card("1 · OAuth v2 de Clover",
             "Reemplazar el token único en .env por el flujo OAuth de Clover. El merchant instala la app desde su terminal y autoriza scopes (READ_ORDERS, READ_CUSTOMERS, READ_INVENTORY, WRITE_INVENTORY). Tokens persistidos por merchant en la base.",
             11.2 * cm, 4.6 * cm),
        card("2 · Firma HMAC en webhooks",
             "Validar la firma de cada webhook usando el secret del partner. Sin firma válida, rechazo automático. Esto cierra el agujero de ventas falsas.",
             11.2 * cm, 4.6 * cm),
        card("3 · Sincronización completa",
             "Hoy: solo orders. Sumamos inventory (bidireccional), customers (customer DB), employees (reportes por vendedor) y refunds/voids.",
             11.2 * cm, 4.6 * cm),
        card("4 · Publicación en Clover App Market",
             "Onboarding desde la terminal Clover, billing manejado por Clover (split 70/30), trial configurable (14/30/60/90 días), prorrateo automático.",
             11.2 * cm, 4.6 * cm),
    ]
    return [
        p("CÓMO VINCULAMOS ESTO A CLOVER DE VERDAD", SLIDE_KICKER),
        p("De integración local a app distribuida en el App Market.", SLIDE_TITLE),
        p("4 movimientos técnico-comerciales para convertir el MVP en una app productiva del ecosistema.",
          SLIDE_SUB),
        grid(steps, cols=2, col_widths=[11.7 * cm, 11.7 * cm],
             row_heights=[4.9 * cm, 4.9 * cm]),
    ]


def slide_architecture():
    diagram_rows = [
        # Top row: Clover side
        [
            card("Clover Merchant",
                 "Terminal Flex / Mini / Station. Hace ventas, voids, refunds.",
                 6.5 * cm, 3.2 * cm, accent=CLOVER_GREEN),
            card("Clover REST API",
                 "GET orders · GET customers · inventory · employees · webhooks firmados",
                 6.5 * cm, 3.2 * cm, accent=DARK_GREEN),
            card("Clover App Market",
                 "OAuth v2 · Billing · Distribución a la base instalada",
                 6.5 * cm, 3.2 * cm, accent=CLOVER_GREEN),
        ],
        # Middle: Atlas backend
        [
            card("Atlas API (FastAPI)",
                 "Routers: auth · sales · dashboard · insights · forecasting · clover",
                 6.5 * cm, 3.2 * cm, accent=BLUE),
            card("Servicios",
                 "clover_service · ml_forecasting · event_manager · auth",
                 6.5 * cm, 3.2 * cm, accent=BLUE),
            card("Postgres",
                 "users · sales · sale_items · products · stock · predictions",
                 6.5 * cm, 3.2 * cm, accent=BLUE),
        ],
        # Bottom: Intelligence + clients
        [
            card("Capa IA / ML",
                 "Groq + Llama 3.3 (insights) · XGBoost (forecasting) · scikit-learn (futuro RFM/MBA)",
                 6.5 * cm, 3.2 * cm, accent=AMBER),
            card("Frontend Web (React)",
                 "Dashboard · Insights · Forecasting · Products · Settings",
                 6.5 * cm, 3.2 * cm, accent=AMBER),
            card("App Android (Kotlin)",
                 "Login + dashboard · roadmap fase 1 completa",
                 6.5 * cm, 3.2 * cm, accent=AMBER),
        ],
    ]
    flat_cells = [c for row in diagram_rows for c in row]
    t = grid(flat_cells, cols=3,
             col_widths=[7.6 * cm, 7.6 * cm, 7.6 * cm],
             row_heights=[3.5 * cm, 3.5 * cm, 3.5 * cm])
    return [
        p("ARQUITECTURA OBJETIVO", SLIDE_KICKER),
        p("Tres capas. Conexión nativa al ecosistema Clover.", SLIDE_TITLE),
        p("Diseñada para multi-tenant desde el día 1, lista para escalar dentro del App Market.",
          SLIDE_SUB),
        t,
    ]


def slide_differentiation():
    rows = [
        ["", "Apps típicas del App Market", "Atlas Nexus"],
        ["Reportes",            "Export a Excel / dashboards estáticos", "Dashboard con deltas y benchmarks vs período previo"],
        ["IA",                  "Ninguna / chatbots genéricos",          "IA con contexto real del comercio (Llama 3.3)"],
        ["Forecasting",         "No tienen",                              "XGBoost por producto, semanal, con confianza calibrada"],
        ["Retención",           "Listas de clientes",                     "Detección automática de churn + acción sugerida"],
        ["Recomendaciones",     "—",                                       "Lista de compras priorizada + alertas semáforo"],
        ["Idioma",              "Inglés first",                            "Español first (LATAM)"],
    ]
    t = Table(rows, colWidths=[4.5 * cm, 9 * cm, 9.5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("BACKGROUND", (0, 0), (-1, 0), NIGHT),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (2, 1), (2, -1), colors.HexColor("#dcfce7")),
        ("FONTNAME", (2, 1), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (2, 1), (2, -1), DARK_GREEN),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), INK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (1, -1), [colors.white, CARD_BG]),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
    ]))
    return [
        p("DIFERENCIACIÓN EN EL APP MARKET", SLIDE_KICKER),
        p("Lo que nadie está haciendo bien dentro del ecosistema.", SLIDE_TITLE),
        p("Las apps actuales son reportes glorificados. Nosotros somos un asesor con IA + ML real.",
          SLIDE_SUB),
        t,
    ]


def slide_value_for_merchant():
    cards = [
        card("⬆️  Subir el ticket promedio",
             "Recomendaciones de combos (próxima Market Basket Analysis con Apriori) + sugerencias proactivas.",
             10.8 * cm, 3.8 * cm),
        card("🎯  Reducir el churn de clientes",
             "Detección automática de clientes que dejaron de comprar + sugerencia de promo personalizada.",
             10.8 * cm, 3.8 * cm),
        card("📦  Optimizar inventario",
             "Lista de compras semanal con confianza y alertas semáforo. Menos faltantes, menos capital frenado.",
             10.8 * cm, 3.8 * cm),
        card("🕒  Ahorrar horas de análisis",
             "Briefing diario en 2 oraciones reemplaza horas de exportar a Excel y armar tablas dinámicas.",
             10.8 * cm, 3.8 * cm),
    ]
    return [
        p("VALOR PARA EL MERCHANT", SLIDE_KICKER),
        p("4 palancas que se traducen en plata.", SLIDE_TITLE),
        p("Cada feature está pensada para mover un número del merchant, no para verse linda.", SLIDE_SUB),
        grid(cards, cols=2, col_widths=[11.7 * cm, 11.7 * cm],
             row_heights=[4.1 * cm, 4.1 * cm]),
    ]


def slide_roadmap():
    phases = [
        ("Fase 1", "Cerrar app Android (Productos, Ventas, Insights, Forecasting, push)", "1–2 sem"),
        ("Fase 2", "Hardening: HMAC en webhook, OAuth, CI, tests, reset password, observabilidad", "2–3 sem"),
        ("Fase 3", "Multi-tenant + publicación en Clover App Market + sync completo", "3–4 sem"),
        ("Fase 3.5", "ML avanzado: Market Basket, RFM, Churn predictivo, anomalías", "1–2 sem"),
        ("Fase 4", "IA proactiva, precios dinámicos, fraude, IA por voz, generador de promos", "1–2 meses"),
        ("Fase 5", "WhatsApp Business, loyalty, mini-ecommerce, capital de trabajo, facturación electrónica", "2–3 meses"),
    ]
    rows = []
    for ph, body, when in phases:
        rows.append([ph, Paragraph(body, BODY), when])
    t = Table(rows, colWidths=[3 * cm, 16.5 * cm, 3.5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (0, -1), CLOVER_GREEN),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("BACKGROUND", (2, 0), (2, -1), NIGHT),
        ("TEXTCOLOR", (2, 0), (2, -1), colors.white),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE),
        ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, CARD_BG]),
    ]))
    return [
        p("ROADMAP", SLIDE_KICKER),
        p("De MVP single-tenant a app del Clover App Market.", SLIDE_TITLE),
        p("Plan en 6 fases concatenadas. La fase 3 es la que nos pone en producción dentro de Clover.",
          SLIDE_SUB),
        t,
    ]


def slide_business():
    tiers = [
        card("Free",
             "Dashboard básico · hasta 100 ventas/mes · sin IA · ideal para onboarding viral.",
             5.5 * cm, 6 * cm, accent=MUTED, bg=CARD_BG),
        card("Pro · $29/mes",
             "IA conversacional · forecasting · alertas · sin límite de ventas.",
             5.5 * cm, 6 * cm, accent=CLOVER_GREEN, bg=colors.HexColor("#dcfce7")),
        card("Business · $99/mes",
             "Todo Pro + multi-local · multi-usuario · roles · integraciones.",
             5.5 * cm, 6 * cm, accent=BLUE, bg=colors.HexColor("#dbeafe")),
        card("Enterprise",
             "Precio a medida · soporte dedicado · onboarding asistido.",
             5.5 * cm, 6 * cm, accent=AMBER, bg=colors.HexColor("#fef3c7")),
    ]
    grid_tiers = grid(tiers, cols=4,
                      col_widths=[5.9 * cm, 5.9 * cm, 5.9 * cm, 5.9 * cm],
                      row_heights=[6.3 * cm])
    return [
        p("MODELO DE NEGOCIO", SLIDE_KICKER),
        p("Pricing pensado para escalar dentro del App Market.", SLIDE_TITLE),
        p("Free para captar, Pro para monetizar, Business para retener, Enterprise para crecimiento ARPU.",
          SLIDE_SUB),
        grid_tiers,
        Spacer(1, 0.4 * cm),
        p(
            "<b>Split Clover:</b> 70/30 (nosotros / Clover) sobre el revenue de la app. "
            "<b>Billing</b> manejado por Clover, sin que tengamos que tocar tarjetas ni AR. "
            "Trials de 14 a 90 días configurables.",
            BODY,
        ),
    ]


def slide_market():
    stats_row = [
        stat_card("100k+",  "merchants activos<br/>en Clover (EEUU + LATAM)", 5.8 * cm, 3.6 * cm),
        stat_card("0.1%",   "captura objetivo<br/>en 12 meses", 5.8 * cm, 3.6 * cm, color=BLUE),
        stat_card("$29–99", "ARPU mensual<br/>según tier",      5.8 * cm, 3.6 * cm, color=AMBER),
        stat_card("70/30",  "split revenue<br/>App Market",     5.8 * cm, 3.6 * cm, color=ROSE),
    ]
    return [
        p("LA OPORTUNIDAD", SLIDE_KICKER),
        p("Por qué Clover, por qué ahora.", SLIDE_TITLE),
        p("App Market maduro, base instalada cautiva, gap evidente en analytics + IA.", SLIDE_SUB),
        Spacer(1, 0.6 * cm),
        grid(stats_row, cols=4,
             col_widths=[6 * cm, 6 * cm, 6 * cm, 6 * cm],
             row_heights=[3.8 * cm]),
        Spacer(1, 0.6 * cm),
        p("<b>Tesis:</b> Clover monetizó el hardware y los pagos. El próximo escalón de "
          "valor para el merchant es la inteligencia sobre la data que ya genera. "
          "Atlas Nexus es esa capa, lista para distribuirse.", LEAD),
    ]


def slide_future_steps():
    cards = [
        card("📡  Próximos 30 días",
             "Hardening de seguridad (HMAC, CORS, JWT) · Alembic real · CI/CD básico · suite de tests E2E.",
             10.8 * cm, 4 * cm),
        card("🔐  60 días",
             "OAuth v2 con Clover · multi-tenant con business_id · refresh tokens por merchant · scopes mínimos.",
             10.8 * cm, 4 * cm),
        card("🏪  90 días",
             "Submission al Clover App Market · pricing en consola Clover · trial configurable · onboarding < 5 min.",
             10.8 * cm, 4 * cm),
        card("🧠  120+ días",
             "ML avanzado: Market Basket (Apriori/FP-Growth), RFM + KMeans, Churn predictivo, anomalías (Isolation Forest).",
             10.8 * cm, 4 * cm),
    ]
    return [
        p("PASOS FUTUROS QUE NOS LLEVAN AL APP MARKET", SLIDE_KICKER),
        p("Una hoja de ruta concreta, no aspiracional.", SLIDE_TITLE),
        p("Cada hito tiene entregable visible y métrica asociada.", SLIDE_SUB),
        grid(cards, cols=2, col_widths=[11.7 * cm, 11.7 * cm],
             row_heights=[4.3 * cm, 4.3 * cm]),
    ]


def slide_asks():
    asks = [
        card("🤝  Acceso temprano a partner tools",
             "Sandbox de desarrollo, documentación OAuth v2 y guidelines de App Market review.",
             7.4 * cm, 5.8 * cm),
        card("🧪  Pilotos guiados",
             "5–10 merchants reales para validar onboarding < 5 min y medir lift en ticket promedio + retención.",
             7.4 * cm, 5.8 * cm),
        card("📣  Co-marketing post-launch",
             "Featured listing en App Market durante el launch, case study conjunto, sesión en Clover Connect.",
             7.4 * cm, 5.8 * cm),
    ]
    return [
        p("LO QUE NECESITAMOS DE CLOVER", SLIDE_KICKER),
        p("3 colaboraciones concretas para acelerar el go-to-market.", SLIDE_TITLE),
        p("Lo demás lo construimos nosotros.", SLIDE_SUB),
        grid(asks, cols=3,
             col_widths=[7.9 * cm, 7.9 * cm, 7.9 * cm],
             row_heights=[6.1 * cm]),
    ]


def slide_closing():
    return [
        Spacer(1, 4.5 * cm),
        p("GRACIAS", ParagraphStyle("th", parent=COVER_TITLE, fontSize=60, textColor=colors.white)),
        Spacer(1, 0.3 * cm),
        p("Atlas Nexus — la capa de inteligencia del ecosistema Clover.",
          ParagraphStyle("sub", parent=COVER_SUB, textColor=colors.white)),
        Spacer(1, 1.5 * cm),
        p("¿Conversamos sobre el siguiente paso?",
          ParagraphStyle("q", parent=LEAD, textColor=colors.white, fontSize=18, leading=24)),
    ]


# ─────────────────────────────────────────────────────────────
#  Doc multi-template (por slide cambia el chrome)
# ─────────────────────────────────────────────────────────────

from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, NextPageTemplate


def build_pdf():
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=landscape(A4),
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
        topMargin=1.4 * cm, bottomMargin=1.7 * cm,
        title="Atlas Nexus — Pitch para Clover",
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

    # 1
    story += slide_cover()
    story.append(NextPageTemplate("slide"))
    story.append(PageBreak())

    # 2
    story += slide_problem();          story.append(PageBreak())
    # 3
    story += slide_what_is();          story.append(PageBreak())
    # 4
    story += slide_demo_overview();    story.append(PageBreak())
    # 5
    story += slide_stack();            story.append(PageBreak())
    # 6
    story += slide_clover_today()

    # 7 — section divider
    story.append(NextPageTemplate("section"))
    story.append(PageBreak())
    story += slide_section("Cómo vinculamos esto a Clover de verdad.", "PARTE 2")
    story.append(NextPageTemplate("slide"))
    story.append(PageBreak())

    # 8
    story += slide_real_integration(); story.append(PageBreak())
    # 9
    story += slide_architecture();     story.append(PageBreak())
    # 10
    story += slide_differentiation();  story.append(PageBreak())
    # 11
    story += slide_value_for_merchant()
    story.append(PageBreak())

    # 12
    story += slide_roadmap();          story.append(PageBreak())
    # 13
    story += slide_business();         story.append(PageBreak())
    # 14
    story += slide_market();           story.append(PageBreak())
    # 15
    story += slide_future_steps();     story.append(PageBreak())
    # 16
    story += slide_asks()

    # closing
    story.append(NextPageTemplate("closing"))
    story.append(PageBreak())
    story += slide_closing()

    doc.build(story)
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    build_pdf()
