import { strict as assert } from "node:assert";
import { test } from "node:test";
import { normalizeDisplayName } from "./display-name";

test("normalizes a display name without changing existing-name fields", () => {
    assert.equal(normalizeDisplayName("  Olayimika  "), "Olayimika");
});

test("allows a creator to clear a display name", () => {
    assert.equal(normalizeDisplayName(null), null);
    assert.equal(normalizeDisplayName("   "), null);
});

test("keeps an omitted display name distinct from an explicit clear", () => {
    assert.equal(normalizeDisplayName(undefined), undefined);
});
