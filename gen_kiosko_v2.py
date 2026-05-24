#!/usr/bin/env python3
"""
gen_kiosko_v2.py — Genera data sintética anual de un kiosco argentino para demo.

Produce 2 archivos en el cwd:
  - ventas_kiosko_demo.csv  : líneas de venta (extiende v1 con card_category + clover_order_id)
  - stock_inicial.csv       : stock inicial por producto (para llenar product_stock)

Mejoras vs v1:
  - Catálogo unitario expandido: ~52 productos en 8 categorías padre + ~20 subcategorías
  - Sin combos predefinidos: cada producto se compra de forma independiente
  - Llena card_category y clover_order_id (antes NULL)
  - Cobertura de customer_email subida a ~30% (antes 5%)
  - Stock inicial por producto generado
  - Mínimo 30 ventas/día garantizado
"""
import csv
import random
import uuid
from collections import Counter, defaultdict
from datetime import date, timedelta

random.seed(42)

# ============================================================
# CATÁLOGO UNITARIO
# (nombre, categoría, subcategoría, costo, precio)
# ============================================================
_CATALOG_RAW = [
    # Snacks
    ("Oreo",              "Snacks",     "Galletitas",       110, 200),
    ("Pepitos",           "Snacks",     "Galletitas",        80, 180),
    ("Terrabusi",         "Snacks",     "Galletitas",       130, 240),
    ("Bagley Sonrisas",   "Snacks",     "Galletitas",       100, 200),
    ("Toddy",             "Snacks",     "Galletitas",        90, 190),
    ("Lays",              "Snacks",     "Papas fritas",     140, 270),
    ("Doritos",           "Snacks",     "Papas fritas",     150, 290),
    ("Maní Pelado",       "Snacks",     "Frutos secos",      60, 130),

    # Bebidas (no alcohólicas)
    ("Coca-Cola",         "Bebidas",    "Gaseosas",         130, 250),
    ("Sprite",            "Bebidas",    "Gaseosas",         130, 250),
    ("Fanta",             "Bebidas",    "Gaseosas",         130, 250),
    ("Pepsi",             "Bebidas",    "Gaseosas",         120, 230),
    ("7-Up",              "Bebidas",    "Gaseosas",         120, 230),
    ("Mirinda",           "Bebidas",    "Gaseosas",         120, 230),
    ("Paso de los Toros", "Bebidas",    "Gaseosas",         140, 270),
    ("Manaos",            "Bebidas",    "Gaseosas",          80, 160),
    ("Pritty",            "Bebidas",    "Gaseosas",          90, 180),
    ("Red Bull",          "Bebidas",    "Energizantes",     150, 270),
    ("Speed",             "Bebidas",    "Energizantes",     120, 220),
    ("Eco de los Andes",  "Bebidas",    "Aguas",             90, 160),
    ("Villavicencio",     "Bebidas",    "Aguas",            100, 180),
    ("Pindapoy",          "Bebidas",    "Jugos",            100, 180),
    ("Cepita",            "Bebidas",    "Jugos",            150, 270),

    # Bebidas alcohólicas
    ("Quilmes",           "Alcohol",    "Cervezas",         160, 300),
    ("Corona",            "Alcohol",    "Cervezas",         180, 330),
    ("Stella Artois",     "Alcohol",    "Cervezas",         200, 360),
    ("Heineken",          "Alcohol",    "Cervezas",         190, 350),
    ("Brahma",            "Alcohol",    "Cervezas",         140, 270),
    ("Vino Termidor",     "Alcohol",    "Vinos",            600, 1200),

    # Golosinas
    ("Topline",           "Golosinas",  "Chicles",           50, 120),
    ("Beldent",           "Golosinas",  "Chicles",           60, 130),
    ("Bazooka",           "Golosinas",  "Chicles",           40, 100),
    ("Billiken",          "Golosinas",  "Caramelos",         40, 100),
    ("Halls",             "Golosinas",  "Caramelos",         80, 170),
    ("Sugus",             "Golosinas",  "Caramelos",         50, 110),
    ("Arcor",             "Golosinas",  "Chocolates",        60, 130),
    ("Felfort",           "Golosinas",  "Chocolates",        70, 150),
    ("Milka",             "Golosinas",  "Chocolates",       250, 450),
    ("Block",             "Golosinas",  "Chocolates",        90, 180),
    ("Jorgito",           "Golosinas",  "Alfajores",         90, 180),
    ("Águila",            "Golosinas",  "Alfajores",        150, 300),
    ("Guaymallén",        "Golosinas",  "Alfajores",        100, 200),

    # Cigarrillos
    ("Marlboro",          "Cigarrillos", "Cigarrillos",     400, 750),
    ("Philip Morris",     "Cigarrillos", "Cigarrillos",     380, 720),
    ("Lucky Strike",      "Cigarrillos", "Cigarrillos",     380, 700),
    ("Camel",             "Cigarrillos", "Cigarrillos",     400, 750),

    # Lácteos
    ("Milkaut",           "Lácteos",    "Yogures",          250, 450),
    ("La Serenísima",     "Lácteos",    "Leches",           350, 600),

    # Comidas
    ("Pancho",            "Comidas",    "Comida caliente",  350, 700),

    # Otros
    ("Jabón Dove",        "Otros",      "Higiene personal", 120, 220),
    ("Bic",               "Otros",      "Librería",          60, 120),
    ("Curitas",           "Otros",      "Higiene personal",  80, 150),
]
CATALOG = {n: (cat, sub, cost, price) for n, cat, sub, cost, price in _CATALOG_RAW}
PRODUCTS = list(CATALOG.keys())

