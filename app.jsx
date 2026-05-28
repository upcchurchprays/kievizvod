/* global React, ReactDOM, PRAYER_DATA */
const { useState, useEffect, useMemo, useRef } = React;

// ───────────────────────────────────────────────────────── markdown renderer
// Дуже простий рендер для прев'ю — Jekyll використає вбудований Kramdown.
function renderMarkdown(md) {
  if (!md) return null;
  const blocks = md.split(/\n\n+/);
  return blocks.map((b, i) => {
    const trimmed = b.trim();
    if (trimmed.startsWith("### ")) return <h3 key={i} className="prayer-h3">{inline(trimmed.slice(4))}</h3>;
    if (trimmed.startsWith("## ")) return <h2 key={i} className="prayer-h2">{inline(trimmed.slice(3))}</h2>;
    if (trimmed.startsWith("# ")) return <h1 key={i} className="prayer-h1">{inline(trimmed.slice(2))}</h1>;
    if (trimmed.startsWith("— ") || trimmed.startsWith("- ")) {
      const items = trimmed.split(/\n/).map(l => l.replace(/^[—-]\s+/, ""));
      return <ul key={i} className="prayer-list">{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>;
    }
    return <p key={i} className="prayer-p">{inline(trimmed)}</p>;
  });
}
function inline(s) {
  // **bold**, *italic*
  const parts = [];
  let rest = s;
  let key = 0;
  while (rest.length) {
    const bold = rest.match(/\*\*([^*]+)\*\*/);
    const ital = rest.match(/\*([^*]+)\*/);
    const first = [bold, ital].filter(Boolean).sort((a, b) => a.index - b.index)[0];
    if (!first) { parts.push(rest); break; }
    if (first.index > 0) parts.push(rest.slice(0, first.index));
    if (first === bold) parts.push(<strong key={key++}>{first[1]}</strong>);
    else parts.push(<em key={key++}>{first[1]}</em>);
    rest = rest.slice(first.index + first[0].length);
  }
  return parts;
}

// ───────────────────────────────────────────────────────── SEARCH
function searchAllPrayers(query) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase();
  const results = [];
  Object.entries(PRAYER_DATA).forEach(([sectionKey, sectionData]) => {
    sectionData.sections.forEach(sec => {
      sec.prayers.forEach(prayer => {
        const titleMatch = prayer.title.toLowerCase().includes(q);
        const subtitleMatch = prayer.subtitle ? prayer.subtitle.toLowerCase().includes(q) : false;
        const bodyMatch = prayer.body ? prayer.body.toLowerCase().includes(q) : false;
        if (titleMatch || subtitleMatch || bodyMatch) {
          let excerpt = '';
          if (bodyMatch && prayer.body) {
            const idx = prayer.body.toLowerCase().indexOf(q);
            const start = Math.max(0, idx - 45);
            const end = Math.min(prayer.body.length, idx + 95);
            excerpt = (start > 0 ? '…' : '') +
              prayer.body.slice(start, end).replace(/#{1,3} ?/g, '').replace(/\*{1,2}/g, '') +
              (end < prayer.body.length ? '…' : '');
          }
          results.push({
            sectionKey, sectionId: sec.id, prayerId: prayer.id,
            title: prayer.title, subtitle: prayer.subtitle,
            sectionTitle: sectionData.title + ' · ' + sec.title,
            excerpt, titleMatch,
          });
        }
      });
    });
  });
  return results.sort((a, b) => (b.titleMatch ? 1 : 0) - (a.titleMatch ? 1 : 0)).slice(0, 10);
}

function SearchResultsList({ results, onNavigate, variant }) {
  if (!results.length) return (
    <div className={`search-results search-results--${variant} search-results--empty`}>
      <Cross size={12} /><span>Нічого не знайдено</span>
    </div>
  );
  return (
    <ul className={`search-results search-results--${variant}`}>
      {results.map((r, i) => (
        <li key={i}>
          <button className="search-result-btn" onClick={() => onNavigate(r)}>
            <Cross size={11} />
            <div className="search-result-body">
              <span className="search-result-title">{r.title}</span>
              <span className="search-result-meta">{r.sectionTitle}</span>
              {r.excerpt && !r.titleMatch && (
                <span className="search-result-excerpt">{r.excerpt}</span>
              )}
            </div>
            <span className="search-result-arrow">→</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function HeroSearch({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => searchAllPrayers(query), [query]);
  const containerRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setFocused(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showResults = focused && query.trim().length > 0;

  function handleKey(e) {
    if (e.key === 'Escape') { setQuery(''); setFocused(false); }
    if (e.key === 'Enter' && results.length) { onNavigate(results[0]); setQuery(''); setFocused(false); }
  }

  return (
    <div className="hero-search-container" ref={containerRef}>
      <div className={`hero-search-wrap${focused ? ' focused' : ''}`}>
        <span className="hero-search-icon"><Search /></span>
        <input
          className="hero-search-input"
          type="text"
          placeholder="Шукати молитву чи акафіст…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKey}
        />
        {query && (
          <button className="hero-search-clear" onMouseDown={e => e.preventDefault()} onClick={() => setQuery('')}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        )}
      </div>
      {showResults && (
        <SearchResultsList
          results={results}
          onNavigate={r => { onNavigate(r); setQuery(''); setFocused(false); }}
          variant="hero"
        />
      )}
    </div>
  );
}

function TopbarSearch({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchAllPrayers(query), [query]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  function handleKey(e) {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    if (e.key === 'Enter' && results.length) { onNavigate(results[0]); setOpen(false); setQuery(''); }
  }

  const showResults = open && query.trim().length > 0;

  return (
    <div className="topbar-search-container" ref={containerRef}>
      {!open ? (
        <button className="topbar-search-btn" onClick={() => setOpen(true)} title="Пошук молитов">
          <Search />
        </button>
      ) : (
        <div className="topbar-search-wrap">
          <span className="topbar-search-icon"><Search /></span>
          <input
            ref={inputRef}
            className="topbar-search-input"
            type="text"
            placeholder="Шукати молитву…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="topbar-search-close" onClick={() => { setOpen(false); setQuery(''); }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="10" y2="10" /><line x1="10" y1="1" x2="1" y2="10" />
            </svg>
          </button>
        </div>
      )}
      {showResults && (
        <SearchResultsList
          results={results}
          onNavigate={r => { onNavigate(r); setOpen(false); setQuery(''); }}
          variant="topbar"
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────── icons
// Православний восьмикінцевий хрест: верхня титульна,
// середня головна, нижня скісна перекладина
const Cross = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <line x1="8" y1="2" x2="8" y2="14" />
    <line x1="5.5" y1="4.5" x2="10.5" y2="4.5" />
    <line x1="3.5" y1="6.5" x2="12.5" y2="6.5" />
    <line x1="4.5" y1="9" x2="11.5" y2="11" />
  </svg>
);
const Sun = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="15"/><line x1="1" y1="8" x2="2.5" y2="8"/><line x1="13.5" y1="8" x2="15" y2="8"/><line x1="3.05" y1="3.05" x2="4.1" y2="4.1"/><line x1="11.9" y1="11.9" x2="12.95" y2="12.95"/><line x1="3.05" y1="12.95" x2="4.1" y2="11.9"/><line x1="11.9" y1="4.1" x2="12.95" y2="3.05"/></svg>;
const Moon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M13 9.5a5.5 5.5 0 1 1-6.5-6.5 4.5 4.5 0 0 0 6.5 6.5z"/></svg>;
const Back = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="8.5,2 3.5,7 8.5,12"/></svg>;
const Search = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="6.5" cy="6.5" r="4"/><line x1="9.5" y1="9.5" x2="13" y2="13" strokeLinecap="round"/></svg>;
const Download = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 1.5v9"/><polyline points="3.5,7.5 7.5,10.5 11.5,7.5"/><path d="M2 13h11"/></svg>;
const BookmarkIcon = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2h9a1 1 0 0 1 1 1v10l-5.5-3.5L2 13V3a1 1 0 0 1 1-1z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,3 12,3"/><path d="M5 3V2h3v1"/><path d="M2 3l.8 8.2A1 1 0 0 0 3.8 12h5.4a1 1 0 0 0 1-.8L11 3"/>
  </svg>
);

// ───────────────────────────────────────────────────────── HERO
function Hero({ onNav, bookmarks, onRemoveBookmark, onOpenBookmark, onSearchNavigate }) {
  return (
    <div className="home-wrap">
      <header className="hero">
        <div className="hero-bg" />
        <div className="hero-vignette" />
        <div className="hero-content">
          <div className="hero-mark"><Cross size={22} /></div>
          <h1 className="hero-title">
            <span className="hero-eyebrow">УПЦ</span>
            Молитовник
          </h1>
          <p className="hero-sub">
            Збірка православних молитов та акафістів київським ізводом
          </p>
          <div className="hero-divider"><span /><Cross size={14} /><span /></div>
          <HeroSearch onNavigate={onSearchNavigate} />
          <nav className="hero-nav">
            <button className="hero-card" onClick={() => onNav("molytvoslov")}>
              <div className="hero-card-title">Молитви</div>
            </button>
            <button className="hero-card" onClick={() => onNav("akafisty")}>
              <div className="hero-card-title">Акафісти</div>
            </button>
          </nav>
        </div>
        <div className="hero-foot">
          <span>Господи, Ісусе Христе, Сину Божий, помилуй мене грішного</span>
        </div>
      </header>

      {/* ── ОБРАНЕ ───────────────────────────────────────────── */}
      <section className="favorites-section">
        <div className="favorites-inner">
          <div className="favorites-heading">
            <span className="favorites-icon"><BookmarkIcon filled={true}/></span>
            <h2 className="favorites-title">Обране</h2>
            {bookmarks.length > 0 && (
              <span className="favorites-count">{bookmarks.length}</span>
            )}
          </div>

          {bookmarks.length === 0 ? (
            <div className="favorites-empty">
              <Cross size={18}/>
              <p>Відкрийте будь-яку молитву і натисніть&nbsp;
                <span className="fav-inline-badge"><BookmarkIcon filled={false}/> Закладка</span>.
              </p>
            </div>
          ) : (
            <ul className="favorites-list">
              {bookmarks.map(b => (
                <li key={b.id} className="favorites-item">
                  <button className="favorites-link" onClick={() => onOpenBookmark(b)}>
                    <Cross size={13}/>
                    <div className="favorites-link-body">
                      <span className="favorites-link-title">{b.title}</span>
                      <span className="favorites-link-meta">{b.sectionTitle}</span>
                    </div>
                    <span className="favorites-link-arrow">→</span>
                  </button>
                  <button
                    className="favorites-remove"
                    onClick={() => onRemoveBookmark(b.id)}
                    title="Видалити із обраного"
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <line x1="1" y1="1" x2="10" y2="10"/><line x1="10" y1="1" x2="1" y2="10"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────────────────── SECTION LISTING
function SectionList({ sectionKey, onBack, onOpen }) {
  const data = PRAYER_DATA[sectionKey];
  // Збираємо всі молитви з усіх секцій у плоский список
  const allPrayers = data.sections.flatMap(sec =>
    sec.prayers.map(p => ({ ...p, sectionId: sec.id }))
  );
  return (
    <section className="listing">
      <div className="listing-header-simple">
        <button className="back-btn" onClick={onBack}><Back/> На головну</button>
        <div className="listing-titleblock">
          <h1 className="listing-title">{data.title}</h1>
          <p className="listing-sub">{data.subtitle}</p>
        </div>
      </div>

      <ul className="prayer-flat-list">
        {allPrayers.map((p, idx) => (
          <li key={p.id}>
            <button className="prayer-flat-link" onClick={() => onOpen(sectionKey, p.sectionId, p.id)}>
              <Cross size={14}/>
              <span className="prayer-flat-body">
                <span className="prayer-flat-title">{p.title}</span>
                {sectionKey !== "akafisty" && p.subtitle && <span className="prayer-flat-sub">{p.subtitle}</span>}
              </span>
              <span className="prayer-flat-arrow">→</span>
            </button>
          </li>
        ))}
      </ul>

    </section>
  );
}
function plural(n, forms) {
  const m100 = n % 100; const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return forms[2];
  if (m10 === 1) return forms[0];
  if (m10 >= 2 && m10 <= 4) return forms[1];
  return forms[2];
}

// ───────────────────────────────────────────────────────── READER
function Reader({ sectionKey, sectionId, prayerId, onBack, settings, setSettings, bookmarked, onToggleBookmark }) {
  useEffect(() => { window.scrollTo(0, 0); }, [prayerId]);
  const section = PRAYER_DATA[sectionKey].sections.find(s => s.id === sectionId);
  const idx = section.prayers.findIndex(p => p.id === prayerId);
  const prayer = section.prayers[idx];
  const prev = section.prayers[idx - 1];
  const next = section.prayers[idx + 1];

  const fontFamily = settings.font === "old" ? "'Old Standard TT', 'Lora', serif"
                    : settings.font === "cormorant" ? "'Cormorant Garamond', 'Old Standard TT', serif"
                    : "'Lora', 'Old Standard TT', serif";

  const handleDownloadPDF = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const articleEl = document.querySelector('.prayer-article');
    if (!articleEl) return;
    const bodyHTML = articleEl.innerHTML;
    const isDark = settings.theme === 'night';
    printWin.document.write(`<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8"/>
<title>${prayer.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"/>
<style>
  @page { margin: 2cm 2.2cm; size: A4; }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: ${fontFamily};
    font-size: ${settings.size}px;
    line-height: 1.7;
    color: #1a1612;
    margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1, h2, h3 {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    text-align: center;
    letter-spacing: 0.01em;
    color: #1a1612;
  }
  h2 { font-size: 1.85em; margin: 0 0 0.6em; line-height: 1.15; }
  h2::after {
    content: ""; display: block;
    width: 60px; height: 1px;
    background: #8a6420;
    margin: 18px auto 0;
  }
  h3 {
    font-size: 1.15em;
    margin: 1.8em 0 0.4em;
    color: #8a6420;
    font-style: italic;
    font-weight: 400;
    letter-spacing: 0.04em;
  }
  p {
    margin: 0 0 1em;
    text-indent: 1.2em;
    text-wrap: pretty;
    hyphens: auto;
  }
  p:first-of-type { text-indent: 0; }
  p:first-of-type::first-letter {
    font-family: 'Cormorant Garamond', serif;
    font-size: 3.2em;
    float: left;
    line-height: 0.95;
    padding: 0.08em 0.1em 0 0;
    color: #8a6420;
    font-weight: 500;
  }
  em { color: #8a6420; font-style: italic; }
  strong {
    font-variant: small-caps;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  ul {
    list-style: none; padding: 0; margin: 0 0 1.2em;
  }
  li {
    padding: 0.18em 0 0.18em 1.5em;
    position: relative;
  }
  li::before {
    content: "✦";
    position: absolute; left: 0;
    color: #b8893a;
    font-size: 0.7em;
    top: 0.5em;
  }
  .prayer-meta {
    text-align: center;
    color: #8a6420;
    font-family: 'Lora', serif;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .prayer-end {
    text-align: center;
    color: #b8893a;
    margin-top: 48px;
    font-size: 18px;
  }
  .footer-print {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #c8b896;
    text-align: center;
    font-family: 'Old Standard TT', serif;
    font-style: italic;
    font-size: 12px;
    color: #8a7a5e;
  }
</style>
</head>
<body>
  ${bodyHTML}
  <div class="footer-print">Молитовник — ${section.title} · ${prayer.title}</div>
</body>
</html>`);
    printWin.document.close();
    // Wait for fonts to load, then trigger print
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 800);
  };

  // Реєструємо функцію завантаження для доступу з верхньої панелі
  useEffect(() => {
    window.__downloadPDF = handleDownloadPDF;
    return () => { delete window.__downloadPDF; };
  });

  return (
    <section className="reader">
      <div className="reader-topbar">
        <button className="back-btn ghost" onClick={onBack}><Back/> {PRAYER_DATA[sectionKey].title}</button>
        <div className="breadcrumb">{section.title}</div>
      </div>

      <article
        className="prayer-article"
        style={{ fontSize: settings.size + "px", fontFamily }}
      >
        <div className="prayer-body">
          {renderMarkdown(prayer.body)}
        </div>
        <div className="prayer-end">
          <span/><Cross size={16}/><span/>
        </div>
      </article>

      <nav className="reader-nav">
        {prev ? (
          <button className="nav-btn" onClick={() => /* simulate */ window.__goPrayer(sectionKey, sectionId, prev.id)}>
            <span className="nav-arrow">←</span>
            <span className="nav-label">
              <span className="nav-eyebrow">Попередня</span>
              <span className="nav-title">{prev.title}</span>
            </span>
          </button>
        ) : <span/>}
        {next ? (
          <button className="nav-btn right" onClick={() => window.__goPrayer(sectionKey, sectionId, next.id)}>
            <span className="nav-label">
              <span className="nav-eyebrow">Наступна</span>
              <span className="nav-title">{next.title}</span>
            </span>
            <span className="nav-arrow">→</span>
          </button>
        ) : <span/>}
      </nav>
    </section>
  );
}

// ───────────────────────────────────────────────────────── BOOKMARK HELPERS
const BOOKMARKS_KEY = "__bookmarks_v1";

function loadBookmarks() {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]"); } catch { return []; }
}
function saveBookmarks(list) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
}

// ───────────────────────────────────────────────────────── APP
function App() {
  const [route, setRoute] = useState({ view: "home" }); // home | list | reader
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("__reader") || "") || defaults(); } catch { return defaults(); }
  });
  const [bookmarks, setBookmarks] = useState(loadBookmarks);

  function defaults() { return { theme: "day", size: 22, font: "old" }; }
  useEffect(() => { localStorage.setItem("__reader", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { document.documentElement.dataset.theme = settings.theme; }, [settings.theme]);
  useEffect(() => { saveBookmarks(bookmarks); }, [bookmarks]);

  function toggleBookmark(sectionKey, sectionId, prayerId) {
    const id = `${sectionKey}::${sectionId}::${prayerId}`;
    setBookmarks(prev => {
      if (prev.find(b => b.id === id)) {
        return prev.filter(b => b.id !== id);
      }
      const section = PRAYER_DATA[sectionKey].sections.find(s => s.id === sectionId);
      const prayer  = section.prayers.find(p => p.id === prayerId);
      return [...prev, {
        id,
        sectionKey,
        sectionId,
        prayerId,
        title: prayer.title,
        subtitle: prayer.subtitle,
        sectionTitle: PRAYER_DATA[sectionKey].title + " · " + section.title,
        savedAt: Date.now()
      }];
    });
  }

  function removeBookmark(id) {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }

  function isBookmarked(sectionKey, sectionId, prayerId) {
    const id = `${sectionKey}::${sectionId}::${prayerId}`;
    return bookmarks.some(b => b.id === id);
  }

  // expose for prev/next inside Reader
  window.__goPrayer = (sk, sid, pid) => setRoute({ view: "reader", sectionKey: sk, sectionId: sid, prayerId: pid });

  let view;
  if (route.view === "home") view = (
    <Hero
      onNav={(k) => setRoute({ view: "list", sectionKey: k })}
      bookmarks={bookmarks}
      onRemoveBookmark={removeBookmark}
      onOpenBookmark={(b) => setRoute({ view: "reader", sectionKey: b.sectionKey, sectionId: b.sectionId, prayerId: b.prayerId })}
      onSearchNavigate={(r) => setRoute({ view: "reader", sectionKey: r.sectionKey, sectionId: r.sectionId, prayerId: r.prayerId })}
    />
  );
  else if (route.view === "list") view = (
    <SectionList
      sectionKey={route.sectionKey}
      onBack={() => setRoute({ view: "home" })}
      onOpen={(sk, sid, pid) => setRoute({ view: "reader", sectionKey: sk, sectionId: sid, prayerId: pid })}
    />
  );
  else if (route.view === "reader") view = (
    <Reader
      sectionKey={route.sectionKey}
      sectionId={route.sectionId}
      prayerId={route.prayerId}
      onBack={() => setRoute({ view: "list", sectionKey: route.sectionKey })}
      settings={settings}
      setSettings={setSettings}
      bookmarked={isBookmarked(route.sectionKey, route.sectionId, route.prayerId)}
      onToggleBookmark={() => toggleBookmark(route.sectionKey, route.sectionId, route.prayerId)}
    />
  );

  return (
    <div className={"app theme-" + settings.theme}>
      {/* persistent top chrome with site name when not on home */}
      {route.view !== "home" && (
        <div className="topbar">
          <button className="brand" onClick={() => setRoute({ view: "home" })}>
            <Cross size={14}/> <span>Молитовник</span>
          </button>
          <div className="topbar-spacer"/>
          <TopbarSearch onNavigate={(r) => setRoute({ view: "reader", sectionKey: r.sectionKey, sectionId: r.sectionId, prayerId: r.prayerId })} />
          {route.view === "reader" && (
            <div className="topbar-reader-tools">
              <div className="seg">
                <button
                  className={settings.font === "old" ? "on" : ""}
                  onClick={() => setSettings({ ...settings, font: "old" })}
                  title="Old Standard TT — церковнослов'янський стиль"
                  style={{ fontFamily: "'Old Standard TT', serif" }}
                >Аа</button>
                <button
                  className={settings.font === "cormorant" ? "on" : ""}
                  onClick={() => setSettings({ ...settings, font: "cormorant" })}
                  title="Cormorant Garamond"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >Аа</button>
                <button
                  className={settings.font === "lora" ? "on" : ""}
                  onClick={() => setSettings({ ...settings, font: "lora" })}
                  title="Lora"
                  style={{ fontFamily: "'Lora', serif" }}
                >Аа</button>
              </div>
              <div className="seg">
                <button onClick={() => setSettings({ ...settings, size: Math.max(14, settings.size - 2) })} title="Зменшити шрифт">А−</button>
                <button onClick={() => setSettings({ ...settings, size: Math.min(36, settings.size + 2) })} title="Збільшити шрифт">А+</button>
              </div>
              <button
                className="pdf-btn"
                onClick={() => window.__downloadPDF?.()}
                title="Завантажити PDF"
              >
                <Download/> <span className="pdf-btn-label">PDF</span>
              </button>
              {(() => {
                const bk = isBookmarked(route.sectionKey, route.sectionId, route.prayerId);
                return (
                  <button
                    className={"bookmark-btn" + (bk ? " on" : "")}
                    onClick={() => toggleBookmark(route.sectionKey, route.sectionId, route.prayerId)}
                    title={bk ? "Видалити із закладок" : "Додати до закладок"}
                  >
                    <BookmarkIcon filled={bk}/>
                    <span className="bookmark-btn-label">{bk ? "Збережено" : "Закладка"}</span>
                  </button>
                );
              })()}
            </div>
          )}
          <div className="topbar-tools">
            <button
              className="theme-mini"
              onClick={() => setSettings({ ...settings, theme: settings.theme === "day" ? "night" : "day" })}
            >
              {settings.theme === "day" ? <Moon/> : <Sun/>}
            </button>
          </div>
        </div>
      )}
      {view}
      <footer className="footer">
        <div className="footer-row">
          <span>© 2026 · Молитовник</span>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
