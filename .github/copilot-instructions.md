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

Workflows para dev
- Correr: `npm run dev`. Build/start: `next build` / `next start`.
- DB: `npm run db:migrate` (crea tabla/trigger), `npm run db:json:migrate` (importa JSON/), `npm run db:check`.

Notas de integración
- Variables en `lib/config.js` (re-export en `app/config.js`); usa `DATABASE_URL` o `DB_*_APP`.
- La API responde `NextResponse` con códigos 200/201/400/404/500. Mantén los códigos existentes.

Si editas este archivo
- Manténlo corto. Actualiza ejemplos con rutas y nombres exactos solo cuando sea necesario.

Cambios aplicados en esta rama (feature-color-FondoPagina)
-------------------------------------------------------
Breve resumen de lo que se implementó y dónde buscarlo:

- Page-level styling: se añadió persistencia y renderizado para `pageSettings` (color de fondo de la página, color y opacidad del contenedor del editor). Los lugares clave:
	- `components/EditorRender.js` (cliente): aplica `pageSettings` en runtime y renderiza columnas respetando colores por columna.
	- `components/EditorRender.server.js` (SSR): inyecta estilos scoped y replica el comportamiento del cliente para SEO/preview.
	- `components/utils/editorRender.js`: funciones utilitarias (`normalize`, `getNonEmptyColumns`, `calcWeights`, `hasFourColumnsInBlocks`).

- Columnas y layout: se mejoró la lógica de columnas para limitar a 4 columnas, calcular pesos según `data.ratio`, y asegurar que el contenedor sea lo bastante ancho (mínimo 900px) cuando existan 4 columnas para evitar que la cuarta baje de línea.
	- `components/ReadOnlyPage.js` se actualizó para respetar ese ancho en la página por `slug`.

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
- `components/ReadOnlyPage.js` — wrapper que controla el `maxWidth` usado en publicación.

Fin de cambios de rama.

Cambios recientes importantes (blob, uploader, GC, migración, métricas, seeders)
--------------------------------------------------------------------------------
- Integración con Vercel Blob para subir y borrar blobs desde el backend. Archivos clave:
	- `app/api/services/images.services.js` (usa `@vercel/blob` `put`/`del`, sanea slug, límite 2MB, whitelist PNG/JPEG).
	- `app/api/images/route.js` (API de upload/delete que normaliza slug y llama al servicio).

- Uploader cliente con prefijo por `slug` y feedback UX:
	- `components/utils/tools.js` (uploader personalizado que pasa `slug` en FormData y header, toasts y pre-check 2MB).
	- `components/Editor.js` y `app/dashboard/editor/page.js` (exponen y piden el `slug` antes de montar el editor para evitar que las subidas caigan en `general/`).
	- `components/editorPlugins/HeroTool.js` (subida de fondo ahora incluye `slug`).

- Limpieza / Garbage Collection y migración de blobs:
	- `app/api/images/gc/route.js` (endpoint de GC que borra blobs no referenciados).
	- `scripts/cleanOrphanBlobs.js` y `scripts/migrate_page_blobs.js` (CLI para listar/eliminar o migrar blobs de `general/` a `<slug>/` y actualizar DB JSON).

- Borrado referenciado en edición/elim. de páginas:
	- `app/api/editor/route.js` (cuando se edita o borra una página, se detectan URLs removidas y se borran si no hay referencias en otras páginas).

- Métricas y observabilidad:
	- `app/api/services/images.metrics.js` (contadores simples de uploads/deletes).
	- `app/api/images/metrics/route.js` (endpoint para leer métricas básicas).

- Seeders y datos de ejemplo:
	- `db/seed_paginaprolanding.json`, `db/seedPages.js`, `db/seed_single.js` (seeder para landing y upsert por slug).

Notas rápidas de uso / prueba
 - Para migrar assets de `general/` a un slug: `node scripts/migrate_page_blobs.js --slug paginaprolanding --dry` (ver resultados) y luego sin `--dry` para ejecutar.
 - Para probar uploads locales: `npm run dev`, abrir `/dashboard/editor?slug=<tu-slug>` y subir una imagen; verificar en Vercel storage que el path sea `<slug>/...`.

Si quieres, puedo añadir un pequeño badge en la barra superior del editor que muestre el `slug` actual y permita cambiarlo antes del primer guardado (UX sugerida).
