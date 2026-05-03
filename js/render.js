import { timeUntil } from './qualifiers.js';

export function showErrors(errors) {
  if (!errors || !errors.length) return;
  const banner = document.getElementById('error-banner');
  banner.hidden = false;
  banner.innerHTML =
    `<strong>Data validation:</strong> ${errors.length} issue(s) — ` +
    errors.map(e => `<span>${escapeHtml(e)}</span>`).join('; ');
}

export function renderHero(data) {
  const updated = new Date(data.lastUpdated);
  const stamp = updated.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  document.getElementById('last-updated').textContent = `Last updated ${stamp}`;
}

export function renderTimeline(data) {
  const strip = document.getElementById('timeline-strip');
  const events = [
    { label: 'DreamHack Birmingham',    when: 'Mar 27–29',         e: data.events.dreamhack },
    { label: 'Elite Cup',               when: 'Feb 14 – May 31',   e: data.events.eliteCup },
    { label: 'EWC Online Qualifiers',   when: 'Jun 12–14',         e: data.events.ewcOnline },
    { label: 'ENC Regional Qualifiers', when: 'Jun 19–21',         e: data.events.encRegional },
    { label: 'EWC 2026',                when: 'Aug 17–21 · Riyadh',e: data.events.ewc },
    { label: 'ENC 2026',                when: 'Nov 19–22 · Riyadh',e: data.events.enc },
  ];
  strip.innerHTML = events.map(ev => `
    <div class="timeline__card" data-status="${ev.e?.status || 'upcoming'}">
      <span class="timeline__icon" aria-hidden="true">${iconForStatus(ev.e?.status)}</span>
      <div class="timeline__body">
        <div class="timeline__name">${escapeHtml(ev.label)}</div>
        <div class="timeline__when">${escapeHtml(ev.when)}</div>
        <div class="timeline__status">${labelForStatus(ev.e?.status)}</div>
      </div>
    </div>
  `).join('');
}

export function renderEwc(data, slots) {
  renderBoard('ewc-board', data, slots, [
    { path: 'dreamhack', label: 'DreamHack Birmingham',  sub: '8 spots · concluded' },
    { path: 'eliteCup',  label: 'Elite Cup',             sub: '8 spots · roll-down applies' },
    { path: 'ewcOnline', label: 'EWC Online Qualifiers', sub: '16 spots · upcoming Jun 12–14' },
  ]);
}

export function renderEnc(data, slots) {
  renderBoard('enc-board', data, slots, [
    { path: 'eliteCup',    label: 'Elite Cup',           sub: '16 spots · 1 per nation' },
    { path: 'encRegional', label: 'Regional Qualifiers', sub: '14 spots · upcoming Jun 19–21 · 6 regions' },
    { path: 'wildcard',    label: 'Wildcards',           sub: '2 spots · TBD' },
  ]);
}

function renderBoard(elId, data, slots, buckets) {
  const el = document.getElementById(elId);
  el.innerHTML = buckets.map(b => `
    <div class="board__bucket">
      <h3 class="board__bucket-title">${escapeHtml(b.label)}</h3>
      <p class="board__bucket-sub">${escapeHtml(b.sub)}</p>
      <ul class="slot-grid" role="list">
        ${slots.filter(s => s.path === b.path).map(s => slotCard(data, s)).join('')}
      </ul>
    </div>
  `).join('');
}

