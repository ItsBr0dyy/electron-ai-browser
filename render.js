const urlInput = document.getElementById('url');
const aiBtn = document.getElementById('ai-btn');
const webview = document.getElementById('browser');
const tabBar = document.getElementById('tab-bar');
const newTabBtn = document.getElementById('new-tab');

let tabs = [{ title: 'New Tab', url: 'https://google.com' }];
let activeTab = 0;

function loadURL(input) {
  let url = input.trim();
  if (!url.startsWith('http') && !url.includes('.')) {
    url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
  } else if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  tabs[activeTab].url = url;
  webview.src = url;
  updateTabs();
}

function updateTabs() {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  const tabElements = document.querySelectorAll('.tab');
  if (tabElements[activeTab]) tabElements[activeTab].classList.add('active');
}

function addTab() {
  tabs.push({ title: 'New Tab', url: 'https://google.com' });
  activeTab = tabs.length - 1;
  const tab = document.createElement('div');
  tab.classList.add('tab', 'active');
  tab.innerHTML = `New Tab <span class="close">×</span>`;
  tabBar.insertBefore(tab, newTabBtn);
  updateTabs();
  webview.src = 'https://google.com';
  setupTabEvents();
}

function setupTabEvents() {
  document.querySelectorAll('.tab').forEach((tab, i) => {
    tab.onclick = () => {
      activeTab = i;
      webview.src = tabs[i].url;
      updateTabs();
    };
    tab.querySelector('.close').onclick = (e) => {
      e.stopPropagation();
      tabs.splice(i, 1);
      tab.remove();
      if (activeTab >= tabs.length) activeTab = tabs.length - 1;
      if (tabs[activeTab]) webview.src = tabs[activeTab].url;
      updateTabs();
    };
  });
}

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadURL(urlInput.value);
});

newTabBtn.addEventListener('click', addTab);

aiBtn.addEventListener('click', () => {
  alert('AI Mode coming soon!');
});

setupTabEvents();
// Load initial tab
loadURL(tabs[activeTab].url);