# Popularidad relativa (peso para sampling, 1-10)
BASE_POP = {
    # alto volumen
    "Coca-Cola": 10.0, "Marlboro": 8.0, "Quilmes": 7.0, "Pancho": 7.0,
    "Sprite": 6.0, "Doritos": 6.0, "Pepsi": 5.5,
    # medio
    "Fanta": 5.0, "Lays": 5.0, "Speed": 5.0, "Oreo": 5.0,
    "Red Bull": 4.5, "Pepitos": 4.5, "7-Up": 4.0, "Brahma": 4.5,
    "Topline": 4.0, "Beldent": 4.0, "Eco de los Andes": 4.0, "Milka": 4.0,
    "Felfort": 3.5, "Jorgito": 4.0, "Stella Artois": 3.5, "Heineken": 3.5,
    "Corona": 3.0, "Bagley Sonrisas": 3.5, "Toddy": 3.5,
    # medio-bajo
    "Terrabusi": 3.0, "Mirinda": 2.5, "Paso de los Toros": 3.5, "Manaos": 3.0,
    "Pritty": 2.5, "Pindapoy": 3.0, "Cepita": 3.0,
    "Bazooka": 2.5, "Halls": 3.5, "Sugus": 2.5, "Block": 2.5,
    "Billiken": 3.0, "Águila": 3.0, "Guaymallén": 3.0, "Arcor": 3.0,
    "Philip Morris": 4.0, "Lucky Strike": 3.5, "Camel": 3.0,
    "Maní Pelado": 2.0, "Villavicencio": 2.0,
    "Milkaut": 2.5, "La Serenísima": 2.5,
    "Vino Termidor": 1.5,
    # bajo (niche)
    "Jabón Dove": 0.8, "Bic": 1.0, "Curitas": 0.6,
}

# Stock inicial por producto = popularidad × 8 (≈ una semana de demanda)
INITIAL_STOCK = {name: max(5, int(round(BASE_POP[name] * 8))) for name in PRODUCTS}

# ============================================================
# PROVEEDORES POR CATEGORÍA
# ============================================================
SUPPLIERS = {
    "Bebidas":     ["Coca-Cola FEMSA", "Embotelladora Andina", "Distribuidora Central"],
    "Alcohol":     ["Cervecería Quilmes", "Brahma SA", "Distribuidora del Barrio"],
    "Snacks":      ["Pepsico Argentina", "Mondelez", "Bagley SA"],
    "Golosinas":   ["Arcor SA", "Felfort SA", "Mondelez"],
    "Cigarrillos": ["Massalin Particulares", "Nobleza Piccardo"],
    "Lácteos":     ["La Serenísima SA", "Milkaut SA"],
    "Comidas":     ["Frigorífico San Sebastián"],
    "Otros":       ["DCC Distribuidora", "Distribuidora del Barrio", "Mayorista 99"],
}