export function renderRanking(data, qMap) {
  const body = document.getElementById('ranking-body');
  const dhIds = new Set(data.dreamhackResults.map(r => r.playerId));
  const sorted = data.players
    .filter(p => Number.isInteger(p.eliteCupRank))
    .sort((a, b) => a.eliteCupRank - b.eliteCupRank);

  const effectiveEcEwc = new Set();
  let picks = 0;
  for (const p of sorted) {
    if (picks >= 8) break;
    if (dhIds.has(p.id)) continue;
    effectiveEcEwc.add(p.id);
    picks++;
  }

  body.innerHTML = sorted.map(p => {
    const q = qMap.get(p.id) || { ewc: [], enc: [] };
    const isDh = dhIds.has(p.id);
    const isWithinTop8 = p.eliteCupRank <= 8;
    const isRolledDown = isDh && isWithinTop8;
    const isEffective = effectiveEcEwc.has(p.id);
    const status = isRolledDown ? 'rolled-down' : isEffective ? 'effective-ewc' : (isDh ? 'dh-qualified' : '');
    const tooltip = [
      p.fullName,
      p.club,
      data.nations[p.nationality]?.name,
      q.ewc.length || q.enc.length ? 'Qualified' : 'In contention',
    ].filter(Boolean).join(' · ');

    return `
      <tr class="rank-row" data-status="${status}" data-tag="${escapeAttr(p.tag.toLowerCase())}" data-nation="${escapeAttr(p.nationality || '')}" title="${escapeAttr(tooltip)}">
        <td class="rank">${p.eliteCupRank}</td>
        <td class="player">
          <span class="flag" aria-label="${escapeAttr(nationLabel(data, p.nationality))}">${nationFlag(data, p.nationality)}</span>
          <span class="tag">${escapeHtml(p.tag)}</span>
          ${p.fullName ? `<span class="fullname">${escapeHtml(p.fullName)}</span>` : ''}
        </td>
        <td class="club">${p.club ? escapeHtml(p.club) : '<span class="muted">—</span>'}</td>
        <td class="pts">${p.eliteCupPoints ?? '—'}</td>
        <td class="status">${badges(q, isRolledDown)}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('ranking-search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    body.querySelectorAll('.rank-row').forEach(row => {
      const tag = row.dataset.tag || '';
      const nation = (row.dataset.nation || '').toLowerCase();
      const nationName = (data.nations[row.dataset.nation]?.name || '').toLowerCase();
      const match = !q || tag.includes(q) || nation.includes(q) || nationName.includes(q);
      row.hidden = !match;
    });
  });

  const shareBtn = document.getElementById('share-btn');
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      const orig = shareBtn.textContent;
      shareBtn.textContent = 'Copied!';
      setTimeout(() => (shareBtn.textContent = orig), 1500);
    } catch {
      window.prompt('Copy this URL', location.href);
    }
  });
}

export function renderExplainer() {
  document.getElementById('explainer-body').innerHTML = `
    <h3>EWC 2026 — 32 spots</h3>
    <ul>
      <li><strong>DreamHack Birmingham</strong> — 8 spots. Concluded Mar 29.</li>
      <li><strong>Elite Cup</strong> — 8 spots. 10 weekly Cups of the Week, top 5 results count, ranking closes May 31.</li>
      <li><strong>EWC Online Qualifiers</strong> — 16 spots. Jun 12–14.</li>
    </ul>
    <h3>ENC 2026 — 32 spots</h3>
    <ul>
      <li><strong>Elite Cup</strong> — 16 spots. One per nation.</li>
      <li><strong>Regional Qualifiers</strong> — 14 spots. Double-elim across 6 regions, Jun 19–21.</li>
      <li><strong>Wildcards</strong> — 2 spots. TBD.</li>
      <li>Hard cap: <strong>2 players per nation</strong> across all ENC paths combined.</li>
    </ul>
    <h3>Roll-down rule</h3>
    <p>A player who already qualified via DreamHack does not double-count. If they also rank inside the Elite Cup top 8, their Elite Cup spot passes to the next non-DreamHack player. The same de-duplication applies if they later win an Online Qualifier.</p>
    <h3>Key dates</h3>
    <ul>
      <li>Elite Cup ranking closes — <strong>May 31, 2026</strong></li>
      <li>EWC Online Qualifiers — <strong>Jun 12–14, 2026</strong></li>
      <li>ENC Regional Qualifiers — <strong>Jun 19–21, 2026</strong></li>
      <li>EWC 2026 (Riyadh) — <strong>Aug 17–21, 2026</strong></li>
      <li>ENC 2026 (Riyadh) — <strong>Nov 19–22, 2026</strong></li>
    </ul>
  `;
}

export function renderFooter() {
  const link = document.getElementById('repo-link');
  if (!link) return;
  const host = location.hostname;
  if (host.endsWith('.github.io')) {
    const user = host.split('.')[0];
    const repo = location.pathname.split('/').filter(Boolean)[0] || 'trackmania-2026-tracker';
    link.href = `https://github.com/${user}/${repo}`;
  }
}

export function startCountdown(data) {
  const target = data.events.eliteCup.closes;
  const isFinal = data.events.eliteCup.final;
  const el = document.getElementById('countdown');
  if (isFinal) {
    el.innerHTML = `<span class="countdown__label">Elite Cup</span> <span class="countdown__value">Final</span>`;
    return;
  }
  let lastSec = -1;
  const tick = () => {
    const t = timeUntil(target);
    if (t.totalMs === 0) {
      el.innerHTML = `<span class="countdown__label">Elite Cup</span> <span class="countdown__value">Closed</span>`;
      clearInterval(int);
      return;
    }
    if (t.seconds === lastSec) return;
    lastSec = t.seconds;
    el.innerHTML = `
      <span class="countdown__label">Elite Cup closes in</span>
      <span class="countdown__value">
        <span>${t.days}</span><small>d</small>
        <span>${pad(t.hours)}</span><small>h</small>
        <span>${pad(t.minutes)}</span><small>m</small>
        <span>${pad(t.seconds)}</span><small>s</small>
      </span>
    `;
  };
  tick();
  const int = setInterval(tick, 1000);
}

// ─── helpers ─────────────────────────────────────────────────────────────

const pad = n => String(n).padStart(2, '0');

function slotCard(data, slot) {
  if (!slot.playerId) {
    return `<li class="slot slot--tbd" role="listitem">
      <span class="slot__rank">—</span>
      <span class="slot__flag" aria-hidden="true">·</span>
      <span class="slot__tag">TBD</span>
      <span class="slot__source">${labelForPath(slot.path)}</span>
    </li>`;
  }
  const p = data.players.find(x => x.id === slot.playerId);
  const tooltip = [p?.fullName, p?.club, data.nations[p?.nationality]?.name].filter(Boolean).join(' · ');
  return `<li class="slot" role="listitem" tabindex="0" data-path="${slot.path}" title="${escapeAttr(tooltip)}">
    <span class="slot__rank">${slot.sourceRank ? '#' + slot.sourceRank : ''}</span>
    <span class="slot__flag" aria-label="${escapeAttr(nationLabel(data, p?.nationality))}">${nationFlag(data, p?.nationality)}</span>
    <span class="slot__tag">${escapeHtml(p?.tag || '?')}</span>
    ${p?.club ? `<span class="slot__club">${escapeHtml(p.club)}</span>` : ''}
  </li>`;
}

function badges(q, isRolledDown) {
  const items = [];
  if (q.ewc.includes('dreamhack'))   items.push(`<span class="badge badge--dh">🏆 EWC · DreamHack</span>`);
  if (q.ewc.includes('eliteCup'))    items.push(`<span class="badge badge--ewc">🎯 EWC · Elite Cup</span>`);
  if (q.ewc.includes('ewcOnline'))   items.push(`<span class="badge badge--ewc">🎯 EWC · Online QR</span>`);
  if (q.enc.includes('eliteCup'))    items.push(`<span class="badge badge--enc">🌍 ENC · Elite Cup</span>`);
  if (q.enc.includes('encRegional')) items.push(`<span class="badge badge--enc">🌍 ENC · Regional</span>`);
  if (q.enc.includes('wildcard'))    items.push(`<span class="badge badge--enc">🌍 ENC · Wildcard</span>`);
  if (isRolledDown) items.push(`<span class="rolldown-arrow" aria-label="Elite Cup spot passes to next non-DreamHack player">↓ passes down</span>`);
  return items.length ? items.join(' ') : '<span class="muted">In contention</span>';
}

function nationFlag(data, code) {
  if (!code) return '🌐';
  return data.nations[code]?.flag || code;
}
function nationLabel(data, code) {
  if (!code) return 'Nationality unknown';
  return data.nations[code]?.name || code;
}
function labelForPath(path) {
  return ({
    dreamhack:   'DreamHack',
    eliteCup:    'Elite Cup',
    ewcOnline:   'EWC Online QR',
    encRegional: 'Regional QR',
    wildcard:    'Wildcard',
  })[path] || path;
}
function iconForStatus(status) {
  return ({ concluded: '✅', live: '⏳', upcoming: '📅' })[status] || '·';
}
function labelForStatus(status) {
  return ({ concluded: 'Concluded', live: 'Live', upcoming: 'Upcoming' })[status] || '';
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function escapeAttr(s) { return escapeHtml(s); }
