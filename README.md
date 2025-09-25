Editor.js + Next.js con almacenamiento en Postgres

Scripts útiles
- npm run db:migrate: crea la tabla pages y trigger updated_at
- npm run db:json:migrate: migra archivos de JSON/ a la base de datos
- npm run db:check: verifica la conexión a la base de datos

Variables de entorno
- DATABASE_URL o las variables DB_HOST_APP, DB_PORT_APP, DB_NAME_APP, DB_USER_APP, DB_PASSWORD_APP

Notas
- La API /api/editor usa Postgres (lectura/escritura). El almacenamiento en JSON solo se usa para migración.
