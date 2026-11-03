# Checklist MVP — Consulta de precio en tiempo real

Marca con `[x]` conforme se termine. Fuente: `consulta-de-precio-en-tiempo-real-spec-mvp.md`.

**Leyenda:** `[x]` hecho · `[ ]` pendiente · `[~]` parcial / demo

---

## Infraestructura base

- [x] Monorepo pnpm (`apps/web` SvelteKit + `apps/api` Express)
- [x] Tailwind UI responsive (prioridad móvil)
- [x] MongoDB Atlas conectado (DB `ConsultaPrecioTiemporeal`)
- [x] `.env` / `.env.example` con `MONGODB_URI`, secretos y puertos
- [x] Puertos desde `.env` (`PORT`, `WEB_PORT`) sin matar procesos ajenos
- [x] Node ≥ 24.22.1 (parche Node2Shell)
- [x] Bootstrap de proveedor desde `.env` (`PROVIDER_*`; no sobrescribe config existente)
- [x] Arranque / flujo API verificado (bootstrap + prueba + búsquedas mock en Atlas)
- [x] UI web en `WEB_PORT` + proxy a API (smoke HTTP; API en `PORT` ya corría)
- [x] Banner de estado en `/` vía `/api/health` (sin/con credenciales)

---

## Usuario consultor (HU-01 / RF1–RF5)

- [x] Pantalla de búsqueda (código / nombre / palabra clave)
- [x] Validación de criterio (mín. 2 caracteres)
- [x] Consulta automática vía API (sin credenciales del proveedor en el cliente)
- [x] Mostrar precio y disponibilidad
- [x] Campos extra si vienen del proveedor (descripción, unidad, entrega)
- [x] Múltiples resultados (búsqueda ambigua)
- [x] Mensaje cuando no hay producto
- [x] Errores visibles (proveedor caído, sin config, sistema no operativo)
- [x] Persistencia de consultas / resultados en Mongo (validado en Atlas)
- [x] Flujo consulta mock verificado vía API (`SKU-1001`, `tornillo`, no encontrado)
- [x] Smoke UI vía proxy: `SKU-1001`, `tornillo`, no encontrado (+ home/admin 200)

---

## Administrador (HU-02)

- [x] Pantalla `/admin` protegida con `ADMIN_TOKEN` (sin Google Auth)
- [x] Configurar tipo de proveedor (`mock` | `http`), usuario, password, `baseUrl`
- [x] Credenciales cifradas AES-256-GCM (nunca en claro al consultor)
- [x] Probar conexión con el proveedor
- [x] Disponibilidad operativa on/off
- [x] Auditoría de cambios de configuración
- [x] Aplicación / reversión de configuración (snapshot anterior)
- [x] Config inicial disponible sin pasar por UI (bootstrap `.env`)
- [x] Admin vía API/proxy: leer config + probar conexión (mock)
- [x] Revertir disponible en `/admin` (por proveedor)

---

## Proveedor externo (hC-03 / RF2, RF6)

- [x] Adaptador pluggable (interfaz común)
- [x] Proveedor **mock** con catálogo demo + login `demo`/`demo`
- [x] Proveedor **http** genérico (`POST /auth`, `GET /productos?q=`)
- [x] Login automatizado y persistencia de token/sesión cifrada
- [x] Renovación automática si la sesión expira
- [x] Manejo de fallos de comunicación / respuestas inválidas
- [x] Listo para API real: solo nombre + URL + usuario + password
- [x] **Varios proveedores** (alta en `/admin`, selector en `/`, uno predeterminado)
- [x] Migración automática de config legacy → colección `proveedores`
- [x] Guía para pedir credenciales al cliente (`GUIA-PEDIR-CREDENCIALES-AL-CLIENTE.md`)
- [ ] Conectar proveedor(es) **real(es)** cuando el cliente entregue URL/creds
- [ ] Validar ToS / autorización por cada proveedor



---

## Modelo de datos (Mongo)

- [x] Colección `productos`
- [x] Colección `consultas`
- [x] Colección `resultados`
- [x] Colección `configProveedor` (legacy; migrada)
- [x] Colección `proveedores` (multi-proveedor)
- [x] Colección `auditConfig`
- [x] Datos de prueba escritos en Atlas (config, consultas, resultados, auditoría)
- [x] Snapshot de respuesta en consultas para caché TTL

---

## No funcionales (MVP)

- [x] Seguridad básica de credenciales (cifrado + token admin)
- [~] Rendimiento “unos pocos segundos” (ok en mock; medir con proveedor real)
- [x] Errores de proveedor no tumban la app
- [x] Varios proveedores configurables (selector en UI)
- [x] Caché opcional de consultas idénticas (`CACHE_TTL_SECONDS`, default 60; `0` = off)

---

## Fuera de alcance (no integrar en este MVP)

| Tema | Motivo |
| --- | --- |
| Auth con Google / OAuth social | Regla explícita del stack |
| Envío de correo (notificaciones, reset, etc.) | Regla explícita del stack |
| Web scraping de un portal concreto | Proveedor no nombrado; frágil y riesgo ToS |
| App de escritorio nativa | MVP = web local |
| Scraping / Playwright del portal web | MVP = API HTTP; varios proveedores por credenciales |
| Panel de usuarios / roles complejos | Solo token admin + consultor sin login |
| Historial de consultas en UI para el consultor | Spec prioriza consulta; logs quedan en Mongo/API |
| Billing, pagos, facturación | No está en el spec |
| App móvil nativa / PWA avanzada | No requerido |
| Features “nice to have” fuera del backlog del spec | Evitar overengineering |

---

## Orden sugerido para ir cerrando lo pendiente

1. [x] Bootstrap + consultas mock verificadas contra Atlas
2. [x] Smoke UI (web `5173` → API `3001` sin matar procesos)
3. [x] Admin config + probar conexión verificados
4. [x] Guía + multi-proveedor listo (solo credenciales)
5. [x] Caché opcional implementada y verificada (2ª consulta idéntica = desdeCache)
6. [x] API reiniciada (solo este proyecto) + smoke multi-proveedor + caché + UI 200
7. [ ] Pegar API(s) real(es) cuando el cliente entregue URL + usuario + password
8. [ ] Validar ToS / autorización por proveedor
9. [ ] Marcar MVP cerrado cuando 7–8 estén OK

**Estado código MVP:** listo. Solo faltan credenciales/API reales del cliente.

**Deploy:** preparado para **un solo proyecto Vercel** vía GitHub (`DEPLOY-VERCEL.md`, `vercel.json`, `api/index.js` serverless + `adapter-vercel`).

---

_Última actualización: 2 nov 2026 (México)._
