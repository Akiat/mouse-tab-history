import assert from "node:assert/strict";
import { test } from "node:test";

import { emptyHistory, forget, step, visit } from "./history.js";

const A = 1;
const B = 2;
const C = 3;
const D = 4;

function historyOf(...tabIds) {
  return tabIds.reduce(visit, emptyHistory());
}

function currentTab({ entries, index }) {
  return entries[index];
}

test("previous walks back through viewed tabs and next returns", () => {
  let history = historyOf(A, B, C);

  history = step(history, "previous");
  assert.equal(currentTab(history), B);
  history = step(history, "previous");
  assert.equal(currentTab(history), A);
  history = step(history, "next");
  assert.equal(currentTab(history), B);
});

test("stepping past either end stays on the current tab", () => {
  const history = historyOf(A, B);

  assert.equal(currentTab(step(history, "next")), B);
  assert.equal(currentTab(step(step(history, "previous"), "previous")), A);
});

test("activating the tab a step just reached records nothing", () => {
  const history = step(historyOf(A, B, C), "previous");

  assert.equal(visit(history, B), history);
});

test("viewing another tab after going back drops the forward tabs", () => {
  const history = visit(step(historyOf(A, B, C), "previous"), D);

  assert.deepEqual(history.entries, [A, B, D]);
  assert.equal(step(history, "next"), history);
});

test("a closed tab is skipped", () => {
  const history = forget(historyOf(A, B, C), B);

  assert.equal(currentTab(step(history, "previous")), A);
});

test("closing a tab between two visits of the same tab keeps steps meaningful", () => {
  const history = forget(historyOf(A, B, C, B), C);

  assert.deepEqual(history.entries, [A, B]);
  assert.equal(currentTab(history), B);
});
