import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import Knex from 'knex';
import { up as createWallets } from '../migrations/20260123100001_create_wallets_table';
import { up as createTransactions } from '../migrations/20260123100002_create_transactions_table';
import { up as createLedger } from '../migrations/20260809000009_add_wallet_ledger_and_webhook_events';
import { up as multiCurrency } from '../migrations/20260809000011_add_multi_currency_wallets';
import { up as allowFees, down as disallowFees } from '../migrations/20261101000000_add_gift_fee_transaction_type';
import { calculateGiftFee } from '../utils/gift-fee';
import { up as createUsers } from '../migrations/20260112123314_create_user_table';
import { up as addIsBlocked } from '../migrations/20261105000000_add_is_blocked_to_users';
import { getResponseStatus } from '../utils/response';
import { up as addPendingBalances } from '../migrations/20261101000003_add_pending_wallet_balances';
import { UNKNOWN_PAYMENT_METHOD } from '../utils/payment-method';

// Run against a disposable schema, never the application's existing tables.
test('gift fee accounting in PostgreSQL', { skip: !process.env.GIFT_FEE_TEST_DATABASE_URL }, async (t) => {
    const connection = new URL(process.env.GIFT_FEE_TEST_DATABASE_URL!);
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname), 'Use a local test database');
    const admin = Knex({ client: 'pg', connection: connection.toString() });
    const schema = `gift_fee_test_${process.pid}_${Date.now()}`;
    connection.searchParams.set('options', `-c search_path=${schema}`);
    process.env.DATABASE_URL = connection.toString();
    process.env.GIFT_FEE_PERCENT = '2';
    const { default: db } = await import('../db/knex');
    t.after(async () => {
        await db.destroy();
        await admin.schema.dropSchemaIfExists(schema, true);
        await admin.destroy();
    });
    await admin.schema.createSchema(schema);
    await createUsers(db);
    await addIsBlocked(db);
    await db.schema.createTable('creators', (table) => {
        table.increments('id');
        table.string('username');
        table.integer('user_id').references('id').inTable('users');
    });
    await createWallets(db);
    await createTransactions(db);
    await createLedger(db);
    await multiCurrency(db);
    await addPendingBalances(db);
    await db.transaction(allowFees);
    await db.transaction(disallowFees);
    await db.transaction(allowFees);
    // Exercise the older native PostgreSQL enum installation as well.
    await db.raw(`
        CREATE TYPE legacy_transaction_type AS ENUM ('gift', 'withdrawal', 'store');
        ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
        ALTER TABLE transactions ALTER COLUMN type TYPE legacy_transaction_type USING type::legacy_transaction_type;
    `);
    await db.transaction(allowFees);

    const { GiftSettlementService } = await import('./gift-settlement.service');
    const { GiftService } = await import('./gift.service');
    const { WalletRepository } = await import('../repositories/WalletRepository');
    const { TransactionRepository } = await import('../repositories/TransactionRepository');
    const { CreatorRepository } = await import('../repositories/CreatorRepository');
    const { WalletPendingBalanceService } = await import('./wallet-pending-balance.service');
    const { BachsProvider, PaystackProvider, setPaymentProvider } = await import('../providers/PaymentProviderFactory');
    t.mock.method(console, 'log', () => {});
    t.mock.method(CreatorRepository, 'getOneWhere', async () => undefined);
    t.mock.method(BachsProvider.prototype, 'verifyWebhookSignature', () => true);
    t.mock.method(BachsProvider.prototype, 'resolvePaymentMethod', async () => UNKNOWN_PAYMENT_METHOD);
    t.mock.method(WalletPendingBalanceService, 'enqueueTransaction', async () => {});

    async function totalBalance(walletId: number): Promise<number> {
        const wallet = await db('wallets').where({ id: walletId }).first();
        return Number(wallet.balance) + Number(wallet.pending_balance);
    }

    async function fixture(currency = 'USD', amount = 10, percent: number | null = 2) {
        const reference = `gift_test_${Date.now()}_${Math.random()}`;
        const [user] = await db('users').insert({ email: `${reference}@example.test`, password_hash: 'unused' }).returning('*');
        const [creator] = await db('creators').insert({ username: reference, user_id: user.id }).returning('*');
        const wallet = await WalletRepository.createForCreator(creator.id, currency);
        const gift = await TransactionRepository.create({
            wallet_id: wallet.id, type: 'gift', amount, currency, status: 'pending',
            reference, provider: 'bachs',
            metadata: percent === null ? {} : { gift_fee: calculateGiftFee(amount, percent) },
        });
        return { gift, wallet, creator, user };
    }

    for (const [currency, amount, expectedFee] of [['USD', 10, 0.2], ['NGN', 1000, 20]] as const) {
        await t.test(`${currency} records a full gift credit followed by a fee debit`, async () => {
            const { gift, wallet } = await fixture(currency, amount);
            assert.equal(await GiftSettlementService.complete(gift.id, 'provider_reference'), true);
            const updated = await db('wallets').where({ id: wallet.id }).first();
            assert.equal(Number(updated.balance), currency === 'USD' ? 0 : amount - expectedFee);
            assert.equal(Number(updated.pending_balance), currency === 'USD' ? amount - expectedFee : 0);
            const fee = await db('transactions').where({ wallet_id: wallet.id, type: 'fee' }).first();
            assert.equal(Number(fee.amount), expectedFee);
            assert.equal(fee.currency, currency);
            assert.equal(fee.status, 'completed');
            assert.equal(fee.metadata.gift_transaction_id, gift.id);
            const ledger = await db('wallet_ledger_entries').where({ wallet_id: wallet.id }).orderBy('id');
            assert.deepEqual(ledger.map((entry) => [entry.direction, Number(entry.amount), Number(entry.balance_after)]), [
                ['credit', amount, amount], ['debit', expectedFee, amount - expectedFee],
            ]);
            assert.equal(ledger[1].transaction_id, fee.id);
            const completed = await TransactionRepository.getByReference(gift.reference);
            assert.equal(completed?.status, 'completed');
            assert.equal(completed?.provider_reference, 'provider_reference');
        });
    }

    await t.test('concurrent retries credit the gift and charge the fee once', async () => {
        const { gift, wallet } = await fixture();
        const results = await Promise.all(Array.from({ length: 4 }, () => GiftSettlementService.complete(gift.id)));
        assert.equal(results.filter(Boolean).length, 1);
        assert.equal(await db('transactions').where({ wallet_id: wallet.id }).count().first().then((r) => Number(r!.count)), 2);
        assert.equal(await totalBalance(wallet.id), 9.8);
    });

    await t.test('a failed fee debit rolls back the credit and fee record, and can be retried', async (sub) => {
        const { gift, wallet } = await fixture();
        const debit = sub.mock.method(WalletRepository, 'debitWallet', async () => { throw new Error('Simulated failure'); });
        await assert.rejects(GiftSettlementService.complete(gift.id), /Simulated failure/);
        assert.equal(await totalBalance(wallet.id), 0);
        assert.equal((await TransactionRepository.getByReference(gift.reference))?.status, 'pending');
        assert.deepEqual(await db('transactions').where({ wallet_id: wallet.id, type: 'fee' }), []);
        assert.deepEqual(await db('wallet_ledger_entries').where({ wallet_id: wallet.id }), []);
        debit.mock.restore();
        assert.equal(await GiftSettlementService.complete(gift.id), true);
    });

    await t.test('saved rates, disabled fees and legacy pending gifts are respected', async () => {
        for (const [percent, balance] of [[5, 9.5], [0, 10], [null, 10]] as const) {
            const { gift, wallet } = await fixture('USD', 10, percent);
            await GiftSettlementService.complete(gift.id);
            assert.equal(await totalBalance(wallet.id), balance);
            const fees = await db('transactions').where({ wallet_id: wallet.id, type: 'fee' });
            assert.equal(fees.length, percent ? 1 : 0);
        }
    });

    await t.test('Bachs converted settlement events and later duplicate events retain the saved USD fee', async () => {
        const { gift, wallet } = await fixture();
        for (const id of ['event_one', 'event_one', 'event_two']) {
            const body = { id: `${id}_${gift.id}`, type: 'collection.succeeded', data: {
                settlement_amount: '15000', settlement_currency: 'NGN', status: 'succeeded',
                metadata: { creatorlink_reference: gift.reference },
            } };
            const result = await GiftService.handleWebhook('bachs', JSON.stringify(body), 'signature', body, 'timestamp');
            assert.equal(result.success, true);
        }
        assert.equal(await totalBalance(wallet.id), 9.8);
        assert.equal((await db('wallet_ledger_entries').where({ wallet_id: wallet.id })).length, 2);
        assert.ok((await db('payment_webhook_events')).every((event) => event.status === 'processed'));
    });

    await t.test('Bachs amount mismatches leave the gift and wallet untouched', async (sub) => {
        sub.mock.method(console, 'error', () => {});
        const { gift, wallet } = await fixture();
        const body = { id: `mismatch_${gift.id}`, type: 'checkout.completed', data: {
            amount: '9', currency: 'USD', reference: gift.reference,
        } };
        const result = await GiftService.handleWebhook('bachs', JSON.stringify(body), 'signature', body, 'timestamp');
        assert.equal(result.success, false);
        assert.equal(await totalBalance(wallet.id), 0);
        assert.equal((await TransactionRepository.getByReference(gift.reference))?.status, 'pending');
        assert.deepEqual(await db('wallet_ledger_entries').where({ wallet_id: wallet.id }), []);
    });

    await t.test('a failed webhook can retry the same event without leaving partial accounting', async (sub) => {
        sub.mock.method(console, 'error', () => {});
        const { gift, wallet } = await fixture();
        const body = { id: `retry_${gift.id}`, type: 'checkout.completed', data: {
            amount: '10', currency: 'USD', reference: gift.reference,
        } };
        const debit = sub.mock.method(WalletRepository, 'debitWallet', async () => { throw new Error('Simulated failure'); });
        assert.equal((await GiftService.handleWebhook('bachs', JSON.stringify(body), 'signature', body, 'timestamp')).success, false);
        assert.equal(await totalBalance(wallet.id), 0);
        assert.deepEqual(await db('transactions').where({ wallet_id: wallet.id, type: 'fee' }), []);
        debit.mock.restore();
        assert.equal((await GiftService.handleWebhook('bachs', JSON.stringify(body), 'signature', body, 'timestamp')).success, true);
        assert.equal(await totalBalance(wallet.id), 9.8);
        assert.equal((await db('transactions').where({ wallet_id: wallet.id, type: 'fee' })).length, 1);
        assert.equal((await db('payment_webhook_events').where({ event_id: body.id }).first()).status, 'processed');
    });

    await t.test('initialization saves the configured fee and charges only the gift amount', async (sub) => {
        const { creator } = await fixture();
        setPaymentProvider('bachs');
        const checkout = sub.mock.method(BachsProvider.prototype, 'initializePayment', async () => ({
            success: true, authorization_url: 'https://example.test/checkout', reference: 'checkout_test',
        }));
        const result = await GiftService.initiateGift(creator.username, {
            amount: 1000, currency: 'NGN', sender_email: 'test@example.test',
        });
        assert.equal(result.success, true);
        const data = result.data!;
        assert.equal(data.fee_amount, 20);
        assert.equal(data.net_amount, 980);
        assert.equal(checkout.mock.calls[0]!.arguments[0]!.amount, 100000);
        const saved = await db('transactions').where({ id: data.transaction_id }).first();
        assert.deepEqual(saved.metadata.gift_fee, { rate_percent: 2, amount_minor: 2000 });
        assert.equal(Number(saved.amount), 1000);
    });

    await t.test('the redirect verification path also deducts the fee exactly once', async (sub) => {
        const { gift, wallet } = await fixture();
        setPaymentProvider('paystack');
        sub.mock.method(PaystackProvider.prototype, 'verifyPayment', async () => ({
            success: true, status: 'success' as const, amount: 1000, reference: gift.reference,
        }));
        assert.equal((await GiftService.verifyGiftPayment(gift.reference)).success, true);
        assert.equal((await GiftService.verifyGiftPayment(gift.reference)).success, true);
        assert.equal(await totalBalance(wallet.id), 9.8);
        assert.equal((await db('transactions').where({ wallet_id: wallet.id, type: 'fee' })).length, 1);
    });

    await t.test('blocked creators cannot initialize gifts or create payment side effects', async (sub) => {
        const { creator, user, wallet } = await fixture('NGN', 1000);
        await db('users').where({ id: user.id }).update({ is_blocked: true });
        setPaymentProvider('bachs');
        const checkout = sub.mock.method(BachsProvider.prototype, 'initializePayment', async () => {
            throw new Error('Blocked creators must never reach checkout');
        });
        const result = await GiftService.initiateGift(creator.username, {
            amount: 1000, currency: 'NGN', sender_email: 'test@example.test',
        });
        assert.equal(getResponseStatus(result), 404);
        assert.equal(checkout.mock.callCount(), 0);
        assert.equal((await db('wallets').where({ creator_id: creator.id })).length, 1);
        assert.equal((await db('transactions').where({ wallet_id: wallet.id })).length, 1);
    });

    for (const [currency, amount] of [['NGN', 1000], ['USD', 10]] as const) {
        await t.test(`${currency} blocking after checkout prevents direct, redirect and webhook credits until unblocked`, async (sub) => {
            sub.mock.method(console, 'error', () => {});
            const { gift, wallet, user } = await fixture(currency, amount);
            await db('users').where({ id: user.id }).update({ is_blocked: true });
            await assert.rejects(GiftSettlementService.complete(gift.id), /Creator not found/);
            setPaymentProvider('paystack');
            sub.mock.method(PaystackProvider.prototype, 'verifyPayment', async () => ({
                success: true, status: 'success' as const, amount: amount * 100, reference: gift.reference,
            }));
            assert.equal(getResponseStatus(await GiftService.verifyGiftPayment(gift.reference)), 404);
            const body = { id: `blocked_${gift.id}`, type: 'checkout.completed', data: {
                amount: String(amount), currency, reference: gift.reference,
            } };
            const result = await GiftService.handleWebhook('bachs', JSON.stringify(body), 'signature', body, 'timestamp');
            assert.equal(getResponseStatus(result), 404);
            assert.equal(await totalBalance(wallet.id), 0);
            assert.equal((await TransactionRepository.getByReference(gift.reference))?.status, 'pending');
            assert.deepEqual(await db('transactions').where({ wallet_id: wallet.id, type: 'fee' }), []);
            assert.deepEqual(await db('wallet_ledger_entries').where({ wallet_id: wallet.id }), []);
            assert.deepEqual(await db('wallet_pending_releases').where({ wallet_id: wallet.id }), []);
            assert.equal((await db('payment_webhook_events').where({ event_id: body.id }).first()).status, 'failed');

            await db('users').where({ id: user.id }).update({ is_blocked: false });
            assert.equal((await GiftService.handleWebhook('bachs', JSON.stringify(body), 'signature', body, 'timestamp')).success, true);
            assert.equal(await totalBalance(wallet.id), amount * 0.98);
        });
    }

    await t.test('fee history can be filtered and migrations preserve existing fee records', async () => {
        const fees = await TransactionRepository.getTransactionsForWallets(
            (await db('wallets').select('id')).map((wallet) => wallet.id), 100, 0, 'fee',
        );
        assert.ok(fees.length > 0);
        assert.ok(fees.every((entry) => entry.type === 'fee'));
        await assert.rejects(db.transaction(disallowFees), /transactions_type_check/);
        assert.equal((await db('transactions').where({ type: 'fee' })).length, fees.length);
    });
});
