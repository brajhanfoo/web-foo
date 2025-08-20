# Foo Talent Group - Plataforma Web

Este proyecto es una aplicación web desarrollada con **Next.js 15**, utilizando el **App Router** y **TailwindCSS** para el manejo de estilos.  
Actualmente el proyecto se encuentra en fase inicial con una **arquitectura monolítica modular**, diseñada para crecer de manera ordenada.

---

## 🚀 Tecnologías principales

- [Next.js 15](https://nextjs.org/) - Framework de React
- [React 18](https://react.dev/) - Librería para UI
- [TailwindCSS](https://tailwindcss.com/) - Framework de estilos
- [TypeScript](https://www.typescriptlang.org/) (opcional, si se incluye más adelante)

---

## 📂 Estructura de carpetas

```plaintext
app/                  # Núcleo de la aplicación (App Router de Next.js)
│
├── globals.css       # Estilos globales (incluye Tailwind)
├── layout.tsx        # Layout raíz (HTML base)
├── page.tsx          # Página principal ("/")
│
├── services/         # Módulo de servicios para empresas
│   ├── layout.tsx    # Layout específico para /services
│   └── page.tsx      # Página principal de /services
│
└── talentos/         # (Futuro módulo) Plataforma de aula virtual, cursos, etc.
    ├── layout.tsx
    └── page.tsxs
```

## 🧹 Regla antes de Commit

Este proyecto utiliza **ESLint** y **Prettier** para asegurar un código limpio, consistente y con buenas prácticas.  
Antes de enviar cualquier commit, sigue estos pasos:

### 1. Verificar el código con ESLint

Ejecuta el siguiente comando para detectar errores y advertencias:

```bash
npm run lint
```

### 2. Formatear el código con Prettier

Asegúrate de que el código siga el estilo definido:

```bash
npm run format
```

## ✅ Convenciones de Commits (Conventional Commits)

Usamos **Conventional Commits** para mantener un historial claro y facilitar releases automáticos.

**Formato básico**

```plaintext
<tipo>(<alcance>): <mensaje corto>
```

- **tipo** (obligatorio): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`
- **alcance** (opcional): módulo o área afectada, p. ej. `services`, `auth`, `ui`
- **mensaje corto**: en modo imperativo, minúsculas, ≤ 50 caracteres recomendados (sin punto final)

**Ejemplos**

- `feat(services): agregar endpoint para crear empresa`
- `fix(auth): corregir expiración de token JWT`
- `docs(readme): actualizar sección de instalación`
- `refactor(ui): dividir Header en componentes más pequeños`
- `perf(api): optimizar consulta de listados`

## Clonar e instalar el proyecto

### Requisitos

- Node.js **v18+** (recomendado v18 o v20)
- npm (incluido con Node) — o yarn / pnpm si prefieres

### Pasos rápidos

1. Clonar el repositorio

```bash
git clone https://github.com/brajhanfoo/web-foo.git
cd web-foo
```

2. Instalar dependencias

```bash
$ npm install
```

3. Compilación y Ejecución del Proyecto

```bash
# development
$ npm run dev

# production mode
$ npm run start
```

## 📄 Licencia

Este proyecto es propiedad de Foo Talent Group.
Su uso está restringido a fines internos de la organización.
