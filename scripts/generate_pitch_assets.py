"""
Genera mockups sintéticos del producto para el pitch Fiserv.
Estilo: fintech moderno (Stripe/Notion) — sombras suaves, espaciado generoso,
acentos naranja, tipografía con jerarquía clara.

Salida: docs/assets/mockups/*.png
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).resolve().parent.parent / "docs" / "assets" / "mockups"
OUT.mkdir(parents=True, exist_ok=True)

# ── Paleta ──────────────────────────────────────────────────
ORANGE = "#FF6B00"
ORANGE_2 = "#FF8A3D"
ORANGE_DARK = "#CC4F00"
ORANGE_LIGHT = "#FFE9D6"
ORANGE_BG = "#FFF4EB"
NAVY = "#0B1F3A"
NAVY_2 = "#1E3253"
INK = "#0F172A"
SLATE = "#475569"
SLATE_2 = "#64748B"
MUTED = "#94A3B8"
BORDER = "#E5E7EB"
LINE = "#F1F5F9"
CARD = "#FFFFFF"
BG = "#F8FAFC"
WHITE = "#FFFFFF"
GREEN = "#10B981"
GREEN_LIGHT = "#D1FAE5"
BLUE = "#3B82F6"
BLUE_LIGHT = "#DBEAFE"
RED = "#EF4444"
RED_LIGHT = "#FEE2E2"
AMBER = "#F59E0B"
AMBER_LIGHT = "#FEF3C7"
PURPLE = "#8B5CF6"
PURPLE_LIGHT = "#EDE9FE"

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def f(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size)


def rrect(d, xy, radius, fill=None, outline=None, width=1):
    d.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text_w(d, text, font):
    return d.textlength(text, font=font)


# ── Soft shadow helper ──────────────────────────────────────
def add_shadow(layer_img, box, radius=8, blur=14, opacity=40, offset_y=4):
    """Draw a soft shadow under a rounded rectangle on the layer_img base."""
    x0, y0, x1, y1 = box
    shadow_layer = Image.new("RGBA", layer_img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    sd.rounded_rectangle([x0, y0 + offset_y, x1, y1 + offset_y],
                         radius=radius, fill=(0, 0, 0, opacity))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(layer_img.convert("RGBA"), shadow_layer)


def shadow_card(base_rgba, box, radius=12, blur=18, opacity=22, offset=(0, 6)):
    """Add a soft drop shadow behind a card region. Modifies in place."""
    x0, y0, x1, y1 = box
    ox, oy = offset
    sh = Image.new("RGBA", base_rgba.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([x0 + ox, y0 + oy, x1 + ox, y1 + oy],
                         radius=radius, fill=(11, 31, 58, opacity))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(base_rgba, sh)


def draw_card(base, d, box, radius=14, fill=CARD, border=None):
    """Compose a shadow + draw the card on top. Returns the new base image."""
    base = shadow_card(base.convert("RGBA"), box, radius=radius)
    nd = ImageDraw.Draw(base)
    nd.rounded_rectangle(box, radius=radius, fill=fill,
                         outline=border or BORDER, width=1 if border or fill == CARD else 0)
    return base


# ── Geometric icon helpers (mini SVG-style glyphs) ──────────
def icon_star(d, xy, size, fill):
    cx, cy = xy
    # 4-point star (compass)
    pts = [
        (cx, cy - size),
        (cx + size * 0.3, cy - size * 0.3),
        (cx + size, cy),
        (cx + size * 0.3, cy + size * 0.3),
        (cx, cy + size),
        (cx - size * 0.3, cy + size * 0.3),
        (cx - size, cy),
        (cx - size * 0.3, cy - size * 0.3),
    ]
    d.polygon(pts, fill=fill)


def icon_dot(d, xy, r, fill):
    cx, cy = xy
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)


def icon_check(d, xy, size, color, width=3):
    cx, cy = xy
    d.line([(cx - size * 0.5, cy), (cx - size * 0.1, cy + size * 0.4),
            (cx + size * 0.6, cy - size * 0.4)], fill=color, width=width)


def icon_arrow_up(d, xy, size, color):
    cx, cy = xy
    pts = [(cx, cy - size), (cx + size * 0.6, cy + size * 0.3),
           (cx - size * 0.6, cy + size * 0.3)]
    d.polygon(pts, fill=color)


def icon_arrow_down(d, xy, size, color):
    cx, cy = xy
    pts = [(cx, cy + size), (cx + size * 0.6, cy - size * 0.3),
           (cx - size * 0.6, cy - size * 0.3)]
    d.polygon(pts, fill=color)


# ── Vertical gradient bg helper ─────────────────────────────
def gradient_bg(size, c1, c2):
    w, h = size
    img = Image.new("RGB", (1, h))
    for y in range(h):
        ratio = y / h
        r = int(int(c1[1:3], 16) * (1 - ratio) + int(c2[1:3], 16) * ratio)
        g = int(int(c1[3:5], 16) * (1 - ratio) + int(c2[3:5], 16) * ratio)
        b = int(int(c1[5:7], 16) * (1 - ratio) + int(c2[5:7], 16) * ratio)
        img.putpixel((0, y), (r, g, b))
    return img.resize((w, h))


# ─────────────────────────────────────────────────────────────
#  Dashboard  (1280×800)
# ─────────────────────────────────────────────────────────────
def make_dashboard():
    W, H = 1280, 800
    base = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(base)

    # ── Sidebar ──
    d.rectangle([0, 0, 230, H], fill=NAVY)
    # subtle gradient overlay top
    grad = gradient_bg((230, 200), NAVY, NAVY_2)
    base.paste(grad, (0, 0))
    d = ImageDraw.Draw(base)

    # Logo block
    rrect(d, [24, 24, 56, 56], 8, fill=ORANGE)
    d.text((34, 32), "A", font=f(16, True), fill=WHITE)
    d.text((66, 28), "Atlas Nexus", font=f(14, True), fill=WHITE)
    d.text((66, 46), "Tienda Demo", font=f(10), fill="#94A3B8")

    # Search
    rrect(d, [24, 78, 206, 110], 8, fill="#1E3253", outline="#1E3253")
    icon_dot(d, (38, 94), 4, MUTED)
    d.ellipse([34, 90, 42, 98], outline=MUTED, width=1)
    d.line([(42, 98), (48, 104)], fill=MUTED, width=2)
    d.text((54, 88), "Buscar…", font=f(11), fill=MUTED)

    # Section label
    d.text((24, 130), "PRINCIPAL", font=f(9, True), fill=MUTED)

    nav = [
        ("Dashboard", True),
        ("Ventas", False),
        ("Productos", False),
        ("Categorías", False),
    ]
    y = 156
    for label, active in nav:
        if active:
            rrect(d, [16, y - 8, 214, y + 22], 8, fill=ORANGE)
            icon_dot(d, (30, y + 7), 4, WHITE)
            d.text((44, y), label, font=f(12, True), fill=WHITE)
        else:
            icon_dot(d, (30, y + 7), 3, MUTED)
            d.text((44, y), label, font=f(12), fill="#CBD5E1")
        y += 38

    d.text((24, y + 8), "INTELIGENCIA", font=f(9, True), fill=MUTED)
    y += 32
    for label in ["Insights IA", "Forecasting", "Smart Receipt"]:
        icon_dot(d, (30, y + 7), 3, MUTED)
        d.text((44, y), label, font=f(12), fill="#CBD5E1")
        y += 38

    # User card at bottom
    rrect(d, [16, H - 80, 214, H - 24], 10, fill="#1E3253")
    d.ellipse([28, H - 68, 60, H - 36], fill=ORANGE)
    d.text((38, H - 60), "JC", font=f(12, True), fill=WHITE)
    d.text((72, H - 64), "Juan C.", font=f(12, True), fill=WHITE)
    d.text((72, H - 46), "Plan Pro", font=f(10), fill="#94A3B8")

    # ── Top bar ──
    d.rectangle([230, 0, W, 70], fill=WHITE)
    d.line([230, 70, W, 70], fill=BORDER, width=1)
    d.text((258, 18), "Buen día, Juan ☀", font=f(20, True), fill=INK)
    d.text((258, 46), "Esto está pasando en tu negocio hoy",
           font=f(11), fill=SLATE_2)
    # period pill
    rrect(d, [W - 220, 20, W - 110, 50], 14, fill=BG, outline=BORDER)
    d.text((W - 210, 28), "Últimos 7 días", font=f(11, True), fill=INK)
    icon_arrow_down(d, (W - 122, 35), 4, INK)
    # action button
    rrect(d, [W - 100, 20, W - 30, 50], 14, fill=NAVY)
    icon_dot(d, (W - 80, 35), 3, ORANGE)
    d.text((W - 70, 28), "Sync", font=f(11, True), fill=WHITE)

    # ── KPI cards ──
    kpis = [
        ("Revenue 7d",    "$284.350", "+18%", GREEN, "up", "vs. semana previa"),
        ("Ventas",         "127",       "+12%", GREEN, "up", "tickets emitidos"),
        ("Ticket prom.",   "$2.239",    "+5.3%", GREEN, "up", "valor por venta"),
        ("Retención",      "68%",       "-2%",  RED,   "down", "clientes recurrentes"),
    ]
    x = 258
    y = 92
    cw, ch = 230, 116
    for label, value, delta, dcolor, arrow, sub in kpis:
        base = shadow_card(base, [x, y, x + cw, y + ch])
        d = ImageDraw.Draw(base)
        rrect(d, [x, y, x + cw, y + ch], 12, fill=CARD, outline=BORDER)
        d.text((x + 16, y + 14), label, font=f(11, True), fill=MUTED)
        d.text((x + 16, y + 34), value, font=f(26, True), fill=INK)
        # delta pill
        pill_w = int(text_w(d, delta, f(11, True)) + 28)
        bg_delta = GREEN_LIGHT if dcolor == GREEN else RED_LIGHT
        rrect(d, [x + 16, y + 72, x + 16 + pill_w, y + 92], 10, fill=bg_delta)
        if arrow == "up":
            icon_arrow_up(d, (x + 26, y + 82), 4, dcolor)
        else:
            icon_arrow_down(d, (x + 26, y + 82), 4, dcolor)
        d.text((x + 34, y + 75), delta, font=f(10, True), fill=dcolor)
        d.text((x + 16, y + 98), sub, font=f(10), fill=SLATE_2)
        x += cw + 12

    # ── Briefing IA hero card ──
    bx, by, bw, bh = 258, 226, 706, 142
    base = shadow_card(base, [bx, by, bx + bw, by + bh])
    d = ImageDraw.Draw(base)
    # gradient fill
    g = gradient_bg((bw, bh), ORANGE_LIGHT, ORANGE_BG)
    mask = Image.new("L", (bw, bh), 0)
    mk = ImageDraw.Draw(mask)
    mk.rounded_rectangle([0, 0, bw, bh], radius=14, fill=255)
    base.paste(g, (bx, by), mask)
    d = ImageDraw.Draw(base)
    rrect(d, [bx, by, bx + bw, by + bh], 14, outline=ORANGE_LIGHT, width=1)
    # Icon circle
    d.ellipse([bx + 18, by + 18, bx + 62, by + 62], fill=ORANGE)
    icon_star(d, (bx + 40, by + 40), 11, WHITE)
    d.text((bx + 76, by + 22), "Briefing del día", font=f(13, True), fill=ORANGE_DARK)
    d.text((bx + 76, by + 42), "Generado a las 8:30 am con tu data en vivo",
           font=f(10), fill=SLATE_2)
    # body lines
    rows = [
        "📈  Hoy llevás $48.300 de revenue — 23% por encima de tu promedio diario.",
        "⭐  Tu producto estrella sigue siendo Café americano (+34u vs. semana previa).",
        "✅  Sugerencia: lanzá combo café + medialuna en franja 16–18h (valle detectado).",
    ]
    y_text = by + 72
    for r in rows:
        d.text((bx + 24, y_text), r, font=f(12), fill=INK)
        y_text += 22

    # ── Chart card ──
    cx, cy, cw, ch = 258, 388, 706, 280
    base = shadow_card(base, [cx, cy, cx + cw, cy + ch])
    d = ImageDraw.Draw(base)
    rrect(d, [cx, cy, cx + cw, cy + ch], 14, fill=CARD, outline=BORDER)
    d.text((cx + 20, cy + 16), "Ventas últimos 7 días", font=f(13, True), fill=INK)
    d.text((cx + 20, cy + 36), "Revenue diario · área + línea",
           font=f(10), fill=SLATE_2)
    # legend
    rrect(d, [cx + cw - 124, cy + 16, cx + cw - 20, cy + 38], 11, fill=ORANGE_BG)
    icon_dot(d, (cx + cw - 110, cy + 27), 4, ORANGE)
    d.text((cx + cw - 96, cy + 21), "Revenue $", font=f(10, True), fill=ORANGE_DARK)

    ax = cx + 60
    ay = cy + ch - 50
    aw = cw - 100
    ah = ch - 110
    # grid + y labels
    for i in range(5):
        gy = cy + 70 + (ah * i // 4)
        d.line([ax, gy, ax + aw, gy], fill=LINE, width=1)
        label = ["$60k", "$45k", "$30k", "$15k", "$0"][i]
        d.text((cx + 18, gy - 6), label, font=f(9), fill=MUTED)

    days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    vals = [0.40, 0.52, 0.38, 0.62, 0.78, 0.92, 0.65]
    pts = []
    for i, v in enumerate(vals):
        px = ax + (aw * i // 6)
        py = ay - int(ah * v)
        pts.append((px, py))

    # area fill (gradient)
    area_w = aw
    area_h = ah
    gradient = gradient_bg((area_w, area_h), "#FFB37A", "#FFFFFF")
    area_mask = Image.new("L", (area_w, area_h), 0)
    am = ImageDraw.Draw(area_mask)
    poly_local = [(p[0] - ax, p[1] - (ay - ah)) for p in pts]
    poly_local = [(0, ah)] + poly_local + [(aw, ah)]
    am.polygon(poly_local, fill=170)
    base.paste(gradient, (ax, ay - ah), area_mask)
    d = ImageDraw.Draw(base)
    # line
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=ORANGE, width=3)
    # dots
    for px, py in pts:
        d.ellipse([px - 6, py - 6, px + 6, py + 6], fill=WHITE)
        d.ellipse([px - 4, py - 4, px + 4, py + 4], fill=ORANGE)
    # x labels
    for i, day in enumerate(days):
        px = ax + (aw * i // 6)
        d.text((px - 12, ay + 12), day, font=f(10, True), fill=SLATE_2)
    # peak callout
    peak_x, peak_y = pts[5]
    rrect(d, [peak_x - 50, peak_y - 38, peak_x + 50, peak_y - 14], 6, fill=NAVY)
    d.text((peak_x - 38, peak_y - 32), "$48.300 ▼", font=f(10, True), fill=WHITE)

    # ── Right column ──
    # Top productos
    rx, ry, rw, rh = 980, 92, 274, 310
    base = shadow_card(base, [rx, ry, rx + rw, ry + rh])
    d = ImageDraw.Draw(base)
    rrect(d, [rx, ry, rx + rw, ry + rh], 14, fill=CARD, outline=BORDER)
    d.text((rx + 16, ry + 16), "Top productos", font=f(13, True), fill=INK)
    d.text((rx + 16, ry + 36), "Revenue · últimos 7 días", font=f(10), fill=SLATE_2)
    products = [
        ("☕ Café americano", "$42.500", "185u", 0.92, ORANGE),
        ("🥐 Medialuna",      "$28.300", "126u", 0.62, BLUE),
        ("☕ Capuchino",      "$24.100", "84u",  0.52, PURPLE),
        ("🥪 Tostado JyQ",    "$19.800", "44u",  0.43, GREEN),
        ("🍫 Brownie",        "$14.200", "31u",  0.31, AMBER),
    ]
    py = ry + 68
    for name, rev, qty, ratio, col in products:
        d.text((rx + 16, py), name, font=f(11, True), fill=INK)
        d.text((rx + rw - 76, py), rev, font=f(11, True), fill=INK)
        bar_y = py + 18
        rrect(d, [rx + 16, bar_y, rx + rw - 16, bar_y + 6], 3, fill=LINE)
        rrect(d, [rx + 16, bar_y, rx + 16 + int((rw - 32) * ratio), bar_y + 6],
              3, fill=col)
        d.text((rx + 16, py + 28), qty, font=f(9), fill=MUTED)
        py += 44

    # Alertas
    ax2, ay2, aw2, ah2 = 980, 422, 274, 246
    base = shadow_card(base, [ax2, ay2, ax2 + aw2, ay2 + ah2])
    d = ImageDraw.Draw(base)
    rrect(d, [ax2, ay2, ax2 + aw2, ay2 + ah2], 14, fill=CARD, outline=BORDER)
    d.text((ax2 + 16, ay2 + 16), "Alertas activas", font=f(13, True), fill=INK)
    rrect(d, [ax2 + aw2 - 36, ay2 + 14, ax2 + aw2 - 14, ay2 + 32], 9, fill=RED)
    d.text((ax2 + aw2 - 30, ay2 + 16), "3", font=f(11, True), fill=WHITE)

    alerts = [
        ("⚠️", "Clientes en riesgo", "8 sin comprar +14d", AMBER, AMBER_LIGHT),
        ("📈", "Día sobre el promedio", "Hoy +28% vs media", GREEN, GREEN_LIGHT),
        ("📦", "Producto sin movimiento", "Brownie · -7 días", RED, RED_LIGHT),
    ]
    yc = ay2 + 48
    for icon, title, sub, col, bg_col in alerts:
        rrect(d, [ax2 + 12, yc, ax2 + aw2 - 12, yc + 56], 10, fill=bg_col)
        d.text((ax2 + 22, yc + 18), icon, font=f(16), fill=col)
        d.text((ax2 + 50, yc + 8), title, font=f(11, True), fill=INK)
        d.text((ax2 + 50, yc + 28), sub, font=f(10), fill=SLATE)
        yc += 62

    # Footer status bar
    d.line([230, H - 50, W, H - 50], fill=BORDER, width=1)
    icon_dot(d, (262, H - 35), 4, GREEN)
    d.text((276, H - 41), "Sincronizado con POS hace 2 min  ·  Stream en vivo activo",
           font=f(10), fill=SLATE_2)

    base.convert("RGB").save(OUT / "dashboard.png", "PNG", optimize=True)
    return base.convert("RGB")


# ─────────────────────────────────────────────────────────────
#  Chat IA  (450×900)
# ─────────────────────────────────────────────────────────────
def make_chat_ia():
    W, H = 450, 900
    base = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(base)

    # Status bar
    d.rectangle([0, 0, W, 32], fill=WHITE)
    d.text((20, 9), "9:41", font=f(11, True), fill=INK)
    d.text((W - 80, 9), "100%  ●●●●", font=f(10), fill=INK)

    # Header
    d.rectangle([0, 32, W, 110], fill=NAVY)
    # Avatar
    d.ellipse([18, 50, 64, 96], fill=ORANGE)
    icon_star(d, (41, 73), 11, WHITE)
    d.text((76, 50), "Asistente Atlas", font=f(15, True), fill=WHITE)
    icon_dot(d, (76, 80), 3, GREEN)
    d.text((86, 74), "en línea  ·  contexto cargado", font=f(10), fill="#94A3B8")
    # menu dots
    icon_dot(d, (W - 30, 65), 3, WHITE)
    icon_dot(d, (W - 30, 75), 3, WHITE)
    icon_dot(d, (W - 30, 85), 3, WHITE)

    # Date pill
    rrect(d, [W // 2 - 60, 124, W // 2 + 60, 144], 10, fill="#E2E8F0")
    d.text((W // 2 - 42, 127), "Hoy · 9:41", font=f(9, True), fill=SLATE)

    y = 162

    def bot_bubble(text, y):
        lines = text.split("\n")
        bw_max = max(text_w(d, ln, f(12)) for ln in lines)
        bw = int(min(330, bw_max + 32))
        bh = len(lines) * 22 + 22
        base_local = shadow_card(base.convert("RGBA"), [16, y, 16 + bw, y + bh],
                                 radius=16, blur=12, opacity=16, offset=(0, 3))
        nd = ImageDraw.Draw(base_local)
        nd.rounded_rectangle([16, y, 16 + bw, y + bh], radius=16,
                             fill=WHITE, outline=BORDER)
        # accent dot
        nd.ellipse([10, y + bh - 14, 22, y + bh - 2], fill=ORANGE)
        for i, ln in enumerate(lines):
            nd.text((30, y + 12 + i * 22), ln, font=f(12), fill=INK)
        return base_local, y + bh + 12

    def user_bubble(text, y):
        bw = int(min(300, text_w(d, text, f(12)) + 32))
        bh = 44
        base_local = shadow_card(base.convert("RGBA"),
                                 [W - 16 - bw, y, W - 16, y + bh],
                                 radius=16, blur=10, opacity=20, offset=(0, 3))
        nd = ImageDraw.Draw(base_local)
        # gradient bubble
        g = gradient_bg((bw, bh), ORANGE, ORANGE_2)
        mask = Image.new("L", (bw, bh), 0)
        mk = ImageDraw.Draw(mask)
        mk.rounded_rectangle([0, 0, bw, bh], radius=16, fill=255)
        base_local.paste(g, (W - 16 - bw, y), mask)
        nd = ImageDraw.Draw(base_local)
        nd.text((W - 16 - bw + 16, y + 14), text, font=f(12), fill=WHITE)
        return base_local, y + bh + 12

    base, y = bot_bubble("¡Buen día, Juan! ¿En qué puedo\nayudarte hoy?", y)
    base, y = user_bubble("¿cuál es mi mejor producto?", y)
    base, y = bot_bubble("Tu producto estrella esta semana fue\nCafé americano con $42.500 (15% del\nrevenue total).", y)

    # Data card inside bot bubble
    bw, bh = 330, 96
    base = shadow_card(base.convert("RGBA"), [16, y, 16 + bw, y + bh],
                       radius=16, blur=12, opacity=16, offset=(0, 3))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([16, y, 16 + bw, y + bh], radius=16, fill=WHITE, outline=BORDER)
    d.ellipse([10, y + bh - 14, 22, y + bh - 2], fill=ORANGE)
    d.text((30, y + 12), "☕  Café americano", font=f(12, True), fill=INK)
    d.text((30, y + 32), "$42.500  ·  185 unidades", font=f(11), fill=SLATE)
    rrect(d, [30, y + 54, 314, y + 64], 5, fill=LINE)
    rrect(d, [30, y + 54, 280, y + 64], 5, fill=ORANGE)
    rrect(d, [30, y + 72, 200, y + 88], 8, fill=GREEN_LIGHT)
    icon_arrow_up(d, (40, y + 80), 3, GREEN)
    d.text((50, y + 74), "+34u vs. semana previa", font=f(10, True), fill=GREEN)
    y += bh + 12

    base, y = user_bubble("¿por qué bajaron el lunes?", y)
    base, y = bot_bubble(
        "Detecté 3 razones probables:\n\n"
        "1. Lunes es tu día más débil\n   (-22% vs. promedio histórico).\n"
        "2. Llovió todo el día (-22% típico\n   en tu vertical).\n"
        "3. Tu VIP Pérez no vino\n   (suele aportar ~$3.200).",
        y,
    )

    # Input bar
    d = ImageDraw.Draw(base)
    d.rectangle([0, H - 76, W, H], fill=WHITE)
    d.line([0, H - 76, W, H - 76], fill=BORDER, width=1)
    rrect(d, [16, H - 60, W - 64, H - 16], 22, fill=BG, outline=BORDER)
    d.text((34, H - 48), "Preguntale a tu negocio…", font=f(12), fill=MUTED)
    # send button (gradient)
    g = gradient_bg((44, 44), ORANGE, ORANGE_2)
    mask = Image.new("L", (44, 44), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, 44, 44], fill=255)
    base.paste(g, (W - 56, H - 60), mask)
    d = ImageDraw.Draw(base)
    d.text((W - 42, H - 50), "→", font=f(18, True), fill=WHITE)

    base.convert("RGB").save(OUT / "chat_ia.png", "PNG", optimize=True)
    return base.convert("RGB")


# ─────────────────────────────────────────────────────────────
#  Forecasting  (1280×800)
# ─────────────────────────────────────────────────────────────
def make_forecasting():
    W, H = 1280, 800
    base = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(base)

    # Sidebar (same minimal version)
    d.rectangle([0, 0, 230, H], fill=NAVY)
    grad = gradient_bg((230, 200), NAVY, NAVY_2)
    base.paste(grad, (0, 0))
    d = ImageDraw.Draw(base)
    rrect(d, [24, 24, 56, 56], 8, fill=ORANGE)
    d.text((34, 32), "A", font=f(16, True), fill=WHITE)
    d.text((66, 28), "Atlas Nexus", font=f(14, True), fill=WHITE)
    d.text((66, 46), "Tienda Demo", font=f(10), fill="#94A3B8")
    nav = [("Dashboard", False), ("Insights IA", False), ("Forecasting", True),
           ("Smart Receipt", False), ("Productos", False)]
    y = 130
    for label, active in nav:
        if active:
            rrect(d, [16, y - 8, 214, y + 22], 8, fill=ORANGE)
            icon_dot(d, (30, y + 7), 4, WHITE)
            d.text((44, y), label, font=f(12, True), fill=WHITE)
        else:
            icon_dot(d, (30, y + 7), 3, MUTED)
            d.text((44, y), label, font=f(12), fill="#CBD5E1")
        y += 38

    # Header
    d.text((258, 26), "Forecasting + Stock", font=f(22, True), fill=INK)
    d.text((258, 56), "Predicción semanal por producto · modelo XGBoost activo",
           font=f(12), fill=SLATE_2)

    # Model status banner
    bx, by, bw, bh = 258, 92, W - 290, 80
    base = shadow_card(base, [bx, by, bx + bw, by + bh])
    d = ImageDraw.Draw(base)
    g = gradient_bg((bw, bh), "#E0F2FE", "#F0F9FF")
    mask = Image.new("L", (bw, bh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, bw, bh], radius=14, fill=255)
    base.paste(g, (bx, by), mask)
    d = ImageDraw.Draw(base)
    rrect(d, [bx, by, bx + bw, by + bh], 14, outline="#BAE6FD", width=1)
    d.rectangle([bx, by, bx + 5, by + bh], fill=BLUE)
    d.ellipse([bx + 22, by + 22, bx + 58, by + 58], fill=BLUE)
    icon_check(d, (bx + 40, by + 40), 9, WHITE, width=3)
    d.text((bx + 70, by + 18), "Modelo XGBoost 2.1 · activo", font=f(13, True), fill=BLUE)
    d.text((bx + 70, by + 40),
           "Entrenado con 8 semanas de historia",
           font=f(11), fill=SLATE)
    # chips on the right
    chips = [("MAPE 11.4%", BLUE, "#DBEAFE"),
             ("R² 0.87", GREEN, GREEN_LIGHT),
             ("Próx. entrenamiento: 3d", AMBER, AMBER_LIGHT)]
    cx = bx + bw - 16
    for label, col, bg_c in reversed(chips):
        cw_chip = int(text_w(d, label, f(11, True)) + 24)
        rrect(d, [cx - cw_chip, by + 28, cx, by + 52], 12, fill=bg_c)
        d.text((cx - cw_chip + 12, by + 32), label, font=f(11, True), fill=col)
        cx -= cw_chip + 8

    # Section title
    d.text((258, 196), "Lista de compras priorizada — próxima semana",
           font=f(15, True), fill=INK)
    d.text((258, 218), "Ordenada por urgencia. Confianza calibrada según error histórico.",
           font=f(10), fill=SLATE_2)
    # filters chip
    rrect(d, [W - 250, 198, W - 30, 226], 14, fill=BG, outline=BORDER)
    d.text((W - 240, 204), "Filtros · Todas las categorías", font=f(11), fill=SLATE)

    # Cards table
    rows = [
        ("☕", "Café en grano premium", "12 kg",       "Alta",  GREEN,  GREEN_LIGHT,
         "Stock: 2.5 kg  ·  Cobertura: 1.5 días"),
        ("🥛", "Leche entera 1L",       "48 unidades", "Alta",  GREEN,  GREEN_LIGHT,
         "Stock: 12 u  ·  Cobertura: 2 días"),
        ("🥐", "Medialunas mix",         "240 unidades","Alta",  GREEN,  GREEN_LIGHT,
         "Velocidad: 34 u/día  ·  Stock: 60 u"),
        ("🧂", "Azúcar 5 kg",            "3 bolsas",    "Media", AMBER,  AMBER_LIGHT,
         "Cobertura actual: 6 días"),
        ("🧻", "Servilletas",            "2 paquetes",  "Media", AMBER,  AMBER_LIGHT,
         "Reposición preventiva"),
        ("🍫", "Brownie",                "—",           "Baja",  RED,    RED_LIGHT,
         "Sin movimiento últimos 7 días  ·  NO reponer"),
    ]
    y = 244
    rh = 64
    for icon, name, qty, conf, ccolor, cbg, sub in rows:
        base = shadow_card(base, [258, y, W - 30, y + rh])
        d = ImageDraw.Draw(base)
        rrect(d, [258, y, W - 30, y + rh], 12, fill=CARD, outline=BORDER)
        d.rectangle([258, y, 264, y + rh], fill=ccolor)
        # icon avatar
        rrect(d, [280, y + 14, 320, y + rh - 14], 10, fill=cbg)
        d.text((290, y + 22), icon, font=f(18), fill=ccolor)
        d.text((332, y + 12), name, font=f(13, True), fill=INK)
        d.text((332, y + 34), sub, font=f(10), fill=SLATE_2)
        d.text((W - 380, y + 22), qty, font=f(14, True), fill=INK)
        # confidence pill
        cp_w = 76
        rrect(d, [W - 232, y + 20, W - 232 + cp_w, y + 44], 11, fill=cbg)
        icon_dot(d, (W - 220, y + 32), 4, ccolor)
        d.text((W - 208, y + 25), conf, font=f(11, True), fill=ccolor)
        # CTA
        rrect(d, [W - 138, y + 20, W - 50, y + 44], 8, fill=NAVY)
        d.text((W - 124, y + 25), "Pedir →", font=f(11, True), fill=WHITE)
        y += rh + 10

    base.convert("RGB").save(OUT / "forecasting.png", "PNG", optimize=True)
    return base.convert("RGB")


# ─────────────────────────────────────────────────────────────
#  Smart Receipt micrositio  (450×900)
# ─────────────────────────────────────────────────────────────
def make_smart_receipt():
    W, H = 450, 900
    base = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(base)

    # Status bar
    d.rectangle([0, 0, W, 32], fill=WHITE)
    d.text((20, 9), "9:41", font=f(11, True), fill=INK)
    d.text((W - 80, 9), "100%  ●●●●", font=f(10), fill=INK)

    # Hero gradient
    g = gradient_bg((W, 240), NAVY, NAVY_2)
    base.paste(g, (0, 32))
    d = ImageDraw.Draw(base)
    # decorative circles
    d.ellipse([W - 80, -40, W + 80, 120], fill=ORANGE_DARK)
    d.ellipse([W - 40, -80, W + 40, 60], fill=ORANGE)

    d.text((24, 60), "¡Gracias por tu compra!", font=f(20, True), fill=WHITE)
    d.text((24, 92), "Tienda Demo  ·  24 may 2026", font=f(11), fill="#94A3B8")

    # Total card
    base = shadow_card(base, [24, 138, W - 24, 218])
    d = ImageDraw.Draw(base)
    g = gradient_bg((W - 48, 80), ORANGE, ORANGE_2)
    mask = Image.new("L", (W - 48, 80), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 48, 80], radius=14, fill=255)
    base.paste(g, (24, 138), mask)
    d = ImageDraw.Draw(base)
    d.text((40, 152), "Total pagado", font=f(11), fill=WHITE)
    d.text((40, 168), "$2.840,00", font=f(24, True), fill=WHITE)
    d.text((40, 198), "Tarjeta · Visa  •••• 4827", font=f(10), fill="#FFE4D0")
    d.text((W - 100, 152), "ID #4827", font=f(10), fill="#FFE4D0")
    # QR placeholder
    rrect(d, [W - 86, 174, W - 40, 220 - 0], 6, fill=WHITE)
    for r in range(7):
        for c in range(7):
            if (r * c + r + c) % 2 == 0:
                d.rectangle([W - 86 + 4 + c * 5, 174 + 4 + r * 5,
                             W - 86 + 8 + c * 5, 178 + 4 + r * 5], fill=NAVY)

    # Items section
    y = 252
    d.text((24, y), "Tu pedido", font=f(14, True), fill=INK)
    d.text((W - 86, y), "3 items", font=f(11), fill=MUTED)
    y += 28
    items = [
        ("☕", "Café americano", "2× $850", "$1.700"),
        ("🥐", "Medialuna", "1× $540", "$540"),
        ("🍫", "Brownie", "1× $600", "$600"),
    ]
    for icon, name, qty, price in items:
        rrect(d, [24, y, W - 24, y + 56], 10, fill=CARD, outline=BORDER)
        rrect(d, [36, y + 10, 76, y + 46], 10, fill=ORANGE_BG)
        d.text((46, y + 16), icon, font=f(20), fill=ORANGE_DARK)
        d.text((88, y + 14), name, font=f(12, True), fill=INK)
        d.text((88, y + 32), qty, font=f(10), fill=SLATE_2)
        d.text((W - 90, y + 22), price, font=f(13, True), fill=INK)
        y += 64

    # Review card
    y += 8
    base = shadow_card(base, [24, y, W - 24, y + 200])
    d = ImageDraw.Draw(base)
    g = gradient_bg((W - 48, 200), ORANGE_LIGHT, ORANGE_BG)
    mask = Image.new("L", (W - 48, 200), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 48, 200], radius=16, fill=255)
    base.paste(g, (24, y), mask)
    d = ImageDraw.Draw(base)
    rrect(d, [24, y, W - 24, y + 200], 16, outline=ORANGE_LIGHT, width=1)
    d.ellipse([40, y + 16, 80, y + 56], fill=ORANGE)
    icon_star(d, (60, y + 36), 11, WHITE)
    d.text((92, y + 22), "¿Cómo te fue?", font=f(15, True), fill=ORANGE_DARK)
    d.text((92, y + 42), "Dejá una reseña y desbloqueá", font=f(11), fill=INK)
    d.text((92, y + 58), "un 15% off para tu próxima visita.", font=f(11), fill=INK)
    # Stars
    sx = 40
    for i in range(5):
        col = ORANGE if i < 4 else WHITE
        outline = ORANGE_DARK if i < 4 else ORANGE
        rrect(d, [sx, y + 92, sx + 44, y + 136], 8, fill=col, outline=outline, width=2)
        icon_star(d, (sx + 22, y + 114), 11, WHITE if i < 4 else ORANGE)
        sx += 50
    # CTA
    rrect(d, [40, y + 152, W - 40, y + 188], 10, fill=NAVY)
    d.text((W // 2 - 38, y + 162), "Enviar reseña →", font=f(11, True), fill=WHITE)

    base.convert("RGB").save(OUT / "smart_receipt.png", "PNG", optimize=True)
    return base.convert("RGB")


# ─────────────────────────────────────────────────────────────
#  Briefing card  (1100×500)
# ─────────────────────────────────────────────────────────────
def make_briefing():
    W, H = 1100, 500
    base = Image.new("RGBA", (W, H), WHITE)
    d = ImageDraw.Draw(base)

    # Gradient backdrop strip
    g = gradient_bg((W, H), "#FFF4EB", "#FFFFFF")
    base.paste(g, (0, 0))
    d = ImageDraw.Draw(base)

    # Decorative blob
    d.ellipse([W - 200, -100, W + 80, 180], fill=ORANGE_LIGHT)
    d.ellipse([W - 140, -60, W + 40, 120], fill=ORANGE_BG)

    # Card
    base = shadow_card(base, [40, 40, W - 40, H - 40], radius=20, blur=22,
                       opacity=24)
    d = ImageDraw.Draw(base)
    rrect(d, [40, 40, W - 40, H - 40], 20, fill=WHITE, outline=BORDER)
    # top accent strip
    rrect(d, [40, 40, W - 40, 48], 20, fill=ORANGE)
    d.rectangle([40, 44, W - 40, 60], fill=ORANGE)

    # Header row
    d.ellipse([72, 76, 142, 146], fill=ORANGE)
    icon_star(d, (107, 111), 18, WHITE)
    d.text((160, 80), "Briefing del día", font=f(22, True), fill=INK)
    d.text((160, 110), "24 may 2026  ·  generado a las 8:30 am",
           font=f(12), fill=SLATE_2)
    # Chips top right
    chips = [("Llama 3.3 70B", GREEN, GREEN_LIGHT),
             ("Latency 1.2s", BLUE, BLUE_LIGHT),
             ("Tokens 480", AMBER, AMBER_LIGHT)]
    cx = W - 60
    for label, col, bg_c in reversed(chips):
        cw_chip = int(text_w(d, label, f(11, True)) + 24)
        rrect(d, [cx - cw_chip, 90, cx, 116], 13, fill=bg_c)
        d.text((cx - cw_chip + 12, 95), label, font=f(11, True), fill=col)
        cx -= cw_chip + 10

    # Body lines
    lines = [
        ("📈", "Hoy llevás $48.300 de revenue — 23% por encima de tu promedio diario.", GREEN),
        ("⭐", "Café americano sigue siendo tu estrella (+34 unidades vs. semana previa).", ORANGE),
        ("⚠", "Detecté 8 clientes en riesgo de churn (no compran hace 14+ días).", AMBER),
        ("✅", "Acción sugerida: combo café + medialuna en franja 16–18h (valle detectado).", BLUE),
    ]
    y = 180
    for icon, txt, col in lines:
        # icon chip
        rrect(d, [80, y, 116, y + 36], 10, fill=ORANGE_BG)
        d.text((92, y + 6), icon, font=f(18), fill=col)
        d.text((130, y + 8), txt, font=f(14), fill=INK)
        y += 50

    base.convert("RGB").save(OUT / "briefing.png", "PNG", optimize=True)
    return base.convert("RGB")


# ─────────────────────────────────────────────────────────────
#  Hero banner (1500×500) — for cover area
# ─────────────────────────────────────────────────────────────
def make_hero_banner():
    W, H = 1500, 500
    base = Image.new("RGB", (W, H), NAVY)
    g = gradient_bg((W, H), NAVY, NAVY_2)
    base.paste(g, (0, 0))
    d = ImageDraw.Draw(base)
    # Decor circles
    d.ellipse([W - 320, -200, W + 80, 280], fill=ORANGE_DARK)
    d.ellipse([W - 200, -80, W + 40, 220], fill=ORANGE)
    d.ellipse([-100, H - 200, 180, H + 100], fill="#1E3253")
    # Atlas A logo
    rrect(d, [80, 80, 200, 200], 24, fill=ORANGE)
    d.text((118, 100), "A", font=f(80, True), fill=WHITE)
    d.text((240, 110), "Atlas Nexus", font=f(56, True), fill=WHITE)
    d.text((240, 180), "Inteligencia accionable para el merchant moderno",
           font=f(20), fill="#CBD5E1")
    # Floating chips
    chips = [("IA Conversacional", ORANGE),
             ("Forecasting ML", BLUE),
             ("Insights accionables", GREEN),
             ("Smart Receipt 2.0", PURPLE)]
    cx = 240
    cy = 280
    for label, col in chips:
        cw_chip = int(text_w(d, label, f(14, True)) + 36)
        rrect(d, [cx, cy, cx + cw_chip, cy + 36], 18,
              fill=WHITE)
        icon_dot(d, (cx + 16, cy + 18), 5, col)
        d.text((cx + 28, cy + 9), label, font=f(13, True), fill=NAVY)
        cx += cw_chip + 12

    base.save(OUT / "hero_banner.png", "PNG", optimize=True)
    return base


# ─────────────────────────────────────────────────────────────
#  Device frames
# ─────────────────────────────────────────────────────────────
def laptop_frame(screen_img, out_name):
    sw, sh = 1280, 800
    screen = screen_img.resize((sw, sh)) if screen_img.size != (sw, sh) else screen_img

    W, H = 1520, 1020
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Soft shadow
    sh_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh_layer)
    sd.rounded_rectangle([80, 80, W - 80, H - 200], radius=24,
                         fill=(0, 0, 0, 60))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(20))
    base = Image.alpha_composite(base, sh_layer)

    d = ImageDraw.Draw(base)
    # Lid (laptop body)
    bx0, by0, bx1, by1 = 60, 40, W - 60, H - 150
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=22, fill="#0F172A")
    # Inner bezel
    d.rounded_rectangle([bx0 + 16, by0 + 16, bx1 - 16, by1 - 16], radius=12, fill="#000000")
    # Camera dot
    d.ellipse([W // 2 - 4, by0 + 6, W // 2 + 4, by0 + 14], fill="#1F2937")
    # Paste screen
    inner_w = bx1 - bx0 - 32
    inner_h = by1 - by0 - 32
    target_w = inner_w - 8
    target_h = int(target_w * sh / sw)
    if target_h > inner_h - 8:
        target_h = inner_h - 8
        target_w = int(target_h * sw / sh)
    scaled = screen.resize((target_w, target_h))
    sx = bx0 + 16 + (inner_w - target_w) // 2
    sy = by0 + 16 + (inner_h - target_h) // 2
    # rounded mask
    mask = Image.new("L", (target_w, target_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, target_w, target_h], radius=6, fill=255)
    base.paste(scaled, (sx, sy), mask)
    # Bottom base
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([30, by1, W - 30, by1 + 32], radius=18, fill="#1E293B")
    d.rounded_rectangle([W // 2 - 80, by1, W // 2 + 80, by1 + 14], radius=8, fill="#0F172A")
    # Hinge dark line
    d.rectangle([bx0 + 30, by1 - 3, bx1 - 30, by1 + 3], fill="#0F172A")

    bg = Image.new("RGB", (W, H), WHITE)
    bg.paste(base, (0, 0), base)
    bg.save(OUT / out_name, "PNG", optimize=True)


def phone_frame(screen_img, out_name):
    sw, sh = 450, 900
    screen = screen_img.resize((sw, sh)) if screen_img.size != (sw, sh) else screen_img

    W, H = 580, 1040
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Shadow
    sh_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh_layer)
    sd.rounded_rectangle([40, 60, W - 40, H - 20], radius=60, fill=(11, 31, 58, 80))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(24))
    base = Image.alpha_composite(base, sh_layer)

    d = ImageDraw.Draw(base)
    # Phone body
    bx0, by0, bx1, by1 = 30, 30, W - 30, H - 30
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=58, fill="#1A1A1A")
    # Inner bezel
    d.rounded_rectangle([bx0 + 10, by0 + 10, bx1 - 10, by1 - 10], radius=50, fill="#000000")

    # Paste screen
    inner_w = bx1 - bx0 - 20
    inner_h = by1 - by0 - 20
    target_w = inner_w - 8
    target_h = int(target_w * sh / sw)
    if target_h > inner_h - 8:
        target_h = inner_h - 8
        target_w = int(target_h * sw / sh)
    scaled = screen.resize((target_w, target_h))
    sx = bx0 + 10 + (inner_w - target_w) // 2
    sy = by0 + 10 + (inner_h - target_h) // 2
    mask = Image.new("L", (target_w, target_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, target_w, target_h], radius=44, fill=255)
    base.paste(scaled, (sx, sy), mask)
    d = ImageDraw.Draw(base)
    # Dynamic island
    d.rounded_rectangle([W // 2 - 60, by0 + 18, W // 2 + 60, by0 + 46],
                        radius=14, fill="#000000")
    # Side buttons (subtle)
    d.rectangle([bx0 - 3, by0 + 140, bx0, by0 + 200], fill="#374151")
    d.rectangle([bx0 - 3, by0 + 220, bx0, by0 + 280], fill="#374151")
    d.rectangle([bx1, by0 + 160, bx1 + 3, by0 + 240], fill="#374151")

    bg = Image.new("RGB", (W, H), WHITE)
    bg.paste(base, (0, 0), base)
    bg.save(OUT / out_name, "PNG", optimize=True)


def main():
    print("Generando mockups…")
    dash = make_dashboard();               print("  ✓ dashboard.png")
    chat = make_chat_ia();                 print("  ✓ chat_ia.png")
    fc = make_forecasting();               print("  ✓ forecasting.png")
    rcpt = make_smart_receipt();           print("  ✓ smart_receipt.png")
    make_briefing();                       print("  ✓ briefing.png")
    make_hero_banner();                    print("  ✓ hero_banner.png")

    print("Componiendo frames de dispositivo…")
    laptop_frame(dash, "laptop_dashboard.png");   print("  ✓ laptop_dashboard.png")
    laptop_frame(fc, "laptop_forecasting.png");   print("  ✓ laptop_forecasting.png")
    phone_frame(chat, "phone_chat.png");          print("  ✓ phone_chat.png")
    phone_frame(rcpt, "phone_receipt.png");       print("  ✓ phone_receipt.png")

    print(f"\nMockups guardados en: {OUT}")


if __name__ == "__main__":
    main()
