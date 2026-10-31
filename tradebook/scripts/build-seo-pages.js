// Generates EdgeTrace's crawlable, static content (runs before every build):
//   public/<slug>/index.html   answer-first content pages with JSON-LD
//   public/index.html          prerendered homepage content + structured data (between markers)
//   public/sitemap.xml, public/llms.txt, public/llms-full.txt
// Content lives in scripts/seo-content.js; mistake fixes come from src/utils/mistakeAdvice.js.
const fs = require('fs');
const path = require('path');
const { SITE, PAGES } = require('./seo-content');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const loadMistakeAdvice = () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/utils/mistakeAdvice.js'), 'utf8');
  const body = src.replace(/export const /g, 'const ') + '\nreturn MISTAKE_ADVICE;';
  return new Function(body)(); // eslint-disable-line no-new-func
};
const titleCase = (s) => s.replace(/\b\w/g, c => c.toUpperCase()).replace(/\bFomo\b/, 'FOMO');
const MISTAKES = Object.entries(loadMistakeAdvice()).map(([key, v]) => ({ name: titleCase(key), ...v }));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pageUrl = (slug) => `${SITE.url}${slug}/`;
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const ORG = { '@type': 'Organization', name: SITE.name, url: SITE.url, logo: `${SITE.url}logo512.png` };

const faqSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const nav = (current) => `
<header class="top">
  <a class="brand" href="${SITE.url}"><span class="logo" aria-hidden="true">E</span>EdgeTrace</a>
  <nav aria-label="Guides">
    ${PAGES.map(p => `<a href="${pageUrl(p.slug)}"${p.slug === current ? ' aria-current="page"' : ''}>${esc(p.nav)}</a>`).join('\n    ')}
  </nav>
  <a class="cta" href="${SITE.appUrl}">Open the free app</a>
</header>`;

const footer = () => `
<footer class="foot">
  <p><strong>EdgeTrace</strong> – ${esc(SITE.tagline)}. Free, no sign-up, your data stays in your browser.</p>
  <p>${PAGES.map(p => `<a href="${pageUrl(p.slug)}">${esc(p.nav)}</a>`).join(' · ')} · <a href="${SITE.url}llms.txt">llms.txt</a></p>
  <p class="muted">Educational content, not financial advice. Trading involves risk of loss.</p>
</footer>`;

const renderSection = (s) => `
<section>
  <h2>${esc(s.h2)}</h2>
  ${(s.p || []).map(p => `<p>${esc(p)}</p>`).join('\n  ')}
  ${s.list ? `<ul>${s.list.map(li => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}
</section>`;

const renderPage = (page) => {
  const url = pageUrl(page.slug);
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.h1,
      description: page.description,
      url,
      mainEntityOfPage: url,
      datePublished: SITE.updated,
      dateModified: SITE.updated,
      author: ORG,
      publisher: ORG,
      image: `${SITE.url}og-image.png`,
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'EdgeTrace', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: page.nav, item: url },
      ],
    },
  ];
  if (page.faqs && page.faqs.length) schemas.push(faqSchema(page.faqs));
  if (page.howto) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: page.h1,
      description: page.intro,
      totalTime: 'PT10M',
      tool: [{ '@type': 'HowToTool', name: 'EdgeTrace trading journal (free web app)' }],
      step: page.howto.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text, url: `${url}#step-${i + 1}` })),
    });
  }
  if (page.glossary) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: 'Trading performance metrics',
      url,
      hasDefinedTerm: page.glossary.map(g => ({ '@type': 'DefinedTerm', name: g.term, description: `${g.def} ${g.formula}.`, url: `${url}#${slugify(g.term)}` })),
    });
  }
  if (page.mistakes) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Common trading mistakes and fixes',
      itemListElement: MISTAKES.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.name, description: `${m.rule}. ${m.solution}`, url: `${url}#${slugify(m.name)}` })),
    });
  }

  const body = [
    page.howto ? `<section><h2>Steps</h2><ol class="steps">${page.howto.map((s, i) => `<li id="step-${i + 1}"><strong>${esc(s.name)}.</strong> ${esc(s.text)}</li>`).join('')}</ol></section>` : '',
    page.mistakes ? `<section><h2>Trading mistakes, rules and fixes</h2>${MISTAKES.map(m => `
  <article class="item" id="${slugify(m.name)}">
    <h3>${esc(m.name)}</h3>
    <p><strong>Rule:</strong> ${esc(m.rule)}.</p>
    <p><strong>How to fix it:</strong> ${esc(m.solution)}</p>
    <p><strong>Prevention:</strong> ${esc(m.prevention)}.</p>
  </article>`).join('')}</section>` : '',
    page.glossary ? `<section><h2>Metrics, formulas and examples</h2><dl class="glossary">${page.glossary.map(g => `
  <div class="item" id="${slugify(g.term)}">
    <dt><dfn>${esc(g.term)}</dfn></dt>
    <dd><p>${esc(g.def)}</p><p class="formula"><code>${esc(g.formula)}</code></p><p><em>Example:</em> ${esc(g.example)}</p></dd>
  </div>`).join('')}</dl></section>` : '',
    ...(page.sections || []).map(renderSection),
    page.faqs && page.faqs.length ? `<section class="faq"><h2>Frequently asked questions</h2>${page.faqs.map(f => `<div class="item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('')}</section>` : '',
  ].join('\n');

  const related = PAGES.filter(p => p.slug !== page.slug).slice(0, 6);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta property="og:type" content="article">
