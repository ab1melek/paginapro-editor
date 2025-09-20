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
