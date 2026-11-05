import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import Knex from 'knex';
import express from 'express';
import jwt from 'jsonwebtoken';
import { up as users } from '../migrations/20260112123314_create_user_table';
import { up as verified } from '../migrations/20260112125311_alter_user_table_add_verified_field';
import { up as blocked } from '../migrations/20261105000000_add_is_blocked_to_users';
import { up as wallets } from '../migrations/20260123100001_create_wallets_table';
import { up as transactions } from '../migrations/20260123100002_create_transactions_table';
import { up as ledger } from '../migrations/20260809000009_add_wallet_ledger_and_webhook_events';
import { up as currencies } from '../migrations/20260809000011_add_multi_currency_wallets';
import { up as pending } from '../migrations/20261101000003_add_pending_wallet_balances';
import { up as adminOperations, down as removeAdminOperations } from '../migrations/20261105000001_add_admin_operations';
import { debitBody, listQuery } from '../validators/admin.validator';

test('admin inputs reject ambiguous money, missing reasons, and unbounded pagination', () => {
    for (const amount of ['0', '-1', '1.001', '1e3', 'NaN', 'Infinity', '99999999999999.99']) {
        assert.equal(debitBody.safeParse({ amount, request_id: randomUUID(), reason: 'Correction' }).success, false, amount);
    }
    assert.equal(debitBody.safeParse({ amount: 10, request_id: randomUUID(), reason: 'Correction' }).success, false);
    assert.equal(debitBody.safeParse({ amount: '0.01', request_id: randomUUID(), reason: 'Correction' }).success, true);
    assert.equal(debitBody.safeParse({ amount: '1.00', request_id: randomUUID(), reason: '' }).success, false);
    assert.equal(listQuery.safeParse({ limit: '101' }).success, false);
    assert.equal(listQuery.safeParse({ offset: '-1' }).success, false);
});

