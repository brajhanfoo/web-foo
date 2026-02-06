export default function PrivacyPolicyPage() {
  return (
    <main className="bg-gray-950 text-gray-300 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Política de Privacidad
        </h1>

        <p className="text-sm text-gray-500 mb-10">
          Última actualización: 25/01/2026
        </p>

        {/* INTRO */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">1. Introducción</h2>
          <p>
            Esta Política de Privacidad describe cómo{' '}
            <strong>FOO TALENT GROUP E.I.R.L.</strong>, con R.U.C. N°
            10465272398, con domicilio en Av. 26 de julio 4272, en adelante la
            Empresa, recopila, utiliza, almacena y protege la información
            personal que usted proporciona al utilizar nuestra plataforma
            educativa Foo Talent Group (FTG), disponible en footalentgroup.com,
            así como cualquier servicio relacionado.
          </p>
          <p>
            Nos comprometemos a proteger su privacidad y a tratar sus datos
            personales de acuerdo con la Ley de Protección de Datos Personales
            del Perú (Ley N° 29733) y su Reglamento.
          </p>
        </section>

        {/* DATOS */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">
            2. Datos Personales que Recopilamos
          </h2>
          <p>
            Recopilamos la información que usted nos proporciona directamente:
          </p>

          <ul className="list-disc ml-6 space-y-3">
            <li>
              <strong>Datos de identificación y contacto:</strong> nombres y
              apellidos, documento de identidad, nacionalidad, fecha de
              nacimiento, correo electrónico, teléfono (incluido WhatsApp) y
              perfiles profesionales.
            </li>
            <li>
              <strong>Datos académicos y profesionales:</strong> historial
              educativo, experiencia laboral, habilidades, progreso y
              evaluaciones dentro de la plataforma.
            </li>
            <li>
              <strong>Datos transaccionales:</strong> información para procesar
              pagos. No almacenamos datos sensibles de tarjetas; los pagos se
              procesan mediante proveedores autorizados como Stripe o PayPal.
            </li>
            <li>
              <strong>Datos de comunicación:</strong> mensajes con soporte,
              mentores o dentro de la comunidad.
            </li>
          </ul>
        </section>

        {/* FINALIDAD */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">
            3. Finalidades del Tratamiento
          </h2>

          <ul className="list-disc ml-6 space-y-2">
            <li>Gestionar su cuenta y acceso a la plataforma.</li>
            <li>Administrar inscripción y certificaciones.</li>
            <li>Comunicación operativa y soporte técnico.</li>
            <li>
              Enviar comunicaciones comerciales con consentimiento previo.
            </li>
            <li>Mejorar servicios y experiencia del usuario.</li>
            <li>Prevenir fraudes y proteger la plataforma.</li>
            <li>Cumplir obligaciones legales.</li>
          </ul>
        </section>

        {/* FUNDAMENTO */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">
            4. Fundamentos Legales
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Ejecución del contrato al registrarse.</li>
            <li>Consentimiento expreso para marketing.</li>
            <li>Interés legítimo para mejorar servicios y seguridad.</li>
            <li>Cumplimiento de obligaciones legales.</li>
          </ul>
        </section>

        {/* TRANSFERENCIAS */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">
            5. Transferencia de Datos
          </h2>
          <p>Sus datos pueden compartirse con:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Proveedores tecnológicos y de pago.</li>
            <li>Mentores y colaboradores formativos.</li>
            <li>Autoridades cuando la ley lo exija.</li>
          </ul>
          <p className="mt-2">
            La Empresa no vende ni alquila datos personales a terceros.
          </p>
        </section>

        {/* ARCO */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">6. Derechos ARCO</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Acceder a sus datos.</li>
            <li>Rectificar datos inexactos.</li>
            <li>Solicitar cancelación.</li>
            <li>Oponerse a marketing directo.</li>
          </ul>
          <p>
            Para ejercer estos derechos, envíe una solicitud con copia de su
            documento de identidad al responsable de protección de datos.
            Responderemos en un plazo máximo de 20 días hábiles.
          </p>
        </section>

        {/* SEGURIDAD */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">
            7. Seguridad de la Información
          </h2>
          <p>
            Implementamos medidas técnicas y organizativas razonables para
            proteger sus datos. Sin embargo, ningún sistema es 100% seguro.
          </p>
        </section>

        {/* RETENCION */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">
            8. Retención de Datos
          </h2>
          <p>
            Conservaremos sus datos mientras su cuenta esté activa o mientras
            sea necesario por obligaciones legales. Los datos de usuarios
            inactivos podrán eliminarse o anonimizarse tras 24 meses.
          </p>
        </section>

        {/* CAMBIOS */}
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">
            9. Modificaciones
          </h2>
          <p>
            Podemos actualizar esta política. Notificaremos cambios relevantes
            mediante la plataforma o correo electrónico.
          </p>
        </section>

        {/* CONTACTO */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">10. Contacto</h2>
          <p>Responsable de Protección de Datos:</p>
          <p>📧 private@footalentgroup.com</p>
          <p>📍 Av. 26 de Julio 4272, Oficina 101, Huancayo, Perú</p>
        </section>
      </div>
    </main>
  )
}