# ============================================================
# NOMBRES ARGENTINOS (para perfil de clientes)
# ============================================================
NAMES = [
    "Juan", "María", "Carlos", "Ana", "Pedro", "Laura", "Diego", "Sofía",
    "Martín", "Lucía", "Sebastián", "Valentina", "Tomás", "Camila", "Nicolás",
    "Florencia", "Mateo", "Agustina", "Lucas", "Catalina", "Joaquín", "Antonella",
    "Bruno", "Julieta", "Federico", "Micaela", "Gonzalo", "Carolina", "Franco",
    "Daniela", "Matías", "Rocío", "Ezequiel", "Mariana", "Maximiliano", "Romina",
    "Leandro", "Brenda", "Cristian", "Belén", "Damián", "Magalí", "Iván", "Solange",
    "Hernán", "Yamila", "Adrián", "Mailén", "Pablo", "Andrea",
]
LASTNAMES = [
    "García", "Rodríguez", "Fernández", "López", "Martínez", "González", "Pérez",
    "Sánchez", "Ramírez", "Torres", "Gómez", "Ruiz", "Díaz", "Hernández", "Muñoz",
    "Álvarez", "Romero", "Suárez", "Alonso", "Gutiérrez", "Navarro", "Domínguez",
    "Vargas", "Vega", "Silva", "Rojas", "Ortega", "Mendoza", "Reyes", "Castro",
    "Aguilar", "Cabrera", "Acosta", "Espinoza", "Cruz", "Salazar", "Méndez",
    "Núñez", "Vázquez", "Soto",
]

# ============================================================
# CURVAS HORARIAS (24h, pico noche)
# ============================================================
HOUR_WEIGHTS = [
    5.5, 5.0, 4.0, 3.0, 3.0, 3.5, 4.5,   # 0-6 madrugada
    5.0, 7.0, 6.0,                        # 7-9 mañana
    4.5, 5.5,                             # 10-11
    9.0, 10.0, 7.0,                       # 12-14 almuerzo
    5.0, 6.0,                             # 15-16
    9.0, 10.0, 9.0,                       # 17-19 merienda
    11.0, 12.0, 11.0, 8.0,                # 20-23 noche pico
]

def hour_boost(sub, hour):
    """Multiplicador de demanda por subcategoría según franja horaria."""
    if 0 <= hour <= 6:
        if sub == "Cigarrillos": return 3.0
        if sub == "Energizantes": return 3.0
        if sub == "Cervezas": return 1.5
        return 0.25
    if 7 <= hour <= 9:
        if sub == "Yogures": return 3.0
        if sub == "Leches": return 2.5
        if sub == "Alfajores": return 2.0
        if sub == "Galletitas": return 1.6
        if sub == "Aguas": return 1.6
        if sub == "Jugos": return 2.0
        if sub == "Gaseosas": return 1.4
        if sub == "Comida caliente": return 1.5
        return 0.9
    if 12 <= hour <= 14:
        if sub == "Comida caliente": return 4.0
        if sub == "Gaseosas": return 1.8
        if sub == "Cigarrillos": return 1.5
        if sub == "Papas fritas": return 1.4
        return 1.0
    if 17 <= hour <= 19:
        if sub == "Alfajores": return 2.0
        if sub == "Chocolates": return 2.0
        if sub == "Galletitas": return 1.4
        if sub == "Gaseosas": return 1.7
        return 1.0
    if 20 <= hour <= 23:
        if sub == "Cervezas": return 3.0
        if sub == "Vinos": return 2.0
        if sub == "Papas fritas": return 2.0
        if sub == "Cigarrillos": return 2.0
        if sub == "Energizantes": return 1.8
        return 0.9
    return 1.0