test('admin operations in PostgreSQL', { skip: !process.env.ADMIN_TEST_DATABASE_URL }, async (t) => {
    const connection = new URL(process.env.ADMIN_TEST_DATABASE_URL!);
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname), 'Use a local test database');
    const owner = Knex({ client: 'pg', connection: connection.toString() });
    const schema = `admin_test_${process.pid}_${Date.now()}`;
    connection.searchParams.set('options', `-c search_path=${schema}`);
    process.env.DATABASE_URL = connection.toString();
    process.env.ADMIN_EMAILS = 'admin@example.test';
    const { default: db } = await import('../db/knex');
    await owner.schema.createSchema(schema);
    const { default: router } = await import('../routes/admin.route');
    const { JWT_SECRET } = await import('../config/env');
    const { AdminService } = await import('./admin.service');
    const { WalletRepository } = await import('../repositories/WalletRepository');
    const { WalletPendingBalanceService } = await import('./wallet-pending-balance.service');
    const app = express();
    app.use(express.json());
    app.use('/admin', router);
    app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ success: false, error: { message: 'Simulated server error' } });
    });
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    t.after(async () => {
        await new Promise<void>((resolve) => server.close(() => resolve()));
        await db.destroy();
        await owner.schema.dropSchemaIfExists(schema, true);
        await owner.destroy();
    });
    await users(db); await verified(db); await blocked(db);
    await db.schema.createTable('creators', (table) => {
        table.increments('id'); table.integer('user_id').unique().references('id').inTable('users');
        table.string('username'); table.string('first_name'); table.string('last_name'); table.string('avatar_url');
    });
    await wallets(db); await transactions(db); await ledger(db); await currencies(db); await pending(db); await adminOperations(db);
    const [admin] = await db('users').insert({ email: 'admin@example.test', password_hash: 'unused', verified: true }).returning('*');
    const token = jwt.sign({ id: admin.id }, JWT_SECRET);
    const address = server.address() as { port: number };
    async function request(path: string, method = 'GET', body?: unknown, accessToken: string | null = token) {
        const response = await fetch(`http://127.0.0.1:${address.port}/admin${path}`, {
            method, headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        return { status: response.status, body: await response.json() as any, headers: response.headers };
    }
    const operation = (extra = {}) => ({ request_id: randomUUID(), reason: 'Accounting correction', ...extra });
    async function fixture(currency = 'NGN', balance = '10.00') {
        const [user] = await db('users').insert({ email: `${randomUUID()}@example.test`, password_hash: 'secret', verified: true }).returning('*');
        const [creator] = await db('creators').insert({ user_id: user.id, username: `user_${user.id}` }).returning('*');
        const wallet = await WalletRepository.createForCreator(creator.id, currency);
        await db('wallets').where({ id: wallet.id }).update({ balance });
        return { user, creator, wallet };
    }
    async function heldGift(amount = '7.80') {
        const fixtureData = await fixture('USD', '0.00');
        const [transaction] = await db('transactions').insert({ wallet_id: fixtureData.wallet.id, type: 'gift', amount,
            currency: 'USD', status: 'completed', reference: randomUUID(), provider: 'test' }).returning('*');
        await WalletRepository.creditWallet(fixtureData.wallet.id, Number(amount), undefined, { transactionId: transaction.id, balanceType: 'pending' });
        const release = await db('wallet_pending_releases').where({ transaction_id: transaction.id }).first();
        return { ...fixtureData, transaction, release };
    }

    await t.test('API denies anonymous, regular, forged-email, unverified, blocked, and unconfigured admins', async () => {
        assert.equal((await request('/overview', 'GET', undefined, null)).status, 401);
        const { user } = await fixture();
        const forged = jwt.sign({ id: user.id, email: admin.email, is_admin: true }, JWT_SECRET);
        assert.equal((await request('/users', 'GET', undefined, forged)).status, 403);
        await db('users').where({ id: admin.id }).update({ verified: false });
        assert.equal((await request('/session')).status, 403);
        await db('users').where({ id: admin.id }).update({ verified: true, is_blocked: true });
        assert.equal((await request('/session')).status, 403);
        await db('users').where({ id: admin.id }).update({ is_blocked: false });
        process.env.ADMIN_EMAILS = '';
        assert.equal((await request('/session')).status, 403);
        process.env.ADMIN_EMAILS = ' ADMIN@example.test ';
        assert.equal((await request('/session')).status, 200);
    });

    await t.test('search includes users without profiles, omits password hashes, and separates currency totals', async () => {
        await fixture('USD', '25.25');
        const response = await request(`/users?search=${encodeURIComponent(admin.email)}`);
        assert.equal(response.body.data.total, 1);
        assert.equal(response.body.data.items[0].creator_id, null);
        assert.equal('password_hash' in response.body.data.items[0], false);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        const summary = (await request('/overview')).body.data;
        for (const currency of ['USD', 'NGN']) {
            const expected = await db('wallets').where({ currency }).sum('balance as sum').first();
            assert.equal(Number(summary.wallets.find((wallet: any) => wallet.currency === currency).available), Number(expected!.sum));
        }
        assert.equal((await request('/users?limit=10000')).status, 400);
    });

    await t.test('blocking immediately revokes an existing token and unblocking restores it', async () => {
        const { user } = await fixture();
        const regularToken = jwt.sign({ id: user.id }, JWT_SECRET);
        const body = operation({ blocked: true });
        assert.equal((await request(`/users/${user.id}/block`, 'PATCH', body)).status, 200);
        assert.equal((await db('users').where({ id: user.id }).first()).is_blocked, true);
        assert.equal((await request('/session', 'GET', undefined, regularToken)).status, 403);
        await request(`/users/${user.id}/block`, 'PATCH', operation({ blocked: false }));
        assert.equal((await db('users').where({ id: user.id }).first()).is_blocked, false);
        assert.equal((await request(`/users/${admin.id}/block`, 'PATCH', operation({ blocked: true }))).status, 400);
    });

    await t.test('concurrent identical debits create one transaction, ledger entry, and audit entry', async () => {
        const { wallet } = await fixture();
        const body = operation({ amount: '4.25' });
        const responses = await Promise.all(Array.from({ length: 4 }, () => request(`/wallets/${wallet.id}/debit`, 'POST', body)));
        assert.ok(responses.every((response) => response.status === 200));
        assert.ok(responses.every((response) => response.body.data.reference === responses[0]!.body.data.reference));
        assert.equal((await db('wallets').where({ id: wallet.id }).first()).balance, '5.75');
        const records = await db('transactions').where({ wallet_id: wallet.id });
        assert.equal(records.length, 1); assert.equal(records[0].type, 'admin_debit'); assert.equal(records[0].status, 'completed');
        const entries = await db('wallet_ledger_entries').where({ wallet_id: wallet.id });
        assert.equal(entries.length, 1); assert.equal(entries[0].transaction_id, records[0].id);
        assert.equal((await db('admin_audit_logs').where({ request_id: body.request_id })).length, 1);
        assert.equal((await request(`/wallets/${wallet.id}/debit`, 'POST', { ...body, amount: '1.00' })).status, 409);
    });

    await t.test('competing debits cannot overspend and invalid requests do not mutate', async () => {
        const { wallet } = await fixture();
        const results = await Promise.all(Array.from({ length: 2 }, () => request(`/wallets/${wallet.id}/debit`, 'POST', operation({ amount: '7.00' }))));
        assert.deepEqual(results.map((result) => result.status).sort(), [200, 400]);
        assert.equal((await db('wallets').where({ id: wallet.id }).first()).balance, '3.00');
        for (const amount of ['-1', '0', '1.001', '99999999999999.99']) {
            assert.equal((await request(`/wallets/${wallet.id}/debit`, 'POST', operation({ amount }))).status, 400);
        }
        assert.equal((await db('transactions').where({ wallet_id: wallet.id })).length, 1);
    });

    await t.test('long reasons fit transaction descriptions while retaining full audit details', async () => {
        const { wallet } = await fixture();
        const reason = 'a'.repeat(500);
        assert.equal((await request(`/wallets/${wallet.id}/debit`, 'POST', operation({ amount: '0.01', reason }))).status, 200);
        const transaction = await db('transactions').where({ wallet_id: wallet.id }).first();
        assert.equal(transaction.description.length, 255);
        assert.equal(transaction.metadata.reason, reason);
    });

    await t.test('a ledger failure rolls back the debit transaction and audit record', async (sub) => {
        const { wallet } = await fixture();
        const body = operation({ amount: '1.00' });
        const mock = sub.mock.method(WalletRepository, 'debitWallet', async () => { throw new Error('Simulated ledger failure'); });
        assert.equal((await request(`/wallets/${wallet.id}/debit`, 'POST', body)).status, 500);
        mock.mock.restore();
        assert.equal((await db('wallets').where({ id: wallet.id }).first()).balance, '10.00');
        assert.equal((await db('transactions').where({ wallet_id: wallet.id })).length, 0);
        assert.equal((await db('admin_audit_logs').where({ request_id: body.request_id })).length, 0);
        assert.equal((await request(`/wallets/${wallet.id}/debit`, 'POST', body)).status, 200);
    });

    await t.test('an audit write failure rolls back the wallet, transaction, and real ledger debit', async () => {
        const { wallet } = await fixture();
        const body = operation({ amount: '1.25', reason: 'Force audit failure' });
        await db.raw("ALTER TABLE admin_audit_logs ADD CONSTRAINT test_audit_failure CHECK (reason <> 'Force audit failure')");
        try {
            assert.equal((await request(`/wallets/${wallet.id}/debit`, 'POST', body)).status, 500);
            assert.equal((await db('wallets').where({ id: wallet.id }).first()).balance, '10.00');
            assert.equal((await db('transactions').where({ wallet_id: wallet.id })).length, 0);
            assert.equal((await db('wallet_ledger_entries').where({ wallet_id: wallet.id })).length, 0);
        } finally { await db.raw('ALTER TABLE admin_audit_logs DROP CONSTRAINT test_audit_failure'); }
    });

    await t.test('an admin can release the exact held amount early without changing payment history', async () => {
        const { release, wallet, transaction } = await heldGift();
        const body = operation();
        await assert.rejects(WalletPendingBalanceService.release(release.id), /not due yet/);
        const response = await request(`/pending-releases/${release.id}/release`, 'POST', body);
        assert.equal(response.status, 200); assert.equal(response.body.data.released, true);
        const balances = await db('wallets').where({ id: wallet.id }).first();
        assert.equal(balances.balance, '7.80'); assert.equal(balances.pending_balance, '0.00');
        const source = await db('transactions').where({ id: transaction.id }).first();
        assert.equal(source.amount, '7.80'); assert.equal(source.status, 'completed');
        assert.equal(source.metadata.wallet_settlement.release_reason, 'admin_override');
        assert.equal(source.metadata.wallet_settlement.admin_override.admin_id, admin.id);
        assert.equal((await request(`/pending-releases/${release.id}/release`, 'POST', body)).body.data.released, true);
        assert.equal((await request(`/pending-releases/${release.id}/release`, 'POST', operation())).body.data.already_released, true);
        assert.equal((await db('wallet_ledger_entries').where({ wallet_id: wallet.id, entry_type: 'pending_release' })).length, 2);
    });

    await t.test('admin/worker races release once; a failed available credit rolls back both balances', async (sub) => {
        const { release, wallet } = await heldGift();
        const body = operation();
        const mock = sub.mock.method(WalletRepository, 'creditWallet', async () => { throw new Error('Simulated credit failure'); });
        assert.equal((await request(`/pending-releases/${release.id}/release`, 'POST', body)).status, 500);
        mock.mock.restore();
        let balance = await db('wallets').where({ id: wallet.id }).first();
        assert.equal(balance.balance, '0.00'); assert.equal(balance.pending_balance, '7.80');
        assert.equal((await db('wallet_pending_releases').where({ id: release.id }).first()).status, 'pending');
        assert.equal((await db('admin_audit_logs').where({ request_id: body.request_id })).length, 0);
        await db('wallet_pending_releases').where({ id: release.id }).update({ release_at: new Date(0) });
        await Promise.all([AdminService.release(admin.id, release.id, body), WalletPendingBalanceService.release(release.id)]);
        balance = await db('wallets').where({ id: wallet.id }).first();
        assert.equal(balance.balance, '7.80'); assert.equal(balance.pending_balance, '0.00');
        assert.equal((await db('wallet_ledger_entries').where({ wallet_id: wallet.id, entry_type: 'pending_release' })).length, 2);
        assert.equal((await request('/audit')).status, 200);
        await assert.rejects(db.transaction(removeAdminOperations), /Cannot discard admin audit history/);
    });
});
