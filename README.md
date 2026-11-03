# Consulta de precio en tiempo real (MVP)

Monorepo pnpm: `apps/web` (SvelteKit) + `apps/api` (Express + MongoDB Atlas).

## Requisitos

- **Node.js ≥ 22.23.4** (ideal 24.x; parche CVE-2026-111497 / Node2Shell)
- pnpm 9+
- URI de MongoDB Atlas con DB `ConsultaPrecioTiemporeal`

## Deploy (un solo Vercel vía GitHub)

Ver **`DEPLOY-VERCEL.md`**: monorepo → un proyecto, front + `/api` en el mismo dominio.


## Setup

```bash
cp .env.example .env
# Edita MONGODB_URI, CREDENTIALS_SECRET y ADMIN_TOKEN

pnpm i
```

## Desarrollo

Puertos: los define `apps/api/.env` (`PORT`, `WEB_PORT`). Si están ocupados, el proceso **falla** (no mata ni roba otro puerto).

```bash
pnpm dev       # web + api según .env
pnpm dev:api
pnpm dev:web
```

- App / Admin / Health usan `WEB_PORT` y `PORT` de tu `.env`

### Demo rápido (proveedor mock)

Al arrancar, si Mongo no tiene config, se crea desde `PROVIDER_*` del `.env` (por defecto mock/`demo`/`demo`).

1. `pnpm dev`
2. En `/` busca `SKU-1001` o `tornillo`
3. (Opcional) `/admin` con `ADMIN_TOKEN` para cambiar a API real

### Pedir credenciales al cliente (no experto)

Ver **`GUIA-PEDIR-CREDENCIALES-AL-CLIENTE.md`**.

### Varios proveedores (solo credenciales)

En **`/admin`**: **+ Nuevo** → nombre + HTTP + URL + usuario + password → Probar.  
En **`/`**: selector de proveedor antes de buscar.

Sin Playwright: cada proveedor con API (`POST /auth`, `GET /productos?q=`).  
`PROVIDER_*` en `.env` solo crea el primero si Mongo está vacío.

Caché: `CACHE_TTL_SECONDS` (default 60). Misma búsqueda + mismo proveedor reutiliza resultado; `0` desactiva.

## Seguridad

- Credenciales del proveedor: AES-256-GCM (`CREDENTIALS_SECRET`)
- Admin protegido con `ADMIN_TOKEN` (sin Google Auth)
- `engines.node`: `>=22.23.4` (Vercel: Node 24.x)

