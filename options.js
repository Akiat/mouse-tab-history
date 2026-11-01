const { isSame, isSideButton, label, load, onChange, reset, save, shortcutFrom } =
  globalThis.mouseTabHistoryShortcuts;

const DIRECTIONS = ["previous", "next"];
const OPPOSITE = { previous: "next", next: "previous" };
const status = document.getElementById("mouse-status");

let shortcuts = await load();

function render() {
  for (const direction of DIRECTIONS) {
    const button = document.getElementById(`${direction}-button`);
    const recording = globalThis.mouseTabHistoryRecording === direction;
    button.textContent = recording ? "Press a side button…" : label(shortcuts[direction]);
    button.classList.toggle("recording", recording);
  }
}

function stopRecording(message) {
  globalThis.mouseTabHistoryRecording = null;
  status.textContent = message;
  render();
}

async function record(direction, event) {
  const shortcut = shortcutFrom(event);
  const opposite = OPPOSITE[direction];
  if (isSame(shortcut, shortcuts[opposite])) {
    status.textContent = `${label(shortcut)} is already your ${opposite} tab shortcut.`;
    return;
  }
  shortcuts = { ...shortcuts, [direction]: shortcut };
  await save(shortcuts);
  stopRecording("Saved.");
}

async function renderKeyboardShortcuts() {
  const commands = await chrome.commands.getAll();
  for (const { name, shortcut } of commands) {
    if (DIRECTIONS.includes(name)) {
      document.getElementById(`${name}-keys`).textContent = shortcut || "Not set";
    }
  }
}

for (const direction of DIRECTIONS) {
  document.getElementById(`${direction}-button`).addEventListener("click", () => {
    globalThis.mouseTabHistoryRecording = direction;
    status.textContent = "Press Esc to cancel.";
    render();
  });
}

// mouseup is where the browser would go back a page, so it has to be cancelled here.
window.addEventListener(
  "mouseup",
  (event) => {
    const direction = globalThis.mouseTabHistoryRecording;
    if (!direction) return;
    if (!isSideButton(event)) {
      stopRecording("");
      return;
    }
    event.preventDefault();
    record(direction, event);
  },
  true,
);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && globalThis.mouseTabHistoryRecording) stopRecording("");
});

document.getElementById("reset").addEventListener("click", async () => {
  await reset();
  status.textContent = "Reset to defaults.";
});

document.getElementById("open-shortcuts").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

// The page stays open while the user edits keyboard shortcuts in another tab.
window.addEventListener("focus", renderKeyboardShortcuts);

onChange((changed) => {
  shortcuts = changed;
  render();
});

render();
renderKeyboardShortcuts();