# ============================================================
# ESTACIONALIDAD (hemisferio sur)
# ============================================================
def seasonal_boost(name, sub, month):
    b = 1.0
    if month in (12, 1, 2):   # verano
        if sub == "Cervezas": b *= 1.6
        if sub == "Gaseosas": b *= 1.5
        if sub == "Aguas":    b *= 1.5
        if sub == "Vinos":    b *= 1.3
        if name in ("Milka", "Felfort", "Block"): b *= 0.7
    if month in (6, 7, 8):    # invierno
        if sub == "Cervezas": b *= 0.6
        if sub == "Leches":   b *= 1.3
        if name in ("Milka", "Felfort", "Arcor", "Block"): b *= 1.4
        if sub == "Alfajores": b *= 1.2
        if name == "Milkaut":  b *= 1.2
    if month in (9, 10, 11):
        if sub in ("Cervezas", "Gaseosas", "Aguas"):
            b *= 1.0 + (month - 8) * 0.07
    if month == 12:
        if name in ("Stella Artois", "Heineken", "Vino Termidor"): b *= 1.8
    return b

def global_day_factor(month):
    if month == 12: return 1.25  # fiestas
    if month == 2:  return 0.85  # vacaciones
    return 1.0

def weekday_factor(weekday):
    if weekday == 4: return 1.40  # viernes
    if weekday == 5: return 1.50  # sábado
    if weekday == 6: return 1.10  # domingo
    return 1.00

# ============================================================
# SAMPLERS
# ============================================================
def sample_hour():
    return random.choices(range(24), weights=HOUR_WEIGHTS, k=1)[0]

def sample_basket_size():
    # 60% 1, 25% 2, 12% 3, 3% 4-5 (mayor distribución a tickets chicos: cada
    # producto es independiente, sin combos forzados)
    r = random.random()
    if r < 0.60: return 1
    if r < 0.85: return 2
    if r < 0.97: return 3
    return random.choice([4, 5])

def sample_quantity():
    return random.choices([1, 2, 3], weights=[85, 12, 3], k=1)[0]

def product_weights(hour, month, exclude):
    names, weights = [], []
    for name in PRODUCTS:
        if name in exclude:
            continue
        _, sub, _, _ = CATALOG[name]
        w = BASE_POP[name] * hour_boost(sub, hour) * seasonal_boost(name, sub, month)
        if w > 0:
            names.append(name)
            weights.append(w)
    return names, weights

def sample_product(hour, month, exclude):
    names, weights = product_weights(hour, month, exclude)
    if not names:
        return None
    return random.choices(names, weights=weights, k=1)[0]

def generate_basket(size, hour, month):
    """Cada producto se elige independiente (sin combos)."""
    items, used = [], set()
    for _ in range(size):
        nxt = sample_product(hour, month, used)
        if nxt is None:
            break
        items.append(nxt)
        used.add(nxt)
    return [(p, sample_quantity()) for p in items]

# ============================================================
# PAGO
# ============================================================
def sample_payment(total):
    if total < 300:
        pm = random.choices(["cash", "card", "qr"], weights=[70, 20, 10], k=1)[0]
    elif total > 1000:
        pm = random.choices(["cash", "card", "qr"], weights=[20, 70, 10], k=1)[0]
    else:
        pm = random.choices(["cash", "card", "qr"], weights=[50, 40, 10], k=1)[0]
    if pm == "card":
        ct = random.choices(["credit", "debit"], weights=[60, 40], k=1)[0]
        cb = random.choices(["visa", "mastercard", "amex"], weights=[40, 35, 25], k=1)[0]
        # Tier de tarjeta — incluye los valores comunes del enum card_category
        cc = random.choices(
            ["classic", "gold", "platinum", "black", "signature", "world"],
            weights=[55, 25, 10, 5, 3, 2], k=1,
        )[0]
        return pm, ct, cb, cc
    return pm, "", "", ""

def sample_clover_order_id(inv, pm):
    """50% de las ventas con tarjeta vienen de Clover (simulado)."""
    if pm == "card" and random.random() < 0.50:
        return f"CLV-{inv:08d}-{uuid.uuid4().hex[:6]}"
    return ""

