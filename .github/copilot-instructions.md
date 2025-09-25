Este repo es una app Next.js (App Router) con un editor basado en Editor.js y backend en Postgres. Mantén la guía breve, concreta y referida al layout real del proyecto.

- habla en español

Lo esencial
- Framework: Next.js App Router (`app/`). Las páginas son Server Components por defecto; cliente con `"use client"`.
- Editor: `components/Editor.js` usa EditorJS directo y expone `save()` por ref. Drag & Drop con `editorjs-drag-drop` tras `isReady`.
- Render: `components/EditorRender.js` (cliente) y `components/EditorRender.server.js` (SSR). Ambos usan utilidades en `components/utils/editorRender.js` (normalize, columnas, pesos, mobile stacking).
- Almacenamiento: Postgres (tabla `pages`). Acceso DB vía `db/pool.js`, queries en `db/queries/page.queries.js`, mapping en `db/models/page.model.js`.
- API: `app/api/editor/route.js` maneja GET/POST/PUT y delega a servicios DB: `createPage.db.service.js`, `editPageById.db.service.js`, `getPageBySlug.db.service.js`, `getPages.db.services.js`.

Convenciones clave
- Datos del editor se guardan como un único objeto en `pages.data` (JSONB). `page_settings` guarda `pageSettings` (JSONB). `id` (TEXT) y `slug` (CITEXT) únicos.
- Compatibilidad: `normalize()` acepta `{ blocks }` o wrapper `[data]`. Si falta `pageSettings` en root, lo infiere desde un bloque `pageSettings` legado en `blocks`.
- Columnas: máximo 4; respeta `data.ratio` para pesos; en móvil se apilan (estilos scoped en cliente/SSR).
- Componentes cliente que usan EditorJS deben estar envueltos con `"use client"` y montar/destruir siguiendo el patrón de `components/Editor.js`.

Archivos a consultar
- `components/Editor.js` — init EditorJS, save(), preserva id/slug, promociona `pageSettings` al root al guardar.
- `components/EditorRender(.server).js` — render de lectura; aplica `pageSettings` (fondo, contenedor, opacidad, maxWidth).
- `components/utils/editorRender.js` — normalize, getNonEmptyColumns, calcWeights, hasFourColumnsInBlocks.
- `db/*` — `pool.js`, `queries/page.queries.js`, `models/page.model.js`, `migrations/migration.js`, `jsonMigration.js`.
- `app/api/editor/route.js` — handlers (GET by id/slug/list, POST create, PUT update).
- `app/[slug]/page.js` — fetch server-side con `config.baseURL` y `cache: "no-store"`.

Flujo de preview responsive
- Borradores: guarda en `sessionStorage` con clave `preview-<timestamp>` y navega a `/dashboard/editor/preview?previewKey=...&id=<id?>`.
- `components/PreviewLoader.js` lee `previewKey` y carga el borrador, o hace fetch por `id` si no hay borrador.
- Cliente vs SSR: el preview usa `EditorRender.js` (cliente); publicación usa `EditorRender.server.js`. Ambos apilan columnas en móvil.

Workflows para dev
- Correr: `npm run dev`. Build/start: `next build` / `next start`.
- DB: `npm run db:migrate` (crea tabla/trigger), `npm run db:json:migrate` (importa JSON/), `npm run db:check`.

Notas de integración
- Variables en `lib/config.js` (re-export en `app/config.js`); usa `DATABASE_URL` o `DB_*_APP`.
- La API responde `NextResponse` con códigos 200/201/400/404/500. Mantén los códigos existentes.

Si editas este archivo
- Manténlo corto. Actualiza ejemplos con rutas y nombres exactos solo cuando sea necesario.

Preview responsive (desktop / tablet / móvil)
------------------------------------------
- El proyecto incluye una vista de "preview" para revisar cómo queda el contenido del editor en Desktop, Tablet y Móvil.
- Flujo de borradores en preview: el editor puede guardar un borrador en `sessionStorage` bajo la clave `preview-<timestamp>`; la ruta de preview acepta `previewKey` (para cargar el borrador) o `id` (para cargar una página guardada). El componente cliente `components/PreviewLoader.js` carga el borrador desde `sessionStorage` cuando `previewKey` está presente y permite volver a la edición pasando de nuevo el `previewKey` al editor.
- Diferencia cliente/servidor: El preview usa un renderer cliente (`components/EditorRender.js`) para permitir interactividad y mostrar cómo Editor.js renderiza en el navegador. Las páginas publicadas siguen usando un renderer servidor (`components/EditorRender.server.js`) para mantener HTML server-side y preservar SEO.
- Columnas y mobile: Para que el preview y la página publicada coincidan en móvil, las columnas se apilan en pantallas pequeñas. Esto se implementó con una lógica compartida de cálculo de pesos/columnas en `components/utils/editorRender.js` y estilos scoped (`@media (max-width:480px)`) inyectados por el renderer servidor para garantizar que la versión publicada también muestre columnas apiladas en móviles.
- Device switcher: `components/PreviewGrid.js` ofrece un selector de dispositivo (Desktop/Tablet/Móvil). El modo Desktop renderiza la página como en producción (contenedor centrado con `padding: 32px` y `maxWidth: 700px`) para conseguir paridad visual.

