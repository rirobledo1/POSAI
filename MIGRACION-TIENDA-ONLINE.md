# 🔧 Script para aplicar cambios de Tienda Online

## Paso 1: Generar migración de Prisma

```bash
cd C:\Users\HTIJ\Desktop\ferreai
npx prisma migrate dev --name add_online_store_features
```

Este comando:
- ✅ Crea la migración automáticamente basándose en los cambios del schema
- ✅ Aplica la migración a la base de datos
- ✅ Regenera el Prisma Client con los nuevos modelos

## Paso 2: Verificar que se aplicó correctamente

```bash
npx prisma studio
```

Deberías ver:
- ✅ Tabla `online_orders` con todos sus campos
- ✅ Enums `OrderType` y `OrderStatus`  
- ✅ Nuevos campos en la tabla `companies`:
  - online_store_enabled
  - online_store_url
  - allow_online_quotes
  - allow_online_sales
  - online_payment_enabled
  - stripe_publishable_key
  - stripe_secret_key
  - payment_mode

## Paso 3: (Opcional) Si hay error, resetear y volver a aplicar

Si encuentras algún error:

```bash
# Ver el estado actual
npx prisma migrate status

# Si hay problemas, puedes hacer rollback
npx prisma migrate reset

# Y volver a aplicar
npx prisma migrate dev --name add_online_store_features
```

## ⚠️ IMPORTANTE

**Antes de ejecutar:** Asegúrate de que tu servidor de desarrollo NO esté corriendo.
Detén `npm run dev` si está ejecutándose.

## 📋 Checklist

- [ ] Servidor de desarrollo detenido
- [ ] Ejecutar `npx prisma migrate dev --name add_online_store_features`
- [ ] Verificar que no haya errores
- [ ] Abrir Prisma Studio y verificar nuevas tablas/campos
- [ ] Reiniciar servidor de desarrollo

---

**Una vez completado, continuamos con la creación de las APIs 🚀**
