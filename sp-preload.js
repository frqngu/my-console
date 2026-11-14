const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('spHost', { token: () => ipcRenderer.invoke('sp:token'), report: (o) => ipcRenderer.send('sp:report', o) });