Notas prácticas para COPILOT / agentes:
- Si implementas cambios que afecten el renderizado de bloques (especialmente `columns`), actualiza `components/utils/editorRender.js` y asegúrate de modificar tanto `EditorRender.js` (cliente) como `EditorRender.server.js` (servidor) para mantener comportamiento idéntico.
- Para previsualizar borradores en el editor: invoca `editorRef.current.save()` en el cliente, guarda el resultado en `sessionStorage` con una clave `preview-<timestamp>`, y redirige a `/dashboard/editor/preview?previewKey=preview-<timestamp>&id=<id?>`.
- No rompas la persistencia JSON: las APIs y servicios siguen la convención de leer/escribir archivos JSON como arrays con un solo objeto (ej. `JSON.stringify([data], null, 2)`). Mantén ese formato cuando modifiques `app/api/services/*.js`.
- Mantén límites de compatibilidad: no introduzcas imports cliente-only (`'use client'` o dynamic imports con `ssr: false`) dentro de Server Components; en su lugar, crea componentes cliente separados (`components/PreviewLoader.js`, `components/PreviewGrid.js`).

Ejemplos rápidos:
- Guardar y abrir preview (cliente):
	1. `const data = await editorRef.current.save();`
	2. `const key = 'preview-' + Date.now();`
	3. `sessionStorage.setItem(key, JSON.stringify(data));`
	4. `router.push(`/dashboard/editor/preview?previewKey=${key}&id=${data.id || ''}`);`

- Cargar preview (cliente): `components/PreviewLoader.js` busca `previewKey` en la query, carga `sessionStorage.getItem(previewKey)` si existe, o hace `fetch('/api/editor?id=...')` si solo hay `id`.

Fin de adiciones sobre preview responsive.

Cambios aplicados en esta rama (feature-color-FondoPagina)
-------------------------------------------------------
Breve resumen de lo que se implementó y dónde buscarlo:

- Page-level styling: se añadió persistencia y renderizado para `pageSettings` (color de fondo de la página, color y opacidad del contenedor del editor). Los lugares clave:
	- `components/EditorRender.js` (cliente): aplica `pageSettings` en runtime y renderiza columnas respetando colores por columna.
	- `components/EditorRender.server.js` (SSR): inyecta estilos scoped y replica el comportamiento del cliente para SEO/preview.
	- `components/utils/editorRender.js`: funciones utilitarias (`normalize`, `getNonEmptyColumns`, `calcWeights`, `hasFourColumnsInBlocks`).

- Columnas y layout: se mejoró la lógica de columnas para limitar a 4 columnas, calcular pesos según `data.ratio`, y asegurar que el contenedor sea lo bastante ancho (mínimo 900px) cuando existan 4 columnas para evitar que la cuarta baje de línea.
	- `components/PreviewGrid.js` y `components/ReadOnlyPage.js` se actualizaron para respetar ese ancho en preview y en la página por `slug`.

- UX editor: la UI de ajustes de página fue trasladada a una barra superior (en el editor) y los cambios se guardan en `pageSettings` dentro del JSON (promocionados al objeto raíz al guardar, preservando el wrapper array). El bloque visual original se dejó en el repo pero no aparece en el toolbox.

- Correcciones y compatibilidad:
	- Se eliminó una regla inválida de CSS Modules (`:global(body)` con transition) y se quitaron transiciones no deseadas que causaban efectos visuales extra; la transición global debe moverse a `app/globals.css` si se quiere mantener.
	- No se tocaron las APIs de almacenamiento: archivos en `JSON/` siguen siendo escritos como arrays con un único objeto.

Buenas prácticas aplicadas
-------------------------
- Preservación de la convención de almacenamiento JSON (array wrapper) para compatibilidad con servicios existentes.
- Mantener paridad cliente/SSR: los cambios en render de columnas y `pageSettings` se aplicaron en ambos renderers para evitar discrepancias entre preview y página publicada.
- Evitar cambios asíncronos en servicios de FS: no se introdujeron fs async en los servicios existentes.

Dónde mirar si algo falla
-------------------------
- `components/EditorRender.js` (cliente) y `components/EditorRender.server.js` (SSR) — sincroniza comportamiento entre ambos.
- `components/utils/editorRender.js` — lógica para calcular columnas/pesos.
- `components/ReadOnlyPage.js` y `components/PreviewGrid.js` — wrappers que controlan el `maxWidth` usado en publicación y preview.

Fin de cambios de rama.
