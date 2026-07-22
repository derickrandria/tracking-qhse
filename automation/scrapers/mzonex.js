const { chromium } = require('playwright');
const config = require('../config');
const fs = require('fs');
const path = require('path');

class MzoneXScraper {
  constructor() {
    this.platform = config.platforms.mzonex;
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
  }
  async init() {
    console.log(`🌐 [MzoneX] Lancement navigateur...`);
    this.browser = await chromium.launch({ headless: config.browser.headless, slowMo: 150, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-blink-features=AutomationControlled'] });
    const ctx = await this.browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'fr-FR', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', ignoreHTTPSErrors: true });
    this.page = await ctx.newPage();
    this.page.setDefaultTimeout(60000);
  }
  async login() {
    const { loginUrl, login } = this.platform;
    console.log(`🔐 Connexion...`);
    try { await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch(e) {}
    await this.page.waitForTimeout(3000);
    const inp = await this.page.$$('input:visible');
    if (inp.length >= 2) {
      await inp[0].click(); await inp[0].fill(''); await inp[0].type(login.username, { delay: 30 });
      await inp[1].click(); await inp[1].fill(''); await inp[1].type(login.password, { delay: 30 });
      console.log(`   ✓ ${login.username}`);
    }
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Enter');
    console.log('   ⏳ SSO 15s...');
    await this.page.waitForTimeout(15000);
    this.isLoggedIn = true;
    console.log('   ✅ Connecté');
    return true;
  }
  async clickText(text) {
    return await this.page.evaluate((t) => {
      const norm = s => s.replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g,' ').trim().toLowerCase();
      const target = norm(t);
      function find(root) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false); while (w.nextNode()) { if (norm(w.currentNode.textContent).includes(target)) { const el = w.currentNode.parentElement; if (el) { el.click(); return true; } } } for (const el of root.querySelectorAll('*')) { if (el.shadowRoot) { if (find(el.shadowRoot)) return true; } } return false; }
      return find(document);
    }, text);
  }
  async extractPlates() {
    return await this.page.evaluate(() => {
      const r = new Set();
      function s(root) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false); while (w.nextNode()) { const m = w.currentNode.textContent.match(/(\d{4}\s*T[A-Z]{2,3})/); if (m) r.add(m[1].trim()); } root.querySelectorAll('[title]').forEach(el => { const m = (el.title||'').match(/(\d{4}\s*T[A-Z]{2,3})/); if (m) r.add(m[1].trim()); }); root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) s(el.shadowRoot); }); }
      s(document);
      return [...r];
    });
  }
  async extractVehicles() {
    if (!this.isLoggedIn) return [];
    console.log('📡 "Espace de travail"...');
    await this.clickText('Espace de travail');
    await this.page.waitForTimeout(5000);
    console.log('   🚗 "Véhicules"...');
    await this.clickText('Véhicules');
    console.log('   ⏳ 15s...');
    await this.page.waitForTimeout(15000);

    // Ouvrir dropdown
    console.log('   🔽 Dropdown...');
    const btnInfo = await this.page.evaluate(() => {
      for (const inp of document.querySelectorAll('input')) {
        const v = (inp.value || '').toLowerCase();
        if (v.includes('favourite') || v.includes('selected')) {
          const c = inp.closest('.wj-input-group') || inp.parentElement?.parentElement;
          if (c) { const b = c.querySelector('.wj-input-group-btn, .wj-btn, button'); if (b) { const r = b.getBoundingClientRect(); return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) }; } }
        }
      }
      return null;
    });
    if (btnInfo) {
      await this.page.mouse.click(btnInfo.x, btnInfo.y);
      await this.page.waitForTimeout(2000);
      const lss = await this.page.evaluate(() => {
        const norm = s => s.replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g,' ').trim().toLowerCase();
        function find(root) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false); while (w.nextNode()) { const t = norm(w.currentNode.textContent); if (t.includes('lss') && t.includes('lpsa') && t.includes('(')) { const el = w.currentNode.parentElement; if (el) { el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true})); el.click(); return true; } } } for (const el of root.querySelectorAll('*')) { if (el.shadowRoot) { if (find(el.shadowRoot)) return true; } } return false; }
        return find(document);
      });
      console.log(`   ✅ LSS: ${lss}`);
    }
    console.log('   ⏳ 15s...');
    await this.page.waitForTimeout(15000);
    await this._ss('05_grid');

    // ★ EXTRACTION AVEC MOUSE.WHEEL (virtual scroll) ★
    console.log('   📊 Extraction avec molette...');
    const allPlates = new Set();

    // Positionner la souris au centre de la grille
    const gridCenter = await this.page.evaluate(() => {
      const g = document.querySelector('.wj-flexgrid, .gridview-wrapper, .wj-cells, table');
      if (g) { const r = g.getBoundingClientRect(); return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }; }
      return { x: 700, y: 500 };
    });
    console.log(`   🖱️ Grille centre: (${gridCenter.x}, ${gridCenter.y})`);
    await this.page.mouse.move(gridCenter.x, gridCenter.y);

    // Extraction initiale
    let plates = await this.extractPlates();
    plates.forEach(p => allPlates.add(p));
    console.log(`   📋 Init: ${plates.length} | Total: ${allPlates.size}`);

    // Scroller avec mouse.wheel (10 tours de molette)
    let noNewCount = 0;
    for (let i = 0; i < 20; i++) {
      await this.page.mouse.wheel(0, 300);
      await this.page.waitForTimeout(800);
      plates = await this.extractPlates();
      const before = allPlates.size;
      plates.forEach(p => allPlates.add(p));
      const newCount = allPlates.size - before;
      console.log(`   🔄 Wheel ${i+1}: +${newCount} | Total: ${allPlates.size}`);
      if (newCount === 0) { noNewCount++; } else { noNewCount = 0; }
      if (noNewCount >= 3) { console.log('   ℹ️ Plus de nouvelles plaques'); break; }
    }

    // Scroll retour en haut + re-extraction
    await this.page.mouse.move(gridCenter.x, gridCenter.y);
    for (let i = 0; i < 10; i++) { await this.page.mouse.wheel(0, -500); await this.page.waitForTimeout(300); }
    await this.page.waitForTimeout(1000);
    plates = await this.extractPlates();
    plates.forEach(p => allPlates.add(p));

    // Fallback HTML
    if (allPlates.size < 20) {
      const html = await this.page.content();
      const found = [...new Set((html.match(/\d{4}\s*T[A-Z]{2,3}/g)||[]))];
      found.forEach(p => allPlates.add(p.trim()));
    }

    const vehicles = [...allPlates].map(p => ({ plate: p, platform: 'MzoneX', extractedAt: new Date().toISOString() }));
    console.log(`   ✅ [MzoneX] ${vehicles.length} véhicules`);
    await this._ss('06_done');
    return vehicles;
  }
  async _ss(n) { const d = path.join(__dirname,'..',config.output.screenshotsDir); if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); try{await this.page.screenshot({path:path.join(d,`mzonex_${n}.png`)});console.log(`   📸 ${n}`);}catch(e){} }
  async close() { if(this.browser){await this.browser.close();console.log('🔒 Fermé');} }
}
module.exports = { MzoneXScraper };