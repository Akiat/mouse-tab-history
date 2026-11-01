// Content scripts are classic scripts, so they cannot import this file as a module.
globalThis.mouseTabHistoryShortcuts = (() => {
  const STORAGE_KEY = "mouseShortcuts";
  const DIRECTIONS = ["previous", "next"];
  const MODIFIERS = ["ctrlKey", "altKey", "shiftKey", "metaKey"];
  const BUTTON_NAMES = { 3: "Back button", 4: "Forward button" };
  const MAC_MODIFIER_NAMES = { ctrlKey: "⌃", altKey: "⌥", shiftKey: "⇧", metaKey: "⌘" };
  const MODIFIER_NAMES = { ctrlKey: "Ctrl", altKey: "Alt", shiftKey: "Shift", metaKey: "Meta" };

  function isMac(platform) {
    return platform.startsWith("Mac");
  }

  function defaults(platform = navigator.platform) {
    const modifier = isMac(platform) ? "metaKey" : "ctrlKey";
    return { previous: { button: 3, [modifier]: true }, next: { button: 4, [modifier]: true } };
  }

  // Mouse events have the same fields as a stored shortcut, so either can be passed.
  function isSame(a, b) {
    return (
      a.button === b.button &&
      MODIFIERS.every((modifier) => Boolean(a[modifier]) === Boolean(b[modifier]))
    );
  }

  function directionFor(shortcuts, event) {
    return DIRECTIONS.find((direction) => isSame(shortcuts[direction], event));
  }

  function isSideButton(event) {
    return event.button in BUTTON_NAMES;
  }

  function shortcutFrom(event) {
    return Object.fromEntries(["button", ...MODIFIERS].map((field) => [field, event[field]]));
  }

  function label(shortcut, platform = navigator.platform) {
    const names = isMac(platform) ? MAC_MODIFIER_NAMES : MODIFIER_NAMES;
    const held = MODIFIERS.filter((modifier) => shortcut[modifier]).map((modifier) => names[modifier]);
    return [...held, BUTTON_NAMES[shortcut.button]].join(" + ");
  }

  async function load() {
    const stored = await chrome.storage.sync.get(STORAGE_KEY);
    return stored[STORAGE_KEY] ?? defaults();
  }

  function save(shortcuts) {
    return chrome.storage.sync.set({ [STORAGE_KEY]: shortcuts });
  }

  function reset() {
    return chrome.storage.sync.remove(STORAGE_KEY);
  }

  function onChange(listener) {
    chrome.storage.sync.onChanged.addListener((changes) => {
      if (STORAGE_KEY in changes) listener(changes[STORAGE_KEY].newValue ?? defaults());
    });
  }

  return {
    defaults,
    directionFor,
    isSame,
    isSideButton,
    label,
    load,
    onChange,
    reset,
    save,
    shortcutFrom,
  };
})();
