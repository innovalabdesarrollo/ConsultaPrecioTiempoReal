# Cómo pedir las credenciales al cliente (lenguaje sencillo)

## De dónde salen (importante)

**No** son de Google, Gmail, MongoDB ni de Innovalab.

Son del **proveedor de productos** con el que tu cliente ya compra o consulta precios  
(ejemplo: mayorista, distribuidor, ferretera, plataforma B2B).

Hoy el sistema usa un **modo demo (mock)** para probar.  
Para precios **reales**, el cliente debe conseguir acceso con ese proveedor.

---

## Qué necesitas exactamente (lista corta)

Pídele al cliente (o que él se lo pida a su proveedor) esto:

| # | Qué | En palabras simples | Dónde lo pones tú |
| --- | --- | --- | --- |
| 1 | **Usuario** | El usuario con el que entran al portal/API del proveedor | `/admin` o `PROVIDER_USUARIO` |
| 2 | **Contraseña** (o token/API key) | La clave de ese acceso | `/admin` o `PROVIDER_PASSWORD` |
| 3 | **Dirección de la API** (URL) | La “dirección web” técnica para consultar precios por sistema (no la página bonita del catálogo) | `/admin` → Base URL o `PROVIDER_BASE_URL` |
| 4 | **Permiso por escrito** | Que el proveedor autorice usar ese acceso desde un sistema automático | Archivo/correo (ToS / autorización) |

Si el proveedor **no tiene API** y solo tiene portal web, anótalo: habría que valorar otro camino (fuera del MVP actual; el MVP ya está listo para **API HTTP**).

---

## Mensaje listo para WhatsApp / correo (cópialo)

> Hola, para conectar la consulta de precios en tiempo real necesitamos los datos de acceso **de tu proveedor de productos** (no de Google ni del correo).
>
> ¿Nos puedes pedir a tu proveedor (o a tu área de compras/TI) lo siguiente?
>
> 1. Usuario de acceso a su sistema / API  
> 2. Contraseña o llave (API key / token)  
> 3. URL de la API para consultar productos y precios (si tienen documentación, mejor)  
> 4. Confirmación de que podemos usar ese acceso desde nuestro sistema (sin entrar a mano a su página cada vez)
>
> Con eso lo configuramos nosotros. Tus usuarios finales **no verán ni usarán** esas claves; solo consultarán código o nombre del producto.

---

## Cómo se lo explicas si “no es experto”

Usa esta analogía:

> “Es como el usuario y contraseña del portal donde hoy ves los precios.  
> Nosotros los guardamos cifrados en el sistema para que tu equipo consulte el precio sin entrar al portal del proveedor cada vez.”

Deja claro:

- El **consultor** (quien busca productos) **nunca** ve esas claves.
- Solo el **administrador** (tú o el cliente de confianza) las carga una vez en `/admin`.
- Si cambian la contraseña del proveedor, hay que actualizarla en `/admin`.

---

## Qué haces tú cuando te las entreguen

Puedes tener **varios proveedores**. Por cada uno:

1. Entra a `/admin` con el `ADMIN_TOKEN`.
2. **+ Nuevo** → pon un **nombre** claro (ej. “Distribuidora X”).
3. Tipo: **HTTP API**.
4. Pega **Base URL**, **Usuario** y **Contraseña**.
5. **Crear** → **Probar** → OK.
6. En `/` el usuario elige ese proveedor en el selector y consulta.

El `.env` solo sirve para el **primer** proveedor (bootstrap). Los siguientes van siempre por `/admin`.


---

## Preguntas útiles si el proveedor “no entiende de API”

- “¿Tienen integración / web service / API para consultar existencias y precios?”
- “¿Nos pueden compartir el manual de integración o un contacto de TI?”
- “¿El acceso es el mismo usuario del portal web o es uno especial para sistemas?”

---

## Checklist de cierre con el cliente

- [ ] Nombre del proveedor confirmado  
- [ ] Usuario recibido  
- [ ] Contraseña / token recibido (por canal seguro; no por chat público si se puede)  
- [ ] URL de API recibida  
- [ ] Autorización / ToS revisados (pueden automatizar consultas)  
- [ ] “Probar conexión” en `/admin` = OK  
- [ ] Búsqueda de un producto real = precio y disponibilidad correctos  
