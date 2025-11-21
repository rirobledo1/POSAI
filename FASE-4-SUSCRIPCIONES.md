# 🎯 FASE 4: Sistema de Suscripciones y Pagos

## 📋 Resumen
Sistema completo de suscripciones con planes configurables, pagos dummy y tracking de trial.

---

## 🚀 INSTALACIÓN RÁPIDA

### Opción 1: Script Automático (Recomendado)

```bash
setup-suscripciones.bat
```

Este script hace TODO automáticamente.

---

### Opción 2: Manual (Paso a Paso)

#### 1. Ejecutar SQL en Supabase

Ve a: https://supabase.com/dashboard/project/vvvyxcigzqifnxdpagag/sql/new

Ejecuta el contenido completo de: `crear-sistema-suscripciones.sql`

#### 2. Regenerar Prisma

```bash
# Limpiar cache
Remove-Item -Recurse -Force .next

# Regenerar
npx prisma generate
```

#### 3. Reiniciar servidor

```bash
npm run dev
```

---

## 📊 Estructura Creada

### Tablas Nuevas:

1. **`subscription_plans`** - Configuración de planes
   - Editable solo por super admin
   - Precios mensuales y anuales
   - Límites y características
   - 3 planes pre-configurados

2. **`payment_history`** - Historial de pagos
   - Tracking de todas las transacciones
   - Método de pago (dummy por ahora)
   - Estados: pending, completed, failed, refunded

### Tablas Actualizadas:

3. **`subscriptions`** - Añadido:
   - `billing_period` (monthly/annual)
   - `trial_ends_at` (fecha de fin de trial)

---

## 💰 Planes Configurados

| Plan | Mensual | Anual | Ahorro | Sucursales | Usuarios |
|------|---------|-------|--------|------------|----------|
| **FREE** | $0 | $0 | - | 1 | 3 |
| **PRO** | $399 | $3,999 | $788 (16%) | 5 | 10 |
| **ENTERPRISE** | $1,299 | $12,999 | $2,589 (16%) | ∞ | ∞ |

**Nota:** Los precios son 100% configurables desde el panel de administración.

---

## 🎨 Componentes a Crear (Siguiente Paso)

### 1. Panel de Planes (`/settings/subscription`)
- Comparación visual de planes
- Toggle mensual/anual
- Badge "Más Popular"
- Badge "Plan Actual"
- Botón "Actualizar Plan"

### 2. Modal de Checkout
- Resumen del plan seleccionado
- Formulario de tarjeta (dummy)
- Total a pagar
- Confirmación

### 3. Banner de Trial
- Mostrar días restantes
- Alert cuando queden < 7 días
- Link a upgrade

### 4. Panel de Admin de Precios (Super Admin Only)
- Editar precios de cada plan
- Activar/desactivar planes
- Configurar límites
- Ver historial de cambios

---

## 🔐 Control de Acceso

### Usuarios Normales:
- ✅ Ver planes disponibles
- ✅ Actualizar su propia suscripción
- ✅ Ver historial de pagos
- ❌ NO pueden editar precios

### Super Admin (Tu usuario):
- ✅ Todo lo anterior +
- ✅ Editar precios de planes
- ✅ Configurar límites
- ✅ Ver todas las suscripciones
- ✅ Ver métricas de ingresos

---

## 📝 Próximos Pasos

Una vez ejecutado el script:

### 1. Verificar BD

```sql
-- Ver planes creados
SELECT plan_code, plan_name, monthly_price, annual_price 
FROM subscription_plans 
ORDER BY display_order;

-- Ver trial de El Tornillo
SELECT 
  c.name,
  s.plan_type,
  s.billing_period,
  s.trial_ends_at,
  EXTRACT(DAY FROM (s.trial_ends_at - NOW())) as dias_restantes
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
WHERE c.name = 'Ferretería El Tornillo';
```

### 2. Crear Componentes UI

Te voy a crear:
- ✅ `/components/subscriptions/PlanCard.tsx`
- ✅ `/components/subscriptions/PlansComparison.tsx`
- ✅ `/components/subscriptions/CheckoutModal.tsx`
- ✅ `/components/subscriptions/PaymentForm.tsx`
- ✅ `/components/subscriptions/TrialBanner.tsx`
- ✅ `/components/admin/PlansAdminPanel.tsx`

### 3. Crear APIs

Te voy a crear:
- ✅ `GET /api/subscriptions/plans` - Listar planes
- ✅ `POST /api/subscriptions/upgrade` - Cambiar plan
- ✅ `POST /api/subscriptions/payment` - Procesar pago (dummy)
- ✅ `GET /api/subscriptions/status` - Estado actual
- ✅ `GET /api/admin/plans` - Administrar planes (super admin)
- ✅ `PUT /api/admin/plans/:id` - Editar plan (super admin)

---

## 🎯 Características del Sistema

### Trial Management
- ✅ 30 días de prueba para plan FREE
- ✅ Contador de días restantes
- ✅ Alertas antes de expirar
- ✅ Degradación automática al expirar

### Billing Flexibility
- ✅ Pago mensual o anual
- ✅ 16% de descuento en pago anual
- ✅ Cambio de plan en cualquier momento
- ✅ Prorrateo (futuro con Stripe)

### Admin Features
- ✅ Editar precios sin tocar código
- ✅ Activar/desactivar planes
- ✅ Configurar características
- ✅ Ver métricas de suscripciones

---

## 🐛 Troubleshooting

### Error al crear tablas
```bash
# Verificar que Docker esté corriendo
docker ps

# Verificar conexión a BD
psql "postgresql://..." -c "SELECT 1"
```

### Error en Prisma
```bash
# Limpiar todo y regenerar
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.prisma
npx prisma generate
```

### No aparecen los planes
```sql
-- Verificar en Supabase
SELECT * FROM subscription_plans;

-- Si está vacío, re-ejecutar el INSERT del script
```

---

## ✅ Checklist de Instalación

- [ ] Script ejecutado exitosamente
- [ ] Tablas creadas en Supabase
- [ ] 3 planes visibles en `subscription_plans`
- [ ] Prisma regenerado sin errores
- [ ] Servidor reiniciado
- [ ] No hay errores en la consola

---

¿Todo listo? Ejecuta el script y avísame para continuar con la UI! 🚀
