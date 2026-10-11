const { BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');

let overlays = [];
let widgetSize = null;
let onDone = null;

// Center the widget on the clicked point, kept inside the display's work area.
function boundsFor(point, size, workArea) {
  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
  return {
    x: clamp(Math.round(point.x - size.width / 2), workArea.x, workArea.x + workArea.width - size.width),
    y: clamp(Math.round(point.y - size.height / 2), workArea.y, workArea.y + workArea.height - size.height),
    width: size.width,
    height: size.height
  };
}

function isActive() {
  return overlays.length > 0;
}

function finish(bounds) {
  if (!isActive()) return;
  globalShortcut.unregister('Escape');
  for (const win of overlays) {
    if (!win.isDestroyed()) win.destroy();
  }
  overlays = [];
  const done = onDone;
  onDone = null;
  if (done) done(bounds);
}

function cancel() {
  finish(null);
}

// Covers every display's work area with a click-catching overlay.
// Calls done(bounds) on a click, or done(null) when cancelled.
function start(size, done) {
  if (isActive()) return;
  widgetSize = size;
  onDone = done;

  for (const display of screen.getAllDisplays()) {
    const win = new BrowserWindow({
      ...display.workArea,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        sandbox: true
      }
    });
    // Above the widget itself, which is also always on top.
    win.setAlwaysOnTop(true, 'screen-saver');
    win.loadFile(path.join(__dirname, '..', 'renderer', 'place.html'), {
      query: { w: String(size.width), h: String(size.height) }
    });
    win.once('ready-to-show', () => {
      if (!win.isDestroyed()) win.show();
    });
    overlays.push(win);
  }

  // Esc must work even when no overlay holds keyboard focus.
  globalShortcut.register('Escape', cancel);
}

ipcMain.on('place:confirm', (e, pt) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || !overlays.includes(win)) return;
  const origin = win.getBounds();
  const point = { x: origin.x + pt.x, y: origin.y + pt.y };
  const workArea = screen.getDisplayNearestPoint(point).workArea;
  finish(boundsFor(point, widgetSize, workArea));
});

ipcMain.on('place:cancel', cancel);

module.exports = { start, cancel, isActive, boundsFor };
