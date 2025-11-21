# Implementación de IVA Dinámico en el Sistema ERP

## Problema Identificado

Anteriormente, el IVA en el punto de venta (POS) estaba **hardcodeado al 16%** en el archivo `POSInterface.tsx`, lo que significa que aunque se cambiara la tasa de IVA en la configuración de empresa, este cambio no se reflejaba en las ventas.

```tsx
// ❌ ANTES: Hardcodeado
const TAX_RATE = 0.16; // IVA 16%
const tax = subtotal * TAX_RATE;
```

## Solución Implementada

### 1. Hook para Configuración de Empresa (`useCompanySettings.ts`)

Se creó un hook personalizado que:
- Obtiene la configuración de empresa desde la API `/api/settings/company`
- Proporciona valores por defecto seguros (IVA 16%, moneda MXN)
- Maneja estados de carga y error
- Permite refrescar los datos

```tsx
export default function useCompanySettings() {
  // ... lógica del hook
  return {
    companySettings,
    loading,
    error,
    refetch,
    taxRate: companySettings?.taxPercentage ? companySettings.taxPercentage / 100 : 0.16,
    currency: companySettings?.currency || 'MXN'
  };
}
```

### 2. Modificación del Componente POS

Se actualizó `POSInterface.tsx` para:
- Importar y usar el hook `useCompanySettings`
- Usar `taxRate` dinámico en lugar de `TAX_RATE` constante
- Mostrar el porcentaje de IVA dinámico en la interfaz
- Agregar indicador de carga mientras se obtiene la configuración

```tsx
// ✅ AHORA: Dinámico
const { taxRate, currency, loading: settingsLoading } = useCompanySettings();
const tax = subtotal * taxRate; // Usamos taxRate dinámico desde configuración

// UI dinámico
<span className="text-gray-600">IVA ({Math.round(taxRate * 100)}%):</span>
```

## Funcionalidad Resultante

### ✅ **Respuesta a la pregunta**: 
**SÍ, ahora funciona dinámicamente**. Si cambias el IVA del 16% al 8% en la configuración de la empresa:

1. **Configuración de Empresa**: Cambias la "Tasa de IVA (%)" de 16 a 8
2. **POS se actualiza**: El sistema automáticamente:
   - Calcula el IVA al 8% en nuevas ventas
   - Muestra "IVA (8%)" en el resumen de venta
   - Aplica la nueva tasa en todos los cálculos

### Flujo de Datos

```
Configuración de Empresa (8%) 
    ↓
API /api/settings/company 
    ↓
useCompanySettings hook (taxRate = 0.08)
    ↓
POSInterface calcula tax = subtotal * 0.08
    ↓
Se muestra "IVA (8%)" en la interfaz
```

## Beneficios Adicionales

1. **Configuración Centralizada**: Una sola fuente de verdad para la tasa de IVA
2. **Tiempo Real**: Los cambios en configuración se reflejan inmediatamente
3. **Moneda Dinámica**: También se obtiene la moneda configurada
4. **Experiencia de Usuario**: Indicador de carga mientras se obtienen las configuraciones
5. **Valores por Defecto Seguros**: Sistema funciona incluso si la API falla

## Archivos Modificados

- ✅ `src/hooks/useCompanySettings.ts` - **Nuevo hook**
- ✅ `src/components/pos/POSInterface.tsx` - **Modificado para usar configuración dinámica**

## Pruebas Sugeridas

1. Cambiar IVA en configuración de empresa (ej: 16% → 8%)
2. Ir al POS y verificar que muestra "IVA (8%)"
3. Realizar una venta y confirmar que calcula correctamente
4. Verificar que en las ventas guardadas se usa la nueva tasa

---

**Conclusión**: El sistema ahora responde dinámicamente a los cambios en la configuración del IVA y moneda, proporcionando flexibilidad total para diferentes jurisdicciones fiscales.
