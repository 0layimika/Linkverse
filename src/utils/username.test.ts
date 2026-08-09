import { strict as assert } from "node:assert";
import { test } from "node:test";
import { normalizeUsername } from "./username";

test("canonicalizes username case and surrounding whitespace", () => {
    assert.equal(normalizeUsername("  OLAYIMIKA "), "olayimika");
});
