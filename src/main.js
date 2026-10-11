const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const { UsageService } = require('./usage');
const settings = require('./settings');
const placement = require('./placement');

const SIZES = {
  wizard: { width: 320, height: 626 },
  tama: { width: 300, height: 319 }
};

let mainWindow = null;
let tray = null;
let usageService = null;
let currentMode = 'wizard';
let lastUsage = null;
let authOk = false;

function createMainWindow() {
  const s = settings.load();
  currentMode = s.mode || 'wizard';
  const size = SIZES[currentMode];

  const display = screen.getPrimaryDisplay();
  const defaultX = display.workArea.x + display.workArea.width - size.width - 24;
  const defaultY = display.workArea.y + display.workArea.height - size.height - 24;

  mainWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: s.windowX ?? defaultX,
    y: s.windowY ?? defaultY,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('moved', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    settings.save({ windowX: x, windowY: y });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    pushState();
  });
}

function setMode(mode) {
  if (mode === currentMode) return;
  placement.cancel();
  currentMode = mode;
  settings.save({ mode });
  if (mainWindow) {
    const [oldX, oldY] = mainWindow.getPosition();
    const [oldW, oldH] = mainWindow.getSize();
    const bottomRightX = oldX + oldW;
    const bottomRightY = oldY + oldH;

    const size = SIZES[currentMode];
    const newX = bottomRightX - size.width;
    const newY = bottomRightY - size.height;

    mainWindow.setBounds({ x: newX, y: newY, width: size.width, height: size.height });
    settings.save({ windowX: newX, windowY: newY });
    mainWindow.webContents.send('mode:update', currentMode);
  }
  buildTrayMenu();
}

function pushState() {
  if (!mainWindow) return;
  mainWindow.webContents.send('mode:update', currentMode);
  mainWindow.webContents.send('auth:update', authOk);
  if (lastUsage) mainWindow.webContents.send('usage:update', lastUsage);
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) mainWindow.hide();
  else mainWindow.show();
}

function placeWidget() {
  if (!mainWindow) return;
  placement.start(SIZES[currentMode], (bounds) => {
    if (!bounds || !mainWindow) return;
    mainWindow.setBounds(bounds);
    settings.save({ windowX: bounds.x, windowY: bounds.y });
    mainWindow.show();
  });
}

function buildTrayMenu() {
  if (!tray) return;
  const template = [
    { label: 'Show / Hide', click: toggleWindow },
    { label: 'Place Widget Here...', click: placeWidget },
    { type: 'separator' },
    {
      label: 'Wizard mode',
      type: 'radio',
      checked: currentMode === 'wizard',
      click: () => setMode('wizard')
    },
    {
      label: 'Tamagotchi mode',
      type: 'radio',
      checked: currentMode === 'tama',
      click: () => setMode('tama')
    },
    { type: 'separator' },
    { label: 'Refresh now', click: () => usageService && usageService.refresh() },
    { label: authOk ? 'Re-login to Claude' : 'Log in to Claude', click: () => usageService && usageService.showLogin() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
}

function createTray() {
  tray = new Tray(path.join(__dirname, '..', 'renderer', 'assets', 'tray-icon.png'));
  tray.setToolTip('Claude Usage');
  tray.on('click', toggleWindow);
  buildTrayMenu();
}

function startUsageService() {
  usageService = new UsageService();

  usageService.on('auth-required', () => {
    authOk = false;
    if (mainWindow) mainWindow.webContents.send('auth:update', false);
    buildTrayMenu();
  });

  usageService.on('auth-ok', () => {
    authOk = true;
    if (mainWindow) mainWindow.webContents.send('auth:update', true);
    buildTrayMenu();
  });

  usageService.on('usage', (usage) => {
    lastUsage = usage;
    if (mainWindow) mainWindow.webContents.send('usage:update', usage);
  });

  usageService.on('error', (err) => {
    console.error('usage service error:', err);
  });

  usageService.start();
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();
  startUsageService();
});

app.on('window-all-closed', (e) => {
  // Widget lives in the tray; do not quit when the window closes.
  e.preventDefault();
});

app.on('before-quit', () => {
  placement.cancel();
  if (usageService) usageService.stop();
});

ipcMain.handle('mode:get', () => currentMode);
ipcMain.on('window:hide', () => {
  if (mainWindow) mainWindow.hide();
});
