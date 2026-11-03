# Publicar en Vercel (un solo proyecto) vía GitHub

Monorepo: **SvelteKit** (`apps/web`) + **API Express serverless** (`api/index.js` → `@cpt/api`).

## 1. Sube el repo a GitHub

Este proyecto **aún puede no tener** `git` / remote. Desde la carpeta del MVP:

```bash
cd ConsultaDePrecioTiemporeal
git init
git add .
git commit -m "MVP listo para Vercel (monorepo)"
# Crea el repo vacío en GitHub y luego:
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

No subas `.env` (ya está en `.gitignore`).


## 2. Conecta en Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → Import GitHub repo  
2. Ajustes del proyecto:
   - **Root Directory:** dejar vacío (raíz del monorepo)
   - **Framework Preset:** SvelteKit (o detectar `vercel.json`)
   - **Install Command:** `pnpm install` (ya en `vercel.json`)
   - **Build Command:** `pnpm --filter @cpt/web build`
   - **Node.js Version:** **24.x** (Project Settings → General)

## 3. Variables de entorno (Production + Preview)

En Vercel → Settings → Environment Variables:

| Variable | Notas |
| --- | --- |
| `MONGODB_URI` | URI Atlas con DB `ConsultaPrecioTiemporeal` |
| `CREDENTIALS_SECRET` | ≥16 caracteres |
| `ADMIN_TOKEN` | ≥8 caracteres |
| `PROVIDER_TIPO` | opcional (`mock` / `http`) bootstrap |
| `PROVIDER_USUARIO` | opcional |
| `PROVIDER_PASSWORD` | opcional |
| `PROVIDER_BASE_URL` | si `http` |
| `PROVIDER_NOMBRE` | opcional |
| `CACHE_TTL_SECONDS` | opcional (default 60) |

No hace falta `PORT` / `WEB_PORT` en Vercel.

## 4. Deploy

**Deploy** → al terminar:

- Front: `https://TU-PROYECTO.vercel.app/`
- API mismo dominio: `https://TU-PROYECTO.vercel.app/api/health`

Cada push a `main` redeploya.

## 5. Después del deploy

1. Abre `/admin` con tu `ADMIN_TOKEN`
2. Agrega proveedores reales (URL + usuario + password)
3. Prueba búsqueda en `/`

## Local sin cambios

```bash
pnpm i
pnpm dev   # web + api como antes
```
