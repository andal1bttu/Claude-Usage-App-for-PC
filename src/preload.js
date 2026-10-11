const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claudeUsage', {
  onMode: (cb) => ipcRenderer.on('mode:update', (_e, mode) => cb(mode)),
  onUsage: (cb) => ipcRenderer.on('usage:update', (_e, usage) => cb(usage)),
  onAuth: (cb) => ipcRenderer.on('auth:update', (_e, ok) => cb(ok)),
  getMode: () => ipcRenderer.invoke('mode:get'),
  hideWindow: () => ipcRenderer.send('window:hide'),
  confirmPlacement: (point) => ipcRenderer.send('place:confirm', point),
  cancelPlacement: () => ipcRenderer.send('place:cancel')
});
