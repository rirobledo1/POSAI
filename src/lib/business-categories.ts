// Categorías predeterminadas por tipo de empresa

export const CATEGORIES_BY_BUSINESS_TYPE = {
  FERRETERIA: [
    { name: "Herramientas Manuales", description: "Martillos, destornilladores, llaves, alicates y herramientas básicas de mano" },
    { name: "Herramientas Eléctricas", description: "Taladros, sierras eléctricas, amoladoras, lijadoras y herramientas con motor" },
    { name: "Ferretería General", description: "Tornillos, tuercas, clavos, pernos, arandelas y elementos de fijación" },
    { name: "Fontanería", description: "Tuberías, conexiones, llaves de paso, grifos y accesorios para instalaciones sanitarias" },
    { name: "Electricidad", description: "Cables, interruptores, enchufes, bombillas y material eléctrico" },
    { name: "Pintura y Acabados", description: "Pinturas, brochas, rodillos, masillas y productos para acabado de superficies" },
    { name: "Construcción", description: "Cemento, arena, grava, ladrillos y materiales para construcción" },
    { name: "Jardinería", description: "Herramientas de jardín, mangueras, aspersores y productos para el cuidado del jardín" },
    { name: "Seguridad Industrial", description: "Cascos, guantes, gafas de protección, arneses y equipo de seguridad laboral" },
    { name: "Cerrajería", description: "Cerraduras, llaves, candados, bisagras y herrajes para puertas y ventanas" },
    { name: "Soldadura", description: "Electrodos, máscaras, soplete, varillas y equipos de soldadura" },
    { name: "Medición", description: "Metros, niveles, escuadras, calibradores y instrumentos de medición" }
  ],

  ABARROTES: [
    { name: "Lácteos", description: "Leche, quesos, yogurt, crema y productos derivados de la leche" },
    { name: "Carnes y Embutidos", description: "Carnes frescas, jamón, salchichas, chorizo y productos cárnicos" },
    { name: "Frutas y Verduras", description: "Productos frescos, frutas de temporada y vegetales" },
    { name: "Panadería", description: "Pan fresco, pasteles, galletas y productos de panadería" },
    { name: "Enlatados y Conservas", description: "Productos enlatados, conservas, alimentos no perecederos" },
    { name: "Bebidas", description: "Refrescos, jugos, agua, bebidas alcohólicas y no alcohólicas" },
    { name: "Limpieza", description: "Detergentes, jabones, desinfectantes y productos de limpieza" },
    { name: "Higiene Personal", description: "Champú, jabón de baño, pasta dental, desodorantes" },
    { name: "Snacks y Dulces", description: "Botanas, chocolates, caramelos y golosinas" },
    { name: "Productos Básicos", description: "Arroz, frijol, azúcar, sal, aceite y productos de primera necesidad" }
  ],

  PAPELERIA: [
    { name: "Útiles Escolares", description: "Cuadernos, lápices, plumas, borradores y material escolar básico" },
    { name: "Oficina", description: "Papel, folders, clips, grapas y artículos de oficina" },
    { name: "Arte y Manualidades", description: "Colores, pinceles, cartulinas, pegamento y materiales creativos" },
    { name: "Tecnología", description: "Calculadoras, USB, baterías y accesorios tecnológicos básicos" },
    { name: "Libros y Revistas", description: "Material de lectura, libros educativos y entretenimiento" },
    { name: "Impresión", description: "Servicios de copiado, impresión y encuadernación" },
    { name: "Organización", description: "Archiveros, cajas, etiquetas y productos organizacionales" },
    { name: "Papelería Fina", description: "Invitaciones, tarjetas, papel especial y productos elegantes" }
  ],

  FARMACIA: [
    { name: "Medicamentos", description: "Medicamentos de patente, genéricos y productos farmacéuticos" },
    { name: "Cuidado Personal", description: "Productos de higiene, belleza y cuidado corporal" },
    { name: "Vitaminas y Suplementos", description: "Vitaminas, minerales y suplementos alimenticios" },
    { name: "Primeros Auxilios", description: "Vendas, alcohol, gasas y material de curación" },
    { name: "Bebé y Maternidad", description: "Productos para bebés, mamás y cuidado infantil" },
    { name: "Equipos Médicos", description: "Termómetros, tensiómetros y equipos de medición" },
    { name: "Ortopedia", description: "Fajas, plantillas, bastones y productos ortopédicos" },
    { name: "Dermatología", description: "Cremas, protectores solares y productos para la piel" }
  ],

  RESTAURANTE: [
    { name: "Carnes", description: "Res, cerdo, pollo, pescado y mariscos" },
    { name: "Vegetales", description: "Verduras frescas, hierbas y vegetales de temporada" },
    { name: "Lácteos y Huevos", description: "Leche, quesos, mantequilla, crema y huevos" },
    { name: "Granos y Cereales", description: "Arroz, pasta, pan, harinas y cereales" },
    { name: "Bebidas", description: "Refrescos, jugos, agua, café, té y bebidas alcohólicas" },
    { name: "Condimentos", description: "Especias, salsas, aceites, vinagres y sazonadores" },
    { name: "Postres", description: "Ingredientes para postres, helados y dulces" },
    { name: "Desechables", description: "Platos, vasos, servilletas y utensilios desechables" }
  ],

  ROPA: [
    { name: "Ropa Masculina", description: "Camisas, pantalones, trajes y ropa para hombre" },
    { name: "Ropa Femenina", description: "Blusas, vestidos, faldas y ropa para mujer" },
    { name: "Ropa Infantil", description: "Ropa para niños y bebés de todas las edades" },
    { name: "Calzado", description: "Zapatos, tenis, sandalias y calzado en general" },
    { name: "Accesorios", description: "Bolsas, cinturones, sombreros y accesorios de moda" },
    { name: "Ropa Interior", description: "Ropa íntima para hombre, mujer y niños" },
    { name: "Deportiva", description: "Ropa y calzado deportivo, ropa para ejercicio" },
    { name: "Formal", description: "Ropa elegante, trajes, vestidos de gala" }
  ],

  ELECTRONICA: [
    { name: "Celulares y Accesorios", description: "Teléfonos móviles, fundas, cargadores y accesorios" },
    { name: "Computadoras", description: "Laptops, PCs, tablets y accesorios informáticos" },
    { name: "Audio y Video", description: "Audífonos, bocinas, televisores y equipos de sonido" },
    { name: "Gaming", description: "Consolas, videojuegos y accesorios para gamers" },
    { name: "Componentes", description: "Cables, conectores, baterías y componentes electrónicos" },
    { name: "Electrodomésticos", description: "Aparatos para el hogar, cocina y limpieza" },
    { name: "Fotografía", description: "Cámaras, lentes, trípodes y equipo fotográfico" },
    { name: "Reparaciones", description: "Servicios y refacciones para reparación de equipos" }
  ],

  AUTOMOTRIZ: [
    { name: "Motor", description: "Aceites, filtros, bujías y refacciones del motor" },
    { name: "Frenos", description: "Balatas, discos, líquido de frenos y sistema de frenado" },
    { name: "Suspensión", description: "Amortiguadores, resortes y componentes de suspensión" },
    { name: "Eléctrico", description: "Baterías, alternadores, luces y sistema eléctrico" },
    { name: "Llantas", description: "Neumáticos, rines y accesorios para ruedas" },
    { name: "Accesorios", description: "Tapetes, fundas, espejos y accesorios decorativos" },
    { name: "Herramientas", description: "Llaves, gatos, herramientas mecánicas especializadas" },
    { name: "Carrocería", description: "Pintura, masilla, faros y partes de la carrocería" }
  ],

  BELLEZA: [
    { name: "Maquillaje", description: "Base, labiales, sombras, rímel y productos de maquillaje" },
    { name: "Cuidado Facial", description: "Cremas, limpiadores, mascarillas y productos faciales" },
    { name: "Cabello", description: "Champús, acondicionadores, tintes y productos capilares" },
    { name: "Perfumería", description: "Perfumes, colonias y fragancias" },
    { name: "Uñas", description: "Esmaltes, lima, removedor y productos para manicure" },
    { name: "Cuidado Corporal", description: "Cremas, lociones, jabones y productos corporales" },
    { name: "Herramientas", description: "Brochas, esponjas, rizadores y herramientas de belleza" },
    { name: "Productos Naturales", description: "Cosméticos orgánicos y productos naturales" }
  ],

  DEPORTES: [
    { name: "Fitness", description: "Pesas, bandas, colchonetas y equipo para ejercicio" },
    { name: "Fútbol", description: "Balones, uniformes, tachones y equipo de fútbol" },
    { name: "Basketball", description: "Balones, uniformes, tenis y equipo de basquetbol" },
    { name: "Natación", description: "Trajes de baño, goggles, gorros y accesorios acuáticos" },
    { name: "Running", description: "Tenis para correr, ropa deportiva y accesorios de running" },
    { name: "Ciclismo", description: "Bicicletas, cascos, accesorios y refacciones" },
    { name: "Deportes de Raqueta", description: "Raquetas, pelotas y equipo para tenis, ping pong" },
    { name: "Suplementos", description: "Proteínas, vitaminas y suplementos deportivos" }
  ],

  JUGUETERIA: [
    { name: "Primera Infancia", description: "Juguetes para bebés de 0-2 años" },
    { name: "Preescolar", description: "Juguetes educativos para niños de 3-5 años" },
    { name: "Escolar", description: "Juguetes y juegos para niños de 6-12 años" },
    { name: "Electrónicos", description: "Videojuegos, tablets infantiles y juguetes tech" },
    { name: "Construcción", description: "Legos, bloques y juguetes de construcción" },
    { name: "Muñecas y Figuras", description: "Muñecas, figuras de acción y accesorios" },
    { name: "Vehículos", description: "Carritos, aviones, trenes y vehículos de juguete" },
    { name: "Juegos de Mesa", description: "Juegos familiares, rompecabezas y entretenimiento" }
  ],

  LIBRERIA: [
    { name: "Literatura", description: "Novelas, cuentos, poesía y literatura clásica" },
    { name: "Educativos", description: "Libros de texto, guías de estudio y material académico" },
    { name: "Infantiles", description: "Cuentos, libros ilustrados y literatura infantil" },
    { name: "Técnicos", description: "Manuales, libros especializados y textos técnicos" },
    { name: "Autoayuda", description: "Desarrollo personal, motivación y crecimiento" },
    { name: "Historia y Biografías", description: "Libros históricos, biografías y documentales" },
    { name: "Revistas", description: "Publicaciones periódicas, revistas especializadas" },
    { name: "Material Didáctico", description: "Mapas, láminas, material educativo complementario" }
  ],

  GENERAL: [
    { name: "Productos Básicos", description: "Artículos de uso general y primera necesidad" },
    { name: "Electrónicos", description: "Dispositivos electrónicos y accesorios básicos" },
    { name: "Hogar", description: "Artículos para el hogar y decoración" },
    { name: "Cuidado Personal", description: "Productos de higiene y cuidado personal" },
    { name: "Alimentos", description: "Productos alimenticios y bebidas" },
    { name: "Ropa y Accesorios", description: "Vestimenta y accesorios básicos" },
    { name: "Herramientas", description: "Herramientas básicas y artículos de ferretería" },
    { name: "Servicios", description: "Servicios diversos y productos especializados" }
  ]
};

export function getCategoriesForBusinessType(businessType: string) {
  return CATEGORIES_BY_BUSINESS_TYPE[businessType as keyof typeof CATEGORIES_BY_BUSINESS_TYPE] || CATEGORIES_BY_BUSINESS_TYPE.GENERAL;
}

export function generateCSVForBusinessType(businessType: string): string {
  const categories = getCategoriesForBusinessType(businessType);
  
  const header = 'name,description,active';
  const rows = categories.map(cat => 
    `"${cat.name}","${cat.description}",true`
  );
  
  return [header, ...rows].join('\n');
}