# ============================================================
# INFLACIÓN Y RESTOCKS
# ============================================================
def cost_inflation(d, start, days_total=365):
    """Factor multiplicativo de costo. 1.0 al inicio del año, ~1.5 al final."""
    elapsed = max(0, (d - start).days)
    return 1.0 + 0.5 * (elapsed / days_total)

def generate_customer_profiles(emails):
    """Para cada email genera (name, phone, birthday). Phone y birthday únicos."""
    used_phones = set()
    profiles = {}
    earliest = date(1960, 1, 1)
    latest = date(2008, 12, 31)
    span_days = (latest - earliest).days
    for email in emails:
        name = f"{random.choice(NAMES)} {random.choice(LASTNAMES)}"
        # Phone: +5491198XXXXXXX, unique
        while True:
            tail = random.randint(1_000_000, 9_999_999)
            phone = f"+541198{tail}"
            if phone not in used_phones:
                used_phones.add(phone)
                break
        birthday = earliest + timedelta(days=random.randint(0, span_days))
        profiles[email] = (name, phone, birthday.isoformat())
    return profiles

def simulate_restocks(sales_list, start_date, end_date):
    """Simula restocks basado en consumo real. Devuelve (events, stockout_prods, panic_prods)."""
    # Consumo diario por producto
    daily_sales = defaultdict(lambda: defaultdict(int))
    for s in sales_list:
        for prod, qty in s["items"]:
            daily_sales[prod][s["fecha"]] += qty

    # Anomalías
    stockout_products = random.sample(PRODUCTS, 3)
    panic_products = random.sample(PRODUCTS, 3)
    stockout_windows = {}
    for p in stockout_products:
        start_offset = random.randint(60, 270)
        duration = random.randint(5, 10)
        stockout_windows[p] = (start_offset, start_offset + duration)
    panic_date_offset = random.randint(330, 350)  # ~15-25 dic

    events = []
    for prod in PRODUCTS:
        initial = INITIAL_STOCK[prod]
        base_cost = CATALOG[prod][2]
        cat = CATALOG[prod][0]
        total_sold = sum(daily_sales[prod].values())
        weekly_avg = max(0.5, total_sold / 52)
        # Cadencia objetivo según velocidad: rápidos restockean seguido con poco,
        # lentos hacen pocas compras grandes (típico de mayorista para slow movers)
        if weekly_avg >= 50:     # muy rápido (Coca, Marlboro)
            restock_qty = int(weekly_avg * 1.5)   # 10 días
        elif weekly_avg >= 15:   # medio
            restock_qty = int(weekly_avg * 3)     # 3 semanas
        elif weekly_avg >= 3:    # lento
            restock_qty = max(20, int(weekly_avg * 8))  # 2 meses
        else:                    # muy lento (Curitas, Bic)
            restock_qty = max(15, int(weekly_avg * 12)) # 3 meses
        threshold = max(3, int(restock_qty * 0.20))
        stock = initial
        in_window = stockout_windows.get(prod)
        suppliers = SUPPLIERS.get(cat, ["Distribuidora del Barrio"])

        d = start_date
        day_offset = 0
        while d <= end_date:
            fecha_str = d.isoformat()
            stock -= daily_sales[prod].get(fecha_str, 0)
            in_stockout = in_window and in_window[0] <= day_offset <= in_window[1]

            # Panic restock (15-25 dic, pre-fiestas) — adicional al ciclo normal
            if prod in panic_products and day_offset == panic_date_offset:
                qty = restock_qty * 3
                cost = round(base_cost * cost_inflation(d, start_date), 2)
                events.append({
                    "producto": prod, "fecha": fecha_str,
                    "hora": f"{random.randint(8,18):02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d}",
                    "cantidad": qty, "costo_unitario": cost,
                    "supplier": random.choice(suppliers),
                    "notes": "Compra pre-fiestas",
                })
                stock += qty

            # Restock normal si stock bajo y no estamos en ventana de stockout
            if stock < threshold and not in_stockout:
                qty = restock_qty
                cost = round(base_cost * cost_inflation(d, start_date), 2)
                events.append({
                    "producto": prod, "fecha": fecha_str,
                    "hora": f"{random.randint(8,18):02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d}",
                    "cantidad": qty, "costo_unitario": cost,
                    "supplier": random.choice(suppliers),
                    "notes": "",
                })
                stock += qty

            d += timedelta(days=1)
            day_offset += 1
    return events, stockout_products, panic_products

