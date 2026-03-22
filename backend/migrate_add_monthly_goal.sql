-- Migración incremental para BD existente
-- Ejecutar solo si ya tenés datos y no querés hacer reset

-- 1. Tabla businesses (si no existe)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Migrar usuarios existentes: crear business por cada user con store_name
INSERT INTO businesses (id, store_name, created_at)
SELECT gen_random_uuid(), store_name, created_at
FROM users
WHERE NOT EXISTS (SELECT 1 FROM businesses LIMIT 1)
  AND store_name IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Agregar columnas nuevas a users (si no existen)
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'admin';
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_goal NUMERIC(12, 2);

-- 4. Agregar customer_email a sales (si no existe)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- 5. Agregar business_id y clover_order_id a sales (si no existen)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS clover_order_id VARCHAR(255) UNIQUE;

-- 6. Agregar business_id a products (si no existe)
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_id UUID;

-- 7. Agregar business_id a categories (si no existe)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS business_id UUID;

-- ⚠️  Si la BD es nueva (Docker reset), ignorar este archivo.
-- Base.metadata.create_all() crea todo automáticamente al levantar el backend.
