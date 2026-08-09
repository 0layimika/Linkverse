# Local PostgreSQL

The backend uses the PostgreSQL 18 server managed by Postgres.app and listening
on `127.0.0.1:5432`. The local connection URL is:

```text
postgresql://olayimika@127.0.0.1:5432/creatorlink_dev
```

From this directory, check it with:

```sh
npm run db:local:status
```

Start and stop the server from Postgres.app. The local `.env` is ignored by Git.
Production still requires an explicit `DATABASE_URL`; it never falls back to
this local database.

Existing migrations were applied locally once to create the current schema.
Future schema changes should still be represented by migrations for safe,
backward-compatible deployment, but they can be developed and tested here
before being applied anywhere hosted.
