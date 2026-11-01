import { strict as assert } from "node:assert";
import { test } from "node:test";
import { BachsProvider } from "./BachsProvider";

const transfer = {
    amount: 1234,
    recipient_code: "pd_test",
    reference: "withdraw_test_001",
    currency: "USD",
};

test("USD withdrawals quote the source amount and create a payout with only quote_id", async (t) => {
    t.mock.method(console, "log", () => {});
    const requests: { path: string; init: RequestInit }[] = [];
    t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
        requests.push({ path: new URL(url).pathname, init });
        return Response.json(requests.length === 1
            ? { quote_id: "pqt_test", from_currency: "USD", to_currency: "NGN", from_amount: "12.34" }
            : { id: "pay_test", reference: transfer.reference, status: "pending" });
    });

    const result = await new BachsProvider().initiateTransfer(transfer);

    assert.equal(requests.length, 2);
    assert.equal(requests[0]!.path, "/v1/payouts/quotes");
    assert.deepEqual(JSON.parse(requests[0]!.init.body as string), {
        from_currency: "USD", to_currency: "NGN", amount: "12.34",
    });
    assert.equal(requests[1]!.path, "/v1/payouts");
    assert.deepEqual(JSON.parse(requests[1]!.init.body as string), {
        destination: "pd_test", quote_id: "pqt_test", reference: transfer.reference,
    });
    assert.equal(new Headers(requests[1]!.init.headers).get("Idempotency-Key"), transfer.reference);
    assert.equal(result.status, "pending");
});

test("NGN withdrawals skip the quote and send the destination amount as a decimal string", async (t) => {
    t.mock.method(console, "log", () => {});
    const requests: { path: string; body: unknown }[] = [];
    t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
        requests.push({ path: new URL(url).pathname, body: JSON.parse(init.body as string) });
        return Response.json({ id: "pay_test", status: "completed" });
    });

    const result = await new BachsProvider().initiateTransfer({ ...transfer, currency: "NGN", amount: 100000 });

    assert.deepEqual(requests, [{ path: "/v1/payouts", body: {
        destination: "pd_test", amount: "1000.00", reference: transfer.reference,
    } }]);
    assert.equal(result.status, "success");
});

test("payout 400 errors retain Bachs' business-rule code and explanation", async (t) => {
    t.mock.method(console, "log", () => {});
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => {
        calls++;
        return calls === 1
            ? Response.json({ quote_id: "pqt_test" })
            : Response.json({
                error_code: "INSUFFICIENT_BALANCE",
                detail: "Required USD 12.44, available USD 12.34",
            }, { status: 400 });
    });

    await assert.rejects(new BachsProvider().initiateTransfer(transfer), {
        message: "Bachs request failed (400) [INSUFFICIENT_BALANCE]: Required USD 12.44, available USD 12.34",
    });
    assert.equal(calls, 2);
});

test("a rejected quote preserves field errors and never submits a payout", async (t) => {
    t.mock.method(console, "log", () => {});
    const errors = [{ field: "amount", message: "Amount must be a positive decimal string", type: "value_error" }];
    const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({
        error_code: "VALIDATION_ERROR", detail: "Invalid request parameters", errors,
    }, { status: 400 }));

    await assert.rejects(new BachsProvider().initiateTransfer(transfer), {
        message: `Bachs request failed (400) [VALIDATION_ERROR]: Invalid request parameters; ${JSON.stringify(errors)}`,
    });
    assert.equal(fetchMock.mock.callCount(), 1);
});

test("withdrawal limit errors retain the structured limit details", async (t) => {
    t.mock.method(console, "log", () => {});
    const details = { currency: "NGN", requested_amount: "1000.00", max_allowed: "500.00" };
    t.mock.method(globalThis, "fetch", async () => Response.json({
        error_code: "WITHDRAWAL_LIMIT_EXCEEDED", detail: "Withdrawal limit exceeded", details,
    }, { status: 400 }));

    await assert.rejects(new BachsProvider().initiateTransfer({ ...transfer, currency: "NGN", amount: 100000 }), {
        message: `Bachs request failed (400) [WITHDRAWAL_LIMIT_EXCEEDED]: Withdrawal limit exceeded; ${JSON.stringify(details)}`,
    });
});