<meta property="og:site_name" content="EdgeTrace">
<meta property="og:title" content="${esc(page.h1)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="article:modified_time" content="${SITE.updated}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.h1)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${SITE.url}og-image.png">
<meta name="theme-color" content="#007AFF">
<link rel="icon" href="${SITE.url}favicon.ico">
<link rel="apple-touch-icon" href="${SITE.url}logo192.png">
<link rel="stylesheet" href="${SITE.url}assets/site.css">
${schemas.map(jsonLd).join('\n')}
</head>
<body>
${nav(page.slug)}
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.url}">EdgeTrace</a> › <span>${esc(page.nav)}</span></nav>
  <article>
    <h1>${esc(page.h1)}</h1>
    <p class="updated">Updated <time datetime="${SITE.updated}">${new Date(SITE.updated + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</time></p>
    <p class="answer"><strong>Short answer:</strong> ${esc(page.intro)}</p>
    ${body}
  </article>
  <aside class="cta-box">
    <h2>Find the mistakes costing you money</h2>
    <p>EdgeTrace is a free, private trading journal. Log or import your trades and get a ranked plan of what to fix – no sign-up.</p>
    <a class="cta" href="${SITE.appUrl}">Start journaling free</a>
  </aside>
  <nav class="related" aria-label="Related guides"><h2>Related guides</h2><ul>${related.map(p => `<li><a href="${pageUrl(p.slug)}">${esc(p.h1)}</a></li>`).join('')}</ul></nav>
</main>
${footer()}
</body>
</html>
`;
};

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// ---------- Homepage: prerendered content + structured data ----------
const HOME_FAQS = [
  ...PAGES.find(p => p.slug === 'trading-journal').faqs,
  ...PAGES.find(p => p.slug === 'faq').faqs.slice(0, 4),
];

const homeSchemas = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'EdgeTrace',
    alternateName: 'EdgeTrace Trading Journal',
    url: SITE.url,
    description: SITE.description,
    applicationCategory: 'FinanceApplication',
    applicationSubCategory: 'Trading journal',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    image: `${SITE.url}og-image.png`,
    screenshot: `${SITE.url}og-image.png`,
    featureList: [
      'Trade journal for stocks, forex, futures and crypto',
      'Mistake tracking ranked by cost',
      'Emotion and tilt analysis',
      'Discipline score and coaching suggestions',
      'Risk rules: max risk per trade, daily loss limit, max trades per day',
      'Equity curve vs disciplined equity curve',
      'CSV and MetaTrader 4/5 import, CSV export and JSON backup',
      'Private: data stored only in your browser',
    ],
    publisher: ORG,
  },
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'EdgeTrace', url: SITE.url, description: SITE.description, inLanguage: 'en', publisher: ORG },
  faqSchema(HOME_FAQS),
];

const homeContent = () => `
<div class="seo-prerender">
  <header><strong>EdgeTrace</strong> · Trading Journal</header>
  <main>
    <h1>EdgeTrace – free trading journal that finds and fixes your trading mistakes</h1>
    <p>${esc(SITE.description)}</p>
    <h2>What EdgeTrace does</h2>
    <ul>
      <li>Ranks every trading mistake by how much money it cost you, with a rule and fix for each.</li>
      <li>Shows your equity curve next to a "disciplined" curve: your P&amp;L if you had skipped every mistake trade.</li>
      <li>Detects tilt and revenge trading by comparing the trade after a loss with the trade after a win.</li>
      <li>Analyses results by emotion, setup, day of week and entry hour.</li>
      <li>Enforces your risk rules: max risk per trade, daily loss limit and max trades per day.</li>
      <li>Imports CSV and MetaTrader 4/5 history; exports CSV and JSON backups. Free, no sign-up, private.</li>
    </ul>
    <h2>Guides</h2>
    <ul>${PAGES.map(p => `<li><a href="${pageUrl(p.slug)}">${esc(p.h1)}</a></li>`).join('')}</ul>
    <h2>Frequently asked questions</h2>
    ${HOME_FAQS.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('\n    ')}
    <p>Loading the app… If nothing happens, please enable JavaScript.</p>
  </main>
</div>`;

const replaceBetween = (html, name, content) => {
  const re = new RegExp(`(<!--${name}:start-->)[\\s\\S]*?(<!--${name}:end-->)`);
  if (!re.test(html)) throw new Error(`Marker ${name} not found in public/index.html`);
  return html.replace(re, `$1${content}$2`);
};

// ---------- llms.txt ----------
const llmsTxt = () => `# EdgeTrace

> ${SITE.description}

EdgeTrace is a free web app (no account, data stored locally in the browser) at ${SITE.url}. It is built for retail and professional traders who want to find the behaviour that costs them money: it ranks mistakes by cost, measures discipline (0–100), detects tilt after losses, analyses results by emotion, setup, weekday and hour, and checks trades against the trader's own risk rules.

## Guides
${PAGES.map(p => `- [${p.h1}](${pageUrl(p.slug)}): ${p.description}`).join('\n')}

## App
- [Open EdgeTrace](${SITE.appUrl}): the trading journal itself (JavaScript single-page app)
- [Full text for LLMs](${SITE.url}llms-full.txt): all guide content in one Markdown file

## Key facts
- Price: free. Account: not required. Storage: browser localStorage only; JSON backup/restore.
- Markets: stocks, ETFs, options, futures, forex, crypto. Futures/forex via point-value multiplier or broker net P&L.
- Import: CSV and MetaTrader 4/5 history (broker profit + commission + swap = net P&L). Export: CSV, JSON.
- R-multiple = (exit − entry) ÷ (entry − stop), reversed for shorts. Discipline score = 60% mistake-free share + 40% plan adherence.
`;

const llmsFull = () => {
  const parts = [`# EdgeTrace – full guide content\n\n> ${SITE.description}\n\nSource: ${SITE.url} · Updated ${SITE.updated}\n`];
  PAGES.forEach(p => {
    parts.push(`\n---\n\n# ${p.h1}\n\nURL: ${pageUrl(p.slug)}\n\n${p.intro}\n`);
    if (p.howto) parts.push(p.howto.map((s, i) => `${i + 1}. **${s.name}.** ${s.text}`).join('\n') + '\n');
    if (p.mistakes) MISTAKES.forEach(m => parts.push(`\n## ${m.name}\n\n- Rule: ${m.rule}\n- Fix: ${m.solution}\n- Prevention: ${m.prevention}\n`));
    if (p.glossary) p.glossary.forEach(g => parts.push(`\n## ${g.term}\n\n${g.def}\n\nFormula: \`${g.formula}\`\n\nExample: ${g.example}\n`));
    (p.sections || []).forEach(s => {
      parts.push(`\n## ${s.h2}\n`);
      (s.p || []).forEach(t => parts.push(`\n${t}\n`));
      if (s.list) parts.push('\n' + s.list.map(li => `- ${li}`).join('\n') + '\n');
    });
    if (p.faqs && p.faqs.length) parts.push('\n## FAQ\n' + p.faqs.map(f => `\n**${f.q}**\n\n${f.a}\n`).join(''));
  });
  return parts.join('');
};

const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE.url}</loc><lastmod>${SITE.updated}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
${PAGES.map(p => `  <url><loc>${pageUrl(p.slug)}</loc><lastmod>${SITE.updated}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>
`;

// ---------- write ----------
PAGES.forEach(p => {
  const dir = path.join(PUBLIC, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderPage(p));
});

const indexPath = path.join(PUBLIC, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
index = replaceBetween(index, 'seo-jsonld', '\n    ' + homeSchemas().map(jsonLd).join('\n    ') + '\n    ');
index = replaceBetween(index, 'seo-content', homeContent());
fs.writeFileSync(indexPath, index);

fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(PUBLIC, 'llms.txt'), llmsTxt());
fs.writeFileSync(path.join(PUBLIC, 'llms-full.txt'), llmsFull());

console.log(`SEO: generated ${PAGES.length} guide pages, homepage content, sitemap.xml, llms.txt, llms-full.txt`);
