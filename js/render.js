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
  const stamp = updated.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  document.getElementById('last-updated').textContent = `Updated ${stamp}`;
}

export function renderSummaryCards(data, ewcSlots, encSlots) {
  const dhFilled    = ewcSlots.filter(s => s.path === 'dreamhack'   && s.playerId).length;
  const ecEwcFilled = ewcSlots.filter(s => s.path === 'eliteCup'   && s.playerId).length;
  const oqFilled    = ewcSlots.filter(s => s.path === 'ewcOnline'  && s.playerId).length;
  const ecEncFilled = encSlots.filter(s => s.path === 'eliteCup'   && s.playerId).length;
  const regFilled   = encSlots.filter(s => s.path === 'encRegional' && s.playerId).length;
  const wcFilled    = encSlots.filter(s => s.path === 'wildcard'    && s.playerId).length;

  document.getElementById('summary-cards').innerHTML = `
    <div class="rtr-card">
      <div class="rtr-card-header">
        <span class="rtr-card-title">EWC 2026</span>
        <span class="rtr-card-sub">Aug 17–21 · Riyadh · $500k · 32 spots</span>
      </div>
      ${spotsRow('DreamHack Birmingham', 'Mar 27–29',       data.events.dreamhack.status, dhFilled,    8)}
      ${spotsRow('Elite Cup',            'Closes May 31',   data.events.eliteCup.status,  ecEwcFilled, 8)}
      ${spotsRow('Online Qualifiers',    'Jun 12–14',       data.events.ewcOnline.status,  oqFilled,   16)}
    </div>
    <div class="rtr-card">
      <div class="rtr-card-header">
        <span class="rtr-card-title">ENC 2026</span>
        <span class="rtr-card-sub">Nov 19–22 · Riyadh · $250k · 32 spots</span>
      </div>
      ${spotsRow('Elite Cup',           '1 per nation · closes May 31', data.events.eliteCup.status,    ecEncFilled, 16)}
      ${spotsRow('Regional Qualifiers', 'Jun 19–21 · 6 regions',        data.events.encRegional.status, regFilled,   14)}
      ${spotsRow('Wildcards',           'TBD',                          'upcoming',                     wcFilled,     2)}
    </div>
  `;
}

function spotsRow(source, meta, status, filled, total) {
  const cls   = status === 'concluded' ? 'rtr-badge-done' : status === 'live' ? 'rtr-badge-live' : 'rtr-badge-soon';
  const label = status === 'concluded' ? 'Concluded' : status === 'live' ? 'Live' : 'Upcoming';
  return `
    <div class="rtr-spots-row">
      <div>
        <div class="rtr-spots-source">${escapeHtml(source)}</div>
        <div class="rtr-spots-meta">${escapeHtml(meta)}</div>
      </div>
      <div class="rtr-spots-right">
        <span class="rtr-badge ${cls}">${label}</span>
        <span class="rtr-spots-count">${filled} / ${total}</span>
      </div>
    </div>
  `;
}

export function renderTimeline(data) {
  const strip = document.getElementById('timeline-strip');
  const events = [
    { label: 'DreamHack Birmingham',    when: 'Mar 27–29',          e: data.events.dreamhack },
    { label: 'Elite Cup',               when: 'Feb 14 – May 31',    e: data.events.eliteCup },
    { label: 'EWC Online Qualifiers',   when: 'Jun 12–14',          e: data.events.ewcOnline },
    { label: 'ENC Regional Qualifiers', when: 'Jun 19–21',          e: data.events.encRegional },
    { label: 'EWC 2026',               when: 'Aug 17–21 · Riyadh', e: data.events.ewc },
    { label: 'ENC 2026',               when: 'Nov 19–22 · Riyadh', e: data.events.enc },
  ];
  strip.innerHTML = events.map(ev => `
    <div class="rtr-timeline-card" data-status="${ev.e?.status || 'upcoming'}">
      <div>
        <div class="rtr-timeline-name">${escapeHtml(ev.label)}</div>
        <div class="rtr-timeline-when">${escapeHtml(ev.when)}</div>
        <div class="rtr-timeline-status">${labelForStatus(ev.e?.status)}</div>
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
    <div class="rtr-board-bucket">
      <h3 class="rtr-bucket-title">${escapeHtml(b.label)}</h3>
      <p class="rtr-bucket-sub">${escapeHtml(b.sub)}</p>
      <ul class="rtr-slot-grid" role="list">
        ${slots.filter(s => s.path === b.path).map(s => slotCard(data, s)).join('')}
      </ul>
    </div>
  `).join('');
}

