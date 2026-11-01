const MAX_ENTRIES = 200;

export function emptyHistory() {
  return { entries: [], index: -1 };
}

export function visit(history, tabId) {
  if (history.entries[history.index] === tabId) return history;
  const entries = [...history.entries.slice(0, history.index + 1), tabId].slice(-MAX_ENTRIES);
  return { entries, index: entries.length - 1 };
}

export function step(history, direction) {
  const index = history.index + (direction === "previous" ? -1 : 1);
  const inRange = index >= 0 && index < history.entries.length;
  return inRange ? { ...history, index } : history;
}

export function forget(history, tabId) {
  const entries = [];
  let index = -1;
  history.entries.forEach((id, position) => {
    // Dropping a tab can leave its neighbours equal, and a step between them would do nothing.
    if (id !== tabId && id !== entries.at(-1)) entries.push(id);
    if (position === history.index) index = entries.length - 1;
  });
  return { entries, index };
}
