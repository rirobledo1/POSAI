# 🧪 PRUEBAS API DE COTIZACIONES

## 📍 URL Base
```
http://localhost:3000
```

---

## 1️⃣ CREAR UNA COTIZACIÓN

### **Endpoint:**
```
POST /api/quotations
```

### **Headers:**
```json
{
  "Content-Type": "application/json"
}
```

### **Body (ejemplo):**
```json
{
  "customerId": "TU_CUSTOMER_ID_AQUI",
  "companyId": "TU_COMPANY_ID_AQUI",
  "branchId": "TU_BRANCH_ID_AQUI",
  "validDays": 15,
  "items": [
    {
      "productId": "TU_PRODUCT_ID_AQUI",
      "quantity": 5,
      "price": 250.00,
      "discount": 0
    },
    {
      "productId": "OTRO_PRODUCT_ID_AQUI",
      "quantity": 10,
      "price": 150.00,
      "discount": 10
    }
  ],
  "discountPercent": 5,
  "notes": "Cliente preferencial - Entrega en 3 días",
  "termsConditions": "Válido por 15 días. Precios sujetos a cambios sin previo aviso."
}
```

### **Respuesta Esperada (201):**
```json
{
  "success": true,
  "quotation": {
    "id": "clxxx...",
    "quotationNumber": "COT-2510-0001",
    "customerId": "...",
    "subtotal": "2350.00",
    "discount": "117.50",
    "tax": "356.80",
    "total": "2589.30",
    "status": "DRAFT",
    "validUntil": "2025-11-07T...",
    "items": [...]
  },
  "message": "Cotización COT-2510-0001 creada exitosamente"
}
```

---

## 2️⃣ LISTAR COTIZACIONES

### **Endpoint:**
```
GET /api/quotations?companyId=TU_COMPANY_ID&page=1&limit=10
```

### **Parámetros Query (opcionales):**
- `companyId` - ID de la empresa (requerido)
- `branchId` - Filtrar por sucursal
- `status` - Filtrar por estado (DRAFT, SENT, ACCEPTED, etc.)
- `customerId` - Filtrar por cliente
- `page` - Página actual (default: 1)
- `limit` - Registros por página (default: 10)

### **Respuesta Esperada (200):**
```json
{
  "quotations": [
    {
      "id": "...",
      "quotationNumber": "COT-2510-0001",
      "customer": {
        "id": "...",
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      "total": "2589.30",
      "status": "DRAFT",
      "validUntil": "2025-11-07T...",
      "createdAt": "2025-10-23T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 🔑 CÓMO OBTENER LOS IDs NECESARIOS

### **1. Obtener tu Company ID:**
```sql
-- En tu base de datos PostgreSQL
SELECT id, name FROM companies LIMIT 1;
```

### **2. Obtener un Customer ID:**
```sql
SELECT id, name FROM customers LIMIT 1;
```

### **3. Obtener un Branch ID:**
```sql
SELECT id, name FROM branches LIMIT 1;
```

### **4. Obtener Product IDs:**
```sql
SELECT id, name, price FROM products WHERE active = true LIMIT 5;
```

---

## 📋 CHECKLIST DE PRUEBA

- [ ] Ejecutar migración (`npx prisma migrate dev`)
- [ ] Generar cliente Prisma (`npx prisma generate`)
- [ ] Iniciar servidor (`npm run dev`)
- [ ] Obtener IDs de la base de datos
- [ ] Probar POST /api/quotations
- [ ] Verificar respuesta exitosa (201)
- [ ] Probar GET /api/quotations
- [ ] Verificar que aparece la cotización creada
- [ ] Ir a http://localhost:3000/cotizaciones
- [ ] Verificar que se muestra en la UI

---

## 🐛 ERRORES COMUNES

### Error 401: No autorizado
**Solución:** Asegúrate de estar logueado en el sistema

### Error 400: Datos inválidos
**Solución:** Verifica que los IDs existan en la base de datos

### Error 500: Error del servidor
**Solución:** Revisa la consola del servidor para ver el error específico

---

## 💡 HERRAMIENTAS RECOMENDADAS

1. **Thunder Client** (extensión de VS Code) - La más fácil
2. **Postman** - Más completa
3. **curl** (línea de comandos)
4. **REST Client** (extensión de VS Code)

---

## 🎯 PRÓXIMO PASO

Una vez que funcione la API, continuaremos con:
- ✅ Formulario de nueva cotización
- ✅ Vista de detalles
- ✅ Generación de PDF
- ✅ Envío por WhatsApp/Email
