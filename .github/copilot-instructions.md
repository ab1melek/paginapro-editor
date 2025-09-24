This repository is a small Next.js app that demonstrates a content editor built around Editor.js
and a file-based JSON backend. Keep guidance short, concrete and tied to the actual project layout.

- speak in spanish

Key things to know
- Framework: Next.js app router (app/ directory). Pages are server components by default; client code is opt-in with "use client".
- Editor: `components/Editor.js` uses EditorJS directly (not editorjs-react-renderer) and exposes a `save()` method via ref.
- Storage: simple file-based JSON storage under the `JSON/` directory. Services in `app/api/services/*.js` read/write those files (fs + path).
- API surface: `app/api/editor/route.js` implements GET/POST/PUT and delegates to services: createPage, editPageById, getPageBySlug, getPages.

Patterns and conventions (do these exactly)
- All server-side data access uses synchronous Node fs operations (fs.readFileSync / fs.writeFileSync). When editing, preserve the existing JSON array wrapper (pages are stored as `[data]`).
- When adding or editing a page, the services expect the page content to be a single object; files are saved as an array with that object as first item. Example: `fs.writeFileSync(..., JSON.stringify([data], null, 2))`.
- Slugs are compared case-insensitively in `getPageBySlug.service.js` — keep that behavior when adding search endpoints.
- Client components that use EditorJS must be wrapped with `"use client"` and mount-only DOM access. Follow the pattern in `components/Editor.js` (useEffect to detect holder element, destroy on cleanup).
- Read-only rendering uses `components/EditorRender.js`. It normalizes Editor.js data (accepts either `{ blocks }` or an array wrapper). When rendering columns, the code flattens/limits to 4 columns and respects `data.ratio` for widths — replicate this logic if adding new block types that affect layout.

Files to reference when coding
- `components/Editor.js` — EditorJS init, save(), DragDrop init, preserving id/slug on save.
- `components/EditorRender.js` — read-only renderer with patterns for images, columns, headers, lists, etc.
- `app/api/services/*.js` — simple fs-based services (createPage, getPages, getPageBySlug, editPageById).
- `app/api/editor/route.js` — Next.js route handlers: POST creates pages, GET supports ?id or ?slug or list, PUT updates by id.
- `app/[slug]/page.js` — example of server-side fetch to `config.baseURL + /api/editor?slug=...` with cache: "no-store".

Developer workflows
- Run locally: npm run dev (uses Next.js defined in `package.json` scripts). Build/start use `next build` and `next start`.
- There are no tests or linters configured. Make minimal, non-breaking edits and run the dev server to validate.

Integration and safety notes
- This project stores content in the `JSON/` directory. Be conservative when changing write logic; existing JSON files are the single source of truth.
- Avoid introducing async fs patterns that change behavior timing-wise; tests are not present to catch race conditions.
- API handlers return NextResponse with JSON bodies. Preserve status codes used today (200, 201, 400, 404, 500).

Helpful examples to copy
- Creating a page: follow `app/api/services/createPage.service.js` — ensure generated id format `editor-<timestamp>` if missing.
- Fetching by slug: follow `getPageBySlug.service.js` — iterate JSON files and return the first case-insensitive slug match.

When you're uncertain
- If a change touches storage format, prefer backward-compatible migrations: keep the array wrapper and include both `id` and `slug` in the saved object.
- Ask the repo owner before replacing file-based storage with a DB or cloud storage.

If you edit this file
- Keep it short. Update examples with exact filenames and small code excerpts only when necessary.

End of instructions.

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
