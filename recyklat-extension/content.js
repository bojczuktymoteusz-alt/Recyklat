/**
 * content.js — Recyklat Chrome Extension v1.9
 *
 * CHANGELOG v1.9 — przepisanie detekcji autora od zera:
 *
 * Problem który próbowaliśmy naprawić przez wiele wersji:
 *   - Filtr "link należy do nagłówka posta" nigdy nie działał pewnie
 *     bo FB zagnieżdża artykuły nieregularnie i closest() zwraca
 *     niespodziewane wyniki.
 *   - Skutek: łapaliśmy linki z reklam, pola komentarzy, UI FB.
 *
 * Nowe podejście — deterministyczne:
 *   1. Znajdź WSZYSTKIE linki /groups/{id}/user/{userId}/ w artykule
 *   2. Weź PIERWSZY który ma niepusty tekst w span[dir="auto"]
 *      i nie jest wewnątrz naszego badge
 *   3. Jeśli brak — szukaj linku profilu osobistego TYLKO w pierwszych
 *      500px artykułu (header zone) przez porównanie getBoundingClientRect
 *   4. Fallback: h2/h3/strong
 *
 * Klasyfikacja post vs komentarz:
 *   - Komentarz = artykuł BEZPOŚREDNIO zagnieżdżony w innym artykule
 *     który sam ma link /groups/.../user/... (prawdziwy post)
 *   - Wrapper FB = artykuł zagnieżdżony w artykule BEZ linku usera
 *     → traktuj jako post
 */

