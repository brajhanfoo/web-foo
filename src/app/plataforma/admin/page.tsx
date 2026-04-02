import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Activity,
  ArrowUpRight,
  BookMarked,
  ClipboardCheck,
  Briefcase,
  GraduationCap,
  Settings,
  Users,
} from 'lucide-react'

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-semibold text-slate-100 text-balance">
            Panel Admin
          </h1>
          <p className="text-sm text-slate-300">
            Centraliza el trabajo operativo y prioriza lo urgente desde un solo
            lugar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
            Super Admin
          </Badge>
          <Button
            variant="outline"
            className="border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
            asChild
          >
            <Link href="/plataforma/admin/configuracion">
              Configuracion{' '}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <h2 className="flex items-center gap-2 text-base text-balance font-semibold leading-none tracking-tight">
              <ClipboardCheck
                className="h-4 w-4 text-emerald-300"
                aria-hidden="true"
              />
              Postulaciones
            </h2>
            <p className="text-sm text-slate-300 text-pretty">
              Revisa aprobaciones, pagos y estados pendientes del pipeline.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-emerald-500/90 text-black hover:bg-emerald-400"
              asChild
            >
              <Link href="/plataforma/admin/postulaciones">
                Ir a Postulaciones
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <h2 className="flex items-center gap-2 text-base text-balance font-semibold leading-none tracking-tight">
              <Users className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              Usuarios
            </h2>
            <p className="text-sm text-slate-300 text-pretty">
              Gestiona roles, acceso y estado de actividad del equipo.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              asChild
            >
              <Link href="/plataforma/admin/usuarios">Ver Usuarios</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <h2 className="flex items-center gap-2 text-base text-balance font-semibold leading-none tracking-tight">
              <GraduationCap
                className="h-4 w-4 text-emerald-300"
                aria-hidden="true"
              />
              Programas
            </h2>
            <p className="text-sm text-slate-300 text-pretty">
              Ajusta ediciones, equipos y contenidos para cada cohorte.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              asChild
            >
              <Link href="/plataforma/admin/programas">Administrar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <h2 className="flex items-center gap-2 text-base text-balance font-semibold leading-none tracking-tight">
              <Briefcase className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              Docentes
            </h2>
            <p className="text-sm text-slate-300 text-pretty">
              Crea docentes, asigna equipos y revisa carga por horarios.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              asChild
            >
              <Link href="/plataforma/admin/docentes">Gestionar docentes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-slate-800 bg-slate-900 text-slate-100 lg:col-span-2">
          <CardHeader>
            <h2 className="text-base text-balance font-semibold leading-none tracking-tight">
              Flujo Recomendado
            </h2>
            <p className="text-sm text-slate-300 text-pretty">
              Asegura que cada cohorte avance sin bloqueos.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Validar postulaciones pendientes y confirmar pagos.
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Revisar asignaciones de equipos y enlaces clave.
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Publicar hitos de la edicion y comunicar cambios.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <h2 className="flex items-center gap-2 text-base text-balance font-semibold leading-none tracking-tight">
              <Settings
                className="h-4 w-4 text-emerald-300"
                aria-hidden="true"
              />
              Acciones Rapidas
            </h2>
            <p className="text-sm text-slate-300 text-pretty">
              Ajustes frecuentes para el panel.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              asChild
            >
              <Link href="/plataforma/admin/programas">
                Crear Nueva Edicion
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              asChild
            >
              <Link href="/plataforma/admin/usuarios">Revisar Permisos</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              asChild
            >
              <Link href="/plataforma/admin/entregables">
                <BookMarked className="mr-2 h-4 w-4" />
                Gestionar Entregables
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              asChild
            >
              <Link href="/plataforma/admin/actividad">
                <Activity className="mr-2 h-4 w-4" />
                Ver Actividad
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
