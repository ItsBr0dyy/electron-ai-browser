/*
Main process: creates window, sets up IPC for OpenAI chat
Requires Node 18+ (global fetch available) or install node-fetch and adjust.
*/
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
const win = new BrowserWindow({
width: 1200,
height: 800,
webPreferences: {
nodeIntegration: false,
contextIsolation: true,
preload: path.join(__dirname, 'preload.js'),
webviewTag: true
}
});

win.loadFile('index.html');
}

app.whenReady().then(() => {
createWindow();
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// IPC handler: send prompt + optional context to OpenAI
ipcMain.handle('openai-chat', async (event, { question, context, model, max_tokens }) => {
try {
const key = process.env.OPENAI_API_KEY;
if (!key) throw new Error('OPENAI_API_KEY environment variable not set.');

// Construct messages: put context first (if any)
const messages = [];
if (context && context.trim().length > 0) {
  messages.push({ role: 'system', content: 'You are a helpful assistant that bases answers only on the provided context when possible.' });
  messages.push({ role: 'system', content: `CONTEXT:\n${context}` });
} else {
  messages.push({ role: 'system', content: 'You are a helpful assistant.' });
}
messages.push({ role: 'user', content: question });

// Default model
model = model || 'gpt-4o-mini'; // change if you prefer another model you have access to
max_tokens = max_tokens || 500;

const resp = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model,
    messages,
    max_tokens,
    temperature: 0.2
  })
});

if (!resp.ok) {
  const txt = await resp.text();
  throw new Error(`OpenAI API error: ${resp.status} ${txt}`);
}
const data = await resp.json();
const answer = data.choices?.[0]?.message?.content || '';
return { answer, raw: data };
```
// Construct messages: put context first (if any)
const messages = [];
if (context && context.trim().length > 0) {
  messages.push({ role: 'system', content: "You are a helpful assistant that bases answers only on the provided context when possible." });
  messages.push({ role: 'system', content: "CONTEXT:\n${context}" });
} else {
  messages.push({ role: 'system', content: 'You are a helpful assistant.' });
}
messages.push({ role: 'user', content: question });

// Default model
model = model || 'gpt-4o-mini'; // change if you prefer another model you have access to
max_tokens = max_tokens || 500;

const resp = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    'Authorization': `${key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model,
    messages,
    max_tokens,
    temperature: 0.2
  })
});

if (!resp.ok) {
  const txt = await resp.text();
  throw new Error(`OpenAI API error: ${resp.status} ${txt}`);
}
const data = await resp.json();
const answer = data.choices?.[0]?.message?.content || '';
return { answer, raw: data };
```

} catch (err) {
console.error('openai-chat error', err);
return { error: err.message || String(err) };
}
});

// small helper: prompt to pick a file to load into webview (optional)
ipcMain.handle('pick-file', async () => {
const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] });
if (canceled || filePaths.length === 0) return null;
return filePaths[0];
});

