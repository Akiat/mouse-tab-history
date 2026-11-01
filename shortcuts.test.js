import assert from "node:assert/strict";
import { test } from "node:test";

import "./shortcuts.js";

const { defaults, directionFor, label } = globalThis.mouseTabHistoryShortcuts;

const MAC = "MacIntel";
const WINDOWS = "Win32";

function press(button, modifiers = {}) {
  return { button, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...modifiers };
}

test("defaults use Cmd on macOS and Ctrl elsewhere", () => {
  assert.equal(directionFor(defaults(MAC), press(3, { metaKey: true })), "previous");
  assert.equal(directionFor(defaults(WINDOWS), press(4, { ctrlKey: true })), "next");
});

test("a side button without the modifier stays the browser's page navigation", () => {
  assert.equal(directionFor(defaults(MAC), press(3)), undefined);
});

test("an extra modifier does not match, so other combinations stay free", () => {
  assert.equal(directionFor(defaults(MAC), press(3, { metaKey: true, shiftKey: true })), undefined);
});

test("labels use each platform's modifier names", () => {
  const shortcut = press(3, { shiftKey: true, metaKey: true });

  assert.equal(label(shortcut, MAC), "⇧ + ⌘ + Back button");
  assert.equal(label(press(4, { ctrlKey: true }), WINDOWS), "Ctrl + Forward button");
});
