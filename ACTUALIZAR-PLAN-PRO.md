# 🎯 Actualizar Plan a PRO - El Tornillo

## Opción 1: Usando el script .bat (Recomendado)

```bash
# Simplemente ejecuta:
actualizar-plan-pro.bat
```

## Opción 2: Directo en Supabase SQL Editor

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard
2. Abre el **SQL Editor**
3. Ejecuta esta consulta:

```sql
-- Actualizar a PRO
UPDATE subscriptions
SET 
  plan_type = 'PRO',
  max_branches = 5,
  max_users = 10,
  updated_at = NOW()
WHERE company_id = (
  SELECT id FROM companies WHERE name = 'Ferretería El Tornillo'
);

-- Verificar
SELECT 
  c.name as empresa,
  s.plan_type as plan,
  s.max_branches as max_sucursales,
  s.max_users as max_usuarios
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
WHERE c.name = 'Ferretería El Tornillo';
```

## Opción 3: Usando psql directo

```bash
psql "postgresql://postgres.vvvyxcigzqifnxdpagag:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f actualizar-plan-pro.sql
```

---

## 📋 Límites por Plan

### FREE
- Sucursales: 1
- Usuarios: 3
- Precio: $0/mes

### PRO
- Sucursales: 5
- Usuarios: 10
- Precio: $29/mes

### ENTERPRISE
- Sucursales: Ilimitadas
- Usuarios: Ilimitados
- Precio: $99/mes

---

## ✅ Después de actualizar

1. **Recarga la página** en el navegador (Ctrl + R o F5)
2. Verifica en **Settings → Gestión de Sucursales**
3. Deberías ver: **"Sucursales: 1 de 5"**
4. Ahora puedes crear hasta 4 sucursales más

---

## 🐛 Si no funciona

Verifica que la tabla `subscriptions` existe:

```sql
SELECT * FROM subscriptions LIMIT 5;
```

Si no existe, avísame para crear la tabla.
