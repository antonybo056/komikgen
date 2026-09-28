const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('native', {
  onMenu: (fn) => ipcRenderer.on('menu', (_e, cmd) => fn(cmd)),
  setDirty: (value, title) => ipcRenderer.invoke('set-dirty', value, title),
  confirm: (message) => ipcRenderer.invoke('confirm', message),
  saveProject: (opts) => ipcRenderer.invoke('save-project', opts),
  openProject: () => ipcRenderer.invoke('open-project'),
  openImage: () => ipcRenderer.invoke('open-image'),
  exportFile: (opts) => ipcRenderer.invoke('export-file', opts),
  copyImage: (dataUrl) => ipcRenderer.invoke('copy-image', dataUrl),
  loadCharacters: () => ipcRenderer.invoke('load-characters'),
  saveCharacters: (list) => ipcRenderer.invoke('save-characters', list)
});
