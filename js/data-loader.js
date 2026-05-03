export async function loadData() {
  const url = `./data/players.json?v=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load data/players.json (HTTP ${res.status})`);
  const data = await res.json();
  data.__errors = validate(data);
  return data;
}

function validate(data) {
  const errors = [];
  const playerIds = new Set();
  const ranks = new Set();

  for (const p of data.players) {
    if (playerIds.has(p.id)) errors.push(`Duplicate player id: ${p.id}`);
    playerIds.add(p.id);
    if (p.nationality != null && !data.nations[p.nationality]) {
      errors.push(`Unknown nationality "${p.nationality}" on ${p.tag}`);
    }
    if (p.eliteCupRank != null) {
      if (!Number.isInteger(p.eliteCupRank) || p.eliteCupRank < 1) {
        errors.push(`Invalid eliteCupRank on ${p.tag}: ${p.eliteCupRank}`);
      } else if (ranks.has(p.eliteCupRank)) {
        errors.push(`Duplicate eliteCupRank ${p.eliteCupRank} on ${p.tag}`);
      } else {
        ranks.add(p.eliteCupRank);
      }
    }
  }

  const checkRef = (arr, label) => {
    for (const r of arr) {
      if (r.playerId != null && !playerIds.has(r.playerId)) {
        errors.push(`${label} references unknown playerId: ${r.playerId}`);
      }
    }
  };
  checkRef(data.dreamhackResults, 'dreamhackResults');
  checkRef(data.ewcOnlineResults, 'ewcOnlineResults');
  checkRef(data.regionalResults, 'regionalResults');
  checkRef(data.wildcards, 'wildcards');

  if (data.dreamhackResults.length > data.events.dreamhack.spots) {
    errors.push(`dreamhackResults exceeds ${data.events.dreamhack.spots} spots`);
  }
  if (data.ewcOnlineResults.length > data.events.ewcOnline.spots) {
    errors.push(`ewcOnlineResults exceeds ${data.events.ewcOnline.spots} spots`);
  }
  if (data.regionalResults.length > data.events.encRegional.spots) {
    errors.push(`regionalResults exceeds ${data.events.encRegional.spots} spots`);
  }

  return errors;
}
