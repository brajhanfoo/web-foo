export const metadata = {
  title: 'Términos y Condiciones | Foo Talent Group',
  description:
    'Términos y Condiciones de uso de la plataforma educativa Foo Talent Group.',
}
import Link from "next/link";
const LAST_UPDATE = '25 de enero de 2026'

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background sutil */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black" />
        <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#00CCA4]/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        {/* HEADER LEGAL */}
        <header className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-semibold tracking-tight">
            Términos y Condiciones de Uso
          </h1>

          <p className="mt-3 text-white/60">
            Foo Talent Group (FTG)
          </p>

          <div className="mt-4 text-sm text-white/50">
            Última actualización: {LAST_UPDATE}
          </div>

          {/* Botones */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/legal/FTG_Terminos_y_Condiciones.pdf"
              target="_blank"
              className="rounded-lg bg-[#00CCA4] px-5 py-2.5 font-semibold text-black hover:bg-[#00bfa0] transition"
            >
              Descargar PDF
            </a>

            <Link
              href="/"
              className="rounded-lg border border-white/15 px-5 py-2.5 text-white/80 hover:bg-white/5 transition"
            >
              Volver al sitio
            </Link>
          </div>
        </header>

        {/* CUERPO LEGAL */}
        <section className="space-y-10 text-[15px] leading-7 text-white/80">

          {/* 1 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Aceptación
            </h2>
            <p>
              Al crear una cuenta, registrarte o utilizar la plataforma,
              servicios o contenidos de Foo Talent Group (FTG), aceptas estos
              Términos y Condiciones en su totalidad. Si no estás de acuerdo con
              cualquiera de sus disposiciones, debes abstenerte de utilizar la
              Plataforma.
            </p>
          </article>

          {/* 2 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Elegibilidad y Cuenta de Usuario
            </h2>
            <p>
              El servicio está dirigido a personas mayores de 18 años. Al
              registrarte declaras tener capacidad legal para contratar.
            </p>
            <p className="mt-3">
              Para usuarios menores de 18 años, se requerirá consentimiento
              expreso de un tutor legal, quien será responsable del cumplimiento
              de estos términos.
            </p>
            <p className="mt-3">
              Eres responsable de mantener la confidencialidad de tus
              credenciales y de toda actividad realizada bajo tu cuenta.
            </p>
          </article>

          {/* 3 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Objeto del Servicio
            </h2>
            <p>
              FTG es una plataforma educativa que ofrece programas de formación
              en tecnología, mentorías, comunidad y recursos educativos. Los
              programas pueden ser gratuitos o de pago y sus condiciones
              específicas serán informadas previamente en la página de
              inscripción correspondiente.
            </p>
          </article>

          {/* 4 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Registro y Veracidad de la Información
            </h2>
            <p>
              Te comprometes a proporcionar información veraz, exacta y
              actualizada. FTG podrá suspender cuentas con información falsa o
              solicitar verificación adicional para prevenir fraudes.
            </p>
          </article>

          {/* 5 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Propiedad Intelectual
            </h2>
            <p>
              Todo el material formativo, software, diseños, logotipos, textos y
              contenidos de FTG están protegidos por derechos de autor. Se
              concede una licencia limitada únicamente para uso educativo dentro
              de la Plataforma.
            </p>
            <p className="mt-3">
              Los proyectos desarrollados por los usuarios seguirán siendo de su
              propiedad intelectual, pero podrán ser utilizados por FTG para
              promoción y mejora de servicios, siempre reconociendo la autoría.
            </p>
          </article>

          {/* 6 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Normas de Conducta
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acoso o intimidación hacia otros usuarios o staff.</li>
              <li>Suplantación de identidad.</li>
              <li>Spam o publicidad no autorizada.</li>
              <li>Contenido ilegal o que infrinja derechos de terceros.</li>
              <li>Intentos de vulnerar la seguridad de la plataforma.</li>
            </ul>
            <p className="mt-3">
              FTG podrá suspender cuentas que incumplan estas normas.
            </p>
          </article>

          {/* 7 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Programas de Pago y Reembolsos
            </h2>
            <p>
              Los precios serán informados previamente. Ofrecemos reembolso
              dentro de los primeros 7 días calendario desde el inicio del
              programa siempre que no se haya consumido más del 8% del contenido.
            </p>
            <p className="mt-3">
              Solicitudes: contacto@footalentgroup.com
            </p>
          </article>

          {/* 8 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Certificaciones
            </h2>
            <p>
              La emisión de certificados está sujeta al cumplimiento de los
              requisitos académicos y de conducta establecidos por FTG.
            </p>
          </article>

          {/* 9 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Limitación de Responsabilidad
            </h2>
            <p>
              La plataforma se ofrece tal cual. FTG no garantiza resultados de empleo ni ingresos derivados de los programas.
            </p>
            <p className="mt-3">
              No seremos responsables por daños indirectos, pérdida de datos o
              lucro cesante derivados del uso de la plataforma.
            </p>
          </article>

          {/* 10 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Modificaciones
            </h2>
            <p>
              FTG puede actualizar estos términos. Los cambios relevantes serán
              notificados con al menos 15 días de anticipación.
            </p>
          </article>

          {/* 11 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Privacidad
            </h2>
            <p>
              El tratamiento de datos personales se rige por nuestra Política de
              Privacidad, que forma parte integral de estos términos.
            </p>
          </article>

          {/* 12 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              12. Terminación
            </h2>
            <p>
              FTG podrá suspender o cancelar cuentas que incumplan estos
              términos. El usuario puede solicitar la baja en cualquier momento.
            </p>
          </article>

          {/* 13 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              13. Ley Aplicable
            </h2>
            <p>
              Estos términos se rigen por las leyes de la República del Perú.
              Cualquier controversia será resuelta por los tribunales de El
              Tambo, Huancayo.
            </p>
          </article>

          {/* 14 */}
          <article>
            <h2 className="text-xl font-semibold text-white mb-3">
              14. Contacto
            </h2>
            <p>Email legal: contacto@footalentgroup.com</p>
            <p className="mt-2">
              Dirección: Av. 26 de julio N° 4272 - Huancayo - Perú
            </p>
          </article>
        </section>

        {/* FOOTER LEGAL */}
        <div className="mt-16 border-t border-white/10 pt-6 text-sm text-white/40">
          © {new Date().getFullYear()} Foo Talent Group. Documento legal
          oficial.
        </div>
      </div>
    </main>
  )
}