export function renderRanking(data, qMap) {
  const body  = document.getElementById('ranking-body');
  const dhIds = new Set(data.dreamhackResults.map(r => r.playerId));
  const sorted = data.players
    .filter(p => Number.isInteger(p.eliteCupRank))
    .sort((a, b) => a.eliteCupRank - b.eliteCupRank);

  // compute which players effectively get the EC→EWC spot
  const effectiveEcIds = new Set();
  let picks = 0;
  for (const p of sorted) {
    if (picks >= 8) break;
    if (dhIds.has(p.id)) continue;
    effectiveEcIds.add(p.id);
    picks++;
  }
  const effectiveList = [...effectiveEcIds];
  const cutlineId = effectiveList[effectiveList.length - 1] ?? null;

  let currentSort = 'rank';

  function renderByRank() {
    let html = '';
    sorted.forEach(p => {
      const isDh    = dhIds.has(p.id);
      const isCutline = !isDh && p.id === cutlineId;
      const cls = isDh ? 'passdown' : isCutline ? 'cutline' : '';
      const q   = qMap.get(p.id) || { ewc: [], enc: [] };
      html += rowHtml(p, cls, q, isDh, data);
    });
    body.innerHTML = html;
    document.getElementById('cutline-label').style.display = '';
    wireSearch(body, data);
  }

  function renderByCountry() {
    const known   = sorted.filter(p =>  p.nationality);
    const unknown = sorted.filter(p => !p.nationality);
    const groups  = {};
    known.forEach(p => { (groups[p.nationality] ??= []).push(p); });

    let html = '';
    Object.keys(groups).sort().forEach(nat => {
      const flag = nationFlag(data, nat);
      html += `<tr class="country-header"><td colspan="6">${flag}  ${escapeHtml(data.nations[nat]?.name || nat)}</td></tr>`;
      groups[nat].forEach(p => {
        const isDh = dhIds.has(p.id);
        const q    = qMap.get(p.id) || { ewc: [], enc: [] };
        html += rowHtml(p, isDh ? 'passdown' : '', q, isDh, data);
      });
    });

    if (unknown.length) {
      html += `<tr class="country-header"><td colspan="6">?  Nationality unknown</td></tr>`;
      unknown.forEach(p => {
        const isDh = dhIds.has(p.id);
        const q    = qMap.get(p.id) || { ewc: [], enc: [] };
        html += rowHtml(p, isDh ? 'passdown' : '', q, isDh, data);
      });
    }

    body.innerHTML = html;
    document.getElementById('cutline-label').style.display = 'none';
    wireSearch(body, data);
  }

  renderByRank();

  document.getElementById('btn-rank').addEventListener('click', () => {
    if (currentSort === 'rank') return;
    currentSort = 'rank';
    document.getElementById('btn-rank').classList.add('active');
    document.getElementById('btn-country').classList.remove('active');
    document.getElementById('ranking-search').value = '';
    renderByRank();
  });

  document.getElementById('btn-country').addEventListener('click', () => {
    if (currentSort === 'country') return;
    currentSort = 'country';
    document.getElementById('btn-country').classList.add('active');
    document.getElementById('btn-rank').classList.remove('active');
    document.getElementById('ranking-search').value = '';
    renderByCountry();
  });

  document.getElementById('share-btn').addEventListener('click', async () => {
    const btn = document.getElementById('share-btn');
    try {
      await navigator.clipboard.writeText(location.href);
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = orig), 1500);
    } catch {
      window.prompt('Copy this URL', location.href);
    }
  });
}

function rowHtml(p, cls, q, isDh, data) {
  let html = `<tr class="${cls}" data-tag="${escapeAttr(p.tag.toLowerCase())}" data-nation="${escapeAttr(p.nationality || '')}">`;
  html += `<td class="rtr-rank">${p.eliteCupRank}</td>`;
  html += `<td><span class="rtr-player">${escapeHtml(p.tag)}</span>${p.fullName ? `<span class="rtr-fullname">${escapeHtml(p.fullName)}</span>` : ''}</td>`;
  html += natCell(data, p);
  html += `<td class="rtr-club">${p.club ? escapeHtml(p.club) : '<span class="rtr-unknown">—</span>'}</td>`;
  html += `<td class="rtr-pts">${p.eliteCupPoints ?? '—'}</td>`;
  html += `<td class="rtr-status-cell">${statusBadges(q, isDh)}</td>`;
  html += `</tr>`;
  return html;
}

