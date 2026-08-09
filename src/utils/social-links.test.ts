import { strict as assert } from "node:assert";
import { test } from "node:test";
import { normalizeSocialLinks } from "./social-links";

test("normalizes platforms, URLs, visibility, and input ordering", () => {
    assert.deepEqual(normalizeSocialLinks([
        { platform: " Instagram ", url: "instagram.com/linkverse" },
        { platform: "email", url: " Creator@Example.com ", is_visible: false },
    ]), [
        { platform: "instagram", url: "https://instagram.com/linkverse", is_visible: true },
        { platform: "email", url: "mailto:creator@example.com", is_visible: false },
    ]);
});

test("rejects duplicate platforms and unsafe URL protocols", () => {
    assert.throws(() => normalizeSocialLinks([
        { platform: "x", url: "https://x.com/linkverse" },
        { platform: "X", url: "https://x.com/creatorlink" },
    ]), /only be added once/);

    assert.throws(() => normalizeSocialLinks([
        { platform: "website", url: "javascript:alert(1)" },
    ]), /http or https/);
});