# ============================================================
# GENERACIÓN
# ============================================================
TODAY = date.today()
START = TODAY - timedelta(days=365)
MIN_SALES_PER_DAY = 30  # piso garantizado

sales = []
inv = 100000
d = START
while d <= TODAY:
    base = random.randint(70, 140)
    n_sales = max(MIN_SALES_PER_DAY,
                  int(round(base * weekday_factor(d.weekday()) * global_day_factor(d.month))))
    for _ in range(n_sales):
        hour = sample_hour()
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        items = generate_basket(sample_basket_size(), hour, d.month)
        if not items:
            continue
        total = sum(CATALOG[p][3] * q for p, q in items)
        pm, ct, cb, cc = sample_payment(total)
        clv = sample_clover_order_id(inv, pm)
        sales.append({
            "invoice_number": inv,
            "fecha": d.isoformat(),
            "hora": f"{hour:02d}:{minute:02d}:{second:02d}",
            "items": items,
            "metodo_pago": pm,
            "card_type": ct,
            "card_brand": cb,
            "card_category": cc,
            "clover_order_id": clv,
            "customer_email": "",
        })
        inv += 1
    d += timedelta(days=1)

# ============================================================
# ASIGNAR CLIENTES RECURRENTES (~30% de ventas)
# ============================================================
ALL_EMAILS = [f"cliente{i:03d}@demo.com" for i in range(1, 351)]
VIP        = ALL_EMAILS[:30]         # 30 VIPs
FREQUENT   = ALL_EMAILS[30:130]      # 100 frecuentes
OCCASIONAL = ALL_EMAILS[130:350]     # 220 ocasionales

# VIPs concentran compras de cervezas/cigarrillos/vinos
HEAVY_SUBS = {"Cervezas", "Cigarrillos", "Vinos"}
HEAVY_PRODS = {n for n, (_, sub, _, _) in CATALOG.items() if sub in HEAVY_SUBS}

unassigned = set(range(len(sales)))
vip_pool = [i for i in unassigned
            if any(p in HEAVY_PRODS for p, _ in sales[i]["items"])]

for email in VIP:
    n = min(random.randint(80, 150), len(vip_pool))
    chosen = random.sample(vip_pool, n) if n > 0 else []
    for idx in chosen:
        sales[idx]["customer_email"] = email
        unassigned.discard(idx)
    vip_pool = [i for i in vip_pool if i in unassigned]

for email in FREQUENT:
    n = min(random.randint(20, 50), len(unassigned))
    chosen = random.sample(list(unassigned), n) if n > 0 else []
    for idx in chosen:
        sales[idx]["customer_email"] = email
        unassigned.discard(idx)

for email in OCCASIONAL:
    n = min(random.randint(3, 12), len(unassigned))
    chosen = random.sample(list(unassigned), n) if n > 0 else []
    for idx in chosen:
        sales[idx]["customer_email"] = email
        unassigned.discard(idx)

# ============================================================
# PERFILES DE CLIENTES
# ============================================================
# Solo generamos perfil para emails que efectivamente aparecen en al menos una venta
emails_in_use = sorted({s["customer_email"] for s in sales if s["customer_email"]})
CUSTOMER_PROFILES = generate_customer_profiles(emails_in_use)

# ============================================================
# SIMULACIÓN DE RESTOCKS (entradas de inventario)
# ============================================================
purchases, stockout_prods, panic_prods = simulate_restocks(sales, START, TODAY)

# ============================================================
# ESCRIBIR CSV DE VENTAS
# ============================================================
OUT_SALES = "ventas_kiosko_demo.csv"
COLS_SALES = [
    "invoice_number", "fecha", "hora", "producto", "cantidad",
    "precio_unitario", "metodo_pago", "categoria", "subcategoria",
    "costo_unitario", "card_type", "card_brand", "card_category",
    "clover_order_id", "customer_email",
]

