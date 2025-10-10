// Lightweight 7TV emote injector for Twitch pages
(async () => {
  // run only on twitch.tv pages
  if (!location.hostname.includes("twitch.tv")) return;

  // get channel name from the URL
  const match = location.pathname.match(/^\/([^/]+)/);
  if (!match) return;
  const channel = match[1];

  try {
    const res = await fetch(`https://7tv.io/v3/users/twitch/${channel}`);
    const data = await res.json();
    const emotes = data.emote_set.emotes;

    // map emote names → image URLs
    const map = {};
    for (const e of emotes) {
      map[e.name] = `https:${e.data.host.url}/3x.webp`;
    }

    // Observe chat and replace emote text
    const chat = document.querySelector('[data-test-selector="chat-scrollable-area__message-container"]');
    if (!chat) return;

    const replaceEmotes = (node) => {
      node.querySelectorAll("span").forEach(span => {
        const txt = span.innerText.trim();
        if (map[txt]) {
          const img = document.createElement("img");
          img.src = map[txt];
          img.alt = txt;
          img.title = txt;
          img.style = "height:28px;vertical-align:middle;margin:0 2px;";
          span.replaceWith(img);
        }
      });
    };

    const observer = new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1) replaceEmotes(n);
    })));
    observer.observe(chat, { childList: true, subtree: true });

    // initial run
    replaceEmotes(chat);

    // popup notice
    const notice = document.createElement('div');
    notice.textContent = '✅ 7TV emotes active';
    Object.assign(notice.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#0f0f0f',
      color: '#8ab4f8',
      padding: '10px 16px',
      borderRadius: '8px',
      fontFamily: 'sans-serif',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
      zIndex: 9999999
    });
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 3000);
  } catch (err) {
    console.error("7TV load failed:", err);
  }
})();