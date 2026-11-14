const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('oskApi', { onState: (cb) => ipcRenderer.on('osk:state', (_e, s) => cb(s)) });
