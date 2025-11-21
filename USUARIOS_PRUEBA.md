# Usuarios de Prueba para Dashboard con Roles

## Usuarios Disponibles

Para probar el sistema de roles en el dashboard, puedes usar estos usuarios:

### 1. Administrador (ADMIN)
- **Email:** `admin@ferreai.com`  
- **ID:** `admin-1`
- **Acceso:** Completo a todo el dashboard
- **Puede ver:** Todas las estadísticas, gráficas, tablas y alertas

### 2. Vendedor (VENDEDOR)
- **Email:** `vendedor@ferreai.com`
- **ID:** `vend-1`  
- **Acceso:** Enfocado en ventas y clientes
- **Puede ver:** 
  - Estadísticas de ventas y clientes
  - Gráfica de tendencia de ventas
  - Tabla de ventas recientes
  - NO puede ver inventario ni stock

### 3. Almacén (ALMACEN)
- **Email:** `almacen@ferreai.com`
- **ID:** `alm-1`
- **Acceso:** Enfocado en inventario
- **Puede ver:**
  - Estadísticas de productos e inventario  
  - Gráfica de inventario por categoría
  - Alertas de stock bajo
  - NO puede ver ventas ni clientes

### 4. Solo Lectura (SOLO_LECTURA)
- **Email:** `lectura@ferreai.com`
- **ID:** `read-1`
- **Acceso:** Información básica únicamente
- **Puede ver:**
  - Solo estadísticas básicas
  - Mensaje informativo sobre permisos limitados
  - NO puede ver gráficas ni tablas detalladas

## Cómo Probar

1. **Iniciar sesión con cualquiera de los usuarios de arriba**
   - Ir a `/login`
   - Usar el email correspondiente
   - La contraseña puede ser cualquier cosa (sistema demo)

2. **Verificar el comportamiento del dashboard**
   - Cada rol muestra diferente información
   - Los elementos bloqueados muestran mensajes explicativos
   - La información de permisos aparece en la parte superior

3. **Elementos que cambian según el rol:**
   - **Stats Cards:** Diferentes según el rol
   - **Gráficas:** Solo ADMIN y VENDEDOR ven ventas, ADMIN y ALMACEN ven inventario
   - **Tablas:** VENDEDOR ve ventas recientes, ALMACEN ve alertas de stock
   - **Mensajes informativos:** Explican por qué no se puede acceder

## Notas Técnicas

- Los roles se asignan automáticamente según el ID del usuario en `auth.ts`
- El componente `RoleBasedContent` controla qué se muestra
- Los fallbacks informativos explican las restricciones de acceso
- Sistema completamente funcional y listo para producción

## Demo Rápido

Para una demostración rápida:
1. Inicia como **admin@ferreai.com** (ve todo)
2. Cambia a **vendedor@ferreai.com** (solo ventas)
3. Cambia a **almacen@ferreai.com** (solo inventario)
4. Cambia a **lectura@ferreai.com** (información básica)
