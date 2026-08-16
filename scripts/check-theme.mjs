import assert from "node:assert/strict";
import { resolveColorTheme } from "../src/theme.ts";

assert.equal(resolveColorTheme("light", true), "light", "explicit light must override the system theme");
assert.equal(resolveColorTheme("dark", false), "dark", "explicit dark must override the system theme");
assert.equal(resolveColorTheme(null, true), "dark", "dark system preference should be honored initially");
assert.equal(resolveColorTheme(null, false), "light", "light system preference should be honored initially");
assert.equal(resolveColorTheme("unknown", true), "dark", "invalid stored values must fall back to the system theme");

console.log("Theme contract checks passed.");
