const HOST = "com.reporter.edge";
let port = null;

function connect() {
  port = chrome.runtime.connectNative(HOST);
  port.onDisconnect.addListener(() => { port = null; });
}

function send(url) {
  if (!port) connect();
  try {
    port.postMessage({ url: url || null });
  } catch (e) {
    port = null;
  }
}

async function reportActive() {
  try {
    const win = await chrome.windows.getLastFocused({ populate: true });
    if (!win || !win.focused) { send(null); return; }
    const tab = (win.tabs || []).find((t) => t.active);
    send(tab ? tab.url : null);
  } catch (e) {
    send(null);
  }
}

chrome.tabs.onActivated.addListener(reportActive);

chrome.tabs.onUpdated.addListener((_id, info, tab) => {
  if (tab.active && (info.url || info.status === "complete")) reportActive();
});

chrome.windows.onFocusChanged.addListener((winId) => {
  if (winId === chrome.windows.WINDOW_ID_NONE) send(null);
  else reportActive();
});

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener((state) => {
  if (state === "active") reportActive();
  else send(null);
});

connect();
reportActive();
