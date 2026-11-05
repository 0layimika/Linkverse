# Admin dashboard

The existing frontend serves the admin workspace at `/admin`. Sign in with an
existing verified account; a creator profile is optional. The creator sidebar
also shows an Admin dashboard link to permitted accounts.

Set `ADMIN_EMAILS` on the **backend** to a comma-separated list of verified
account emails, then restart the backend. For example:

```dotenv
ADMIN_EMAILS=owner@example.com,operations@example.com
```

An empty list denies all admin access. Every endpoint verifies the persisted
user email, verification state, and block state. Browser-stored user fields and
JWT role/email claims do not grant access. Admin accounts cannot be blocked
through this dashboard.

Before using the dashboard, apply migrations with `npm run migrate`, including
`20261105000000_add_is_blocked_to_users` and
`20261105000001_add_admin_operations`. Deploy backend and frontend together so
creator transaction history understands the new `admin_debit` type.

The dashboard provides:

- Paginated search of all users, including users without creator profiles;
  main and pending balances in each user's USD and NGN wallets.
- Separate USD and NGN totals, each split into main and pending balances.
  Total means main plus pending; currencies are never added together.
- Blocking and unblocking using the existing account restrictions.
- Main-wallet debits with a reason. Wallet update, completed `admin_debit`
  transaction, debit ledger entry, and admin audit entry commit atomically.
  Debits never consume held funds and cannot overdraw the wallet.
- Pending settlement releases into the main wallet, including early releases.
  The original payment transaction and its gross/fee history stay intact; the
  existing release record, paired ledger entries, and settlement metadata are
  updated, with `release_reason: admin_override`. The audit log records the
  admin and reason. This moves the actual held net amount, not the gross gift.
- Transaction browsing with currency/status/search filters and settlement
  status distinct from payment status; an audit log with change results.

All mutations require a UUID `request_id` and a 5–500 character `reason`.
Retries with the same actor, key, and payload replay the committed result;
reusing a key with another payload returns 409. The dialog keeps its key and
payload after an unconfirmed network/server outcome. Retry that request or
inspect the audit log before starting a fresh debit. Wallet row locks prevent
overdrafts; settlement locks and unique ledger references prevent duplicate
releases when the queue worker and admin act concurrently.

API base: `/api/v1/admin` (`auth` and `requireAdmin` protect every route).

| Method | Route | Body / query |
| --- | --- | --- |
| GET | `/session`, `/overview` | None |
| GET | `/users` | `search`, `status=active\|blocked`, `limit`, `offset` |
| GET | `/transactions` | `search`, `status`, `currency`, `user_id`, `limit`, `offset` |
| GET | `/pending-releases` | `search`, `currency`, `user_id`, `limit`, `offset` |
| GET | `/audit` | `limit`, `offset` |
| PATCH | `/users/:userId/block` | `request_id`, `reason`, `blocked` |
| POST | `/wallets/:walletId/debit` | `request_id`, `reason`, `amount` (decimal string in major currency units) |
| POST | `/pending-releases/:releaseId/release` | `request_id`, `reason` |

Run unit tests with `npm test`. To also run admin accounting integration tests,
point `ADMIN_TEST_DATABASE_URL` at a local PostgreSQL test database. The suite
uses a disposable schema and refuses remote hosts:

```sh
ADMIN_TEST_DATABASE_URL=postgresql://localhost/creatorlink_test npm test
```

It exercises authorization, totals, blocking, input rejection, atomic rollback,
concurrent/idempotent debits, early release, and admin/worker settlement races.
