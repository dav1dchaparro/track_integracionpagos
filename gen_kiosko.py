#!/usr/bin/env python3
"""Genera ventas_kiosko_demo.csv — data sintética anual para demo de analytics."""
import csv
import random
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta

random.seed(42)

# ============================================================
# CATÁLOGO (deduplicado: el spec lista repetidos con misma data)
# ============================================================
_CATALOG_RAW = [
    ("Oreo",              "Snacks",    "Galletitas",       110, 200),
    ("Terrabusi",         "Snacks",    "Galletitas",       130, 240),
    ("Lays",              "Snacks",    "Papas fritas",     140, 270),
    ("Doritos",           "Snacks",    "Papas fritas",     150, 290),
    ("Topline",           "Golosinas", "Chicles",           50, 120),
    ("Beldent",           "Golosinas", "Chicles",           60, 130),
    ("Billiken",          "Golosinas", "Caramelos",         40, 100),
    ("Arcor",             "Golosinas", "Chocolates",        60, 130),
    ("Felfort",           "Golosinas", "Chocolates",        70, 150),
    ("Milka",             "Golosinas", "Chocolates",       250, 450),
    ("Jorgito",           "Golosinas", "Alfajores",         90, 180),
    ("Coca-Cola",         "Bebidas",   "Gaseosas",         130, 250),
    ("Sprite",            "Bebidas",   "Gaseosas",         130, 250),
    ("Fanta",             "Bebidas",   "Gaseosas",         130, 250),
    ("Pepsi",             "Bebidas",   "Gaseosas",         120, 230),
    ("7-Up",              "Bebidas",   "Gaseosas",         120, 230),
    ("Mirinda",           "Bebidas",   "Gaseosas",         120, 230),
    ("Red Bull",          "Bebidas",   "Energizantes",     150, 270),
    ("Speed",             "Bebidas",   "Energizantes",     120, 220),
    ("Eco de los Andes",  "Bebidas",   "Aguas",             90, 160),
    ("Pindapoy",          "Bebidas",   "Jugos",            100, 180),
    ("Quilmes",           "Bebidas",   "Cervezas",         160, 300),
    ("Corona",            "Bebidas",   "Cervezas",         180, 330),
    ("Stella Artois",     "Bebidas",   "Cervezas",         200, 360),
    ("Heineken",          "Bebidas",   "Cervezas",         190, 350),
    ("Brahma",            "Bebidas",   "Cervezas",         140, 270),
    ("Milkaut",           "Lácteos",   "Yogures",          250, 450),
    ("Pancho",            "Comidas",   "Comida caliente",  350, 700),
    ("Marlboro",          "Otros",     "Cigarrillos",      400, 750),
    ("Jabón Dove",        "Otros",     "Higiene personal", 120, 220),
    ("Bic",               "Otros",     "Librería",          60, 120),
]
CATALOG = {n: (cat, sub, cost, price) for n, cat, sub, cost, price in _CATALOG_RAW}
PRODUCTS = list(CATALOG.keys())

# Popularidad base (kiosco AR realista)
BASE_POP = {
    "Oreo": 4.0,  "Terrabusi": 2.0, "Lays": 4.0, "Doritos": 5.0,
    "Topline": 3.0, "Beldent": 3.0, "Billiken": 2.5, "Arcor": 2.0,
    "Felfort": 2.0, "Milka": 2.0, "Jorgito": 3.5,
    "Coca-Cola": 10.0, "Sprite": 5.0, "Fanta": 5.0, "Pepsi": 4.0,
    "7-Up": 2.5, "Mirinda": 2.5, "Red Bull": 3.0, "Speed": 3.0,
    "Eco de los Andes": 3.0, "Pindapoy": 2.0,
    "Quilmes": 6.0, "Corona": 3.0, "Stella Artois": 3.0,
    "Heineken": 3.0, "Brahma": 4.0,
    "Milkaut": 2.0, "Pancho": 6.0, "Marlboro": 7.0,
    "Jabón Dove": 0.5, "Bic": 0.8,
}

# ============================================================
# COMBOS (anchor -> partner, prob de co-ocurrencia)
# ============================================================
COMBOS = [
    ("Pancho",        "Coca-Cola", 0.60),
    ("Pancho",        "Pepsi",     0.40),
    ("Quilmes",       "Doritos",   0.55),
    ("Stella Artois", "Lays",      0.50),
    ("Heineken",      "Doritos",   0.45),
    ("Doritos",       "Coca-Cola", 0.45),  # combo "cena/picada"
    ("Marlboro",      "Speed",     0.40),
    ("Marlboro",      "Red Bull",  0.30),
    ("Jorgito",       "Milkaut",   0.35),
    ("Oreo",          "Coca-Cola", 0.30),
    ("Billiken",      "Topline",   0.25),
    ("Beldent",       "Marlboro",  0.20),
]
COMBO_LOOKUP = defaultdict(list)
for a, b, p in COMBOS:
    COMBO_LOOKUP[a].append((b, p))

