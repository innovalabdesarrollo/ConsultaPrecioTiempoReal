# CONSULTA DE PRECIO EN TIEMPO REAL — Especificación MVP

> Exportado desde **Traductor Dev** · 2/11/2026, 6:46:56 p.m.

## Resumen del proyecto

| Campo | Valor |
| --- | --- |
| Estado | draft |
| Presupuesto | $0 |
| Tipo de sistema | — |
| Plazo MVP | — |

### Objetivo

Desarrollar un sistema local que permita al usuario final consultar en tiempo real el precio y disponibilidad de productos de un proveedor externo, sin necesidad de que el usuario acceda directamente al portal del proveedor ni maneje credenciales de acceso. El sistema actuará como intermediario, conectándose de forma automática y segura al sitio web del proveedor utilizando las credenciales configuradas por el administrador, y devolverá al usuario la información solicitada a partir de una búsqueda simple por código de producto, nombre del producto o palabra clave.

### Propuesta de solución

1. Descripción general

Se propone construir una aplicación (local o interna) que sirva como capa intermedia entre el usuario final y el sitio web del proveedor. El usuario ingresará un criterio de búsqueda (código, nombre o palabra clave) desde una interfaz sencilla, y el sistema se encargará de:

Autenticarse en el sitio del proveedor usando las credenciales almacenadas de forma segura.
Realizar la búsqueda del producto en el sitio del proveedor.
Extraer los datos relevantes (precio, disponibilidad/stock, y opcionalmente descripción, unidad de medida, tiempo de entrega, etc.).
Mostrar el resultado al usuario en una interfaz local, clara y rápida.
2. Alcance
Un único punto de búsqueda para el usuario (código, nombre o palabra clave).
Conexión automatizada al portal del proveedor sin exponer credenciales al usuario final.
Presentación de precio y disponibilidad como mínimo; campos adicionales según lo que el proveedor exponga.
Manejo de errores (producto no encontrado, sitio del proveedor caído, sesión expirada, etc.).
3. Requerimientos funcionales
#	Requerimiento
RF1	El usuario podrá ingresar código, nombre o palabra clave del producto.
RF2	El sistema se conectará automáticamente al sitio del proveedor usando credenciales predefinidas (sin intervención del usuario).
RF3	El sistema devolverá precio y disponibilidad del producto consultado.
RF4	El sistema deberá manejar múltiples resultados si la búsqueda es ambigua (ej. palabra clave que arroja varios productos).
RF5	El sistema deberá informar cuando el producto no exista o no se encuentre disponible.
RF6	El sistema deberá mantener actualizada la sesión/autenticación con el proveedor (renovación automática si expira).
4. Requerimientos no funcionales
Seguridad: las credenciales del proveedor deben almacenarse cifradas (nunca visibles ni accesibles para el usuario final).
Rendimiento: tiempo de respuesta razonable por consulta (idealmente unos pocos segundos).
Disponibilidad: manejo adecuado de caídas o cambios en el sitio del proveedor.
Escalabilidad: posibilidad de agregar más proveedores en el futuro con el mismo esquema.
Mantenibilidad: si el proveedor cambia el diseño de su web, el sistema debe poder adaptarse con el menor esfuerzo posible.
5. Consideraciones técnicas iniciales
Método de conexión al proveedor: definir si el proveedor ofrece una API oficial (lo ideal) o si se requiere web scraping (más frágil, sujeto a cambios en el sitio y a posibles restricciones de los Términos de Servicio del proveedor).
Autenticación: login automatizado y persistencia de sesión (cookies/tokens), con renovación cuando expire.
Interfaz de usuario: aplicación local (web local, escritorio o similar) con un solo campo de búsqueda.
Caché opcional: guardar resultados recientes para reducir consultas repetidas al proveedor y mejorar tiempos de respuesta.
Registro (logs): dejar trazabilidad de las consultas realizadas para auditoría y detección de errores.
6. Riesgos identificados
Si no existe una API oficial, el uso de scraping puede violar los Términos de Servicio del proveedor y es vulnerable a cambios en su sitio web.
Cambios en la estructura del sitio del proveedor podrían romper la extracción de datos.
Bloqueos por parte del proveedor si detecta consultas automatizadas frecuentes.
7. Próximos pasos sugeridos
Confirmar si el proveedor tiene una API pública o privada disponible (recomendado antes de optar por scraping).
Revisar los Términos de Servicio del proveedor respecto a automatización/scraping.
Definir la interfaz de usuario final (web, escritorio, etc.).
Definir el mecanismo de almacenamiento seguro de credenciales.
Construir un prototipo (MVP) con una sola búsqueda funcionando end-to-end.

