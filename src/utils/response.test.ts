import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getResponseStatus } from "./response";

test("maps underscore-form API-kit not-found errors to HTTP 404", () => {
    assert.equal(getResponseStatus({
        success: false,
        error: { code: "NOT_FOUND", message: "Creator not found" },
    } as any), 404);
});