# ============================================================
# CURVAS HORARIAS
# ============================================================
# Pesos para sampleo de hora del día (kiosco con tráfico 24h pero pico noche)
HOUR_WEIGHTS = [
    5.5, 5.0, 4.0, 3.0, 3.0, 3.5, 4.5,   # 0-6 madrugada
    5.0, 7.0, 6.0,                        # 7-9 mañana
    4.5, 5.5,                             # 10-11
    9.0, 10.0, 7.0,                       # 12-14 almuerzo
    5.0, 6.0,                             # 15-16
    9.0, 10.0, 9.0,                       # 17-19 merienda
    11.0, 12.0, 11.0, 8.0,                # 20-23 noche (pico)
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
        if sub == "Alfajores": return 2.0
        if sub == "Galletitas": return 1.6
        if sub == "Gaseosas": return 1.4
        if sub == "Aguas": return 1.6
        if sub == "Jugos": return 2.0
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
        if sub == "Gaseosas": return 1.7
        if sub == "Galletitas": return 1.4
        return 1.0
    if 20 <= hour <= 23:
        if sub == "Cervezas": return 3.0
        if sub == "Papas fritas": return 2.0
        if sub == "Galletitas": return 1.4
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
        elif sub == "Gaseosas": b *= 1.5
        elif sub == "Aguas":    b *= 1.4
        elif name in ("Milka", "Felfort"): b *= 0.7
    if month in (6, 7, 8):    # invierno
        if sub == "Cervezas": b *= 0.6
        if name in ("Milka", "Felfort", "Arcor"): b *= 1.4
        if sub == "Alfajores": b *= 1.2
        if name == "Milkaut":  b *= 1.2
    if month in (9, 10, 11):  # primavera progresiva
        if sub in ("Cervezas", "Gaseosas", "Aguas"):
            b *= 1.0 + (month - 8) * 0.07
    if month == 12:
        if name in ("Stella Artois", "Heineken"): b *= 1.8
    return b

def global_day_factor(month):
    if month == 12: return 1.25
    if month == 2:  return 0.85
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
    # 50% 1, 30% 2, 15% 3, 5% 4-5
    r = random.random()
    if r < 0.50: return 1
    if r < 0.80: return 2
    if r < 0.95: return 3
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
    items, used = [], set()
    first = sample_product(hour, month, used)
    if first is None:
        return items
    items.append(first); used.add(first)
    # Si arranca con un anchor de combo fuerte y la canasta es de 1, suele
    # subir a 2 (comprar pancho/cerveza solo es raro: lleva acompañamiento)
    if size == 1 and first in COMBO_LOOKUP and random.random() < 0.60:
        size = 2
    while len(items) < size:
        combo_fired = False
        # Iterar items en orden de inserción y disparar el primer combo viable
        for current in list(items):
            partners = COMBO_LOOKUP.get(current, [])
            for partner, prob in partners:
                if partner not in used and random.random() < prob:
                    items.append(partner); used.add(partner)
                    combo_fired = True
                    break
            if combo_fired:
                break
        if not combo_fired:
            nxt = sample_product(hour, month, used)
            if nxt is None:
                break
            items.append(nxt); used.add(nxt)
    return [(p, sample_quantity()) for p in items]

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
        return pm, ct, cb
    return pm, "", ""

# ============================================================
# GENERACIÓN
# ============================================================
TODAY = date.today()
START = TODAY - timedelta(days=365)

sales = []
inv = 100000
d = START
while d <= TODAY:
    base = random.randint(80, 150)
    n_sales = int(round(base * weekday_factor(d.weekday()) * global_day_factor(d.month)))
    for _ in range(n_sales):
        hour = sample_hour()
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        items = generate_basket(sample_basket_size(), hour, d.month)
        if not items:
            continue
        total = sum(CATALOG[p][3] * q for p, q in items)
        pm, ct, cb = sample_payment(total)
        sales.append({
            "invoice_number": inv,
            "fecha": d.isoformat(),
            "hora": f"{hour:02d}:{minute:02d}:{second:02d}",
            "items": items,
            "metodo_pago": pm,
            "card_type": ct,
            "card_brand": cb,
            "customer_email": "",
        })
        inv += 1
    d += timedelta(days=1)

# ============================================================
# ASIGNAR CLIENTES RECURRENTES
# ============================================================
ALL_EMAILS = [f"cliente{i:03d}@demo.com" for i in range(1, 151)]
VIP        = ALL_EMAILS[:20]
FREQUENT   = ALL_EMAILS[20:70]
OCCASIONAL = ALL_EMAILS[70:150]

CERVEZA_CIGAR = {n for n, (_, sub, _, _) in CATALOG.items()
                 if sub in ("Cervezas", "Cigarrillos")}

unassigned = set(range(len(sales)))
vip_pool = [i for i in unassigned
            if any(p in CERVEZA_CIGAR for p, _ in sales[i]["items"])]

for email in VIP:
    n = min(random.randint(50, 100), len(vip_pool))
    chosen = random.sample(vip_pool, n) if n > 0 else []
    for idx in chosen:
        sales[idx]["customer_email"] = email
        unassigned.discard(idx)
    vip_pool = [i for i in vip_pool if i in unassigned]

for email in FREQUENT:
    n = min(random.randint(10, 30), len(unassigned))
    chosen = random.sample(list(unassigned), n) if n > 0 else []
    for idx in chosen:
        sales[idx]["customer_email"] = email
        unassigned.discard(idx)

for email in OCCASIONAL:
    n = min(random.randint(2, 8), len(unassigned))
    chosen = random.sample(list(unassigned), n) if n > 0 else []
    for idx in chosen:
        sales[idx]["customer_email"] = email
        unassigned.discard(idx)

# ============================================================
# ESCRIBIR CSV
# ============================================================
OUT = "ventas_kiosko_demo.csv"
COLS = ["invoice_number", "fecha", "hora", "producto", "cantidad",
        "precio_unitario", "metodo_pago", "categoria", "subcategoria",
        "costo_unitario", "card_type", "card_brand", "customer_email"]

with open(OUT, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(COLS)
    for s in sales:
        for prod, qty in s["items"]:
            cat, sub, cost, price = CATALOG[prod]
            w.writerow([
                s["invoice_number"], s["fecha"], s["hora"],
                prod, qty, price, s["metodo_pago"],
                cat, sub, cost,
                s["card_type"], s["card_brand"], s["customer_email"],
            ])

# ============================================================
# VALIDACIÓN
# ============================================================
with open(OUT, encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

unique_inv = {r["invoice_number"] for r in rows}
print(f"Total filas: {len(rows)}")
print(f"Ventas únicas (invoice_number): {len(unique_inv)}")
print(f"Promedio items por venta: {len(rows)/len(unique_inv):.2f}")

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

# Top 10 productos por unidades
qty_by_prod = Counter()
for r in rows:
    qty_by_prod[r["producto"]] += int(r["cantidad"])
print("\nTop 10 productos por unidades vendidas:")
for p, q in qty_by_prod.most_common(10):
    print(f"  {p:20s}: {q}")

# Consistencia precio / costo
price_sets = defaultdict(set); cost_sets = defaultdict(set)
for r in rows:
    price_sets[r["producto"]].add(r["precio_unitario"])
    cost_sets[r["producto"]].add(r["costo_unitario"])
inc_price = sum(1 for v in price_sets.values() if len(v) > 1)
inc_cost  = sum(1 for v in cost_sets.values() if len(v) > 1)
print(f"\nProductos con precio inconsistente: {inc_price}")
print(f"Productos con costo inconsistente: {inc_cost}")

# Card sin brand
card_no_brand = sum(1 for r in rows
                    if r["metodo_pago"] == "card" and not r["card_brand"])
print(f"Ventas con metodo_pago=card sin card_brand: {card_no_brand}")

# Lifts
baskets = defaultdict(set)
for r in rows:
    baskets[r["invoice_number"]].add(r["producto"])
N = len(baskets)

def lift(a, b):
    pa = sum(1 for s in baskets.values() if a in s) / N
    pb = sum(1 for s in baskets.values() if b in s) / N
    pab = sum(1 for s in baskets.values() if a in s and b in s) / N
    return pab / (pa * pb) if pa * pb > 0 else 0.0

print(f"Lift Pancho+Coca-Cola: {lift('Pancho', 'Coca-Cola'):.2f}")
print(f"Lift Quilmes+Doritos: {lift('Quilmes', 'Doritos'):.2f}")

# Extra: cobertura de email (informativo)
emails_present = sum(1 for r in rows if r["customer_email"])
inv_with_email = len({r["invoice_number"] for r in rows if r["customer_email"]})
print(f"\nVentas con customer_email: {inv_with_email} ({inv_with_email/total_inv*100:.1f}%)")
