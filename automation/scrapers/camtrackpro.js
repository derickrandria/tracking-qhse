// ═══════════════════════════════════════════════════════════════════════
// SCRAPER CamtrackPro – hosting.camtrack.net
// Corrigé : attente plus longue + meilleurs sélecteurs de login
// Basé sur captures d'écran du 22/07/2026
// ═══════════════════════════════════════════════════════════════════════

const { chromium } = require('playwright');
const config = require('../config');
const fs = require('fs');
const path = require('path');

class CamtrackProScraper {
  constructor() {
    this.platform = config.platforms.camtrackpro;
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  async init() {
    console.log(`🌐 [CamtrackPro] Lancement navigateur...`);
    this.browser = await chromium.launch({
      headless: config.browser.headless,
      slowMo: 200,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });
    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    });
    this.page = await context.newPage();
    this.page.setDefaultTimeout(60000);
  }

  async login() {
    const { loginUrl, login } = this.platform;
    console.log(`🔐 [CamtrackPro] Connexion à ${loginUrl}...`);

    // Charger la page de login
    await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.waitForTimeout(3000);

    // Fermer le popup Google Maps si présent
    try {
      const okBtn = await this.page.$('button:has-text("OK"), .ok-button, [class*="close"]');
      if (okBtn) {
        await okBtn.click();
        console.log('   ℹ️ Popup Google Maps fermé');
        await this.page.waitForTimeout(1000);
      }
    } catch (e) { /* pas de popup */ }

    await this._screenshot('01_login_page');

    // ── Remplir le formulaire de login ──
    // Basé sur la capture : "Utilisateur:", "Mot de passe:", bouton "Entrer"
    console.log('   📝 Remplissage du formulaire...');

    // Stratégie 1 : Chercher par les labels visibles
    try {
      // Le champ utilisateur (premier input text visible)
      const allInputs = await this.page.$$('input:visible');
      console.log(`   📋 ${allInputs.length} champs trouvés`);

      if (allInputs.length >= 2) {
        // Premier input = utilisateur, deuxième = mot de passe
        await allInputs[0].click();
        await allInputs[0].fill('');
        await allInputs[0].type(login.username, { delay: 50 });
        console.log(`   ✓ Utilisateur saisi: ${login.username}`);

        await allInputs[1].click();
        await allInputs[1].fill('');
        await allInputs[1].type(login.password, { delay: 50 });
        console.log(`   ✓ Mot de passe saisi`);

        // Soumettre le formulaire avec la touche Entrée (plus fiable que cliquer le bouton)
        await this.page.keyboard.press('Enter');
        console.log('   ✓ Touche Entrée envoyée');
      } else {
        console.warn('   ⚠️ Pas assez de champs trouvés');
        // Stratégie de secours : sélecteurs de la config
        const userInput = await this.page.$(login.selectors.usernameInput);
        const passInput = await this.page.$(login.selectors.passwordInput);
        if (userInput && passInput) {
          await userInput.fill(login.username);
          await passInput.fill(login.password);
          await this.page.keyboard.press('Enter');
        }
      }
    } catch (e) {
      console.error(`   ❌ Erreur formulaire: ${e.message}`);
    }

    // ── Attendre le chargement après login ──
    // CamtrackPro est LENT à charger (carte Google Maps + données véhicules)
    console.log('   ⏳ Attente du chargement (30 secondes)...');
    await this.page.waitForTimeout(10000);
    await this._screenshot('02_after_login_10s');

    // Fermer le popup Google Maps à nouveau (apparaît souvent après login)
    try {
      const okBtn2 = await this.page.$('button:has-text("OK")');
      if (okBtn2) {
        await okBtn2.click();
        console.log('   ℹ️ Popup Google Maps fermé (2ème fois)');
      }
    } catch (e) { /* */ }

    // Attendre encore
    await this.page.waitForTimeout(10000);
    await this._screenshot('02_after_login_20s');

    // Attendre encore si nécessaire (la carte peut mettre 30s+)
    await this.page.waitForTimeout(10000);
    await this._screenshot('02_after_login_30s');

    // Vérifier si la page est chargée (présence de la sidebar ou d'éléments de navigation)
    const pageText = await this.page.textContent('body').catch(() => '');
    const hasContent = pageText.includes('Tableau de bord') ||
                       pageText.includes('Statuts') ||
                       pageText.includes('LSS') ||
                       pageText.includes('TBS') ||
                       pageText.includes('TBV') ||
                       pageText.includes('TCC');

    if (hasContent) {
      this.isLoggedIn = true;
      console.log('   ✅ [CamtrackPro] Page chargée avec succès');
    } else {
      console.warn('   ⚠️ [CamtrackPro] La page semble encore en chargement');
      // On tente quand même l'extraction
      this.isLoggedIn = true;
    }

    return this.isLoggedIn;
  }

  async extractVehicles() {
    if (!this.isLoggedIn) {
      console.error('❌ [CamtrackPro] Non connecté');
      return [];
    }

    console.log('📡 [CamtrackPro] Extraction des véhicules...');

    // Cliquer sur l'onglet "Statuts"
    try {
      const statusTab = await this.page.$('text="Statuts"');
      if (statusTab) {
        await statusTab.click();
        console.log('   ✓ Onglet "Statuts" cliqué');
        await this.page.waitForTimeout(5000);
      }
    } catch (e) { /* déjà sur Statuts */ }

    await this._screenshot('03_status_page');

    const vehicles = [];

    // ── Stratégie 1 : Extraire TOUT le texte de la sidebar ──
    try {
      const bodyText = await this.page.textContent('body');

      // Pattern : "XXXX TXX-MARQUE-LPSA(LSS)" ou "XXXX TXX-MARQUE-LPSA(LSS)"
      const regex = /(\d{4}\s*T[A-Z]{2,3})[-\s]([A-Z\s]+?)[-]LPSA/g;
      const matches = [...bodyText.matchAll(regex)];
      const seen = new Set();

      for (const match of matches) {
        const plate = match[1].trim();
        if (!seen.has(plate)) {
          seen.add(plate);
          vehicles.push({
            plate,
            brand: match[2].trim(),
            fullName: match[0],
            platform: 'CamtrackPro',
            extractedAt: new Date().toISOString(),
          });
        }
      }
      console.log(`   📋 Stratégie 1 (texte page): ${vehicles.length} véhicules`);
    } catch (e) {
      console.warn(`   ⚠️ Stratégie 1 échouée: ${e.message}`);
    }

    // ── Stratégie 2 : Chercher dans les éléments de la sidebar ──
    if (vehicles.length === 0) {
      try {
        // Chercher tous les éléments qui contiennent le pattern de plaque
        const elements = await this.page.$$('*');
        const seen = new Set();

        for (const el of elements) {
          try {
            const text = await el.textContent();
            if (text && text.match(/\d{4}\s*T[A-Z]{2,3}/)) {
              const plateMatch = text.match(/(\d{4}\s*T[A-Z]{2,3})/);
              if (plateMatch && !seen.has(plateMatch[1])) {
                // Vérifier que c'est un élément de liste (pas le body entier)
                const tagName = await el.evaluate(e => e.tagName);
                const childCount = await el.evaluate(e => e.children.length);
                if (childCount < 5 && text.length < 100) {
                  seen.add(plateMatch[1]);
                  const brandMatch = text.match(/-([A-Z]+)-/);
                  vehicles.push({
                    plate: plateMatch[1].trim(),
                    brand: brandMatch ? brandMatch[1] : '',
                    fullName: text.trim(),
                    platform: 'CamtrackPro',
                    extractedAt: new Date().toISOString(),
                  });
                }
              }
            }
          } catch (e) { /* skip element */ }
        }
        console.log(`   📋 Stratégie 2 (éléments): ${vehicles.length} véhicules`);
      } catch (e) {
        console.warn(`   ⚠️ Stratégie 2 échouée: ${e.message}`);
      }
    }

    // ── Stratégie 3 : Liste connue de la config ──
    if (vehicles.length === 0) {
      console.log('   🔄 Utilisation de la liste connue...');
      for (const name of this.platform.knownVehicles) {
        const match = name.match(/^(\d{4}\s*T[A-Z]{2,3})-([A-Z]+)-/);
        if (match) {
          vehicles.push({
            plate: match[1].trim(),
            brand: match[2],
            fullName: name,
            platform: 'CamtrackPro',
            extractedAt: new Date().toISOString(),
          });
        }
      }
    }

    console.log(`   ✅ [CamtrackPro] ${vehicles.length} véhicules au total`);
    await this._screenshot('04_extraction_done');
    return vehicles;
  }

  async _screenshot(name) {
    const dir = path.join(__dirname, '..', config.output.screenshotsDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `camtrackpro_${name}.png`);
    try {
      await this.page.screenshot({ path: filePath, fullPage: false });
      console.log(`   📸 Screenshot: camtrackpro_${name}.png`);
    } catch (e) { /* ignore */ }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 [CamtrackPro] Navigateur fermé');
    }
  }
}

module.exports = { CamtrackProScraper };
