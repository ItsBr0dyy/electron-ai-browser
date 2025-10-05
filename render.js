/*
Renderer code — handles UI, webview navigation, and triggers OpenAI chat via preload API.
*/
const webview = document.getElementById('webview');
const addr = document.getElementById('addr');
const goBtn = document.getElementById('goBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const askBtn = document.getElementById('askBtn');
const clearBtn = document.getElementById('clearBtn');
const qbox = document.getElementById('q');
const chatArea = document.getElementById('chatArea');
const usePageContextEl = document.getElementById('usePageContext');
const modelSelect = document.getElementById('modelSelect');

function isProbablyUrl(text) {
try {
new URL(text);
return true;
} catch { return false; }
}

function toSearchUrl(text) {
const encoded = encodeURIComponent(text);
return `https://www.google.com/search?q=${encoded}`;
}

function navigateTo(text) {
let url = text.trim();
if (!url) return;
if (!isProbablyUrl(url)) {
url = toSearchUrl(url);
}
webview.loadURL(url);
}

// Enter key on address bar
addr.addEventListener('keydown', (e) => {
if (e.key === 'Enter') navigateTo(addr.value);
});
goBtn.addEventListener('click', () => navigateTo(addr.value));
backBtn.addEventListener('click', () => webview.canGoBack() && webview.goBack());
forwardBtn.addEventListener('click', () => webview.canGoForward() && webview.goForward());

// update address bar when page changes
webview.addEventListener('did-start-loading', () => { addr.value = webview.getURL(); });
webview.addEventListener('did-navigate-in-page', () => { addr.value = webview.getURL(); });
webview.addEventListener('did-navigate', () => { addr.value = webview.getURL(); });

// chat helpers
function appendMessage(who, text) {
const m = document.createElement('div');
m.className = `message ${who}`;
const b = document.createElement('div');
b.className = 'bubble';
b.innerText = text;
m.appendChild(b);
chatArea.appendChild(m);
chatArea.scrollTop = chatArea.scrollHeight;
}

async function askAI() {
const question = qbox.value.trim();
if (!question) return;
appendMessage('user', question);
qbox.value = '';
appendMessage('ai', 'Thinking...');

let context = '';
if (usePageContextEl.checked) {
try {
// Grab page text from webview: use executeJavaScript to get innerText of body
context = await webview.executeJavaScript(`(function(){ try { return document.body.innerText || ""; } catch(e) { return ""; } })();`, true);
// truncate context length so payloads stay reasonable
if (context && context.length > 12000) context = context.slice(0, 12000) + '\n\n[TRUNCATED]';
} catch (err) {
console.warn('Could not get page text', err);
context = '';
}
}

const model = modelSelect.value;
let res;
try {
res = await window.electronAPI.openaiChat({ question, context, model, max_tokens: 700 });
} catch (err) {
res = { error: err.message || String(err) };
}

// remove last "Thinking..." bubble
const aiThinking = Array.from(chatArea.querySelectorAll('.message.ai')).pop();
if (aiThinking) chatArea.removeChild(aiThinking);

if (res.error) {
appendMessage('ai', `Error: ${res.error}`);
} else {
appendMessage('ai', res.answer || JSON.stringify(res.raw || 'No answer'));
}
}

askBtn.addEventListener('click', askAI);
qbox.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) askAI(); });

clearBtn.addEventListener('click', () => { chatArea.innerHTML = ''; });

// basic keyboard shortcuts
window.addEventListener('keydown', (e) => {
if (e.ctrlKey && e.key === 'l') {
addr.focus();
addr.select();
}
});