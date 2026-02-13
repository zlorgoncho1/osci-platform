import { marked } from 'marked';

let docIndex = null;
let knownSlugs = new Set();

/** Regex matching a bare doc slug (no protocol, no slash, no extension). */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Smooth-scroll to an element by ID (used by landing nav onclick). */
window.scrollToSection = function (id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  // Close mobile sidebar if open
  document.getElementById('side-nav')?.classList.remove('open');
};

/** Highlight the active sidebar link based on scroll position. */
function initSideNavObserver() {
  const sectionIds = ['hero','problem','modules','architecture','security','deploy'];
  const links = document.querySelectorAll('.side-nav-link[data-section]');
  if (!links.length) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.side-nav-link[data-section="${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    }
  }, { rootMargin: '-20% 0px -70% 0px' });

  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }
}

// Init observer when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSideNavObserver);
} else {
  initSideNavObserver();
}

async function loadIndex() {
  if (docIndex) return docIndex;
  const res = await fetch('./index.json');
  docIndex = await res.json();
  knownSlugs = new Set(docIndex.sections.flatMap(s => s.items.map(i => i.slug)));
  return docIndex;
}

function renderSidebar(index, activeSlug) {
  const sidebar = document.getElementById('doc-sidebar');
  let html = '<a href="./" class="sidebar-back">&larr; Accueil</a>';
  for (const section of index.sections) {
    html += `<p class="sidebar-section-title">${section.title}</p><ul class="sidebar-list">`;
    for (const item of section.items) {
      const active = item.slug === activeSlug ? ' active' : '';
      html += `<li><a href="./#docs/${item.slug}" class="sidebar-link${active}">${item.title}</a></li>`;
    }
    html += '</ul>';
  }
  sidebar.innerHTML = html;
}

async function renderDoc(slug) {
  const container = document.getElementById('doc-content');
  try {
    const res = await fetch(`./${slug}.md`);
    if (!res.ok) throw new Error('Not found');
    const md = await res.text();
    container.innerHTML = marked.parse(md);
  } catch {
    container.innerHTML = '<p class="doc-not-found">Document introuvable.</p><a href="./#docs" class="doc-back-link">Retour à la documentation</a>';
  }
}

async function renderDocIndex() {
  const index = await loadIndex();
  const container = document.getElementById('doc-content');
  let html = '<h1>Documentation OSCI</h1><p>Parcourez la documentation de la plateforme.</p>';
  for (const section of index.sections) {
    html += `<h2>${section.title}</h2><div class="doc-index-grid">`;
    for (const item of section.items) {
      html += `<a href="./#docs/${item.slug}" class="doc-index-card"><h3>${item.title}</h3><p>${item.description}</p></a>`;
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

async function route() {
  const hash = window.location.hash.replace(/^#/, '');
  const landing = document.getElementById('landing');
  const docView = document.getElementById('doc-view');
  const siteHeader = document.getElementById('site-header');
  const docsFooter = document.getElementById('docs-footer');
  const sideNav = document.getElementById('side-nav');
  const mobileBar = document.getElementById('mobile-bar');

  if (hash.startsWith('docs')) {
    // ── Show documentation view ──
    landing.classList.add('hidden');
    docView.classList.remove('hidden');
    if (siteHeader) siteHeader.classList.remove('hidden');
    if (docsFooter) docsFooter.classList.remove('hidden');
    if (sideNav) sideNav.style.display = 'none';
    if (mobileBar) mobileBar.style.display = 'none';

    const slug = hash.replace(/^docs\/?/, '');
    const index = await loadIndex();

    if (slug) {
      renderSidebar(index, slug);
      await renderDoc(slug);
    } else {
      renderSidebar(index, null);
      await renderDocIndex();
    }
    window.scrollTo(0, 0);
  } else {
    // ── Show landing page ──
    landing.classList.remove('hidden');
    docView.classList.add('hidden');
    if (siteHeader) siteHeader.classList.add('hidden');
    if (docsFooter) docsFooter.classList.add('hidden');
    if (sideNav) sideNav.style.display = '';
    if (mobileBar) mobileBar.style.display = '';
  }
}

/**
 * Intercept clicks on internal doc links rendered from markdown.
 * Rewrites relative slug hrefs (e.g. "vision-and-value") to hash routes (#docs/vision-and-value).
 */
document.getElementById('doc-content')?.addEventListener('click', (event) => {
  const target = event.target.closest('a');
  if (!target) return;

  const href = target.getAttribute('href');
  if (!href) return;

  // Ignore external links, anchors, and already-hashed links
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return;
  if (href.startsWith('#')) return;
  if (href.startsWith('./')) return; // sidebar / index links already correct

  // Treat as internal doc slug
  const slug = href.replace(/\.md$/, '');
  if (SLUG_RE.test(slug) && knownSlugs.has(slug)) {
    event.preventDefault();
    window.location.hash = `docs/${slug}`;
  }
});

window.addEventListener('hashchange', route);
route();
