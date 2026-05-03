// Pure functions for TrackMania 2026 qualifier computation.
// No DOM access — testable in isolation.

export function playersById(data) {
  const map = new Map();
  for (const p of data.players) map.set(p.id, p);
  return map;
}

export function playersByEliteCupRank(players) {
  return [...players]
    .filter(p => Number.isInteger(p.eliteCupRank))
    .sort((a, b) => a.eliteCupRank - b.eliteCupRank);
}

export function playerNation(data, playerId) {
  return playersById(data).get(playerId)?.nationality ?? null;
}

export function computeEwcSlots(data) {
  const slots = [];
  const taken = new Set();

  const dh = [...data.dreamhackResults].sort((a, b) => a.rank - b.rank);
  for (const r of dh) {
    slots.push({ path: 'dreamhack', playerId: r.playerId, sourceRank: r.rank, status: 'qualified' });
    taken.add(r.playerId);
  }

  let ecPicks = 0;
  for (const p of playersByEliteCupRank(data.players)) {
    if (ecPicks >= 8) break;
    if (taken.has(p.id)) continue;
    slots.push({ path: 'eliteCup', playerId: p.id, sourceRank: p.eliteCupRank, status: 'qualified' });
    taken.add(p.id);
    ecPicks++;
  }
  while (ecPicks < 8) {
    slots.push({ path: 'eliteCup', playerId: null, status: 'tbd' });
    ecPicks++;
  }

  let oqPicks = 0;
  for (const r of data.ewcOnlineResults) {
    if (oqPicks >= 16) break;
    if (taken.has(r.playerId)) continue;
    slots.push({ path: 'ewcOnline', playerId: r.playerId, status: 'qualified' });
    taken.add(r.playerId);
    oqPicks++;
  }
  while (oqPicks < 16) {
    slots.push({ path: 'ewcOnline', playerId: null, status: 'tbd' });
    oqPicks++;
  }

  return slots;
}

export function computeEncSlots(data) {
  const MAX_PER_NATION = 2;
  const slots = [];
  const nationCount = new Map();

  let ecPicks = 0;
  for (const p of playersByEliteCupRank(data.players)) {
    if (ecPicks >= 16) break;
    if (!p.nationality) continue;
    if ((nationCount.get(p.nationality) || 0) >= 1) continue;
    slots.push({ path: 'eliteCup', playerId: p.id, nation: p.nationality, sourceRank: p.eliteCupRank, status: 'qualified' });
    nationCount.set(p.nationality, 1);
    ecPicks++;
  }
  while (ecPicks < 16) {
    slots.push({ path: 'eliteCup', playerId: null, status: 'tbd' });
    ecPicks++;
  }

  let regPicks = 0;
  for (const r of data.regionalResults) {
    if (regPicks >= 14) break;
    const n = playerNation(data, r.playerId);
    if ((nationCount.get(n) || 0) >= MAX_PER_NATION) continue;
    slots.push({ path: 'encRegional', playerId: r.playerId, nation: n, status: 'qualified' });
    nationCount.set(n, (nationCount.get(n) || 0) + 1);
    regPicks++;
  }
  while (regPicks < 14) {
    slots.push({ path: 'encRegional', playerId: null, status: 'tbd' });
    regPicks++;
  }

  let wcPicks = 0;
  for (const w of data.wildcards) {
    if (wcPicks >= 2) break;
    if (w.playerId == null) {
      slots.push({ path: 'wildcard', playerId: null, status: 'tbd' });
      wcPicks++;
      continue;
    }
    if ((nationCount.get(w.nation) || 0) >= MAX_PER_NATION) continue;
    slots.push({ path: 'wildcard', playerId: w.playerId, nation: w.nation, status: 'qualified' });
    nationCount.set(w.nation, (nationCount.get(w.nation) || 0) + 1);
    wcPicks++;
  }
  while (wcPicks < 2) {
    slots.push({ path: 'wildcard', playerId: null, status: 'tbd' });
    wcPicks++;
  }

  return slots;
}

export function qualifiedViaMap(ewcSlots, encSlots) {
  const map = new Map();
  const ensure = id => {
    if (!map.has(id)) map.set(id, { ewc: [], enc: [] });
    return map.get(id);
  };
  for (const s of ewcSlots) {
    if (!s.playerId) continue;
    ensure(s.playerId).ewc.push(s.path);
  }
  for (const s of encSlots) {
    if (!s.playerId) continue;
    ensure(s.playerId).enc.push(s.path);
  }
  return map;
}

export function timeUntil(iso) {
  const target = new Date(iso).getTime();
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    totalMs: ms,
  };
}

const SMOKE_EXPECTED_EWC_EC = ['Binkss', 'Massa', 'Nayko', 'Otaaaq', 'Gwen', 'Mime', 'Xerar', 'Scapie'];

export function smokeTest(data) {
  const slots = computeEwcSlots(data);
  const tags = slots
    .filter(s => s.path === 'eliteCup' && s.playerId)
    .map(s => data.players.find(p => p.id === s.playerId)?.tag);
  const ok =
    tags.length === SMOKE_EXPECTED_EWC_EC.length &&
    tags.every((t, i) => t === SMOKE_EXPECTED_EWC_EC[i]);
  console.assert(ok, '[qualifiers] smoke test failed', { got: tags, expected: SMOKE_EXPECTED_EWC_EC });
  if (ok) console.info('[qualifiers] smoke test OK — Elite Cup → EWC:', tags.join(', '));
}
