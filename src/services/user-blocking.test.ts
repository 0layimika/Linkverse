import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { Request, Response } from 'express';
import Knex from 'knex';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { up as createUsers } from '../migrations/20260112123314_create_user_table';
import { up as addVerified } from '../migrations/20260112125311_alter_user_table_add_verified_field';
import { up as createCreators } from '../migrations/20260112153724_create_creator_table';
import { up as addIsBlocked, down as removeIsBlocked } from '../migrations/20261105000000_add_is_blocked_to_users';
import { getResponseStatus } from '../utils/response';

const testDatabaseUrl = process.env.USER_BLOCKING_TEST_DATABASE_URL || process.env.GIFT_FEE_TEST_DATABASE_URL;

test('user blocking in PostgreSQL', { skip: !testDatabaseUrl }, async (t) => {
    const connection = new URL(testDatabaseUrl!);
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname), 'Use a local test database');
    const admin = Knex({ client: 'pg', connection: connection.toString() });
    const schema = `user_blocking_test_${process.pid}_${Date.now()}`;
    connection.searchParams.set('options', `-c search_path=${schema}`);
    process.env.DATABASE_URL = connection.toString();
    const { default: db } = await import('../db/knex');
    t.after(async () => {
        await db.destroy();
        await admin.schema.dropSchemaIfExists(schema, true);
        await admin.destroy();
    });
    await admin.schema.createSchema(schema);
    await createUsers(db);
    await addVerified(db);
    await createCreators(db);
    const password = 'blocking-test-password';
    const [user] = await db('users').insert({
        email: 'blocking@example.test', password_hash: await bcrypt.hash(password, 4), verified: true,
    }).returning('*');
    await addIsBlocked(db);

    const { AuthService } = await import('./auth.service');
    const { auth } = await import('../middlewares/auth.middleware');
    const { JWT_SECRET } = await import('../config/env');
    const { CreatorRepository } = await import('../repositories/CreatorRepository');
    const { CreatorService } = await import('./creator.service');
    const { ProfileService } = await import('./profile.service');
    const { ProfileController } = await import('../controllers/profile.controller');
    const { LinkRepository } = await import('../repositories/LinkRepository');
    const { ProfileConfigRepository } = await import('../repositories/ProfileConfigRepository');
    const { CreatorSocialLinkRepository } = await import('../repositories/CreatorSocialLinkRepository');

    function response() {
        const result = { statusCode: 200, body: undefined as any };
        const res = {
            status(code: number) { result.statusCode = code; return this; },
            json(body: unknown) { result.body = body; return this; },
        } as Response;
        return { result, res };
    }

    await t.test('the migration defaults existing and new users to unblocked and rejects null', async () => {
        assert.equal((await db('users').where({ id: user.id }).first()).is_blocked, false);
        const [newUser] = await db('users').insert({ email: 'new@example.test', password_hash: 'unused' }).returning('*');
        assert.equal(newUser.is_blocked, false);
        await assert.rejects(db('users').where({ id: newUser.id }).update({ is_blocked: null }), /not-null/);
        await db.transaction(async (trx) => {
            await removeIsBlocked(trx);
            await addIsBlocked(trx);
            assert.equal((await trx('users').where({ id: user.id }).first()).is_blocked, false);
        });
    });

    await t.test('blocking denies login for users with or without a creator profile', async () => {
        assert.equal((await AuthService.login({ email: user.email, password })).success, true);
        await db('users').where({ id: user.id }).update({ is_blocked: true });
        assert.equal(getResponseStatus(await AuthService.login({ email: user.email, password })), 403);
        await db('creators').insert({ username: 'blocked_creator', user_id: user.id });
        assert.equal(getResponseStatus(await AuthService.login({ email: user.email, password })), 403);
        await db('users').where({ id: user.id }).update({ is_blocked: false });
        assert.equal((await AuthService.login({ email: user.email, password })).success, true);
    });

    await t.test('an existing token stops working immediately after blocking and works after unblocking', async () => {
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        async function authenticate() {
            const { res, result } = response();
            let calledNext = false;
            await auth({ headers: { authorization: `Bearer ${token}` } } as Request, res, () => { calledNext = true; });
            return { ...result, calledNext };
        }
        assert.equal((await authenticate()).calledNext, true);
        await db('users').where({ id: user.id }).update({ is_blocked: true });
        const denied = await authenticate();
        assert.equal(denied.statusCode, 403);
        assert.equal(denied.calledNext, false);
        await db('users').where({ id: user.id }).update({ is_blocked: false });
        assert.equal((await authenticate()).calledNext, true);
    });

    await t.test('account verification cannot issue an access token to a blocked user', async () => {
        await db('users').where({ id: user.id }).update({ is_blocked: true, verified: false });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        const result = await AuthService.verify(token);
        assert.equal(getResponseStatus(result), 403);
        assert.equal((await db('users').where({ id: user.id }).first()).verified, false);
        await db('users').where({ id: user.id }).update({ is_blocked: false, verified: true });
    });

    await t.test('blocked profiles and QR codes are hidden while their usernames stay reserved', async (sub) => {
        sub.mock.method(LinkRepository, 'getActiveLinksForCreator', async () => []);
        sub.mock.method(ProfileConfigRepository, 'getByCreatorId', async () => undefined);
        sub.mock.method(CreatorSocialLinkRepository, 'listVisibleForCreator', async () => []);
        assert.ok(await CreatorRepository.findPublicByUsername(' BLOCKED_CREATOR '));
        assert.equal((await ProfileService.getPublicProfile('blocked_creator')).success, true);
        await db('users').where({ id: user.id }).update({ is_blocked: true });
        assert.equal(await CreatorRepository.findPublicByUsername('blocked_creator'), undefined);
        assert.ok(await CreatorRepository.findByUsername('blocked_creator'));
        assert.equal(getResponseStatus(await ProfileService.getPublicProfile('blocked_creator')), 404);
        const { res, result } = response();
        await ProfileController.getQRCode({ params: { username: 'blocked_creator' } } as unknown as Request, res);
        assert.equal(result.statusCode, 404);
        assert.equal(getResponseStatus(await CreatorService.createCreator(user.id, { username: 'blocked_creator' })), 400);
        await db('users').where({ id: user.id }).update({ is_blocked: false });
        assert.equal((await ProfileService.getPublicProfile('blocked_creator')).success, true);
    });
});
