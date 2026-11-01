import { emptyHistory, forget, step, visit } from "./history.js";

// The service worker stops between events, so the histories must outlive it.
const histories = chrome.storage.session
  .get("histories")
  .then(({ histories = {} }) => histories);

async function updateHistory(windowId, change) {
  const all = await histories;
  all[windowId] = change(all[windowId] ?? emptyHistory());
  await chrome.storage.session.set({ histories: all });
  return all[windowId];
}

async function move(windowId, direction) {
  // The index moves before the tab does, so the resulting onActivated finds it already current.
  const { entries, index } = await updateHistory(windowId, (history) => step(history, direction));
  if (index >= 0) await chrome.tabs.update(entries[index], { active: true });
}

async function recordActiveTabs() {
  const tabs = await chrome.tabs.query({ active: true });
  await Promise.all(
    tabs.map((tab) => updateHistory(tab.windowId, (history) => visit(history, tab.id))),
  );
}

async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({});
  // allSettled because browser pages and discarded tabs refuse injection.
  await Promise.allSettled(
    tabs.map((tab) =>
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["shortcuts.js", "content.js"],
      }),
    ),
  );
}

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  updateHistory(windowId, (history) => visit(history, tabId));
});

chrome.tabs.onRemoved.addListener((tabId, { windowId }) => {
  updateHistory(windowId, (history) => forget(history, tabId));
});

chrome.tabs.onDetached.addListener((tabId, { oldWindowId }) => {
  updateHistory(oldWindowId, (history) => forget(history, tabId));
});

chrome.runtime.onMessage.addListener(({ direction }, sender) => {
  if (sender.tab) move(sender.tab.windowId, direction);
});

chrome.commands.onCommand.addListener(async (direction) => {
  const { id } = await chrome.windows.getLastFocused();
  await move(id, direction);
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.runtime.onStartup.addListener(recordActiveTabs);

chrome.runtime.onInstalled.addListener(({ reason }) => {
  recordActiveTabs();
  injectIntoOpenTabs();
  // Nothing else tells new users that mouse shortcuts only work over web pages.
  if (reason === "install") chrome.runtime.openOptionsPage();
});
