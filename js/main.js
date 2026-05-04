import { loadData } from './data-loader.js';
import { computeEwcSlots, computeEncSlots, qualifiedViaMap, smokeTest } from './qualifiers.js';
import {
  showErrors,
  renderHero,
  renderSummaryCards,
  renderTimeline,
  renderEwc,
  renderEnc,
  renderRanking,
  renderExplainer,
  renderFooter,
  startCountdown,
} from './render.js';

async function main() {
  try {
    const data = await loadData();
    if (data.__errors?.length) showErrors(data.__errors);

    smokeTest(data);

    const ewcSlots = computeEwcSlots(data);
    const encSlots = computeEncSlots(data);
    const qMap = qualifiedViaMap(ewcSlots, encSlots);

    renderHero(data);
    renderSummaryCards(data, ewcSlots, encSlots);
    renderTimeline(data);
    renderEwc(data, ewcSlots);
    renderEnc(data, encSlots);
    renderRanking(data, qMap);
    renderExplainer();
    renderFooter();
    startCountdown(data);
  } catch (e) {
    console.error(e);
    showErrors([e.message || String(e)]);
  }
}

main();
