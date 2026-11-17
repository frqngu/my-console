const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('guide', {
  load: () => ipcRenderer.invoke('guide:get'),
  save: (checked) => ipcRenderer.send('guide:save', checked),
  done: () => ipcRenderer.send('guide:done'),
});
