// Usage: node scripts/check-anim.cjs <port> <topicId> [<topicId> ...]
// Needs a dev server: npx vite --port <port> --strictPort   (start it in the background first)
// Opens each topic, exercises Animate and Playground, reports errors and saves screenshots for visual review.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [port, ...ids] = process.argv.slice(2);
  const outDir = process.env.SHOTS_DIR || require('path').join(require('os').tmpdir(), 'anim-shots'); fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  let bad = 0;
  for (const id of ids) {
    const errs = [];
    p.removeAllListeners('pageerror'); p.removeAllListeners('console');
    p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 300)); });
    await p.goto(`http://localhost:${port}/#/topic/${id}`);
    await p.waitForTimeout(800);
    const tab = p.locator('button.tab', { hasText: 'Animate' });
    if (!(await tab.count())) { console.log(`FAIL ${id}: no Animate tab (is src/anim/${id}.tsx present and exporting default?)`); bad++; continue; }
    await tab.click(); await p.waitForTimeout(900);
    const loadErr = await p.locator('text=failed to load').count();
    await p.screenshot({ path: `${outDir}/${id}-1-animate.png`, fullPage: true });
    const fwd = p.locator('button[title="Step forward"]');
    if (await fwd.count()) { for (let i = 0; i < 4; i++) { await fwd.first().click(); await p.waitForTimeout(250); } }
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${outDir}/${id}-2-animate-steps.png`, fullPage: true });
    const scrub = p.locator('.player input[type=range]').first();
    if (await scrub.count()) { await scrub.evaluate((el) => { const s = el; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(s, s.max); s.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(900); }
    await p.screenshot({ path: `${outDir}/${id}-3-animate-end.png`, fullPage: true });
    await p.locator('button.tab', { hasText: 'Playground' }).click(); await p.waitForTimeout(900);
    await p.screenshot({ path: `${outDir}/${id}-4-playground.png`, fullPage: true });
    const ranges = p.locator('.main input[type=range]');
    const nR = await ranges.count();
    for (let i = 0; i < Math.min(nR, 3); i++) {
      await ranges.nth(i).evaluate((el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; const v = (+el.min + +el.max * 3) / 4; set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); });
      await p.waitForTimeout(300);
    }
    const btns = p.locator('.main .viz-side button, .main .choice button');
    if (await btns.count()) { await btns.last().click().catch(() => {}); await p.waitForTimeout(400); }
    await p.screenshot({ path: `${outDir}/${id}-5-playground-changed.png`, fullPage: true });
    const nan = await p.evaluate(() => [...document.querySelectorAll('svg')].some((s) => /NaN|Infinity/.test(s.innerHTML)));
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    const problems = [...errs, ...(loadErr ? ['animation failed to load'] : []), ...(nan ? ['NaN/Infinity in an SVG'] : []), ...(overflow ? ['horizontal overflow'] : [])];
    if (problems.length) bad++;
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${id}${problems.length ? '\n   - ' + [...new Set(problems)].slice(0, 6).join('\n   - ') : ''}`);
  }
  console.log(`Screenshots: ${outDir}/<id>-{1..5}-*.png  (look at them!)`);
  await b.close();
  process.exit(bad ? 1 : 0);
})();
