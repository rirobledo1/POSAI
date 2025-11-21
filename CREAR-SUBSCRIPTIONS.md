# 🎯 Crear Tabla Subscriptions y Actualizar a PRO

## 🚨 Problema Detectado
La tabla `subscriptions` no existe en la base de datos. Necesitamos crearla primero.

---

## 🚀 Opción 1: Script Automático (Recomendado)

```bash
# Ejecuta este comando:
crear-tabla-subscriptions.bat
```

Este script:
- ✅ Crea la tabla `subscriptions`
- ✅ Agrega índices para rendimiento
- ✅ Configura triggers automáticos
- ✅ Crea suscripción FREE para todas las empresas
- ✅ Actualiza "El Tornillo" a plan PRO

---

## 🚀 Opción 2: Directo en Supabase (Más Rápido)

1. Ve a: https://supabase.com/dashboard/project/vvvyxcigzqifnxdpagag/sql/new

2. Copia y pega este SQL completo:

```sql
-- Crear tabla subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'FREE' CHECK (plan_type IN ('FREE', 'PRO', 'ENTERPRISE')),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  max_branches INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Crear suscripciones para empresas existentes
INSERT INTO subscriptions (company_id, plan_type, max_branches, max_users, status)
SELECT id, 'FREE', 1, 3, 'active'
FROM companies
ON CONFLICT (company_id) DO NOTHING;

-- Actualizar El Tornillo a PRO
UPDATE subscriptions
SET 
  plan_type = 'PRO',
  max_branches = 5,
  max_users = 10,
  updated_at = NOW()
WHERE company_id = (SELECT id FROM companies WHERE name = 'Ferretería El Tornillo');

-- Verificar
SELECT 
  c.name as empresa,
  s.plan_type as plan,
  s.max_branches as sucursales,
  s.max_users as usuarios
FROM subscriptions s
JOIN companies c ON s.company_id = c.id;
```

3. Click en **"RUN"** ▶️

4. Recarga tu app (F5)

---

## 📋 Estructura de la Tabla

```
subscriptions
├── id (UUID, PK)
├── company_id (UUID, FK → companies) 🔗
├── plan_type (FREE/PRO/ENTERPRISE)
├── status (active/inactive/cancelled)
├── max_branches (límite de sucursales)
├── max_users (límite de usuarios)
├── created_at
└── updated_at (auto-actualiza)
```

---

## 📊 Límites por Plan

| Plan         | Sucursales | Usuarios | Precio  |
|--------------|-----------|----------|---------|
| **FREE**     | 1         | 3        | $0/mes  |
| **PRO**      | 5         | 10       | $29/mes |
| **ENTERPRISE** | ∞       | ∞        | $99/mes |

---

## ✅ Después de Ejecutar

1. **Recarga la página** (Ctrl + R o F5)
2. Ve a **Settings → Gestión de Sucursales**
3. Deberías ver: **"Sucursales: 1 de 5"** ✨
4. El badge mostrará **"Plan PRO"**
5. Podrás crear 4 sucursales más

---

## 🔍 Verificaciones

### Ver todas las suscripciones:
```sql
SELECT 
  c.name,
  s.plan_type,
  s.max_branches,
  s.max_users,
  s.status
FROM subscriptions s
JOIN companies c ON s.company_id = c.id;
```

### Ver sucursales actuales:
```sql
SELECT 
  c.name as empresa,
  COUNT(b.id) as total,
  s.max_branches as limite
FROM companies c
LEFT JOIN branches b ON c.id = b.company_id
LEFT JOIN subscriptions s ON c.id = s.company_id
GROUP BY c.name, s.max_branches;
```

---

## 🐛 Troubleshooting

### Error: "relation subscriptions already exists"
- ✅ Esto es normal, significa que ya se creó
- Ejecuta solo el UPDATE de El Tornillo

### No se ve el cambio en la UI
1. Verifica con SQL que el cambio existe
2. Haz hard refresh: `Ctrl + Shift + R`
3. Revisa la consola del navegador (F12)

### Error de permisos
- Asegúrate de usar el SQL Editor de Supabase
- Usuario debe ser `postgres` (owner)

---

## 📝 Notas Importantes

- ⚠️ Esta tabla es **ESENCIAL** para el sistema multi-tenant
- 🔄 Se auto-actualiza el campo `updated_at`
- 🔗 Tiene relación CASCADE con `companies`
- 🎯 Una empresa = Una suscripción (UNIQUE)

---

¿Todo listo? Ejecuta cualquiera de las 2 opciones y luego recarga tu app! 🚀