## Actores del sistema (3)

### Usuario consultor

Usuario interno que ingresa un código, nombre o palabra clave para consultar el precio y la disponibilidad de productos.

### Administrador de la aplicación

Responsable de configurar y mantener las credenciales del proveedor, los parámetros de conexión y la disponibilidad operativa del sistema.

### Proveedor externo

Actor externo cuyo portal o API proporciona los datos de productos, precios, disponibilidad y, cuando corresponda, autenticación de acceso.

## Historias de usuario (3)

### HU-01

- **Rol:** Usuario consultor
- **Prioridad:** Media
- **Formato:** Como **Usuario consultor**, quiero **Como usuario consultor interno,
quiero ingresar el código, nombre o una palabra clave del producto en el sistema,
para consultar rápidamente su precio y disponibilidad actual en el proveedor, sin tener que entrar manualmente al sitio web del proveedor ni conocer sus credenciales de acceso.** para **para consultar rápidamente su precio y disponibilidad actual en el proveedor, sin tener que entrar manualmente al sitio web del proveedor ni conocer sus credenciales de acceso.**.

**Casos de uso vinculados:** Consultar precio y disponibilidad de producto

### HU-02

- **Rol:** Administrador de la aplicación
- **Prioridad:** Media
- **Formato:** Como **Administrador de la aplicación**, quiero **Como administrador de la aplicación,
quiero configurar y mantener las credenciales del proveedor, los parámetros de conexión y la disponibilidad operativa del sistema,** para **para garantizar que los usuarios consultores puedan realizar búsquedas de precio y disponibilidad de forma continua, segura y confiable, sin intervenir directamente en cada consulta.**.

**Casos de uso vinculados:** Configurar conexión con el proveedor

### hC-03

- **Rol:** Proveedor externo
- **Prioridad:** Media
- **Formato:** Como **Proveedor externo**, quiero **Como sistema del proveedor externo,
quiero recibir solicitudes de autenticación y consulta de productos desde el sistema local mediante mi portal web o API,** para **para entregar de forma correcta y oportuna los datos de precio, disponibilidad y demás información de productos solicitada, validando previamente la identidad del solicitante.**.

**Casos de uso vinculados:** Procesar solicitudes de autenticación y consulta de productos

## Casos de uso (3)

### Consultar precio y disponibilidad de producto

- **Rol:** Usuario consultor
- **Prioridad:** Media

Permitir al usuario consultor buscar un producto por código, nombre o palabra clave y obtener su precio y disponibilidad actual desde el proveedor externo.

**Pasos:**

1. El usuario consultor ingresa un código, nombre o palabra clave del producto.
2. El sistema valida que el criterio de búsqueda sea válido.
3. El sistema consulta automáticamente la información del producto en el proveedor externo utilizando las credenciales configuradas.
4. El sistema obtiene el precio y la disponibilidad actual del producto.
5. El sistema muestra al usuario consultor los resultados de la consulta.
6. Si no se encuentra el producto o el proveedor no está disponible, el sistema informa la situación al usuario.

### Configurar conexión con el proveedor

- **Rol:** Administrador de la aplicación
- **Prioridad:** Media

Permitir al administrador configurar y mantener de forma segura las credenciales del proveedor, los parámetros de conexión y la disponibilidad operativa del sistema para garantizar consultas continuas y confiables.

