// This file is injected again into open tabs on install and update, where a top-level const would throw.
(() => {
  const { defaults, directionFor, load, onChange } = globalThis.mouseTabHistoryShortcuts;
  let shortcuts = defaults();

  load().then((loaded) => {
    shortcuts = loaded;
  });
  onChange((changed) => {
    shortcuts = changed;
  });

  // Chromium navigates on mouseup: acting on mousedown would let the new tab catch the release.
  window.addEventListener(
    "mouseup",
    (event) => {
      // An update leaves the old script in open tabs without a runtime; it must not block the click.
      if (!chrome.runtime?.id || globalThis.mouseTabHistoryRecording) return;
      const direction = directionFor(shortcuts, event);
      if (!direction) return;
      event.preventDefault();
      chrome.runtime.sendMessage({ direction });
    },
    true,
  );
})();
