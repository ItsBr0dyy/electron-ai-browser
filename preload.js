/*
Preload script: exposes a minimal, safe API to the renderer.
Only the functions we explicitly expose are accessible.
*/
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
openaiChat: (payload) => ipcRenderer.invoke('openai-chat', payload),
pickFile: () => ipcRenderer.invoke('pick-file'),
// get page text from webview (renderer will call webview.executeJavaScript)
});