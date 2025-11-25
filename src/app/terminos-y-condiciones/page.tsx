import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata = {
  title: 'Términos y Condiciones | PosAI',
  description: 'Términos y condiciones de uso del sistema PosAI - Sistema de Punto de Venta y Gestión Empresarial'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/login" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio de sesión
          </Link>
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
              <p className="text-gray-600">PosAI - Sistema de Gestión Empresarial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12">
          <div className="prose prose-lg max-w-none">
            {/* Fecha de actualización */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8">
              <p className="text-sm text-gray-700 mb-0">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-600 mb-0 mt-1">
                Versión 1.0
              </p>
            </div>

            {/* Introducción */}
            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Bienvenido a <strong>POS AI</strong> (en adelante, "el Servicio"), un sistema de punto de venta 
                y gestión empresarial proporcionado por <strong>POS Solutions SA de CV</strong> (en adelante, 
                "la Empresa", "nosotros" o "nuestro").
              </p>
              <p className="text-gray-700 leading-relaxed">
                Al acceder o utilizar nuestro Servicio, usted (en adelante, "el Usuario" o "usted") acepta 
                estar sujeto a los presentes Términos y Condiciones. Si no está de acuerdo con estos términos, 
                le solicitamos que no utilice el Servicio.
              </p>
            </section>

            {/* 1. Definiciones */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Definiciones</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <ul className="space-y-3">
                  <li>
                    <strong className="text-gray-900">Servicio:</strong>
                    <span className="text-gray-700"> Plataforma web y móvil PosAI para gestión de punto de venta, inventario, clientes y operaciones comerciales.</span>
                  </li>
                  <li>
                    <strong className="text-gray-900">Usuario:</strong>
                    <span className="text-gray-700"> Persona física o moral que se registra y utiliza el Servicio.</span>
                  </li>
                  <li>
                    <strong className="text-gray-900">Cuenta:</strong>
                    <span className="text-gray-700"> Registro personal del Usuario que le permite acceder al Servicio.</span>
                  </li>
                  <li>
                    <strong className="text-gray-900">Plan:</strong>
                    <span className="text-gray-700"> Modalidad de suscripción (FREE, PRO, PRO PLUS, ENTERPRISE) con características y precios específicos.</span>
                  </li>
                  <li>
                    <strong className="text-gray-900">Datos del Usuario:</strong>
                    <span className="text-gray-700"> Información ingresada, almacenada o procesada por el Usuario a través del Servicio.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 2. Aceptación de Términos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Aceptación de Términos</h2>
              <p className="text-gray-700">
                Al crear una cuenta, acceder al Servicio o utilizarlo de cualquier manera, usted declara que:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Es mayor de edad (18 años o más) o cuenta con autorización parental/legal</li>
                <li>Tiene capacidad legal para celebrar contratos vinculantes</li>
                <li>Ha leído, comprendido y acepta estos Términos y Condiciones</li>
                <li>Acepta cumplir con todas las leyes y regulaciones aplicables en México</li>
              </ul>
            </section>

            {/* 3. Descripción del Servicio */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Descripción del Servicio</h2>
              <p className="text-gray-700 mb-4">
                PosAI es una plataforma de software como servicio (SaaS) que proporciona:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Funcionalidades Principales</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Sistema de punto de venta (POS)</li>
                    <li>• Gestión de inventario</li>
                    <li>• Control de clientes y proveedores</li>
                    <li>• Facturación y cotizaciones</li>
                    <li>• Reportes y estadísticas</li>
                    <li>• Gestión multi-sucursal</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Según tu Plan</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Usuarios ilimitados o limitados</li>
                    <li>• Productos ilimitados o limitados</li>
                    <li>• Sucursales según plan contratado</li>
                    <li>• Soporte técnico personalizado</li>
                    <li>• Integraciones adicionales</li>
                  </ul>
                </div>
              </div>
              <p className="text-gray-700 mt-4">
                Las características específicas dependen del Plan contratado. La Empresa se reserva el derecho 
                de modificar, suspender o discontinuar cualquier aspecto del Servicio en cualquier momento.
              </p>
            </section>

            {/* 4. Registro y Cuenta */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Registro y Cuenta de Usuario</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Creación de Cuenta</h3>
              <p className="text-gray-700 mb-4">
                Para utilizar el Servicio, debe crear una cuenta proporcionando información precisa, completa 
                y actualizada. Es responsabilidad del Usuario mantener la confidencialidad de sus credenciales 
                de acceso.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Responsabilidad de la Cuenta</h3>
              <p className="text-gray-700 mb-4">
                Usted es responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Mantener la seguridad de su contraseña y credenciales</li>
                <li>Todas las actividades realizadas bajo su cuenta</li>
                <li>Notificar inmediatamente cualquier uso no autorizado</li>
                <li>Asegurar que la información de su perfil sea precisa</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Suspensión de Cuenta</h3>
              <p className="text-gray-700">
                La Empresa puede suspender o terminar su cuenta si:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Viola estos Términos y Condiciones</li>
                <li>Proporciona información falsa o engañosa</li>
                <li>Participa en actividades fraudulentas o ilegales</li>
                <li>No realiza los pagos correspondientes</li>
                <li>Utiliza el Servicio de manera que dañe a otros usuarios o al sistema</li>
              </ul>
            </section>

            {/* 5. Planes y Pagos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Planes, Pagos y Facturación</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Planes Disponibles</h3>
              <p className="text-gray-700 mb-4">
                PosAI ofrece diferentes planes de suscripción:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <ul className="space-y-2 text-gray-700">
                  <li><strong>FREE:</strong> Plan gratuito con funcionalidades limitadas</li>
                  <li><strong>PRO:</strong> Plan de pago con características avanzadas</li>
                  <li><strong>PRO PLUS:</strong> Plan premium con todas las características</li>
                  <li><strong>ENTERPRISE:</strong> Plan empresarial personalizado</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Precios y Pagos</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Los precios se expresan en pesos mexicanos (MXN) más IVA</li>
                <li>Los pagos son mensuales o anuales según el plan seleccionado</li>
                <li>Los pagos anuales incluyen descuentos promocionales</li>
                <li>Los pagos se procesan de forma automática en la fecha de renovación</li>
                <li>Todas las transacciones son procesadas de forma segura</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Renovación y Cancelación</h3>
              <p className="text-gray-700">
                Las suscripciones se renuevan automáticamente a menos que se cancelen antes de la fecha de 
                renovación. Puede cancelar su suscripción en cualquier momento desde el panel de configuración.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
                <p className="text-sm text-gray-700 mb-0">
                  <strong>Importante:</strong> No se realizan reembolsos parciales por cancelaciones anticipadas. 
                  El servicio continuará disponible hasta el final del período de facturación pagado.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.4 Cambios de Precio</h3>
              <p className="text-gray-700">
                La Empresa se reserva el derecho de modificar los precios con un aviso previo de 30 días. 
                Los cambios no afectarán los períodos de facturación ya pagados.
              </p>
            </section>

            {/* 6. Uso Aceptable */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Uso Aceptable del Servicio</h2>
              <p className="text-gray-700 mb-4">
                Al utilizar PosAI, usted se compromete a:
              </p>
              
              <h3 className="text-lg font-semibold text-green-700 mb-2">✓ Usos Permitidos</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Utilizar el Servicio para sus operaciones comerciales legítimas</li>
                <li>Mantener la seguridad y confidencialidad de sus datos</li>
                <li>Cumplir con todas las leyes y regulaciones aplicables</li>
                <li>Respetar los derechos de propiedad intelectual</li>
              </ul>

              <h3 className="text-lg font-semibold text-red-700 mb-2">✗ Usos Prohibidos</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Realizar ingeniería inversa, descompilar o desensamblar el Servicio</li>
                <li>Usar el Servicio para actividades ilegales o fraudulentas</li>
                <li>Intentar acceder sin autorización a sistemas o redes</li>
                <li>Transmitir malware, virus o código malicioso</li>
                <li>Compartir su cuenta con terceros no autorizados</li>
                <li>Sobrecargar o interferir con el funcionamiento del Servicio</li>
                <li>Extraer datos mediante scraping u otros métodos automatizados</li>
                <li>Revender o sublicenciar el Servicio sin autorización</li>
              </ul>
            </section>

            {/* 7. Propiedad Intelectual */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propiedad Intelectual</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Derechos de la Empresa</h3>
              <p className="text-gray-700 mb-4">
                Todo el contenido del Servicio, incluyendo pero no limitado a software, diseño, textos, 
                gráficos, logos, iconos, imágenes, código fuente y compilado, es propiedad exclusiva de 
                POS Solutions SA de CV o sus licenciantes, y está protegido por las leyes de propiedad 
                intelectual de México y tratados internacionales.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Licencia de Uso</h3>
              <p className="text-gray-700 mb-4">
                La Empresa le otorga una licencia limitada, no exclusiva, no transferible y revocable para 
                acceder y utilizar el Servicio únicamente para sus propósitos comerciales internos, de acuerdo 
                con estos Términos.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Datos del Usuario</h3>
              <p className="text-gray-700">
                Usted conserva todos los derechos sobre los datos que ingresa en el Servicio. Al utilizar 
                PosAI, nos otorga una licencia para almacenar, procesar y transmitir sus datos únicamente 
                para proporcionar el Servicio.
              </p>
            </section>

            {/* 8. Privacidad y Protección de Datos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacidad y Protección de Datos</h2>
              <p className="text-gray-700 mb-4">
                La Empresa cumple con la Ley Federal de Protección de Datos Personales en Posesión de los 
                Particulares (LFPDPPP) de México.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Recopilación de Datos</h3>
              <p className="text-gray-700 mb-4">
                Recopilamos y procesamos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Información de registro (nombre, email, teléfono, RFC)</li>
                <li>Datos comerciales (productos, ventas, inventario, clientes)</li>
                <li>Información de pago (procesada por terceros seguros)</li>
                <li>Datos de uso y analítica del sistema</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Uso de Datos</h3>
              <p className="text-gray-700 mb-4">
                Sus datos se utilizan para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Proporcionar y mejorar el Servicio</li>
                <li>Procesar transacciones y facturación</li>
                <li>Enviar notificaciones y soporte técnico</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Análisis estadístico y mejora del producto</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Seguridad</h3>
              <p className="text-gray-700">
                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger sus datos 
                contra acceso no autorizado, pérdida o divulgación. Sin embargo, ningún sistema es 100% seguro 
                y no podemos garantizar la seguridad absoluta.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mt-4">
                <p className="text-sm text-gray-700 mb-0">
                  Para más información sobre cómo manejamos sus datos, consulte nuestro 
                  <strong> Aviso de Privacidad</strong> disponible en nuestro sitio web.
                </p>
              </div>
            </section>

            {/* 9. Respaldo y Recuperación de Datos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Respaldo y Recuperación de Datos</h2>
              <p className="text-gray-700 mb-4">
                La Empresa realiza respaldos periódicos de los datos del sistema. Sin embargo:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Es responsabilidad del Usuario mantener copias de seguridad propias</li>
                <li>La Empresa no garantiza la recuperación total de datos en caso de pérdida</li>
                <li>No somos responsables por pérdida de datos debido a acciones del Usuario</li>
                <li>Los respaldos se conservan según el plan contratado</li>
              </ul>
            </section>

            {/* 10. Disponibilidad del Servicio */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disponibilidad del Servicio</h2>
              <p className="text-gray-700 mb-4">
                Nos esforzamos por mantener el Servicio disponible 24/7, pero no podemos garantizar:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Disponibilidad ininterrumpida del Servicio</li>
                <li>Ausencia de errores o defectos</li>
                <li>Corrección de todos los problemas</li>
                <li>Compatibilidad con todo hardware o software</li>
              </ul>
              <p className="text-gray-700">
                Podemos suspender temporalmente el Servicio para mantenimiento, actualizaciones o reparaciones, 
                notificando con anticipación cuando sea posible.
              </p>
            </section>

            {/* 11. Limitación de Responsabilidad */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitación de Responsabilidad</h2>
              <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">IMPORTANTE - LEA CUIDADOSAMENTE</p>
                <p className="text-sm text-gray-700 mb-0">
                  El Servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo, 
                  expresas o implícitas.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.1 Exclusión de Garantías</h3>
              <p className="text-gray-700 mb-4">
                La Empresa no garantiza que:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>El Servicio cumplirá con todos sus requisitos</li>
                <li>El Servicio será ininterrumpido, oportuno, seguro o libre de errores</li>
                <li>Los resultados obtenidos serán precisos o confiables</li>
                <li>Todos los defectos serán corregidos</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.2 Límites de Responsabilidad</h3>
              <p className="text-gray-700 mb-4">
                En ningún caso la Empresa será responsable por:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Daños indirectos, incidentales, especiales o consecuentes</li>
                <li>Pérdida de beneficios, ingresos, datos o uso</li>
                <li>Interrupción del negocio</li>
                <li>Daños causados por terceros o eventos fuera de nuestro control</li>
                <li>Decisiones comerciales tomadas basándose en el Servicio</li>
              </ul>
              <p className="text-gray-700 mt-4">
                La responsabilidad total de la Empresa no excederá el monto pagado por el Usuario durante 
                los últimos 12 meses de servicio.
              </p>
            </section>

            {/* 12. Indemnización */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Indemnización</h2>
              <p className="text-gray-700">
                Usted acepta indemnizar y mantener indemne a la Empresa, sus directores, empleados y 
                representantes de cualquier reclamo, demanda, daño, pérdida o gasto (incluyendo honorarios 
                legales) que surja de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
                <li>Su uso del Servicio</li>
                <li>Violación de estos Términos</li>
                <li>Violación de derechos de terceros</li>
                <li>Uso indebido del Servicio por su parte o sus empleados</li>
              </ul>
            </section>

            {/* 13. Modificaciones */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Modificaciones a los Términos</h2>
              <p className="text-gray-700 mb-4">
                La Empresa se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios 
                se notificarán mediante:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Correo electrónico a la dirección registrada</li>
                <li>Notificación en el panel del sistema</li>
                <li>Actualización de la fecha en esta página</li>
              </ul>
              <p className="text-gray-700">
                El uso continuado del Servicio después de la notificación constituye la aceptación de los 
                nuevos términos. Si no está de acuerdo, debe cancelar su cuenta.
              </p>
            </section>

            {/* 14. Terminación */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Terminación del Servicio</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.1 Por el Usuario</h3>
              <p className="text-gray-700 mb-4">
                Puede cancelar su cuenta en cualquier momento desde el panel de configuración. Los datos 
                se conservarán durante 30 días después de la cancelación, luego serán eliminados permanentemente.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 Por la Empresa</h3>
              <p className="text-gray-700 mb-4">
                Podemos suspender o terminar su acceso si:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Viola estos Términos y Condiciones</li>
                <li>No realiza los pagos correspondientes</li>
                <li>Utiliza el Servicio de manera que cause daño</li>
                <li>Por razones legales o regulatorias</li>
              </ul>
            </section>

            {/* 15. Ley Aplicable y Jurisdicción */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Ley Aplicable y Jurisdicción</h2>
              <p className="text-gray-700 mb-4">
                Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos.
              </p>
              <p className="text-gray-700">
                Cualquier controversia derivada de estos Términos será resuelta ante los tribunales 
                competentes de Tijuana, Baja California, México, renunciando las partes a cualquier 
                otra jurisdicción que pudiera corresponderles.
              </p>
            </section>

            {/* 16. Disposiciones Generales */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Disposiciones Generales</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.1 Acuerdo Completo</h3>
              <p className="text-gray-700 mb-4">
                Estos Términos constituyen el acuerdo completo entre usted y la Empresa respecto al uso 
                del Servicio.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.2 Divisibilidad</h3>
              <p className="text-gray-700 mb-4">
                Si alguna disposición de estos Términos es declarada inválida, las demás disposiciones 
                permanecerán en pleno vigor.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.3 Renuncia</h3>
              <p className="text-gray-700 mb-4">
                La falta de ejercicio de cualquier derecho no constituye una renuncia al mismo.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">16.4 Cesión</h3>
              <p className="text-gray-700">
                No puede ceder estos Términos sin consentimiento previo escrito. La Empresa puede ceder 
                estos Términos sin restricción.
              </p>
            </section>

            {/* Contacto */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para preguntas, comentarios o preocupaciones sobre estos Términos y Condiciones, puede 
                contactarnos en:
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="font-semibold text-gray-900 mb-3">POS Solutions SA de CV</p>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Dirección:</strong> Tijuana, Baja California, México</li>
                  <li><strong>Email:</strong> soporte@posai.com</li>
                  <li><strong>Teléfono:</strong> +52 (664) XXX-XXXX</li>
                  <li><strong>Horario de atención:</strong> Lunes a Viernes, 9:00 - 18:00 hrs (Tiempo del Pacífico)</li>
                </ul>
              </div>
            </section>

            {/* Footer acknowledgment */}
            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600 text-center">
                Al utilizar POS AI, usted reconoce haber leído, comprendido y aceptado estos Términos y Condiciones.
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">
                © {new Date().getFullYear()} POS Solutions SA de CV. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>

        {/* Botón volver */}
        <div className="text-center mt-8">
          <Link href="/login">
            <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
