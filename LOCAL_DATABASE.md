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

Gift fees default to 2% for both NGN and USD. Set `GIFT_FEE_PERCENT` in `.env`
and restart the backend to change the rate (`0` disables fees). New gifts save
their rate at initiation; existing gifts retain their saved fee, and gifts
initiated before fees were introduced remain fee-free. Apply migrations before
running the updated backend with `npm run migrate`.

To test gift credits, fee debits, concurrent retries and rollback in an isolated
schema that is removed afterward:

```sh
GIFT_FEE_TEST_DATABASE_URL=postgresql://olayimika@127.0.0.1:5432/creatorlink_dev npm test
```