**Pasos:**

1. El administrador accede a la configuración de conexión del proveedor.
2. El sistema solicita las credenciales y los parámetros de conexión requeridos.
3. El administrador registra o modifica las credenciales y los parámetros de conexión.
4. El administrador configura la disponibilidad operativa del sistema.
5. El sistema valida el formato y la integridad de la configuración ingresada.
6. El sistema prueba la conexión con el proveedor utilizando las credenciales configuradas.
7. El sistema informa el resultado de la validación y guarda la configuración si la conexión es exitosa.
8. El sistema aplica la disponibilidad operativa configurada para permitir o restringir las consultas de los usuarios.

### Procesar solicitudes de autenticación y consulta de productos

- **Rol:** Proveedor externo
- **Prioridad:** Media

Validar la identidad del sistema local y atender sus solicitudes de consulta para devolver oportunamente el precio, la disponibilidad y la información de los productos solicitados.

**Pasos:**

1. El sistema local envía al proveedor externo una solicitud de autenticación con las credenciales configuradas.
2. El proveedor externo valida las credenciales y la identidad del solicitante.
3. El proveedor externo informa al sistema local el resultado de la autenticación y, si corresponde, entrega un mecanismo de sesión o token.
4. El sistema local envía una solicitud de consulta con el código, nombre o palabra clave del producto.
5. El proveedor externo valida la sesión o token asociado a la solicitud.
6. El proveedor externo busca los productos coincidentes en su portal o sistema de datos.
7. El proveedor externo devuelve al sistema local la información de precio, disponibilidad y demás datos solicitados.
8. Si ocurre un error de autenticación, autorización, búsqueda o comunicación, el proveedor externo devuelve el estado y detalle del error correspondiente.

## Modelo de datos (3 objetos)

### Producto

Representa el producto consultado y la información comercial obtenida del proveedor externo.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del producto. |
| codigoProducto | text | — | Sí | Código del producto en el proveedor externo. |
| nombre | text | — | Sí | Nombre comercial del producto. |
| descripcion | textarea | — | — | Descripción del producto obtenida del proveedor. |
| precio | decimal | — | — | Precio vigente del producto. |
| moneda | text | — | — | Moneda en la que se expresa el precio. |
| disponible | boolean | — | Sí | Indica si el producto está disponible. |
| consultadoEn | datetime | — | Sí | Fecha y hora de la última consulta al proveedor. |

### Consulta de producto

Representa una solicitud de búsqueda de precio y disponibilidad realizada por el usuario consultor.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la solicitud de consulta. |
| terminoBusqueda | text | — | Sí | Código, nombre o palabra clave utilizada para buscar. |
| tipoBusqueda | text | — | Sí | Tipo de búsqueda realizada: código, nombre o palabra clave. |
| estado | text | — | Sí | Estado de la consulta, por ejemplo pendiente, completada o fallida. |
| solicitadaEn | datetime | — | Sí | Fecha y hora en que se realizó la solicitud. |
| completadaEn | datetime | — | — | Fecha y hora en que finalizó el procesamiento. |
| mensajeError | textarea | — | — | Detalle del error cuando la consulta no puede completarse. |

### Resultado de consulta

Representa la respuesta devuelta al usuario con el precio y la disponibilidad del producto solicitado.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del resultado. |
| consultaId | uuid | — | Sí | Identificador de la consulta que originó este resultado. |
| productoId | uuid | — | — | Identificador del producto encontrado. |
| precio | decimal | — | — | Precio devuelto por el proveedor para el producto. |
| moneda | text | — | — | Moneda del precio devuelto. |
| disponible | boolean | — | — | Disponibilidad del producto al momento de la respuesta. |
| detalleRespuesta | textarea | — | — | Información adicional devuelta al usuario. |
| obtenidoEn | datetime | — | Sí | Fecha y hora en que se obtuvo la respuesta del proveedor. |

### Relaciones

