# Foo Talent Group - Plataforma Web

> Repositorio del proyecto web de Foo Talent Group (Next.js 15). Este README combina la información técnica del proyecto con las **buenas prácticas de Gitflow** y las convenciones de trabajo para colaborar usando GitHub (Issues, Projects y Pull Requests).

---

## 🏷️ Resumen rápido

- **Ramas protegidas:** `main` (producción).
- **Rama de integración:** `dev` (desarrollo diario).
- **Prefijo para features:** `fet/` (ej.: `fet/123-login-usuario`).
- Usamos **PRs**, **Issues**, **Projects (Kanban)** y **GitHub Actions** para CI.

---

## 📌 Tecnologías principales

- Next.js 15 - App Router
- React 18
- TailwindCSS
- Node.js (v18+ recomendado)
- TypeScript (opcional)

---

## 📂 Estructura de carpetas (ejemplo)

```plaintext
app/                  # Núcleo de la aplicación (App Router de Next.js)
│
├── globals.css       # Estilos globales (incluye Tailwind)
├── layout.tsx        # Layout raíz (HTML base)
├── page.tsx          # Página principal ("/")
│
├── services/         # Módulo de servicios para empresas
│   ├── layout.tsx
│   └── page.tsx
│
└── talentos/         # (Futuro módulo) Plataforma de aula virtual
    ├── layout.tsx
    └── page.tsx
```

---

## 🧹 Reglas antes de commitear

Este proyecto utiliza **ESLint** y **Prettier** para asegurar un código limpio, consistente y con buenas prácticas.  
Antes de enviar cualquier commit, sigue estos pasos:

#### 1. Verificar el código con ESLint

Ejecuta el siguiente comando para detectar errores y advertencias:

```bash
npm run lint
```

#### 2. Formatear el código con Prettier

Asegúrate de que el código siga el estilo definido:

```bash
npm run format
```

---

## ✅ Convenciones de commits (Conventional Commits)

Formato:

```plaintext
<tipo>(<alcance>): <mensaje corto>
```

Tipos recomendados: `feat`/`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

Ejemplos:

- `feat(services): agregar endpoint para crear empresa`
- `fix(auth): corregir expiración de token JWT`
- `docs(readme): actualizar sección de instalación`
- `refactor(ui): dividir Header en componentes más pequeños`
- `perf(api): optimizar consulta de listados`

---

## 🔧 Clonar e instalar

Requisitos: Node.js v18+.

```bash
git clone https://github.com/brajhanfoo/web-foo.git
cd web-foo
npm install

# desarrollo
npm run dev

# producción
npm run build
npm run start
```

---

## 📋 Flujo Gitflow recomendado (detallado)

### 1. Modelo de ramas

- `main` – Producción (protegida). Solo merges controlados mediante PRs desde `release` o `hotfix`.
- `dev` – Integración diaria (rama base para features).
- `feat/...` – Features creadas desde `dev`.
- `release/...` – Preparación de versiones desde `dev`.
- `hotfix/...` – Correcciones críticas creadas desde `main`.

### 2. Convenciones de nombres

- Feature: `feat/{ISSUE_NUM}-{descripcion-corta}`  
  Ej: `feat/123-login-usuario`
- Release: `release/vX.Y.Z`  
  Ej: `release/v1.2.0`
- Hotfix: `hotfix/vX.Y.Z`  
  Ej: `hotfix/v1.2.1`

> Recomendación: siempre incluir número de issue para trazabilidad.

### 3. Flujo paso a paso

#### a) Crear la tarea (Issue)

- Crear Issue con título, descripción, tareas y etiqueta (`bug`, `feature`, `documentation`).
- Asignarse la tarea.
- Asignar milestone si aplica.
- Añadir la tarjeta al Project Board (Backlog / In Progress).

#### b) Crear rama desde `dev`

```bash
git checkout dev
git pull origin dev
git checkout -b feat/123-descripcion-corta
# trabaja, commitea
git add .
git commit -m "feat(123): descripción corta"
git push -u origin feat/123-descripcion-corta
```

#### c) Pull Request a `dev`

- Abrir PR con descripción, pasos para probar y `Closes #ISSUE_NUM`.
- Asignar revisores.
- Merge una vez aprobado.

**Estrategia de merge:** `Squash and merge` para feature branches (historial compacto), `Merge commit` para releases.

#### d) Release

- Crear `release/vX.Y.Z` desde `dev` cuando estén las features listas.
- Probar, corregir y mergear `release` → `main`.
- Crear tag `vX.Y.Z` y desplegar.
- Merge `main` → `dev` para propagar etiquetas/cambios.

#### e) Hotfix

- Crear `hotfix/x.y.z` desde `main`, corregir, abrir PR a `main`.
- Tras merge, taggear y mergear `main` → `dev`.

---

## 📦 Uso de GitHub (Issues, Projects y PRs)

- **Issues:** documentan tareas y bugs. Usa labels y milestones.
- **Projects (Kanban):** `Backlog`, `In progress`, `In review`, `QA`, `Done`.
- Vincula tarjetas a issues/PRs.
- **PRs:** deben referenciar issues (`Closes #`) y tener descripción y checklist.

---

## 🧾 Plantillas recomendadas

### Pull Request template (`.github/PULL_REQUEST_TEMPLATE.md`)

```markdown
## Descripción

Resumen breve.

## Issue relacionado

Closes #ISSUE_NUMBER

## Cómo probar

- Paso 1
- Paso 2

## Checklist

- [ ] Tests pasan
- [ ] Linter OK
- [ ] Revisores asignados
- [ ] Documentación actualizada
```

### Issue template (feature / bug) (`.github/ISSUE_TEMPLATE/`)

```markdown
### Descripción

¿Qué quieres lograr?

### Pasos para reproducir (si aplica)

1.
2.

### Resultado esperado

### Criterios de aceptación

- [ ] Criterio 1
- [ ] Criterio 2
```

---

## ⚙️ Integración continua (recomendado)

- Usa **GitHub Actions** con workflows que ejecuten: `install`, `build`, `test`, `lint` en cada PR.
- Configura los checks como requisito para merge en `dev` y `main`.

---

## 🧰 Comandos útiles

```bash
# crear rama feature
git checkout dev
git pull
git checkout -b fet/123-mi-feature

# rebase/merge con dev antes de push
git fetch origin
git rebase origin/dev

# push
git push -u origin fet/123-mi-feature
```

---

## ❓ FAQ corto

**¿Puedo crear una rama desde `main`?** Solo para hotfixes críticos.  
**¿Merge directo a `main`?** No. Solo via `release` o `hotfix` y siempre con PRs y checks aprobados.

---

## 📄 Licencia

Propiedad de Foo Talent Group. Uso restringido a fines internos.

---