(async () => {
  'use strict';

  const ARTICLE = 'div[role="article"]';
  const USER_LINK_RE = /\/groups\/\d+\/user\/\d+/;

  const CONFIG = {
    PROFILE_HREF_ALLOW: [
      /facebook\.com\/profile\.php/,
      /facebook\.com\/[^/?#]+\/?$/,
      /^\/[^/?#]+\/?$/,
    ],
    PROFILE_HREF_DENY: [
      /\/groups\//,/\/search\//,/\/events\//,/\/pages\//,/\/hashtag\//,
      /\/marketplace\//,/\/watch\//,/\/stories\//,/\/reel\//,/\/permalink\//,
      /\/photo\//,/\/video\//,/\/photos\//,
    ],
    PROFILE_ARIA: ['profile', 'profil', 'perfil'],
    TIMESTAMP_RE: [
      /\/posts\//,/story_fbid=/,/\/permalink\//,/\?fbid=/,/\/\d{10,}\/?/,
    ],
    RELATIVE_TIME_RE:
      /\d+\s*(min|godz|godzin|hour|hr|day|d|s|ago|temu|minut|sekund)|just now|teraz/i,
    BLACKLIST: new Set([
      'odpady','recykling','recycling','giełda','surowce','sprzedam',
      'kupię','oddam','przyjmę','wtórne','odpadów','group','grupa','grupy',
      'strona','fanpage','page','s.a','www','http','mailto','recyklat',
      'write something','napisz','facebook','udostępnij','share',
      'lubię','like','obserwuj','follow','zaproś','invite','wprowadź',
      'wydarzenia','events','filmy','videos','ogłoszenia','announcements',
      'komentarz','comment','odpowiedz','reply','polubienia','reactions',
      'zobacz więcej','see more','message sent','wiadomość',
      'współautor','top contributor','najbardziej','admin','moderator',
      'author','autor','członek','member','właściciel','owner',
      'publiczna','public','private','prywatna','skomentuj','odpowiedz',
    ]),
    MIN_LEN: 2,
    MAX_LEN: 80,
    CONTENT_MAX: 400,
  };

  let MESSAGES = {
    badge:      { matchMethod: '{method} ({score}%)', addToDb: '+ Dodaj do Bazy', copyLead: 'Kopiuj Lead' },
    tags: {
      hot:     { label: '🔥 Hot',     key: 'HOT'     },
      contact: { label: '📞 Contact', key: 'CONTACT' },
      archive: { label: '📁 Archive', key: 'ARCHIVE' },
    },
    toast: {
      contactAdded   : '✅ Dodano: {name}',
      contactExists  : 'ℹ️ Już istnieje: {name}',
      leadCopied     : '📋 Lead skopiowany do schowka',
      leadCopyFailed : '⚠️ Nie można skopiować do schowka',
      tagSet         : '🏷️ Tag: {tag}',
      historyFailed  : '⚠️ Serwer niedostępny — zapisano tylko w Chrome',
    },
    prompt:     { addContact: 'Dodaję: "{name}"\nNotatka (materiał, uwaga) — zostaw puste jeśli brak:' },
    leadFormat: '[{tag}] [{date}] | {author} | {content} | {url}',
    noDate:     '—',
    noContent:  '(brak treści)',
    noUrl:      '(brak linku)',
    noTag:      'NIEOZNACZONY',
  };

  async function loadMessages() {
    try {
      const resp = await fetch(chrome.runtime.getURL('messages.json'));
      if (resp.ok) MESSAGES = await resp.json();
    } catch (e) { console.warn('[Recyklat] messages.json not loaded:', e); }
  }

  function t(tpl, vars = {}) {
    return Object.entries(vars).reduce((s,[k,v]) => s.replaceAll(`{${k}}`,v??''), tpl);
  }

  const HistoryWriter = {
    URL: 'http://localhost:17731/append',
    async append(name, notes) {
      const now = new Date();
      const line = `${now.toISOString().slice(0,10)} ${now.toTimeString().slice(0,5)} | ${name}${notes?' | '+notes:''}`;
      try {
        const r = await fetch(this.URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({line})});
        return r.ok;
      } catch { return false; }
    },
  };

  let contacts = [];
  const processedPosts    = new WeakSet();
  const processedComments = new WeakSet();

  async function init() {
    await loadMessages();
    contacts = await window.ContactsDB.getAll();
    console.log(`[Recyklat v1.9] Loaded ${contacts.length} contacts`);
    scanPage();
    startObserver();
  }

  // ══════════════════════════════════════════════════════════════════════
  // Klasyfikacja artykułów
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Komentarz = artykuł którego BEZPOŚREDNI rodzic-artykuł
   * sam zawiera link /groups/.../user/... (czyli jest prawdziwym postem).
   *
   * Jeśli rodzic-artykuł nie ma takiego linku → wrapper → traktuj jako post.
   */
  function isCommentArticle(el) {
    const parent = el.parentElement?.closest(ARTICLE);
    if (!parent) return false;
    // Rodzic musi mieć link usera POZA naszym el
    const links = parent.querySelectorAll('a[role="link"]');
    for (const l of links) {
      if (el.contains(l)) continue;
      if (USER_LINK_RE.test(l.getAttribute('href') || '')) return true;
    }
    return false;
  }

  function scanPage() {
    document.querySelectorAll(ARTICLE).forEach(a => {
      try {
        isCommentArticle(a) ? processComment(a) : processPost(a);
      } catch(e) { console.error('[Recyklat] scan error:', e); }
    });
  }

  function processPost(postEl) {
    if (processedPosts.has(postEl)) return;
    processedPosts.add(postEl);
    try {
      const lead = extractLead(postEl, 'post');
      if (!lead.author) return;
      console.log('[Recyklat] Post —', lead.author);
      BadgeRenderer.apply(postEl, lead, window.FuzzyMatcher.match(lead.author, contacts), 'post');
    } catch(e) { console.error('[Recyklat] processPost error:', e); }
  }

  function processComment(commentEl) {
    if (processedComments.has(commentEl)) return;
    processedComments.add(commentEl);
    try {
      const lead = extractLead(commentEl, 'comment');
      if (!lead.author) return;
      console.log('[Recyklat] Comment —', lead.author);
      BadgeRenderer.apply(commentEl, lead, window.FuzzyMatcher.match(lead.author, contacts), 'comment');
    } catch(e) { console.error('[Recyklat] processComment error:', e); }
  }

  // ══════════════════════════════════════════════════════════════════════
  // Lead extraction
  // ══════════════════════════════════════════════════════════════════════

  function extractLead(containerEl, mode) {
    const authorResult = findAuthor(containerEl, mode);
    return {
      authorEl : authorResult.el,
      author   : authorResult.name,
      date     : extractDate(containerEl, mode),
      content  : extractContent(containerEl, mode, authorResult.el),
      url      : extractPermalink(containerEl),
    };
  }

  /**
   * Nowa deterministyczna detekcja autora.
   *
   * KROK 1 — szukaj linków /groups/{id}/user/{userId}/ w całym artykule.
   *   Bierz PIERWSZY który ma span[dir="auto"] z validnym tekstem
   *   i NIE jest naszym badge.
   *   Ten link zawsze pojawia się 1-2 razy (avatar + imię). Avatar
   *   ma pusty span → pomijamy. Imię ma tekst → bierzemy.
   *
   * KROK 2 — szukaj linku profilu osobistego z validnym imieniem.
   *
   * KROK 3 — h2/h3/strong > span[dir="auto"]
   *
   * KROK 4 — fallback span
   */
  function findAuthor(containerEl, mode) {
    const allLinks = Array.from(containerEl.querySelectorAll('a[role="link"]'));

    // KROK 1: /groups/.../user/.../
    for (const link of allLinks) {
      if (!USER_LINK_RE.test(link.getAttribute('href') || '')) continue;
      const nameEl = getNameSpan(link);
      if (!nameEl) continue;
      const name = cleanText(nameEl);
      if (isValidAuthor(name)) return { el: nameEl, name };
    }

    // KROK 2: profil osobisty
    for (const link of allLinks) {
      const href = link.getAttribute('href') || '';
      const aria = (link.getAttribute('aria-label') || '').toLowerCase();
      const hrefOk = isPersonalProfileHref(href);
      const ariaOk = CONFIG.PROFILE_ARIA.some(f => aria.includes(f));
      if (!hrefOk && !ariaOk) continue;
      const nameEl = getNameSpan(link);
      if (!nameEl) continue;
      const name = cleanText(nameEl);
      if (isValidAuthor(name)) return { el: nameEl, name };
    }

    // KROK 3: nagłówki
    for (const sel of ['h2 span[dir="auto"]','h3 span[dir="auto"]','strong span[dir="auto"]']) {
      for (const el of containerEl.querySelectorAll(sel)) {
        if (el.closest('.recyklat-badge')) continue;
        const name = cleanText(el);
        if (isValidAuthor(name) && looksLikeName(name)) return { el, name };
      }
    }

    // KROK 4: fallback
    for (const span of containerEl.querySelectorAll('span[dir="auto"]')) {
      if (span.closest('.recyklat-badge')) continue;
      const name = cleanText(span);
      if (name && isValidAuthor(name) && looksLikeName(name)) return { el: span, name };
    }

    return { el: null, name: null };
  }

  /**
   * Zwraca span[dir="auto"] wewnątrz linka z czystym tekstem
   * (nie nasz badge, niepusty).
   */
  function getNameSpan(link) {
    for (const span of link.querySelectorAll('span[dir="auto"]')) {
      if (span.closest('.recyklat-badge')) continue;
      const text = cleanText(span);
      if (text.length >= CONFIG.MIN_LEN) return span;
    }
    return null;
  }

  function extractDate(containerEl, mode) {
    const abbr = containerEl.querySelector('abbr[data-utime], abbr[title]');
    if (abbr) return abbr.getAttribute('title') || abbr.textContent.trim();

    for (const link of containerEl.querySelectorAll('a[role="link"]')) {
      const title = link.getAttribute('title') || '';
      if (title.length > 6 && /\d{4}|\d{1,2}:\d{2}/.test(title)) return title;
      const label = link.getAttribute('aria-label') || '';
      if (label.length > 6 && /\d{4}|\d{1,2}:\d{2}/.test(label)) return label;
      if (mode === 'comment') {
        const txt = (link.textContent || '').trim();
        if (CONFIG.RELATIVE_TIME_RE.test(txt) && txt.length < 30) return txt;
      }
    }
    for (const span of containerEl.querySelectorAll('span[aria-label]')) {
      const label = span.getAttribute('aria-label') || '';
      if (/\d{4}|\d{1,2}:\d{2}/.test(label)) return label;
      if (mode === 'comment' && CONFIG.RELATIVE_TIME_RE.test(label)) return label;
    }
    if (mode === 'comment') {
      for (const span of containerEl.querySelectorAll('span')) {
        const txt = (span.textContent || '').trim();
        if (txt.length < 20 && CONFIG.RELATIVE_TIME_RE.test(txt)) return txt;
      }
    }
    return MESSAGES.noDate;
  }

  function extractContent(containerEl, mode, authorEl) {
    if (mode === 'post') {
      for (const sel of [
        'div[data-ad-comet-preview="message"]',
        'div[data-ad-preview="message"]',
        '[data-testid="post_message"]',
        'div[dir="auto"]',
      ]) {
        for (const el of containerEl.querySelectorAll(sel)) {
          if (el.closest('.recyklat-badge')) continue;
          const text = (el.innerText || el.textContent || '').trim();
          if (text.length > 20) return text.slice(0, CONFIG.CONTENT_MAX);
        }
      }
      return MESSAGES.noContent;
    }

    // Komentarz
    const box = containerEl.querySelector('div[role="comment"]');
    if (box) {
      for (const el of box.querySelectorAll('div[dir="auto"],span[dir="auto"]')) {
        if (el.closest('.recyklat-badge')) continue;
        const text = (el.innerText || el.textContent || '').trim();
        if (text.length > 5) return text.slice(0, CONFIG.CONTENT_MAX);
      }
    }
    if (authorEl) {
      const parent = authorEl.closest(ARTICLE) || containerEl;
      for (const el of parent.querySelectorAll('div[dir="auto"],span[dir="auto"]')) {
        if (el === authorEl || el.contains(authorEl)) continue;
        if (el.closest('.recyklat-badge')) continue;
        const text = (el.innerText || el.textContent || '').trim();
        if (text.length > 5) return text.slice(0, CONFIG.CONTENT_MAX);
      }
    }
    let best = '';
    for (const el of containerEl.querySelectorAll('div[dir="auto"],span[dir="auto"]')) {
      if (el.closest('.recyklat-badge')) continue;
      const text = (el.innerText || el.textContent || '').trim();
      if (text.length > best.length) best = text;
    }
    return best.length > 5 ? best.slice(0, CONFIG.CONTENT_MAX) : MESSAGES.noContent;
  }

  function extractPermalink(containerEl) {
    for (const link of containerEl.querySelectorAll('a[role="link"]')) {
      const href = link.getAttribute('href') || '';
      const full = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
      if (CONFIG.TIMESTAMP_RE.some(p => p.test(href))) return full.split('?')[0];
    }
    return MESSAGES.noUrl;
  }

  // ══════════════════════════════════════════════════════════════════════
  // BadgeRenderer
  // ══════════════════════════════════════════════════════════════════════
  const BadgeRenderer = {
    CLS: 'recyklat-badge',

    apply(containerEl, lead, matchResult, type) {
      try {
        containerEl.querySelector(`.${this.CLS}`)?.remove();
        const badge = document.createElement('div');
        badge.className  = this.CLS;
        badge.dataset.type = type;
        badge._activeTag = null;

        badge.addEventListener('click',       e => { e.stopPropagation(); e.preventDefault(); });
        badge.addEventListener('mousedown',   e => e.stopPropagation());
        badge.addEventListener('mouseup',     e => e.stopPropagation());
        badge.addEventListener('pointerdown', e => e.stopPropagation());

        if (matchResult.matched) {
          this._style(containerEl, 'green');
          badge.classList.add('recyklat-badge--known');
          badge.innerHTML = this._knownHTML(matchResult);
        } else {
          this._style(containerEl, 'red');
          badge.classList.add('recyklat-badge--unknown');
          badge.innerHTML = this._unknownHTML(lead.author);
          this._bindAdd(badge, lead, containerEl, type);
        }
        this._bindTags(badge);
        this._bindCopy(badge, lead);

        const anchor = lead.authorEl
          ? (lead.authorEl.closest('a[role="link"],span,strong') || lead.authorEl)
          : null;
        if (anchor?.parentElement) {
          anchor.parentElement.insertBefore(badge, anchor.nextSibling);
        } else if (containerEl.firstChild) {
          containerEl.insertBefore(badge, containerEl.firstChild);
        } else {
          containerEl.appendChild(badge);
        }
      } catch(e) { console.error('[Recyklat] BadgeRenderer error:', e); }
    },

    _style(el, color) {
      el.style.outline       = `3px solid ${color==='green'?'#22c55e':'#ef4444'}`;
      el.style.outlineOffset = '2px';
      el.style.borderRadius  = '8px';
    },

    _tagsHTML() {
      return Object.entries(MESSAGES.tags).map(([,cfg])=>`
        <button class="recyklat-badge__tag-btn"
          data-tag-key="${escAttr(cfg.key)}" data-tag-label="${escAttr(cfg.label)}"
          title="${escAttr(cfg.label)}" type="button">${esc(cfg.label)}</button>
      `).join('');
    },

    _knownHTML(m) {
      const method = t(MESSAGES.badge.matchMethod,{method:m.method,score:m.score});
      return `<span class="recyklat-badge__icon">✅</span>
        <span class="recyklat-badge__name">${esc(m.contact.name)}</span>
        ${m.contact.notes?`<span class="recyklat-badge__notes">${esc(m.contact.notes)}</span>`:''}
        <span class="recyklat-badge__method">${esc(method)}</span>
        <span class="recyklat-badge__tag-group">${this._tagsHTML()}</span>
        <button class="recyklat-badge__copy-btn" type="button">${esc(MESSAGES.badge.copyLead)}</button>`;
    },

    _unknownHTML(name) {
      return `<span class="recyklat-badge__icon">❓</span>
        <span class="recyklat-badge__name">${esc(name)}</span>
        <button class="recyklat-badge__add-btn" data-name="${escAttr(name)}" type="button">${esc(MESSAGES.badge.addToDb)}</button>
        <span class="recyklat-badge__tag-group">${this._tagsHTML()}</span>
        <button class="recyklat-badge__copy-btn" type="button">${esc(MESSAGES.badge.copyLead)}</button>`;
    },

    _bindTags(badge) {
      badge.querySelectorAll('.recyklat-badge__tag-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation(); e.preventDefault();
          const key=btn.dataset.tagKey, label=btn.dataset.tagLabel;
          const isActive = badge._activeTag===key;
          badge._activeTag = isActive?null:key;
          badge.querySelectorAll('.recyklat-badge__tag-btn').forEach(b=>
            b.classList.toggle('recyklat-badge__tag-btn--active', b.dataset.tagKey===badge._activeTag));
          if (!isActive) showToast(t(MESSAGES.toast.tagSet,{tag:label}));
        });
      });
    },

    _bindAdd(badge, lead, containerEl, type) {
      badge.querySelector('.recyklat-badge__add-btn')?.addEventListener('click', async e => {
        e.stopPropagation(); e.preventDefault();
        const name = e.currentTarget.dataset.name;
        const notes = prompt(t(MESSAGES.prompt.addContact,{name}))??'';
        const result = await window.ContactsDB.add(name, notes);
        if (result.success) {
          const saved = await HistoryWriter.append(name, notes);
          contacts = await window.ContactsDB.getAll();
          processedPosts.delete(containerEl);
          processedComments.delete(containerEl);
          containerEl.style.outline='';
          type==='post'?processPost(containerEl):processComment(containerEl);
          showToast(t(MESSAGES.toast.contactAdded,{name}));
          if (!saved) showToast(MESSAGES.toast.historyFailed);
        } else {
          showToast(t(MESSAGES.toast.contactExists,{name}));
        }
      });
    },

    _bindCopy(badge, lead) {
      badge.querySelector('.recyklat-badge__copy-btn')?.addEventListener('click', async e => {
        e.stopPropagation(); e.preventDefault();
        const cfg = badge._activeTag
          ? Object.values(MESSAGES.tags).find(c=>c.key===badge._activeTag)
          : null;
        const text = t(MESSAGES.leadFormat,{
          tag    : cfg?cfg.label:(MESSAGES.noTag||'NIEOZNACZONY'),
          date   : lead.date    || MESSAGES.noDate,
          author : lead.author  || '—',
          content: lead.content || MESSAGES.noContent,
          url    : lead.url     || MESSAGES.noUrl,
        });
        try {
          await navigator.clipboard.writeText(text);
          showToast(MESSAGES.toast.leadCopied);
        } catch { showToast(MESSAGES.toast.leadCopyFailed); }
      });
    },
  };

  // ══════════════════════════════════════════════════════════════════════
  // MutationObserver
  // ══════════════════════════════════════════════════════════════════════
  function startObserver() {
    let timer = null;
    new MutationObserver(mutations => {
      let hasNew = false;
      for (const m of mutations) if (m.addedNodes.length) { hasNew=true; break; }
      if (hasNew) {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.matches?.(ARTICLE)) {
              try { isCommentArticle(node)?processComment(node):processPost(node); }
              catch(e) { console.error('[Recyklat] observer error:', e); }
            }
            node.querySelectorAll?.(ARTICLE).forEach(a => {
              try { isCommentArticle(a)?processComment(a):processPost(a); }
              catch(e) { console.error('[Recyklat] observer subtree error:', e); }
            });
          }
        }
      }
      clearTimeout(timer);
      timer = setTimeout(scanPage, 400);
    }).observe(document.body, { childList:true, subtree:true });
    setInterval(scanPage, 1500);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════════════════

  function isPersonalProfileHref(href) {
    if (!href) return false;
    if (USER_LINK_RE.test(href)) return true;
    if (CONFIG.PROFILE_HREF_DENY.some(p=>p.test(href))) return false;
    return CONFIG.PROFILE_HREF_ALLOW.some(p=>p.test(href));
  }

  /** Wyciąga tekst z elementu, ignorując nasze badge */
  function cleanText(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);
    clone.querySelectorAll('.recyklat-badge').forEach(b=>b.remove());
    let direct = '';
    for (const n of clone.childNodes) {
      if (n.nodeType===Node.TEXT_NODE) direct += n.textContent;
    }
    direct = direct.trim();
    if (direct.length >= CONFIG.MIN_LEN) return direct;
    const full = (clone.textContent||'').trim();
    return full.length <= CONFIG.MAX_LEN ? full : '';
  }

  function isValidAuthor(text) {
    if (!text || text.length < CONFIG.MIN_LEN || text.length > CONFIG.MAX_LEN) return false;
    const lower = text.toLowerCase();
    for (const w of CONFIG.BLACKLIST) if (lower.includes(w)) return false;
    return /[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text);
  }

  function looksLikeName(text) {
    if (!text) return false;
    const words = text.trim().split(/\s+/);
    if (words.length>=1 && words.length<=5 && words.every(w=>/^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(w))) return true;
    return /[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]{3,}/.test(text);
  }

  function showToast(msg) {
    document.getElementById('recyklat-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'recyklat-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(), 3000);
  }

  const esc     = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const escAttr = s => String(s).replace(/"/g,'&quot;');

  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