- **Consulta de producto** → **Resultado de consulta** (one-to-one): genera
- **Producto** → **Resultado de consulta** (one-to-many): aparece en

## Épicas (3)

### Usuario consultor

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Usuario consultor.

**Tickets (4):** Integrar consulta de precio y disponibilidad con el proveedor externo; Mostrar resultados de precio y disponibilidad al usuario consultor; Implementar búsqueda de productos por código, nombre o palabra clave; Validar criterio de búsqueda antes de consultar al proveedor

### Administrador de la aplicación

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Administrador de la aplicación.

**Tickets (5):** Implementar configuración segura de credenciales y parámetros del proveedor; Validar configuración y probar conexión con el proveedor; Configurar disponibilidad operativa del sistema; Implementar auditoría de cambios en la configuración del proveedor; Implementar aplicación atómica y reversión de la configuración del proveedor

### Proveedor externo

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Proveedor externo.

**Tickets (5):** Implementar consulta de productos en el proveedor externo; Gestionar respuestas inválidas y fallos de comunicación del proveedor; Implementar autenticación del sistema local contra el proveedor externo; Interpretar la respuesta estructurada del proveedor externo; Gestionar renovación y cierre de sesión con el proveedor externo

## Backlog de tickets (14)

### Proveedor externo

- **[Backlog]** Implementar consulta de productos en el proveedor externo _(task, Media)_
  - Rol: Proveedor externo · HU: hC-03
  - Implementación: QA
- **[Backlog]** Gestionar respuestas inválidas y fallos de comunicación del proveedor _(task, Media)_
  - Rol: Proveedor externo · HU: hC-03
  - Implementación: QA
- **[Backlog]** Implementar autenticación del sistema local contra el proveedor externo _(task, Media)_
  - Rol: Proveedor externo · HU: hC-03
  - Implementación: QA
- **[Backlog]** Interpretar la respuesta estructurada del proveedor externo _(task, Media)_
  - Rol: Proveedor externo · HU: hC-03
  - Implementación: QA
- **[Backlog]** Gestionar renovación y cierre de sesión con el proveedor externo _(task, Media)_
  - Rol: Proveedor externo · HU: hC-03
  - Implementación: QA

### Administrador de la aplicación

- **[Backlog]** Implementar configuración segura de credenciales y parámetros del proveedor _(task, Media)_
  - Rol: Administrador de la aplicación · HU: HU-02
  - Implementación: QA
- **[Backlog]** Validar configuración y probar conexión con el proveedor _(task, Media)_
  - Rol: Administrador de la aplicación · HU: HU-02
  - Implementación: QA
- **[Backlog]** Configurar disponibilidad operativa del sistema _(task, Media)_
  - Rol: Administrador de la aplicación · HU: HU-02
  - Implementación: QA
- **[Backlog]** Implementar auditoría de cambios en la configuración del proveedor _(task, Media)_
  - Rol: Administrador de la aplicación · HU: HU-02
  - Implementación: QA
- **[Backlog]** Implementar aplicación atómica y reversión de la configuración del proveedor _(task, Media)_
  - Rol: Administrador de la aplicación · HU: HU-02
  - Implementación: QA

### Usuario consultor

- **[Backlog]** Integrar consulta de precio y disponibilidad con el proveedor externo _(task, Media)_
  - Rol: Usuario consultor · HU: HU-01
  - Implementación: QA
- **[Backlog]** Mostrar resultados de precio y disponibilidad al usuario consultor _(task, Media)_
  - Rol: Usuario consultor · HU: HU-01
  - Implementación: QA
- **[Backlog]** Implementar búsqueda de productos por código, nombre o palabra clave _(task, Media)_
  - Rol: Usuario consultor · HU: HU-01
  - Implementación: QA
- **[Backlog]** Validar criterio de búsqueda antes de consultar al proveedor _(task, Media)_
  - Rol: Usuario consultor · HU: HU-01
  - Implementación: QA

---

_Fin de la especificación._