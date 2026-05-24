"""
Genera un PDF MUY detallado del estado de Atlas Nexus.
Estructura: palabras simples primero, después lo técnico al detalle.
Salida: docs/RESUMEN_COMPLETO_ATLAS_NEXUS.pdf
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, ListFlowable, ListItem, KeepTogether,
)


OUTPUT = Path(__file__).resolve().parent.parent / "docs" / "RESUMEN_COMPLETO_ATLAS_NEXUS.pdf"


# ─────────────────────────────────────────────────────────────
#  Estilos
# ─────────────────────────────────────────────────────────────

styles = getSampleStyleSheet()

GREEN = colors.HexColor("#16a34a")
DARK = colors.HexColor("#0f172a")
GREY = colors.HexColor("#475569")
LIGHT = colors.HexColor("#f1f5f9")
BLUE = colors.HexColor("#1e40af")
ORANGE = colors.HexColor("#ea580c")
RED = colors.HexColor("#dc2626")


def style(name, **kwargs):
    base = styles["Normal"]
    return ParagraphStyle(name=name, parent=base, **kwargs)


TITLE_COVER = style(
    "TitleCover", fontName="Helvetica-Bold", fontSize=32, leading=38,
    textColor=DARK, alignment=TA_LEFT, spaceAfter=6,
)
SUBTITLE_COVER = style(
    "SubtitleCover", fontName="Helvetica", fontSize=14, leading=18,
    textColor=GREY, alignment=TA_LEFT, spaceAfter=18,
)
META = style(
    "Meta", fontName="Helvetica", fontSize=10, leading=14,
    textColor=GREY, alignment=TA_LEFT,
)
H1 = style(
    "H1", fontName="Helvetica-Bold", fontSize=22, leading=28,
    textColor=GREEN, spaceBefore=18, spaceAfter=10,
)
H2 = style(
    "H2", fontName="Helvetica-Bold", fontSize=16, leading=21,
    textColor=DARK, spaceBefore=14, spaceAfter=8,
)
H3 = style(
    "H3", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
    textColor=BLUE, spaceBefore=10, spaceAfter=4,
)
H4 = style(
    "H4", fontName="Helvetica-Bold", fontSize=10.5, leading=14,
    textColor=DARK, spaceBefore=8, spaceAfter=3,
)
BODY = style(
    "Body", fontName="Helvetica", fontSize=10.5, leading=15,
    textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6,
)
BULLET = style(
    "Bullet", fontName="Helvetica", fontSize=10.5, leading=14,
    textColor=DARK, leftIndent=14, bulletIndent=2,
)
SMALL = style(
    "Small", fontName="Helvetica", fontSize=9, leading=12,
    textColor=GREY, alignment=TA_LEFT,
)
CODE = style(
    "Code", fontName="Courier", fontSize=9, leading=12,
    textColor=DARK, backColor=LIGHT,
    leftIndent=6, rightIndent=6, spaceAfter=6, spaceBefore=4,
)
TAG = style(
    "Tag", fontName="Helvetica-Bold", fontSize=8.5, leading=11,
    textColor=colors.white, alignment=TA_LEFT,
)


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def p(text, st=BODY):
    return Paragraph(text, st)


def bullets(items, st=BULLET):
    return ListFlowable(
        [ListItem(Paragraph(t, st), leftIndent=12, bulletColor=GREEN) for t in items],
        bulletType="bullet", bulletFontSize=8, leftIndent=16, bulletOffsetY=-1,
    )


def kv_table(rows, col_widths=None, header=None):
    data = []
    if header:
        data.append(header)
    data.extend(rows)
    t = Table(data, colWidths=col_widths or [4.5 * cm, 12 * cm], hAlign="LEFT")
    base_style = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TEXTCOLOR", (0, 0), (-1, -1), DARK),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT]),
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ]
    if header:
        base_style += [
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    t.setStyle(TableStyle(base_style))
    return t


def section_divider():
    t = Table([[""]], colWidths=[16.5 * cm], rowHeights=[0.06 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), GREEN)]))
    return t


def badge(text, color):
    t = Table([[text]], colWidths=[3.0 * cm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


# ─────────────────────────────────────────────────────────────
#  Página y footer
# ─────────────────────────────────────────────────────────────

def add_page_chrome(canvas, doc):
    canvas.saveState()
    # Top accent bar
    canvas.setFillColor(GREEN)
    canvas.rect(0, A4[1] - 0.4 * cm, A4[0], 0.4 * cm, fill=1, stroke=0)
    # Footer
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(2 * cm, 1.2 * cm, "Atlas Nexus · Resumen completo del proyecto · 2026-05-23")
    canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Página {doc.page}")
    canvas.restoreState()


# ─────────────────────────────────────────────────────────────
#  Contenido
# ─────────────────────────────────────────────────────────────

def build_story():
    s = []

    # ───── COVER ─────
    s.append(Spacer(1, 3 * cm))
    s.append(p("ATLAS NEXUS", TITLE_COVER))
    s.append(p("Resumen completo del proyecto", SUBTITLE_COVER))
    s.append(badge("VERSIÓN DETALLADA", GREEN))
    s.append(Spacer(1, 1.2 * cm))
    s.append(p(
        "Este documento explica <b>absolutamente todo</b> lo que está hecho en el "
        "proyecto Atlas Nexus, primero en palabras simples para cualquier persona "
        "del equipo o stakeholder, y después con el detalle técnico de cada "
        "tecnología, módulo y decisión de diseño.", BODY,
    ))
    s.append(Spacer(1, 0.6 * cm))
    s.append(p(
        "<b>Atlas Nexus</b> es un acelerador inteligente para negocios emergentes "
        "que ya usan <b>Clover POS</b>. Tomamos sus ventas, sus productos, sus "
        "clientes recurrentes y los cruzamos con inteligencia artificial y machine "
        "learning para dar al dueño del negocio respuestas que hoy no tiene: qué "
        "vendió, por qué, qué se viene la semana que entra, qué cliente está por "
        "irse y qué producto va a quedar sin stock.", BODY,
    ))
    s.append(Spacer(1, 1.5 * cm))
    s.append(p("Fecha: 23 de mayo de 2026", META))
    s.append(p("Repositorio: track_integracionpagos · Branch: main", META))
    s.append(p("Estado: MVP single-tenant funcional (Web + Backend + ML + IA + Android parcial)", META))

    s.append(PageBreak())

    # ───── TOC ─────
    s.append(p("Contenido", H1))
    s.append(section_divider())
    s.append(Spacer(1, 0.4 * cm))
    toc_items = [
        "1. Qué es Atlas Nexus (en una frase)",
        "2. Para quién está pensado",
        "3. Qué se hizo, explicado en palabras simples",
        "  3.1. Registro e inicio de sesión",
        "  3.2. Dashboard principal del negocio",
        "  3.3. Productos y categorías",
        "  3.4. Sincronización con Clover (la caja registradora)",
        "  3.5. Insights con Inteligencia Artificial",
        "  3.6. Forecasting / Predicción de demanda y stock",
        "  3.7. Patrones de compra",
        "  3.8. Meta mensual y configuración",
        "  3.9. App móvil Android",
        "  3.10. Datos de demostración",
        "  3.11. Ventas en tiempo real",
        "4. Cómo se ve el flujo end-to-end",
        "5. Tecnologías usadas — vista panorámica",
        "6. Backend en profundidad (FastAPI + SQLAlchemy + Postgres)",
        "7. Modelo de datos (tablas y relaciones)",
        "8. Endpoints / API REST disponibles",
        "9. Frontend en profundidad (React + Vite + Tailwind + Recharts)",
        "10. Inteligencia Artificial conversacional (Groq + Llama 3.3)",
        "11. Machine Learning de forecasting (XGBoost + pandas)",
        "12. Integración con Clover POS",
        "13. Streaming en tiempo real (SSE)",
        "14. Autenticación y seguridad",
        "15. Infraestructura local y deploy (Docker Compose)",
        "16. App Android (Kotlin + Gradle) — estado actual",
        "17. Estado del proyecto, deuda técnica y próximos pasos",
        "18. Roadmap por fases",
        "19. Modelo de negocio sugerido",
    ]
    for it in toc_items:
        s.append(p(it, BODY))
    s.append(PageBreak())

    # ────────────────────────────────────────────────────
    #  PARTE 1 — PALABRAS SIMPLES
    # ────────────────────────────────────────────────────
    s.append(p("PARTE 1", SMALL))
    s.append(p("Lo que se hizo, en palabras simples", H1))
    s.append(section_divider())
    s.append(Spacer(1, 0.3 * cm))

    # 1
    s.append(p("1. Qué es Atlas Nexus (en una frase)", H2))
    s.append(p(
        "Es una aplicación web (con app móvil Android en camino) que se conecta a "
        "una caja registradora Clover y le da al dueño del negocio un panel con "
        "información clara: cuánto vendió hoy, qué le va a faltar la semana que "
        "viene, qué clientes están dejando de comprarle, y un asistente con "
        "inteligencia artificial al que puede preguntarle cosas en español como si "
        "fuera un asesor.", BODY,
    ))

    s.append(p("2. Para quién está pensado", H2))
    s.append(p(
        "Para comerciantes chicos y medianos — una cafetería, un kiosco, una "
        "panadería, una tienda de barrio, un local de ropa — que ya usan Clover "
        "como sistema de cobro y quieren entender mejor su negocio sin tener que "
        "ser contadores ni saber Excel. La aplicación habla en castellano, es "
        "directa, y no asume conocimientos técnicos.", BODY,
    ))

    s.append(p("3. Qué se hizo, explicado en palabras simples", H2))

    # 3.1
    s.append(p("3.1. Registro e inicio de sesión", H3))
    s.append(p(
        "El comerciante entra al sitio, crea una cuenta con su email, el nombre de "
        "su tienda y una contraseña. La próxima vez vuelve a entrar con email y "
        "contraseña y queda dentro de su panel. Cada cuenta es independiente: las "
        "ventas y los datos de un negocio no se mezclan con los de otro. La "
        "contraseña no se guarda como la escribió: se guarda <i>hasheada</i> (es "
        "decir, transformada de manera que ni siquiera nosotros podemos verla).", BODY,
    ))

    # 3.2
    s.append(p("3.2. Dashboard principal del negocio", H3))
    s.append(p(
        "Apenas entra, el comerciante ve un tablero con los números importantes "
        "del negocio. Puede elegir si quiere mirar <b>hoy, esta semana, este mes "
        "o este año</b>, y todo el tablero se recalcula al instante.", BODY,
    ))
    s.append(p("Tarjetas principales (KPIs) que se muestran:", H4))
    s.append(bullets([
        "<b>Ingresos totales</b> del período, con flecha arriba o abajo comparando contra el período anterior.",
        "<b>Cantidad de ventas</b> hechas en el período.",
        "<b>Ticket promedio</b>: cuánto gasta en promedio cada cliente por compra.",
        "<b>Cantidad de productos</b> que tiene cargados.",
        "<b>Cantidad de categorías</b> en que tiene organizados sus productos.",
        "<b>Clientes únicos</b> identificados en el período.",
        "<b>Tasa de retorno</b>: qué porcentaje de clientes volvió a comprar.",
    ]))
    s.append(p("Gráficos que se muestran:", H4))
    s.append(bullets([
        "<b>Línea de ventas a lo largo del tiempo</b> — un día por punto, para ver cuándo vendió más y cuándo menos.",
        "<b>Distribución por método de pago</b> (Tarjeta vs QR) en un gráfico de torta.",
        "<b>Distribución por marca de tarjeta</b> (Visa, Mastercard, Amex).",
        "<b>Top 10 productos</b> por ingresos, con cantidad de unidades vendidas.",
        "<b>Categorías con más ingresos</b>.",
        "<b>Top 5 clientes</b> por gasto total, con la cantidad de compras que hicieron.",
    ]))

    s.append(p("Otras cosas que aparecen en la página principal:", H4))
    s.append(bullets([
        "Un <b>briefing del día</b> generado con IA: 2 o 3 oraciones que combinan un dato concreto, una oportunidad o riesgo, y una acción específica que el dueño puede tomar HOY.",
        "<b>Alertas inteligentes</b>: clientes en riesgo de irse, días en que se vendió por encima del promedio, productos que dejaron de venderse, avances hacia la meta del mes.",
        "Un botón de <b>Sync Clover</b> que va y trae las últimas ventas de la caja registradora con un click.",
        "Botón de <b>refresh</b> para actualizar los datos manualmente, y selector de período.",
    ]))

    # 3.3
    s.append(p("3.3. Productos y categorías", H3))
    s.append(p(
        "El comerciante puede dar de alta los productos que vende, ponerles un "
        "precio y agruparlos en categorías (por ejemplo: Bebidas, Comidas, "
        "Postres). Cada producto puede pertenecer a varias categorías a la vez. "
        "Esto sirve para que los reportes después salgan ordenados y la IA pueda "
        "razonar sobre 'qué categoría te está rindiendo más' en vez de hablar "
        "producto por producto.", BODY,
    ))

    # 3.4
    s.append(p("3.4. Sincronización con Clover (la caja registradora)", H3))
    s.append(p(
        "Si el negocio ya tiene Clover configurado (token de acceso del comercio), "
        "el sistema puede traer las ventas reales de Clover y meterlas en Atlas. "
        "Hay dos formas de hacerlo:", BODY,
    ))
    s.append(bullets([
        "<b>Sync manual</b>: el comerciante aprieta un botón y el backend va a la API de Clover, trae las últimas órdenes, las convierte en ventas de Atlas y las guarda. Si una venta ya estaba importada, no la duplica.",
        "<b>Webhook</b>: cuando ocurre una venta en Clover, Clover llama a nuestro endpoint <i>/clover/webhook</i> avisando del evento, y Atlas va a buscar el detalle de esa orden y la guarda. Esto permite tener el panel casi en vivo.",
    ]))
    s.append(p(
        "Las ventas importadas se mapean a la misma estructura que las ventas "
        "creadas en Atlas: número de factura (con prefijo CLV- para identificar "
        "que vino de Clover), método de pago, tipo y marca de tarjeta, total, "
        "fecha y línea por línea de productos. Si un producto que viene de Clover "
        "no existe en Atlas, se crea automáticamente.", BODY,
    ))

    # 3.5
    s.append(p("3.5. Insights con Inteligencia Artificial", H3))
    s.append(p(
        "Esta es una de las funciones diferenciadoras. Está dividida en tres "
        "partes:", BODY,
    ))
    s.append(p("a) Briefing del día con IA", H4))
    s.append(p(
        "Cada vez que el comerciante entra a la app, se genera un mini-texto de 2 "
        "o 3 oraciones que le resume el día y le sugiere una acción concreta. "
        "Ejemplo de lo que devolvería: <i>\"Hoy llevás $42.300 con 18 ventas. Tu "
        "cliente más fiel no compra hace 12 días: mandale un saludo o un combo "
        "personalizado. Probá ofrecer el combo café+medialuna entre las 8 y 10am "
        "para subir el ticket promedio.\"</i> El texto se genera con un modelo de "
        "lenguaje (Llama 3.3 corriendo en Groq) al que se le pasan los datos del "
        "negocio del día y la meta mensual.", BODY,
    ))
    s.append(p("b) Chat con la IA del negocio", H4))
    s.append(p(
        "El comerciante puede hacerle preguntas en lenguaje natural como <i>\"¿qué "
        "producto me rindió más esta semana?\"</i>, <i>\"¿cuánto le vendí a Pedro "
        "el mes pasado?\"</i>, <i>\"¿estoy mejor que el mes anterior?\"</i>. La "
        "IA recibe un contexto con los datos reales del período elegido (ingresos, "
        "ventas, ticket promedio, top productos, clientes únicos, retorno) y "
        "responde en castellano, breve y accionable. Mantiene el historial de la "
        "conversación así puede responder repreguntas (\"¿y al revés?\", \"¿en "
        "qué horario?\").", BODY,
    ))
    s.append(p("c) Alertas automáticas", H4))
    s.append(p(
        "Sin que el comerciante pregunte, el sistema le muestra alertas cuando "
        "detecta cuatro cosas distintas:", BODY,
    ))
    s.append(bullets([
        "<b>Clientes en riesgo</b>: gente que compraba seguido y hace 14 días o más que no aparece. Sugiere mandarles una promoción.",
        "<b>Día por encima del promedio</b>: cuando el día actual va 20% o más arriba que el promedio diario de los últimos 7 días, lo celebra con un mensaje verde.",
        "<b>Productos sin movimiento</b>: productos que se vendieron alguna vez en los últimos 30 días pero no se vendieron en los últimos 7. Nombra los dos primeros y dice cuántos más hay así.",
        "<b>Avance de meta mensual</b>: si la meta mensual está fijada, avisa cuando se llegó al 75% y cuando se superó el 100%.",
    ]))

    # 3.6
    s.append(p("3.6. Forecasting / Predicción de demanda y stock", H3))
    s.append(p(
        "Es la parte de Machine Learning. El sistema mira el histórico de ventas "
        "(agrupado por semana, por producto) y entrena un modelo que predice "
        "cuánto se va a vender de cada producto la semana que viene. Cruza esa "
        "predicción con el stock actual y devuelve una <b>lista de compras "
        "recomendada</b>: cuántas unidades de cada producto le conviene pedir.", BODY,
    ))
    s.append(p("Para cada producto el sistema muestra:", H4))
    s.append(bullets([
        "Stock actual.",
        "Demanda predicha para los próximos 7 días.",
        "Compra recomendada (predicción menos stock actual, nunca negativa).",
        "Confianza del modelo (0 a 1), basada en qué tan bien el modelo predijo el histórico.",
        "Tipo de modelo usado: <i>xgboost</i> si hay al menos 4 semanas de datos, o <i>promedio móvil</i> de las últimas 4 semanas como fallback cuando hay poca data.",
        "Nivel de alerta: <b>crítico</b> (necesita comprar mucho), <b>moderado</b> o <b>ok</b>.",
    ]))
    s.append(p(
        "El comerciante también puede ir a una pantalla de <b>stock</b> y poner a "
        "mano cuántas unidades tiene de cada producto, para que la recomendación "
        "sea más afilada.", BODY,
    ))

    # 3.7
    s.append(p("3.7. Patrones de compra", H3))
    s.append(p(
        "Hay una pantalla dedicada a entender qué pasa con los clientes: cuándo "
        "compran, qué métodos de pago prefieren, y cómo evoluciona el "
        "comportamiento de compra a lo largo del tiempo. Es la base sobre la que "
        "más adelante se va a montar el Market Basket Analysis (qué productos se "
        "venden juntos) y la segmentación RFM (clientes VIP, frecuentes, "
        "dormidos, nuevos).", BODY,
    ))

    # 3.8
    s.append(p("3.8. Meta mensual y configuración", H3))
    s.append(p(
        "En la pantalla de <b>Configuración</b> el dueño puede fijar una meta de "
        "facturación mensual. A partir de ahí toda la app la usa: el briefing la "
        "incluye en el contexto, las alertas avisan cuando se pasa el 75% y el "
        "100%, y el dashboard muestra el avance.", BODY,
    ))

    # 3.9
    s.append(p("3.9. App móvil Android (estado actual: parcial)", H3))
    s.append(p(
        "Existe una app nativa Android escrita en Kotlin, en la carpeta "
        "<i>CloverIAMarketing/</i>, con su propia arquitectura documentada. Por "
        "ahora tiene <b>pantalla de login y un dashboard básico</b>. Falta "
        "construir el resto: productos, categorías, ventas, insights, "
        "forecasting, settings, notificaciones push y modo offline. Está "
        "planificado como Fase 1 del roadmap.", BODY,
    ))

    # 3.10
    s.append(p("3.10. Datos de demostración", H3))
    s.append(p(
        "Para que cualquier persona pueda probar el sistema sin tener Clover ni "
        "ventas reales, viene un script <i>seed_demo.py</i> que carga datos de un "
        "negocio ficticio: una cafetería con 4 categorías, 22 productos, ~1.100 "
        "ventas distribuidas en los últimos 45 días, niveles de stock por "
        "producto, y emails recurrentes para poder ver las métricas de "
        "retención. El login de demo es <i>pedro@demo.com / demo123</i>.", BODY,
    ))

    # 3.11
    s.append(p("3.11. Ventas en tiempo real (streaming)", H3))
    s.append(p(
        "Cuando se crea una venta nueva (manual, importada de Clover o vía "
        "webhook), el backend la <i>broadcastea</i> por un canal en vivo (Server-"
        "Sent Events). Cualquier cliente conectado al canal recibe el evento sin "
        "tener que recargar la página. Es la base para que en una pantalla de "
        "caja se vean entrar las ventas como un feed.", BODY,
    ))

    # 4. Flujo end-to-end
    s.append(p("4. Cómo se ve el flujo end-to-end", H2))
    s.append(p(
        "Para que quede claro cómo se conectan todas las piezas, este es el "
        "recorrido típico de un dato desde que ocurre la venta hasta que la ve el "
        "dueño en su panel:", BODY,
    ))
    s.append(bullets([
        "<b>1.</b> El cliente paga en el negocio con la terminal Clover.",
        "<b>2.</b> Clover registra la venta y dispara un webhook a nuestra API o nosotros corremos el sync manual.",
        "<b>3.</b> El backend recibe el evento, va a la API REST de Clover y trae la orden completa con sus line items y pagos.",
        "<b>4.</b> El servicio <i>clover_service</i> mapea la orden Clover a una Sale + SaleItems de Atlas, creando productos nuevos si hace falta.",
        "<b>5.</b> La venta se guarda en Postgres y se emite un evento por SSE a los clientes conectados.",
        "<b>6.</b> El dashboard, al refrescar o al recibir el evento, llama a <i>/dashboard/summary</i> que recalcula KPIs, top productos, top clientes, métodos de pago, etc.",
        "<b>7.</b> Las pantallas de Insights llaman a <i>/insights/briefing</i> y <i>/insights/alerts</i>; el briefing arma un prompt con los datos y se lo pasa a Llama 3.3 vía Groq.",
        "<b>8.</b> Cuando el dueño abre Forecasting, el endpoint <i>/forecasting/recommendations</i> agrega ventas por semana, arma features, entrena XGBoost y devuelve la lista de compras recomendada.",
    ]))

    s.append(PageBreak())

    # ────────────────────────────────────────────────────
    #  PARTE 2 — TECNOLOGÍAS Y ARQUITECTURA
    # ────────────────────────────────────────────────────
    s.append(p("PARTE 2", SMALL))
    s.append(p("Tecnologías y arquitectura, en detalle", H1))
    s.append(section_divider())
    s.append(Spacer(1, 0.3 * cm))

    # 5
    s.append(p("5. Tecnologías usadas — vista panorámica", H2))
    s.append(p(
        "La aplicación es una arquitectura clásica de 3 capas (frontend SPA + "
        "backend API + base relacional) más capas opcionales de IA, ML y "
        "streaming. Todo corre en contenedores Docker para que el dev local sea "
        "<i>git clone && docker compose up</i>.", BODY,
    ))
    s.append(kv_table(
        rows=[
            ["Frontend",   "React 18, React Router 6, Vite 5, Tailwind CSS 3, Recharts 2, Lucide icons"],
            ["Backend",    "Python 3, FastAPI 0.115, Uvicorn, Pydantic Settings, SQLAlchemy 2.0"],
            ["Base de datos", "PostgreSQL 15 (Alpine), tipos UUID, ENUMs nativos, índices únicos"],
            ["Autenticación", "JWT con python-jose (HS256), passlib + bcrypt para hash"],
            ["IA conversacional", "Groq SDK + modelo Llama 3.3 70B versátil"],
            ["Machine Learning", "XGBoost 2.1, scikit-learn 1.5, pandas 2.2, numpy 1.26"],
            ["Streaming",  "Server-Sent Events vía sse-starlette"],
            ["Integración POS", "Cliente HTTP a Clover REST API (httpx 0.28)"],
            ["DevOps",     "Docker, docker-compose, Dockerfiles por servicio, volúmenes para hot-reload"],
            ["Mobile",     "Android nativo en Kotlin con Gradle KTS (CloverIAMarketing/)"],
            ["Migraciones", "Alembic instalado (aún no en uso — DDL al startup por ahora)"],
            ["Testing",    "pytest 8.3 (estructura instalada, suite por crecer)"],
        ],
        col_widths=[4.5 * cm, 12 * cm],
        header=["Capa", "Stack"],
    ))

    # 6. Backend
    s.append(p("6. Backend en profundidad", H2))
    s.append(p(
        "El backend es una API REST monolítica escrita con FastAPI. La aplicación "
        "se inicializa en <i>app/main.py</i> usando un <i>lifespan</i> async: al "
        "arrancar, se crea el engine de SQLAlchemy y se materializan las tablas "
        "con <i>init_db</i>; al apagar, se limpian conexiones. Se registran 9 "
        "routers con responsabilidades bien separadas:", BODY,
    ))
    s.append(kv_table(
        rows=[
            ["auth.py",        "Registro, login, refresh de tokens, lectura del usuario actual, edición de meta mensual."],
            ["sales.py",       "Crear ventas manualmente, listar con filtros (método de pago, marca de tarjeta), paginación skip/limit."],
            ["products.py",    "CRUD de productos, asignación de categorías (many-to-many)."],
            ["categories.py",  "CRUD de categorías por usuario."],
            ["dashboard.py",   "Endpoint maestro /dashboard/summary que devuelve todos los KPIs, gráficos, top productos, top clientes y deltas vs período anterior."],
            ["insights.py",    "Briefing diario con IA, chat conversacional con historial, alertas automáticas (en-riesgo/milestone/slow/goal)."],
            ["forecasting.py", "Genera recomendaciones de compra entrenando XGBoost, lista y actualiza stock por producto."],
            ["clover.py",      "Recibe webhooks de Clover y trae órdenes con sync manual."],
            ["stream.py",      "Server-Sent Events para empujar ventas nuevas en tiempo real."],
        ],
        col_widths=[3.6 * cm, 12.9 * cm],
        header=["Router", "Responsabilidad"],
    ))
    s.append(p(
        "El módulo <i>app/services/</i> contiene la lógica que no es HTTP: "
        "<i>auth.py</i> con hash y JWT, <i>clover_service.py</i> con el cliente "
        "HTTP a Clover y el mapeo orden→Sale, <i>ml_forecasting.py</i> con todo "
        "el pipeline de ML, y <i>event_manager.py</i> que mantiene los "
        "subscriptores SSE en memoria por user_id.", BODY,
    ))
    s.append(p(
        "Las dependencias se inyectan con el sistema de <i>Depends</i> de "
        "FastAPI: <i>get_db</i> abre una sesión SQLAlchemy, <i>get_current_user</i> "
        "valida el JWT del header Authorization y carga el User desde la base. "
        "Los settings se leen con <i>pydantic-settings</i> desde el archivo "
        "<i>.env</i>, lo que da validación de tipos y errores al arrancar si "
        "falta alguna variable.", BODY,
    ))

    # 7. Modelo de datos
    s.append(p("7. Modelo de datos", H2))
    s.append(p(
        "Todo se modela con SQLAlchemy 2.0 usando la sintaxis declarativa moderna "
        "<i>Mapped/mapped_column</i>. IDs en UUID (no auto-increment) para evitar "
        "colisiones si en el futuro se migra a multi-tenant y se sincronizan "
        "bases. Estas son las tablas:", BODY,
    ))
    s.append(kv_table(
        rows=[
            ["users",
             "id (UUID), store_name, email único e indexado, password (hash bcrypt), monthly_goal (Numeric 12,2, opcional), created_at."],
            ["categories",
             "id, user_id (FK users), name, created_at."],
            ["products",
             "id, user_id, name, price (Numeric 10,2), created_at. Relación many-to-many con categories via tabla puente product_categories."],
            ["product_categories",
             "Tabla puente con product_id y category_id como PK compuesta."],
            ["sales",
             "id, user_id, invoice_number, payment_method ENUM(card,qr), card_type ENUM(credit,debit), card_brand ENUM(visa,mastercard,amex), card_category ENUM(classic..centurion), customer_email, clover_order_id único, total, sold_at."],
            ["sale_items",
             "id, sale_id (FK), product_id (FK), quantity, subtotal. Carga eager con joined load."],
            ["product_stock",
             "id, user_id, product_id, current_stock (int), updated_at. UNIQUE constraint sobre (user_id, product_id) para que cada producto del usuario tenga una sola fila."],
            ["demand_predictions",
             "id, user_id, product_id, predicted_quantity, period_start, period_end, confidence, recommended_purchase, model_type, created_at. Se borran y se rescriben en cada run del forecasting."],
        ],
        col_widths=[3.6 * cm, 12.9 * cm],
        header=["Tabla", "Columnas y notas"],
    ))
    s.append(p(
        "Todos los enums son ENUMs reales de Postgres (no strings sueltos), lo "
        "que da validación a nivel de motor de base. Las fechas son DateTime con "
        "timezone, siempre guardadas como UTC. Los montos usan Numeric con "
        "precisión y escala definidas para no perder centavos por floats.", BODY,
    ))

    # 8. Endpoints
    s.append(p("8. Endpoints / API REST disponibles", H2))
    s.append(p("Todos los endpoints (excepto register, login y stream) requieren JWT en el header <i>Authorization: Bearer &lt;token&gt;</i>:", BODY))
    s.append(kv_table(
        rows=[
            ["POST /auth/register",        "Crea usuario nuevo."],
            ["POST /auth/login",           "Devuelve access_token JWT."],
            ["POST /auth/refresh",         "Renueva token aún con uno expirado (gracia)."],
            ["GET /auth/me",               "Datos del usuario actual."],
            ["PUT /auth/me/goal",          "Setea o actualiza la meta mensual."],
            ["GET /dashboard/summary",     "KPIs, gráficos, top productos, top clientes, deltas vs período previo. Param: period=today|week|month|year."],
            ["POST /sales/",               "Crear venta manual."],
            ["GET /sales/",                "Listar ventas con filtros y paginación."],
            ["GET /stream/sales",          "SSE con ventas nuevas en vivo (token por query string)."],
            ["GET/POST /categories/",      "Listar y crear categorías."],
            ["GET/POST /products/",        "Listar y crear productos."],
            ["PUT /products/{id}/categories", "Actualizar categorías de un producto."],
            ["GET /forecasting/recommendations", "Lista priorizada de compras sugeridas."],
            ["GET /forecasting/stock",     "Stock actual por producto."],
            ["PUT /forecasting/stock/{product_id}", "Setear stock de un producto."],
            ["POST /insights/chat",        "Chat con la IA del negocio."],
            ["GET /insights/briefing",     "Briefing diario."],
            ["GET /insights/alerts",       "Alertas detectadas automáticamente."],
            ["POST /clover/webhook",       "Recibe eventos push de Clover."],
            ["POST /clover/sync",          "Pull manual de las últimas órdenes."],
            ["GET /health",                "Liveness check del servicio."],
        ],
        col_widths=[6 * cm, 10.5 * cm],
        header=["Endpoint", "Para qué sirve"],
    ))

    # 9. Frontend
    s.append(p("9. Frontend en profundidad", H2))
    s.append(p(
        "El frontend es una SPA en React 18 servida por Vite 5. La estructura "
        "está en <i>frontend/src/</i> con tres carpetas centrales:", BODY,
    ))
    s.append(kv_table(
        rows=[
            ["pages/",      "Una pantalla por archivo: Login, Register, Dashboard, Insights, Products, Categories, PurchasePatterns, Settings."],
            ["components/", "Componentes reutilizables: Sidebar, Header, ChartCard (wrapper de Recharts), StatCard (KPI card), FilterBar."],
            ["context/",    "AuthContext con AuthProvider, useAuth() y un helper apiFetch que adjunta el token y maneja el JSON."],
        ],
        col_widths=[3.5 * cm, 13 * cm],
        header=["Carpeta", "Qué hay adentro"],
    ))
    s.append(p(
        "El ruteo se hace con <i>react-router-dom v6</i>. Hay un guard simple en "
        "<i>App.jsx</i>: si <i>useAuth().user</i> es null se muestra la pantalla "
        "de Login (y opcionalmente Register en <i>/register</i>); si hay user, se "
        "renderiza el layout con Sidebar + Header y las páginas detrás. El modo "
        "oscuro se maneja con la clase <i>dark</i> de Tailwind aplicada al "
        "wrapper raíz, y se conserva en estado local.", BODY,
    ))
    s.append(p("Bibliotecas clave del frontend:", H4))
    s.append(bullets([
        "<b>Recharts</b> para todos los gráficos (LineChart, BarChart, PieChart, ResponsiveContainer). Permite hacer responsive sin tocar canvas.",
        "<b>Tailwind CSS</b> con dark mode controlado por clase, customización en <i>tailwind.config.js</i>, plus algunas variables CSS (--scifi-bg, etc.) para acentos visuales.",
        "<b>Lucide React</b> para los íconos (DollarSign, ShoppingCart, Package, Cloud, RefreshCw, etc.).",
        "<b>Vite</b> como bundler/dev-server, con hot module replacement en menos de 200ms.",
    ]))
    s.append(p(
        "El componente <i>Dashboard.jsx</i> es el más grande: carga "
        "<i>/dashboard/summary</i> según el período elegido, además de "
        "<i>/insights/alerts</i>, <i>/insights/briefing</i> y <i>/auth/me</i> "
        "en paralelo con Promise.all. Tiene un botón <i>Sync Clover</i> que "
        "dispara <i>/clover/sync</i> y, si trae ventas nuevas, refresca todo. La "
        "meta mensual se edita inline desde el dashboard también, sin tener que "
        "ir a Settings.", BODY,
    ))

    # 10. IA conversacional
    s.append(p("10. Inteligencia Artificial conversacional", H2))
    s.append(p(
        "La parte de IA usa <b>Groq</b> como proveedor de inferencia (tiene una "
        "API gratuita con muy baja latencia) y el modelo <b>llama-3.3-70b-"
        "versatile</b>. La integración se hace con el SDK oficial de Groq desde "
        "el router <i>insights.py</i>.", BODY,
    ))
    s.append(p(
        "Para cada interacción se arma un <i>system prompt</i> que <b>no es "
        "genérico</b>: incluye datos reales del negocio (revenue total, total de "
        "ventas, ticket promedio, métodos de pago, top productos, clientes únicos "
        "y tasa de retorno) calculados al momento desde la base. Esto convierte "
        "al modelo en un asesor que ya tiene contexto del negocio, no en un "
        "chatbot genérico.", BODY,
    ))
    s.append(p("Tres usos distintos:", H4))
    s.append(bullets([
        "<b>Briefing</b>: max_tokens=200, estructura forzada por prompt en 2-3 oraciones (dato concreto + insight + acción).",
        "<b>Chat</b>: max_tokens=500, el historial de la conversación se pasa como mensajes encadenados para que la IA mantenga contexto entre repreguntas.",
        "<b>Si falta GROQ_API_KEY</b>: el briefing devuelve un mensaje educado pidiendo configurarla, en vez de explotar.",
    ]))

    # 11. ML
    s.append(p("11. Machine Learning de forecasting", H2))
    s.append(p(
        "El servicio <i>app/services/ml_forecasting.py</i> es el módulo más "
        "técnico del backend. Pipeline completo:", BODY,
    ))
    s.append(p("Paso 1 — Agregación", H4))
    s.append(p(
        "Se hace una consulta SQL que agrupa <i>sale_items</i> por producto y "
        "semana ISO (con <i>date_trunc('week', sold_at)</i> de Postgres), sumando "
        "la cantidad vendida. El resultado se trae a pandas en un DataFrame.", BODY,
    ))
    s.append(p("Paso 2 — Feature engineering", H4))
    s.append(p("Para cada producto se construyen estas features:", BODY))
    s.append(bullets([
        "<b>lag_1, lag_2, lag_3, lag_4</b>: cuántas unidades se vendieron 1, 2, 3 y 4 semanas atrás.",
        "<b>rolling_mean_4</b>: promedio móvil de las 4 últimas semanas (con shift para no filtrar la semana actual).",
        "<b>rolling_std_4</b>: desvío estándar de las 4 últimas semanas (rellenado con 0 si no hay suficientes datos).",
        "<b>week_of_year</b>: número de semana ISO del año.",
        "<b>month</b>: mes del año (1-12).",
        "<b>is_first_half</b>: si la semana cae en la primera mitad del mes (día ≤ 15).",
        "<b>product_enc</b>: label encoding del producto (cada producto único recibe un entero).",
    ]))
    s.append(p("Paso 3 — Entrenamiento", H4))
    s.append(p(
        "Si hay al menos 4 semanas de datos (<i>MIN_WEEKS_FOR_ML</i>) y al menos "
        "10 filas con features completas, se entrena un <b>XGBRegressor</b> con "
        "100 estimadores, max_depth=4, learning_rate=0.1, random_state=42. Si no, "
        "se cae al fallback de <i>rolling average</i> de 4 semanas — esto evita "
        "el problema típico del cold-start donde un modelo se entrena con poca "
        "data y predice basura.", BODY,
    ))
    s.append(p("Paso 4 — Confianza", H4))
    s.append(p(
        "La confianza se computa como <i>1 - MAE / max(y)</i> sobre el set de "
        "entrenamiento, clipeada a [0.40, 0.99] para no mostrar nunca un número "
        "ni demasiado alto ni demasiado bajo en el frontend. Para el fallback "
        "promedio se hardcodea confianza 0.5.", BODY,
    ))
    s.append(p("Paso 5 — Predicción de la próxima semana", H4))
    s.append(p(
        "Para cada producto se arma una fila de features con los lags de las "
        "últimas 4 semanas observadas y el calendario de la próxima semana ISO. "
        "Se predice con el modelo, se clamping a no-negativos, y se redondea.", BODY,
    ))
    s.append(p("Paso 6 — Cálculo de recomendación y persistencia", H4))
    s.append(p(
        "<i>recommended_purchase = max(0, predicted - current_stock)</i>. Se "
        "borran las predicciones viejas del usuario y se insertan las nuevas en "
        "la tabla <i>demand_predictions</i>. Se calcula un nivel de alerta "
        "(crítico / moderado / ok) según el ratio entre lo que hay que comprar y "
        "lo predicho. La lista se devuelve ordenada por urgencia descendente.", BODY,
    ))

    # 12. Clover
    s.append(p("12. Integración con Clover POS", H2))
    s.append(p(
        "El servicio <i>app/services/clover_service.py</i> se comunica con la API "
        "REST de Clover (v3) usando <b>httpx</b>. Hoy las credenciales "
        "(<i>CLOVER_MERCHANT_ID</i> y <i>CLOVER_ACCESS_TOKEN</i>) vienen del "
        "archivo <i>.env</i>, lo que es funcional para un solo comercio pero "
        "incompatible con multi-tenant (próxima fase).", BODY,
    ))
    s.append(p("Funciones expuestas:", H4))
    s.append(bullets([
        "<b>fetch_clover_order(order_id)</b>: trae una orden expandida (lineItems + payments).",
        "<b>fetch_clover_orders(limit)</b>: trae las últimas N órdenes ordenadas por createdTime DESC.",
        "<b>_map_payment_info(order)</b>: detecta si el pago fue con tarjeta (y mapea VISA/MC/MASTERCARD/AMEX a nuestros enums) o QR.",
        "<b>_map_clover_order(order, user_id, db)</b>: convierte una orden Clover en un objeto Sale con su lista de SaleItems, creando productos nuevos si el nombre no existía aún para el usuario.",
        "<b>sync_clover_orders(user_id, db, limit)</b>: pull masivo idempotente — saltea órdenes ya importadas detectando duplicados por <i>clover_order_id</i> único.",
        "<b>process_clover_webhook(event_type, object_id, user_id, db)</b>: handler del webhook. Filtra eventos que no sean de tipo ORDER, evita duplicados y trae el detalle de la orden recién creada.",
    ]))
    s.append(p(
        "Conversión de unidades Clover: los precios vienen en centavos y la "
        "cantidad como <i>unitQty</i> en milésimas, por eso hay divisiones por "
        "100 y agrupaciones por 100 al mapear.", BODY,
    ))

    # 13. SSE
    s.append(p("13. Streaming en tiempo real", H2))
    s.append(p(
        "Server-Sent Events implementado con <b>sse-starlette</b>. Hay un "
        "<i>event_manager</i> que mantiene un dict <i>user_id → set de queues "
        "asyncio</i>. Cuando se crea una venta nueva, el router de "
        "<i>/sales/</i> llama a <i>event_manager.broadcast(user_id, payload)</i>, "
        "que encola el evento para todos los suscriptores del usuario. La ruta "
        "<i>GET /stream/sales?token=...</i> valida el JWT por query string (los "
        "EventSource del browser no permiten headers custom), se suscribe al "
        "canal y stremea eventos <i>new_sale</i> hasta que el cliente cierra la "
        "conexión, momento en el cual se hace cleanup automático.", BODY,
    ))

    # 14. Auth
    s.append(p("14. Autenticación y seguridad", H2))
    s.append(p(
        "El sistema usa JWT firmados con HS256 (un solo secreto compartido). El "
        "token contiene <i>sub=user.id</i> y un <i>exp</i> configurable "
        "(default 60 minutos). El hash de contraseñas es <b>bcrypt</b> vía "
        "passlib, lo que es el estándar industrial. Hay un endpoint "
        "<i>/auth/refresh</i> que acepta tokens recién expirados (gracia "
        "configurable) para renovar sin obligar al login.", BODY,
    ))
    s.append(p("Notas de seguridad actuales (declaradas como deuda):", H4))
    s.append(bullets([
        "CORS hoy está abierto con <i>allow_origins=[\"*\"]</i> — hay que restringirlo a los dominios reales antes de producción.",
        "El webhook de Clover no verifica firma HMAC todavía — cualquiera con la URL podría inyectar ventas. En fase de hardening hay que validar la firma.",
        "<i>JWT_SECRET</i> tiene un default tipo <i>change-me-in-production</i> en el .env de ejemplo — fácil de olvidar al deployar.",
        "El stream usa el token por query string, lo que es funcional pero queda en logs si no se filtran.",
    ]))

    # 15. Docker
    s.append(p("15. Infraestructura local y deploy", H2))
    s.append(p(
        "El <i>docker-compose.yml</i> define tres servicios:", BODY,
    ))
    s.append(kv_table(
        rows=[
            ["postgres", "Postgres 15.3 Alpine. Volumen <i>pgdata</i> para persistencia. Carpeta <i>initdb/</i> montada en docker-entrypoint-initdb.d para scripts SQL iniciales."],
            ["api",      "Build desde <i>backend/</i>. Lee <i>backend/.env</i>. Expone 8000. Monta el código fuente como volumen para hot-reload con uvicorn --reload."],
            ["frontend", "Build desde <i>frontend/</i>. Expone 3000. Volumen del código + volumen anónimo para <i>node_modules</i> (truco para no pisar los node_modules del container con los del host)."],
        ],
        col_widths=[2.6 * cm, 13.9 * cm],
        header=["Servicio", "Configuración"],
    ))
    s.append(p(
        "Tras un <i>docker compose up --build -d</i> el sistema queda listo en "
        "<i>http://localhost:3000</i> (frontend) y "
        "<i>http://localhost:8000</i> (API). Las tablas se crean automáticamente "
        "al primer arranque del backend (DDL en lifespan, no Alembic). Para "
        "cargar la data demo se corre <i>docker compose exec -T api python "
        "seed_demo.py</i>.", BODY,
    ))

    # 16. Android
    s.append(p("16. App Android (Kotlin) — estado actual", H2))
    s.append(p(
        "La carpeta <i>CloverIAMarketing/</i> contiene un proyecto Android nativo "
        "con Gradle KTS. Tiene su propio <i>ARCHITECTURE.md</i> que define la "
        "estructura. <b>Estado actual</b>: implementadas la pantalla de login y "
        "un dashboard básico que consume la misma API REST del backend. <b>Lo que "
        "falta</b>: productos, categorías, ventas, insights, forecasting, "
        "settings, pull-to-refresh, modo offline con cache local, notificaciones "
        "push, ícono e identidad visual final. Es la primera fase del roadmap "
        "porque sin la app el comerciante no puede operar desde el celular en el "
        "mostrador.", BODY,
    ))

    # 17. Estado y deuda técnica
    s.append(p("17. Estado del proyecto, deuda técnica y próximos pasos", H2))
    s.append(p(
        "El MVP es <b>funcional y demostrable</b>: con la data demo se puede "
        "loguear, ver el dashboard completo, conversar con la IA, ver alertas, "
        "correr forecasting con XGBoost, hacer sync con Clover si hay "
        "credenciales, y recibir ventas en vivo por SSE. Lo que bloquea pasar a "
        "producción con clientes reales:", BODY,
    ))
    s.append(kv_table(
        rows=[
            ["🔴 P0 · Token Clover único en .env",  "Imposible servir a más de un comercio. Necesita OAuth v2 con tokens por usuario en base."],
            ["🔴 P0 · Webhook sin verificación HMAC", "Cualquiera con la URL puede inyectar ventas falsas."],
            ["🔴 P0 · CORS abierto a *",              "Vector de CSRF y leak de tokens."],
            ["🔴 P0 · JWT_SECRET default",            "Riesgo si se olvida cambiar al deployar."],
            ["🟠 P1 · DDL al startup (sin Alembic)",  "Sin rollback de schema. Alembic ya está instalado pero no se usa."],
            ["🟠 P1 · Sin tests de integración",      "Cualquier cambio puede romper la sincronización silenciosamente."],
            ["🟠 P1 · Sin observabilidad",            "Ni logs centralizados ni Sentry ni métricas."],
            ["🟠 P1 · Sin reset password / verif. email", "UX bloqueante para self-service."],
            ["🟡 P2 · Sin paginación en algunas listas", "Performance se degrada con histórico grande."],
            ["🟡 P2 · Sin caché en dashboard",        "Recalcula KPIs en cada request."],
            ["🟡 P2 · Android incompleto",            "Web first es OK, perdemos terminales Clover Android por ahora."],
        ],
        col_widths=[6 * cm, 10.5 * cm],
        header=["Issue", "Por qué importa"],
    ))

    # 18. Roadmap
    s.append(p("18. Roadmap por fases", H2))
    s.append(p("Resumen del roadmap definido en <i>ROADMAP.md</i> y <i>PLAN_ORQUESTADOR.md</i>:", BODY))
    s.append(kv_table(
        rows=[
            ["Fase 1 — Cerrar app Android",
             "Productos, Categorías, Ventas, Insights, Forecasting, Settings, pull-to-refresh, offline básico, push notifications, branding. 1-2 semanas."],
            ["Fase 2 — Calidad y confiabilidad",
             "Reset password, verificación de email, tests E2E, backups, logs centralizados, manejo de errores uniforme, rate limiting, política de privacidad. 2-3 semanas."],
            ["Fase 3 — Sacar más jugo a Clover",
             "OAuth v2, publicación en Clover App Market, sync de inventario bidireccional, sync de empleados y clientes, webhooks completos (refunds, cancelaciones), multi-merchant. 3-4 semanas."],
            ["Fase 3.5 — ML sobre data transaccional",
             "Market Basket Analysis (Apriori/FP-Growth con mlxtend), segmentación RFM + KMeans, churn predictivo, detección de anomalías con Isolation Forest. 1-2 semanas."],
            ["Fase 4 — Diferenciación con IA",
             "IA proactiva, sugerencias de precios, detección de fraude, predicción de churn con modelo, análisis de competencia con datos públicos, IA por voz, generador de promos. 1-2 meses."],
            ["Fase 5 — Crecimiento comercial",
             "WhatsApp Business, programa de fidelidad, mini-ecommerce, marketplace entre comerciantes, capital de trabajo basado en historial, facturación electrónica, integración contable. 2-3 meses."],
            ["Fase 6 — Escalar técnico",
             "Multi-tenant real con business_id, roles y permisos, cache Redis para dashboard, cola Celery/RQ para ML, CDN para assets, microservicios, observabilidad (Grafana/Sentry), CI/CD, multi-región."],
        ],
        col_widths=[5.2 * cm, 11.3 * cm],
        header=["Fase", "Contenido"],
    ))

    # 19. Negocio
    s.append(p("19. Modelo de negocio sugerido", H2))
    s.append(p(
        "Esquema tentativo de monetización definido en <i>ROADMAP.md</i>:", BODY,
    ))
    s.append(kv_table(
        rows=[
            ["Free",       "Dashboard básico, hasta 100 ventas/mes."],
            ["Pro",        "$29/mes. Insights IA, forecasting, alertas, sin límite de ventas."],
            ["Business",   "$99/mes. Multi-local, multi-usuario, integraciones."],
            ["Enterprise", "Precio a medida + soporte dedicado."],
        ],
        col_widths=[3.5 * cm, 13 * cm],
        header=["Tier", "Qué incluye"],
    ))
    s.append(p(
        "<b>Distribución prevista</b>: publicación en el Clover App Market una "
        "vez que el MVP esté endurecido y multi-tenant. Clover toma una comisión "
        "del 15-30% sobre el revenue del marketplace, lo que hay que considerar "
        "al fijar los precios.", BODY,
    ))

    # Cierre
    s.append(Spacer(1, 0.5 * cm))
    s.append(section_divider())
    s.append(Spacer(1, 0.3 * cm))
    s.append(p(
        "<b>Cierre</b> · Atlas Nexus tiene hoy un MVP demostrable que combina un "
        "dashboard moderno en React, un backend FastAPI prolijo, ML real con "
        "XGBoost, IA conversacional con Llama 3.3, e integración con Clover por "
        "REST y webhooks. La diferenciación clara es <b>IA accionable</b> sobre "
        "data transaccional, no un dashboard más. Lo que sigue es endurecer el "
        "código y abrir el camino al Clover App Market.", BODY,
    ))

    return s


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=1.6 * cm,
        bottomMargin=1.8 * cm,
        title="Atlas Nexus — Resumen completo",
        author="Atlas Nexus",
    )
    doc.build(build_story(), onFirstPage=add_page_chrome, onLaterPages=add_page_chrome)
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    main()