with open(OUT_SALES, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(COLS_SALES)
    for s in sales:
        for prod, qty in s["items"]:
            cat, sub, cost, price = CATALOG[prod]
            w.writerow([
                s["invoice_number"], s["fecha"], s["hora"],
                prod, qty, price, s["metodo_pago"],
                cat, sub, cost,
                s["card_type"], s["card_brand"], s["card_category"],
                s["clover_order_id"], s["customer_email"],
            ])

# ============================================================
# ESCRIBIR CSV DE STOCK INICIAL
# ============================================================
OUT_STOCK = "stock_inicial.csv"
with open(OUT_STOCK, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["producto", "stock_inicial"])
    for name in PRODUCTS:
        w.writerow([name, INITIAL_STOCK[name]])

# ============================================================
# ESCRIBIR CSV DE CLIENTES
# ============================================================
OUT_CUSTOMERS = "clientes.csv"
with open(OUT_CUSTOMERS, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["email", "name", "phone", "birthday"])
    for email, (name, phone, bday) in CUSTOMER_PROFILES.items():
        w.writerow([email, name, phone, bday])

# ============================================================
# ESCRIBIR CSV DE COMPRAS AL PROVEEDOR
# ============================================================
OUT_PURCHASES = "compras_proveedor.csv"
with open(OUT_PURCHASES, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["producto", "fecha", "hora", "cantidad", "costo_unitario", "supplier", "notes"])
    for p in purchases:
        w.writerow([p["producto"], p["fecha"], p["hora"], p["cantidad"],
                    p["costo_unitario"], p["supplier"], p["notes"]])

# ============================================================
# VALIDACIÓN
# ============================================================
with open(OUT_SALES, encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

unique_inv = {r["invoice_number"] for r in rows}
print(f"=== {OUT_SALES} ===")
print(f"Total filas: {len(rows)}")
print(f"Ventas únicas (invoice_number): {len(unique_inv)}")
print(f"Promedio items por venta: {len(rows)/len(unique_inv):.2f}")
print(f"Productos en catálogo: {len(PRODUCTS)}")
print(f"Categorías padre distintas: {len({c for c, _, _, _ in CATALOG.values()})}")
print(f"Subcategorías distintas: {len({s for _, s, _, _ in CATALOG.values()})}")

# Ventas mínimas/máximas por día
by_day = Counter(r["fecha"] for r in rows)
sales_per_day = Counter()
for inv_n in unique_inv:
    fecha = next(r["fecha"] for r in rows if r["invoice_number"] == inv_n)
    sales_per_day[fecha] += 1
print(f"Ventas/día - min: {min(sales_per_day.values())}, "
      f"max: {max(sales_per_day.values())}, "
      f"avg: {sum(sales_per_day.values())/len(sales_per_day):.0f}")

# Distribución método de pago (por venta, no por fila)
pm_by_inv = {}
for r in rows:
    pm_by_inv[r["invoice_number"]] = r["metodo_pago"]
pm_counts = Counter(pm_by_inv.values())
total_inv = sum(pm_counts.values())
print("\nDistribución metodo_pago (por venta):")
for pm in ("cash", "card", "qr"):
    c = pm_counts.get(pm, 0)
    print(f"  {pm:5s}: {c:>6}  ({c/total_inv*100:.1f}%)")

# Card category distribution
cc_counts = Counter(r["card_category"] for r in rows if r["card_category"])
print(f"\ncard_category cubre {sum(cc_counts.values())} líneas de venta con tarjeta")
for cc, c in cc_counts.most_common():
    print(f"  {cc:10s}: {c}")

# Customer email coverage
inv_with_email = len({r["invoice_number"] for r in rows if r["customer_email"]})
print(f"\nVentas con customer_email: {inv_with_email} ({inv_with_email/total_inv*100:.1f}%)")
print(f"Clientes únicos: {len({r['customer_email'] for r in rows if r['customer_email']})}")

# Clover order id
inv_with_clv = len({r["invoice_number"] for r in rows if r["clover_order_id"]})
print(f"Ventas con clover_order_id: {inv_with_clv} ({inv_with_clv/total_inv*100:.1f}%)")

# Top 10 productos
qty_by_prod = Counter()
for r in rows:
    qty_by_prod[r["producto"]] += int(r["cantidad"])
print("\nTop 10 productos por unidades vendidas:")
for p, q in qty_by_prod.most_common(10):
    print(f"  {p:22s}: {q}")

# Consistencia
price_sets = defaultdict(set); cost_sets = defaultdict(set)
for r in rows:
    price_sets[r["producto"]].add(r["precio_unitario"])
    cost_sets[r["producto"]].add(r["costo_unitario"])
inc_price = sum(1 for v in price_sets.values() if len(v) > 1)
inc_cost  = sum(1 for v in cost_sets.values() if len(v) > 1)
print(f"\nVerificaciones:")
print(f"  Productos con precio inconsistente: {inc_price}")
print(f"  Productos con costo inconsistente:  {inc_cost}")
card_no_brand = sum(1 for r in rows if r["metodo_pago"] == "card" and not r["card_brand"])
print(f"  Card sin brand: {card_no_brand}")
card_no_cat = sum(1 for r in rows if r["metodo_pago"] == "card" and not r["card_category"])
print(f"  Card sin category: {card_no_cat}")

print(f"\n=== {OUT_STOCK} ===")
print(f"Productos con stock inicial: {len(PRODUCTS)}")
print(f"Stock total: {sum(INITIAL_STOCK.values())}")

print(f"\n=== {OUT_CUSTOMERS} ===")
print(f"Clientes con perfil: {len(CUSTOMER_PROFILES)}")
# Sanity check: todos los emails que aparecen en ventas tienen perfil
emails_in_sales = {r["customer_email"] for r in rows if r["customer_email"]}
missing = emails_in_sales - set(CUSTOMER_PROFILES.keys())
print(f"  Emails de ventas sin perfil: {len(missing)} (debe ser 0)")
# Telefonos únicos
phones = [p for _, p, _ in CUSTOMER_PROFILES.values()]
print(f"  Teléfonos únicos: {len(set(phones))} de {len(phones)}")

print(f"\n=== {OUT_PURCHASES} ===")
print(f"Total restocks: {len(purchases)}")
total_cantidad = sum(p["cantidad"] for p in purchases)
print(f"Unidades compradas: {total_cantidad}")
print(f"Suppliers únicos: {len({p['supplier'] for p in purchases})}")
print(f"Anomalías sembradas:")
print(f"  Productos con stockout window: {stockout_prods}")
print(f"  Productos con panic restock:   {panic_prods}")

# Cadencias por producto: días promedio entre compras
print(f"\nCadencia (días entre restocks):")
from datetime import date as _date
cadencia = []
for prod in PRODUCTS:
    dates_p = sorted([_date.fromisoformat(p["fecha"]) for p in purchases if p["producto"] == prod])
    if len(dates_p) >= 2:
        gaps = [(dates_p[i+1] - dates_p[i]).days for i in range(len(dates_p)-1)]
        cadencia.append((prod, len(dates_p), sum(gaps)/len(gaps)))
cadencia.sort(key=lambda x: x[2])
print(f"  Top 5 rápidos (menos días entre compras):")
for prod, n, avg in cadencia[:5]:
    print(f"    {prod:22s}: {n:>3} compras, cada {avg:.1f} días")
print(f"  Top 5 lentos:")
for prod, n, avg in cadencia[-5:]:
    print(f"    {prod:22s}: {n:>3} compras, cada {avg:.1f} días")

# Cost inflation check
coca_purchases = [p for p in purchases if p["producto"] == "Coca-Cola"]
if len(coca_purchases) >= 2:
    coca_purchases.sort(key=lambda p: p["fecha"])
    first_cost = coca_purchases[0]["costo_unitario"]
    last_cost = coca_purchases[-1]["costo_unitario"]
    change = (last_cost - first_cost) / first_cost * 100
    print(f"\nInflación Coca-Cola (primera vs última compra del año): "
          f"${first_cost} → ${last_cost} ({change:+.1f}%)")