function statusBadges(q, isDh) {
  let out = '';
  if (q.ewc.includes('dreamhack'))   out += `<span class="rtr-qual-badge q-ewc-dh">EWC · DreamHack</span>`;
  if (q.ewc.includes('eliteCup'))    out += `<span class="rtr-qual-badge q-ewc-ec">EWC · Elite Cup</span>`;
  if (q.ewc.includes('ewcOnline'))   out += `<span class="rtr-qual-badge q-ewc-oq">EWC · Online QR</span>`;
  if (q.enc.includes('eliteCup'))    out += ` <span class="rtr-qual-badge q-enc">ENC · Elite Cup</span>`;
  if (q.enc.includes('encRegional')) out += ` <span class="rtr-qual-badge q-enc">ENC · Regional</span>`;
  if (q.enc.includes('wildcard'))    out += ` <span class="rtr-qual-badge q-enc">ENC · Wildcard</span>`;
  if (isDh)                          out += `<span class="rtr-passdown-note">↓ passes down</span>`;
  if (!out)                          out  = `<span class="rtr-unknown">In contention</span>`;
  return out;
}

function natCell(data, p) {
  if (!p.nationality) return `<td><span class="rtr-unknown">—</span></td>`;
  return `<td><span class="rtr-flag">${nationFlag(data, p.nationality)}</span><span class="rtr-nat">${p.nationality}</span></td>`;
}

function wireSearch(body, data) {
  const input = document.getElementById('ranking-search');
  const handler = e => {
    const q = e.target.value.trim().toLowerCase();
    body.querySelectorAll('tr:not(.country-header)').forEach(row => {
      const tag     = row.dataset.tag    || '';
      const nation  = (row.dataset.nation || '').toLowerCase();
      const natName = (data.nations[row.dataset.nation]?.name || '').toLowerCase();
      row.hidden = !(!q || tag.includes(q) || nation.includes(q) || natName.includes(q));
    });
  };
  input.removeEventListener('input', input._h);
  input._h = handler;
  input.addEventListener('input', handler);
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
    <p>A player who already qualified via DreamHack does not double-count. If they also rank inside the Elite Cup top 8, their Elite Cup spot passes to the next non-DreamHack player.</p>
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
  const target  = data.events.eliteCup.closes;
  const isFinal = data.events.eliteCup.final;
  const el      = document.getElementById('last-updated');
  if (!el) return;

  const updated = new Date(data.lastUpdated);
  const stamp   = updated.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  if (isFinal) { el.textContent = `Updated ${stamp} · Elite Cup closed`; return; }

  const tick = () => {
    const t = timeUntil(target);
    if (t.totalMs === 0) { el.textContent = `Updated ${stamp} · Elite Cup closed`; clearInterval(int); return; }
    el.textContent = `Updated ${stamp} · EC closes in ${t.days}d ${pad(t.hours)}h ${pad(t.minutes)}m`;
  };
  tick();
  const int = setInterval(tick, 60000);
}

// ─── helpers ──────────────────────────────────────────────────────────────

const pad = n => String(n).padStart(2, '0');

function slotCard(data, slot) {
  if (!slot.playerId) {
    return `<li class="rtr-slot rtr-slot--tbd" role="listitem">
      <span class="rtr-slot-rank">—</span>
      <span class="rtr-slot-flag" aria-hidden="true">·</span>
      <span class="rtr-slot-tag">TBD</span>
      <span class="rtr-slot-source">${labelForPath(slot.path)}</span>
    </li>`;
  }
  const p = data.players.find(x => x.id === slot.playerId);
  const tooltip = [p?.fullName, p?.club, data.nations[p?.nationality]?.name].filter(Boolean).join(' · ');
  return `<li class="rtr-slot" role="listitem" tabindex="0" title="${escapeAttr(tooltip)}">
    <span class="rtr-slot-rank">${slot.sourceRank ? '#' + slot.sourceRank : ''}</span>
    <span class="rtr-slot-flag" aria-label="${escapeAttr(nationLabel(data, p?.nationality))}">${nationFlag(data, p?.nationality)}</span>
    <span class="rtr-slot-tag">${escapeHtml(p?.tag || '?')}</span>
    ${p?.club ? `<span class="rtr-slot-club">${escapeHtml(p.club)}</span>` : ''}
  </li>`;
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
  return ({ dreamhack:'DreamHack', eliteCup:'Elite Cup', ewcOnline:'EWC Online QR', encRegional:'Regional QR', wildcard:'Wildcard' })[path] || path;
}
function labelForStatus(status) {
  return ({ concluded: 'Concluded', live: 'Live', upcoming: 'Upcoming' })[status] || '';
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}
function escapeAttr(s) { return escapeHtml(s); }
