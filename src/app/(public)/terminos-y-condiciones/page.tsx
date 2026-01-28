export const metadata = {
  title: 'Términos y Condiciones | Foo Talent Group',
  description:
    'Términos y Condiciones de uso de la plataforma de Foo Talent Group E.I.R.L.',
}

const TERMS_VERSION = '2026-01-19'

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      {/* Background oscuro con gradientes */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black" />
        <div className="absolute -top-32 -left-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <header className="rounded-2xl border border-emerald-400/20 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_0_1px_rgba(0,204,164,0.12),0_20px_60px_rgba(0,0,0,0.65)]">
          <h1 className="text-3xl font-semibold text-white">
            Términos y Condiciones
          </h1>

          <p className="mt-2 text-white/70">
            Estos Términos y Condiciones regulan el acceso y uso de la
            plataforma de{' '}
            <span className="text-white">Foo Talent Group E.I.R.L.</span> (en
            adelante, “FTG”, “nosotros” o “la Empresa”).
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/60">
              <span className="text-white/80">Versión:</span> {TERMS_VERSION}
              <span className="mx-2 text-white/30">•</span>
              <span className="text-white/80">Última actualización:</span>{' '}
              {TERMS_VERSION}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href="/legal/FTG_Terminos_y_Condiciones.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-black hover:bg-emerald-400"
              >
                Descargar PDF
              </a>

              <a
                href="/registro"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-white hover:bg-white/10"
              >
                Volver al registro
              </a>
            </div>
          </div>
        </header>

        <section className="mt-6 space-y-4">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              1. Aceptación de los términos
            </h2>
            <p className="mt-2">
              Al registrarte, acceder o utilizar la plataforma de FTG, declaras
              haber leído y aceptado estos Términos y Condiciones, así como
              nuestra política de privacidad (si aplica). Si no estás de
              acuerdo, debes abstenerte de utilizar la plataforma.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              2. Servicios y finalidad de la plataforma
            </h2>
            <p className="mt-2">
              FTG ofrece una plataforma educativa para gestionar programas de
              formación, inscripción a iniciativas como Smart Projects,
              seguimiento de perfil educativo, acceso a contenidos, comunicación
              con el equipo y gestión administrativa asociada.
            </p>
            <p className="mt-3">
              La plataforma puede incluir módulos y funcionalidades que cambien
              con el tiempo (nuevas rutas, roles, herramientas, integraciones o
              contenidos), manteniendo el objetivo de soporte educativo y
              organizativo.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              3. Registro, cuenta y veracidad de datos
            </h2>
            <p className="mt-2">
              Para crear una cuenta es posible que solicitemos datos personales
              y de contacto (por ejemplo: nombre, apellido, país de residencia,
              documento de identidad, número de WhatsApp, email, LinkedIn u
              otros). Te comprometes a proporcionar información veraz, actual y
              completa.
            </p>
            <p className="mt-3">
              Eres responsable de mantener la confidencialidad de tu contraseña
              y de toda actividad realizada desde tu cuenta. Si sospechas un
              acceso no autorizado, debes notificarlo de inmediato.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              4. Uso permitido y conducta
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Usar la plataforma únicamente para fines educativos y de gestión
                de tu participación en programas de FTG.
              </li>
              <li>
                No intentar vulnerar seguridad, acceso, integridad o
                disponibilidad del servicio (por ejemplo: scraping abusivo,
                ataques, inyección, fuerza bruta, etc.).
              </li>
              <li>
                No suplantar identidad, no falsificar datos, ni utilizar la
                plataforma para actividades ilícitas o no autorizadas.
              </li>
              <li>
                Respetar a la comunidad: conducta apropiada en comunicaciones,
                respeto y cumplimiento de normas internas del programa.
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              5. Pagos, inscripciones y programas
            </h2>
            <p className="mt-2">
              Algunos programas pueden ser gratuitos, de pago, o requerir un
              pago posterior a la inscripción. Las condiciones específicas
              (precio, formas de pago, fechas, política de reembolso,
              requisitos) serán informadas en cada programa o convocatoria.
            </p>
            <p className="mt-3">
              FTG puede solicitar validaciones adicionales para confirmar
              inscripción, identidad o cumplimiento de requisitos del programa.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              6. Propiedad intelectual
            </h2>
            <p className="mt-2">
              Los contenidos, recursos, materiales, marcas, diseño y software de
              la plataforma pertenecen a FTG o a sus licenciantes. No se permite
              copiar, redistribuir, vender o explotar comercialmente el
              contenido sin autorización escrita.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              7. Tratamiento de datos y comunicaciones
            </h2>

            <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-white/85">
              <span className="font-medium text-emerald-300">Importante:</span>{' '}
              Al registrarte, autorizas a FTG a usar tus datos de contacto para
              comunicaciones organizativas y, adicionalmente, para enviarte
              novedades y publicidad sobre nuevos programas, convocatorias o
              beneficios.
            </div>

            <p className="mt-3">Los datos se utilizan principalmente para:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Gestión del perfil educativo y participación en programas
                (inscripción, seguimiento, certificaciones, coordinación).
              </li>
              <li>
                Canales de comunicación (email, WhatsApp u otros) para soporte,
                recordatorios y coordinación del programa.
              </li>
              <li>
                Envío de comunicaciones comerciales/publicitarias relacionadas
                con FTG (por ejemplo: nuevos programas, eventos, becas,
                oportunidades).
              </li>
            </ul>

            <p className="mt-3">
              Podrás solicitar la baja de comunicaciones promocionales mediante
              el enlace de desuscripción en emails o contactándonos por los
              canales oficiales indicados por FTG.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              8. Suspensión o cierre de cuentas
            </h2>
            <p className="mt-2">
              FTG puede suspender o cancelar cuentas que incumplan estos
              términos, que representen riesgo de seguridad, fraude, abuso o uso
              no autorizado. También puedes solicitar el cierre de tu cuenta.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              9. Disponibilidad, cambios y limitación de responsabilidad
            </h2>
            <p className="mt-2">
              La plataforma se ofrece “tal cual” y puede presentar
              interrupciones por mantenimiento, mejoras, cambios técnicos o
              incidentes. FTG no garantiza disponibilidad ininterrumpida.
            </p>
            <p className="mt-3">
              En la medida permitida por ley, FTG no será responsable por daños
              indirectos, pérdida de datos, pérdida de oportunidades u otros
              perjuicios derivados del uso o imposibilidad de uso del servicio.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">
              10. Modificaciones de los términos
            </h2>
            <p className="mt-2">
              FTG puede actualizar estos términos. Cuando existan cambios
              relevantes, podremos notificarlo por la plataforma o por email. La
              versión vigente estará publicada en esta página.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <h2 className="text-xl font-semibold text-white">11. Contacto</h2>
            <p className="mt-2">
              Para consultas sobre estos términos o sobre el uso de la
              plataforma, podrás contactar a FTG por los canales oficiales
              publicados en nuestro sitio y comunicaciones.
            </p>
          </article>

          <footer className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            <p className="text-sm">
              <span className="text-white/80">Razón social:</span> Foo Talent
              Group E.I.R.L.
            </p>
            <p className="mt-1 text-sm">
              <span className="text-white/80">Versión de términos:</span>{' '}
              {TERMS_VERSION}
            </p>
          </footer>
        </section>
      </div>
    </main>
  )
}
