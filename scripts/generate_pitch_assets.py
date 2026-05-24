"""
Genera mockups sintéticos para el pitch Fiserv usando Pillow.
Salida: docs/assets/mockups/*.png

Genera:
  · dashboard.png         — KPIs + gráficos (laptop ratio)
  · chat_ia.png           — Chat IA con burbujas (mobile ratio)
  · forecasting.png       — Lista de compras + barras
  · smart_receipt.png     — Receipt micrositio (mobile)
  · briefing.png          — Briefing diario con IA
  · laptop_dashboard.png  — Frame de laptop con dashboard
  · phone_chat.png        — Frame de iPhone con chat
  · phone_receipt.png     — Frame de iPhone con receipt
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).resolve().parent.parent / "docs" / "assets" / "mockups"
OUT.mkdir(parents=True, exist_ok=True)

# Paleta Fiserv
ORANGE = "#FF6B00"
ORANGE_DARK = "#CC4F00"
ORANGE_LIGHT = "#FFE4D0"
NAVY = "#0B1F3A"
INK = "#0F172A"
SLATE = "#334155"
MUTED = "#64748B"
LINE = "#E2E8F0"
CARD = "#F8FAFC"
WHITE = "#FFFFFF"
GREEN = "#16A34A"
GREEN_LIGHT = "#DCFCE7"
BLUE = "#2563EB"
BLUE_LIGHT = "#DBEAFE"
RED = "#E11D48"
AMBER = "#F59E0B"
AMBER_LIGHT = "#FEF3C7"

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def f(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size)


def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text_w(draw, text, font):
    return draw.textlength(text, font=font)


# ─────────────────────────────────────────────────────────────
#  Dashboard (1280x800) — laptop ratio
# ─────────────────────────────────────────────────────────────

def make_dashboard():
    W, H = 1280, 800
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)

    # Sidebar
    d.rectangle([0, 0, 220, H], fill=NAVY)
    d.text((24, 28), "ATLAS NEXUS", font=f(15, True), fill=WHITE)
    d.text((24, 50), "Tienda Demo · LATAM", font=f(10), fill="#9CA3AF")

    nav_items = [
        ("●  Dashboard", True),
        ("○  Productos", False),
        ("○  Ventas", False),
        ("○  Insights IA", False),
        ("○  Forecasting", False),
        ("○  Smart Receipt", False),
        ("○  Categorías", False),
        ("○  Ajustes", False),
    ]
    y = 110
    for label, active in nav_items:
        if active:
            d.rounded_rectangle([12, y - 6, 208, y + 22], radius=6, fill=ORANGE)
            d.text((24, y), label, font=f(12, True), fill=WHITE)
        else:
            d.text((24, y), label, font=f(12), fill="#CBD5E1")
        y += 38

    # Top bar
    d.rectangle([220, 0, W, 64], fill=WHITE)
    d.line([220, 64, W, 64], fill=LINE, width=1)
    d.text((250, 22), "Dashboard", font=f(20, True), fill=INK)
    d.text((250, 46), "Buenos días, Juan — esto está pasando hoy", font=f(11), fill=MUTED)
    # period selector
    rounded_rect(d, [W - 200, 18, W - 30, 46], 6, fill=CARD, outline=LINE)
    d.text((W - 188, 24), "Últimos 7 días  ▼", font=f(11), fill=INK)

    # KPI cards
    kpis = [
        ("Revenue", "$284.350", "+18%", GREEN, "vs. semana previa"),
        ("Ventas", "127", "+12%", GREEN, "tickets emitidos"),
        ("Ticket promedio", "$2.239", "+5,3%", GREEN, "valor por venta"),
        ("Retención", "68%", "-2%", RED, "clientes recurrentes"),
    ]
    x = 250
    y = 90
    cw, ch = 235, 110
    for label, value, delta, dcolor, sub in kpis:
        rounded_rect(d, [x, y, x + cw, y + ch], 10, fill=WHITE, outline=LINE)
        d.line([x, y, x + cw, y], fill=ORANGE, width=3)
        d.text((x + 16, y + 16), label, font=f(11, True), fill=MUTED)
        d.text((x + 16, y + 34), value, font=f(26, True), fill=INK)
        d.text((x + 16, y + 70), delta, font=f(12, True), fill=dcolor)
        d.text((x + 60, y + 70), sub, font=f(10), fill=MUTED)
        x += cw + 14

    # Briefing IA card
    bx, by, bw, bh = 250, 220, 720, 130
    rounded_rect(d, [bx, by, bx + bw, by + bh], 10, fill=ORANGE_LIGHT, outline=ORANGE_LIGHT)
    d.line([bx, by, bx + bw, by], fill=ORANGE, width=3)
    # Icon star
    d.rounded_rectangle([bx + 16, by + 16, bx + 50, by + 50], radius=8, fill=ORANGE)
    d.text((bx + 26, by + 22), "IA", font=f(14, True), fill=WHITE)
    d.text((bx + 64, by + 20), "Briefing diario", font=f(12, True), fill=ORANGE_DARK)
    d.text((bx + 16, by + 60),
           "Tu mejor día de la semana fue el sábado con $48.300 (17% del revenue semanal).",
           font=f(13), fill=INK)
    d.text((bx + 16, by + 82),
           "El café americano sigue siendo tu producto estrella (+34 unidades vs. semana previa).",
           font=f(13), fill=INK)
    d.text((bx + 16, by + 104),
           "Acción sugerida: lanzar combo café + medialuna en franja 16-18h (valle detectado).",
           font=f(12, True), fill=ORANGE_DARK)

    # Sales timeline chart
    cx, cy, cw, ch = 250, 370, 720, 270
    rounded_rect(d, [cx, cy, cx + cw, cy + ch], 10, fill=WHITE, outline=LINE)
    d.text((cx + 20, cy + 16), "Ventas últimos 7 días", font=f(13, True), fill=INK)
    d.text((cx + 20, cy + 36), "Revenue diario · línea + área", font=f(10), fill=MUTED)
    # Axes
    ax = cx + 50
    ay = cy + ch - 40
    aw = cw - 90
    ah = ch - 100
    # grid
    for i in range(5):
        gy = cy + 70 + (ah * i // 4)
        d.line([ax, gy, ax + aw, gy], fill=LINE, width=1)
    # data line
    days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    vals = [0.45, 0.55, 0.42, 0.65, 0.78, 0.92, 0.68]
    pts = []
    for i, v in enumerate(vals):
        px = ax + (aw * i // 6)
        py = ay - int(ah * v)
        pts.append((px, py))
    # area fill
    poly = [(ax, ay)] + pts + [(ax + aw, ay)]
    d.polygon(poly, fill=ORANGE_LIGHT)
    # line
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=ORANGE, width=3)
    # dots
    for px, py in pts:
        d.ellipse([px - 5, py - 5, px + 5, py + 5], fill=WHITE, outline=ORANGE, width=2)
    # x labels
    for i, day in enumerate(days):
        px = ax + (aw * i // 6)
        d.text((px - 12, ay + 8), day, font=f(10), fill=MUTED)

    # Right column: top productos
    rx, ry, rw, rh = 985, 90, 270, 280
    rounded_rect(d, [rx, ry, rx + rw, ry + rh], 10, fill=WHITE, outline=LINE)
    d.text((rx + 16, ry + 16), "Top productos", font=f(13, True), fill=INK)
    d.text((rx + 16, ry + 36), "Por revenue (7 días)", font=f(10), fill=MUTED)
    products = [
        ("Café americano", "$42.500", 0.92),
        ("Medialuna", "$28.300", 0.62),
        ("Capuchino", "$24.100", 0.52),
        ("Tostado JyQ", "$19.800", 0.43),
        ("Brownie", "$14.200", 0.31),
    ]
    py = ry + 64
    for name, rev, ratio in products:
        d.text((rx + 16, py), name, font=f(11, True), fill=INK)
        d.text((rx + rw - 80, py), rev, font=f(11, True), fill=ORANGE)
        bar_y = py + 18
        d.rounded_rectangle([rx + 16, bar_y, rx + rw - 16, bar_y + 6], radius=3, fill=LINE)
        d.rounded_rectangle([rx + 16, bar_y, rx + 16 + int((rw - 32) * ratio), bar_y + 6],
                            radius=3, fill=ORANGE)
        py += 38

    # Bottom right: alertas
    ax2, ay2, aw2, ah2 = 985, 390, 270, 250
    rounded_rect(d, [ax2, ay2, ax2 + aw2, ay2 + ah2], 10, fill=WHITE, outline=LINE)
    d.text((ax2 + 16, ay2 + 16), "Alertas activas  · 3", font=f(13, True), fill=INK)
    alerts = [
        ("Clientes en riesgo", "8 sin comprar +14d", AMBER, AMBER_LIGHT),
        ("Día sobre el promedio", "Hoy +28% vs media", GREEN, GREEN_LIGHT),
        ("Producto sin movimiento", "Brownie -7d", RED, "#FEE2E2"),
    ]
    ay_cursor = ay2 + 48
    for title, sub, col, bg in alerts:
        rounded_rect(d, [ax2 + 12, ay_cursor, ax2 + aw2 - 12, ay_cursor + 56], 8, fill=bg)
        d.rectangle([ax2 + 12, ay_cursor, ax2 + 16, ay_cursor + 56], fill=col)
        d.text((ax2 + 24, ay_cursor + 10), title, font=f(11, True), fill=INK)
        d.text((ax2 + 24, ay_cursor + 30), sub, font=f(10), fill=SLATE)
        ay_cursor += 62

    # Footer bar
    d.line([220, H - 50, W, H - 50], fill=LINE, width=1)
    d.text((250, H - 36), "Última sincronización con POS: hace 2 min  ·  Datos en tiempo real (SSE)",
           font=f(10), fill=MUTED)

    img.save(OUT / "dashboard.png", "PNG", optimize=True)
    return img


# ─────────────────────────────────────────────────────────────
#  Chat IA (450x900) — mobile ratio
# ─────────────────────────────────────────────────────────────

def make_chat_ia():
    W, H = 450, 900
    img = Image.new("RGB", (W, H), "#F1F5F9")
    d = ImageDraw.Draw(img)

    # Status bar
    d.rectangle([0, 0, W, 28], fill=WHITE)
    d.text((20, 8), "9:41", font=f(11, True), fill=INK)
    d.text((W - 60, 8), "100% ●", font=f(11), fill=INK)

    # Header
    d.rectangle([0, 28, W, 92], fill=NAVY)
    d.ellipse([16, 40, 56, 80], fill=ORANGE)
    d.text((26, 50), "IA", font=f(14, True), fill=WHITE)
    d.text((70, 42), "Asistente Atlas", font=f(15, True), fill=WHITE)
    d.text((70, 64), "● en línea · contexto del negocio", font=f(10), fill="#94A3B8")

    # Chat bubbles
    y = 120

    def bot_bubble(text, y, height=None):
        lines = text.split("\n")
        bw = min(320, max(text_w(d, ln, f(12)) for ln in lines) + 32)
        bh = height or (len(lines) * 22 + 22)
        d.rounded_rectangle([16, y, 16 + bw, y + bh], radius=14, fill=WHITE)
        d.rounded_rectangle([16, y, 22, y + bh], radius=3, fill=ORANGE)
        for i, ln in enumerate(lines):
            d.text((30, y + 12 + i * 22), ln, font=f(12), fill=INK)
        return y + bh + 12

    def user_bubble(text, y):
        bw = min(300, text_w(d, text, f(12)) + 32)
        bh = 44
        d.rounded_rectangle([W - 16 - bw, y, W - 16, y + bh], radius=14, fill=ORANGE)
        d.text((W - 16 - bw + 16, y + 14), text, font=f(12), fill=WHITE)
        return y + bh + 12

    y = bot_bubble("¡Buen día, Juan! ¿En qué te puedo\nayudar hoy?", y)
    y = user_bubble("¿cuál es mi mejor producto?", y)
    y = bot_bubble(
        "Tu producto estrella esta semana\nfue Café americano con $42.500\nde revenue (15% del total).",
        y,
    )
    # Card with data inside bot bubble
    bw, bh = 320, 84
    d.rounded_rectangle([16, y, 16 + bw, y + bh], radius=14, fill=WHITE)
    d.rounded_rectangle([16, y, 22, y + bh], radius=3, fill=ORANGE)
    d.text((30, y + 12), "Café americano", font=f(12, True), fill=INK)
    d.text((30, y + 30), "$42.500  ·  185 unidades", font=f(11), fill=SLATE)
    d.rounded_rectangle([30, y + 52, 310, y + 60], radius=4, fill="#E2E8F0")
    d.rounded_rectangle([30, y + 52, 280, y + 60], radius=4, fill=ORANGE)
    d.text((30, y + 66), "+34 unidades vs. semana previa", font=f(10), fill=GREEN)
    y += bh + 12

    y = user_bubble("¿por qué bajaron las ventas el lunes?", y)
    y = bot_bubble(
        "Detecté 3 razones probables:\n\n1. Lunes históricamente es tu día\n   más débil (-22% vs. media).\n2. Llovió todo el día — tu vertical\n   pierde ~22% con lluvia.\n3. El cliente VIP Pérez no vino\n   (suele aportar $3.200).",
        y,
    )

    # Input bar
    d.rectangle([0, H - 70, W, H], fill=WHITE)
    d.line([0, H - 70, W, H - 70], fill=LINE, width=1)
    d.rounded_rectangle([16, H - 56, W - 60, H - 14], radius=18, fill="#F1F5F9", outline=LINE)
    d.text((30, H - 44), "Preguntale a tu negocio…", font=f(12), fill=MUTED)
    d.ellipse([W - 52, H - 56, W - 10, H - 14], fill=ORANGE)
    d.text((W - 41, H - 47), "→", font=f(18, True), fill=WHITE)

    img.save(OUT / "chat_ia.png", "PNG", optimize=True)
    return img


# ─────────────────────────────────────────────────────────────
#  Forecasting (1280x800)
# ─────────────────────────────────────────────────────────────

def make_forecasting():
    W, H = 1280, 800
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)

    # Sidebar
    d.rectangle([0, 0, 220, H], fill=NAVY)
    d.text((24, 28), "ATLAS NEXUS", font=f(15, True), fill=WHITE)
    d.text((24, 50), "Tienda Demo · LATAM", font=f(10), fill="#9CA3AF")
    nav_items = [
        ("○  Dashboard", False),
        ("○  Productos", False),
        ("○  Ventas", False),
        ("○  Insights IA", False),
        ("●  Forecasting", True),
        ("○  Smart Receipt", False),
        ("○  Ajustes", False),
    ]
    y = 110
    for label, active in nav_items:
        if active:
            d.rounded_rectangle([12, y - 6, 208, y + 22], radius=6, fill=ORANGE)
            d.text((24, y), label, font=f(12, True), fill=WHITE)
        else:
            d.text((24, y), label, font=f(12), fill="#CBD5E1")
        y += 38

    # Header
    d.text((250, 32), "Forecasting + Stock", font=f(22, True), fill=INK)
    d.text((250, 60), "Predicción semanal por producto · modelo XGBoost", font=f(12), fill=MUTED)

    # Model info banner
    rounded_rect(d, [250, 98, W - 30, 154], 10, fill="#E0F2FE", outline="#E0F2FE")
    d.rectangle([250, 98, 254, 154], fill=BLUE)
    d.text((272, 110), "Modelo activo: XGBoost 2.1", font=f(13, True), fill=BLUE)
    d.text((272, 130), "Entrenado con 8 semanas de historia · MAPE 11,4% · próximo entrenamiento en 3 días",
           font=f(11), fill=SLATE)

    # Shopping list
    d.text((250, 180), "Lista de compras priorizada — próxima semana", font=f(15, True), fill=INK)
    d.text((250, 204), "Ordenada por urgencia. Confianza calibrada según error histórico.",
           font=f(10), fill=MUTED)

    rows = [
        ("Café en grano premium", "12 kg", "Alta", GREEN, "Stock actual: 2,5 kg · Cobertura: 1,5 días"),
        ("Leche entera 1L", "48 unidades", "Alta", GREEN, "Stock: 12 u · Cobertura: 2 días"),
        ("Medialunas (mix)", "240 unidades", "Alta", GREEN, "Velocidad: 34 u/día · Stock: 60 u"),
        ("Azúcar 5 kg", "3 bolsas", "Media", AMBER, "Cobertura actual: 6 días"),
        ("Servilletas", "2 paquetes", "Media", AMBER, "Reposición preventiva"),
        ("Brownie", "—", "Baja", RED, "Sin movimiento últimos 7 días · NO reponer"),
    ]
    y = 232
    for name, qty, conf, ccolor, sub in rows:
        rounded_rect(d, [250, y, W - 30, y + 64], 8, fill=WHITE, outline=LINE)
        d.rectangle([250, y, 254, y + 64], fill=ccolor)
        d.text((272, y + 12), name, font=f(13, True), fill=INK)
        d.text((272, y + 36), sub, font=f(10), fill=MUTED)
        # Qty
        d.text((W - 350, y + 18), qty, font=f(14, True), fill=INK)
        # Confidence pill
        cw_pill = 70
        rounded_rect(d, [W - 200, y + 18, W - 200 + cw_pill, y + 42], 10, fill=ccolor)
        d.text((W - 200 + 14, y + 23), conf, font=f(11, True), fill=WHITE)
        # Action button
        rounded_rect(d, [W - 110, y + 18, W - 50, y + 42], 6, fill=ORANGE)
        d.text((W - 105, y + 23), "Pedir", font=f(11, True), fill=WHITE)
        y += 72

    img.save(OUT / "forecasting.png", "PNG", optimize=True)
    return img


# ─────────────────────────────────────────────────────────────
#  Smart Receipt micrositio (450x900) — mobile
# ─────────────────────────────────────────────────────────────

def make_smart_receipt():
    W, H = 450, 900
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)

    # Status bar
    d.rectangle([0, 0, W, 28], fill=WHITE)
    d.text((20, 8), "9:41", font=f(11, True), fill=INK)
    d.text((W - 60, 8), "100% ●", font=f(11), fill=INK)

    # Hero
    d.rectangle([0, 28, W, 200], fill=NAVY)
    d.text((24, 60), "¡Gracias por tu compra!", font=f(20, True), fill=WHITE)
    d.text((24, 92), "Tienda Demo  ·  24 may 2026 · 14:32", font=f(11), fill="#94A3B8")
    rounded_rect(d, [24, 130, W - 24, 180], 10, fill=ORANGE)
    d.text((40, 145), "Total pagado", font=f(11), fill=WHITE)
    d.text((40, 158), "$2.840,00", font=f(20, True), fill=WHITE)
    d.text((W - 110, 156), "ID: #4827", font=f(11), fill=WHITE)

    # Items
    d.text((24, 220), "Tu pedido", font=f(14, True), fill=INK)
    items = [
        ("2× Café americano", "$1.700"),
        ("1× Medialuna", "$540"),
        ("1× Brownie", "$600"),
    ]
    y = 250
    for name, price in items:
        d.text((24, y), name, font=f(12), fill=INK)
        d.text((W - 80, y), price, font=f(12, True), fill=INK)
        d.line([24, y + 24, W - 24, y + 24], fill=LINE)
        y += 36

    # Review section
    rounded_rect(d, [24, y + 20, W - 24, y + 180], 14, fill=ORANGE_LIGHT)
    d.text((40, y + 36), "¿Cómo te fue?", font=f(15, True), fill=ORANGE_DARK)
    d.text((40, y + 60), "Dejanos una reseña y desbloqueá", font=f(11), fill=INK)
    d.text((40, y + 76), "un 15% off para tu próxima visita.", font=f(11), fill=INK)
    # Stars
    sx = 40
    for i in range(5):
        col = ORANGE if i < 4 else "#FFFFFF"
        outline = ORANGE_DARK
        # crude star: filled rounded box
        d.rounded_rectangle([sx, y + 108, sx + 36, y + 144], radius=4,
                            fill=col, outline=outline, width=2)
        d.text((sx + 8, y + 116), "★", font=f(20, True),
               fill=WHITE if i < 4 else ORANGE)
        sx += 44
    rounded_rect(d, [240, y + 108, W - 40, y + 144], 8, fill=NAVY)
    d.text((266, y + 116), "Enviar reseña", font=f(11, True), fill=WHITE)

    # Promo card
    y2 = y + 210
    rounded_rect(d, [24, y2, W - 24, y2 + 80], 14, fill=WHITE, outline=ORANGE, width=2)
    d.text((40, y2 + 18), "🎁  Promo personalizada", font=f(13, True), fill=ORANGE_DARK)
    d.text((40, y2 + 42), "10% off en tu próximo café americano.", font=f(11), fill=INK)
    d.text((40, y2 + 58), "Válido hasta el 31 may.", font=f(10), fill=MUTED)

    img.save(OUT / "smart_receipt.png", "PNG", optimize=True)
    return img


# ─────────────────────────────────────────────────────────────
#  Briefing card (1100x500) - como hero del slide IA
# ─────────────────────────────────────────────────────────────

def make_briefing():
    W, H = 1100, 500
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)

    # Card frame
    d.rounded_rectangle([20, 20, W - 20, H - 20], radius=16, fill=WHITE, outline=LINE, width=2)
    d.rounded_rectangle([20, 20, W - 20, 28], radius=16, fill=ORANGE)
    # Header
    d.ellipse([50, 60, 110, 120], fill=ORANGE)
    d.text((68, 76), "IA", font=f(20, True), fill=WHITE)
    d.text((130, 64), "Briefing del día  ·  24 may 2026", font=f(13, True), fill=ORANGE_DARK)
    d.text((130, 86), "Generado a las 8:30 am con tu data en vivo", font=f(11), fill=MUTED)

    # Body
    lines = [
        ("📈 ", "Hoy llevás $48.300 de revenue, 23% por encima de tu promedio diario."),
        ("⭐ ", "Tu producto estrella sigue siendo Café americano (+34 unidades vs. semana previa)."),
        ("⚠️ ", "Detecté 8 clientes en riesgo de churn (no compran hace 14+ días)."),
        ("✅ ", "Acción sugerida: combo café + medialuna en franja 16-18h (valle detectado)."),
    ]
    y = 160
    for icon, txt in lines:
        d.text((60, y), icon, font=f(16), fill=INK)
        d.text((110, y + 2), txt, font=f(14), fill=INK)
        y += 50

    # Footer chips
    chips = [("Endpoint: /insights/briefing", BLUE_LIGHT, BLUE),
             ("Modelo: Llama 3.3 70B", GREEN_LIGHT, GREEN),
             ("Tiempo de respuesta: 1,2 s", AMBER_LIGHT, AMBER)]
    cx = 60
    for label, bg, fg in chips:
        cw = int(text_w(d, label, f(11, True)) + 32)
        rounded_rect(d, [cx, H - 70, cx + cw, H - 40], 14, fill=bg)
        d.text((cx + 16, H - 64), label, font=f(11, True), fill=fg)
        cx += cw + 12

    img.save(OUT / "briefing.png", "PNG", optimize=True)
    return img


# ─────────────────────────────────────────────────────────────
#  Device frames
# ─────────────────────────────────────────────────────────────

def laptop_frame(screen_img: Image.Image, out_name: str):
    """Wrap a 1280x800 screen in a laptop frame."""
    sw, sh = 1280, 800
    screen = screen_img.resize((sw, sh)) if screen_img.size != (sw, sh) else screen_img

    # Outer canvas
    W = 1500
    H = 1000
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)

    # Laptop body (top): rounded rectangle
    bx0, by0 = 60, 40
    bx1, by1 = W - 60, H - 130
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=20, fill="#111827", outline="#1F2937", width=2)
    # Inner bezel
    d.rounded_rectangle([bx0 + 14, by0 + 14, bx1 - 14, by1 - 14], radius=10, fill="#000000")
    # Screen position
    inner_w = bx1 - bx0 - 28
    inner_h = by1 - by0 - 28
    # Resize screen to fit inner
    target_w = inner_w - 10
    target_h = int(target_w * sh / sw)
    if target_h > inner_h - 10:
        target_h = inner_h - 10
        target_w = int(target_h * sw / sh)
    scaled = screen.resize((target_w, target_h))
    sx = bx0 + 14 + (inner_w - target_w) // 2
    sy = by0 + 14 + (inner_h - target_h) // 2
    img.paste(scaled, (sx, sy))

    # Bottom base
    d.rounded_rectangle([30, by1, W - 30, by1 + 26], radius=14, fill="#1F2937")
    d.rounded_rectangle([W // 2 - 60, by1, W // 2 + 60, by1 + 14], radius=6, fill="#374151")
    # Shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([100, by1 + 30, W - 100, by1 + 70], fill=(0, 0, 0, 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    out = Image.alpha_composite(shadow, img)

    # Composite onto white background
    bg = Image.new("RGB", (W, H), WHITE)
    bg.paste(out, (0, 0), out)
    bg.save(OUT / out_name, "PNG", optimize=True)


def phone_frame(screen_img: Image.Image, out_name: str):
    """Wrap a mobile screen in an iPhone-style frame."""
    sw, sh = 450, 900
    screen = screen_img.resize((sw, sh)) if screen_img.size != (sw, sh) else screen_img

    W, H = 560, 1020
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)

    # Phone body
    bx0, by0 = 30, 30
    bx1, by1 = W - 30, H - 30
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=58, fill="#111827", outline="#1F2937", width=3)
    # Inner bezel
    d.rounded_rectangle([bx0 + 12, by0 + 12, bx1 - 12, by1 - 12], radius=48, fill="#000000")

    # Paste screen
    inner_w = bx1 - bx0 - 24
    inner_h = by1 - by0 - 24
    target_w = inner_w - 6
    target_h = int(target_w * sh / sw)
    if target_h > inner_h - 6:
        target_h = inner_h - 6
        target_w = int(target_h * sw / sh)
    scaled = screen.resize((target_w, target_h))
    sx = bx0 + 12 + (inner_w - target_w) // 2
    sy = by0 + 12 + (inner_h - target_h) // 2
    # Mask with rounded corners
    mask = Image.new("L", (target_w, target_h), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, target_w, target_h], radius=42, fill=255)
    img.paste(scaled, (sx, sy), mask)

    # Notch
    d.rounded_rectangle([W // 2 - 60, by0 + 10, W // 2 + 60, by0 + 36], radius=14, fill="#000000")

    # Shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([bx0 + 6, by0 + 16, bx1 + 6, by1 + 16], radius=58, fill=(0, 0, 0, 50))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    out = Image.alpha_composite(shadow, img)

    bg = Image.new("RGB", (W, H), WHITE)
    bg.paste(out, (0, 0), out)
    bg.save(OUT / out_name, "PNG", optimize=True)


def main():
    print("Generando mockups…")
    dash = make_dashboard();             print("  ✓ dashboard.png")
    chat = make_chat_ia();               print("  ✓ chat_ia.png")
    fc = make_forecasting();             print("  ✓ forecasting.png")
    rcpt = make_smart_receipt();         print("  ✓ smart_receipt.png")
    make_briefing();                     print("  ✓ briefing.png")

    print("Componiendo frames de dispositivo…")
    laptop_frame(dash, "laptop_dashboard.png");      print("  ✓ laptop_dashboard.png")
    laptop_frame(fc, "laptop_forecasting.png");      print("  ✓ laptop_forecasting.png")
    phone_frame(chat, "phone_chat.png");             print("  ✓ phone_chat.png")
    phone_frame(rcpt, "phone_receipt.png");          print("  ✓ phone_receipt.png")

    print(f"\nMockups guardados en: {OUT}")


if __name__ == "__main__":
    main()
