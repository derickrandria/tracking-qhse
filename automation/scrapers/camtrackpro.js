// ═══════════════════════════════════════════════════════════════════════
// SCRAPER CamtrackPro – hosting.camtrack.net
// Basé sur capture d'écran du 21/07/2026
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
    console.log(`🌐 [CamtrackPro] Lancement navigateur (headless: ${config.browser.headless})...`);
    this.browser = await chromium.launch({
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });
    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    });
    this.page = await context.newPage();
    this.page.setDefaultTimeout(config.browser.timeout);
  }

  async login() {
    const { loginUrl, login } = this.platform;
    console.log(`🔐 [CamtrackPro] Connexion à ${loginUrl}...`);

    await this.page.goto(loginUrl, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(2000);

    // Fermer le popup Google Maps si présent
    try {
      const okBtn = await this.page.$('button:has-text("OK")');
      if (okBtn) {
        await okBtn.click();
        console.log('   ℹ️ Popup Google Maps fermé');
      }
    } catch (e) { /* pas de popup */ }

    await this._screenshot('01_login_page');

    // Stratégies de connexion
    const strategies = [
      async () => {
        const userInput = await this.page.$(login.selectors.usernameInput);
        const passInput = await this.page.$(login.selectors.passwordInput);
        if (userInput && passInput) {
          await userInput.fill(login.username);
          await passInput.fill(login.password);
          const btn = await this.page.$(login.selectors.submitButton);
          if (btn) await btn.click();
          else await this.page.keyboard.press('Enter');
          return true;
        }
        return false;
      },
      async () => {
        const inputs = await this.page.$$('input:visible');
        if (inputs.length >= 2) {
          await inputs[0].fill(login.username);
          await inputs[1].fill(login.password);
          await this.page.keyboard.press('Enter');
          return true;
        }
        return false;
      },
    ];

    let loggedIn = false;
    for (const strategy of strategies) {
      try {
        loggedIn = await strategy();
        if (loggedIn) break;
      } catch (e) { continue; }
    }

    if (!loggedIn) {
      console.error('❌ [CamtrackPro] Impossible de trouver les champs de connexion');
      await this._screenshot('01_login_failed');
      return false;
    }

    await this.page.waitForTimeout(5000);
    await this._screenshot('02_after_login');

    // Vérifier la connexion (présence de la sidebar avec véhicules)
    const currentUrl = this.page.url();
    const hasSidebar = await this.page.$('[class*="sidebar"], [class*="vehicle-list"], nav');
    
    if (hasSidebar || currentUrl.includes('camtrack')) {
      this.isLoggedIn = true;
      console.log('   ✅ [CamtrackPro] Connexion réussie');
    } else {
      console.warn('   ⚠️ [CamtrackPro] Statut de connexion incertain');
      this.isLoggedIn = true; // On tente quand même
    }

    return this.isLoggedIn;
  }

  async extractVehicles() {
    if (!this.isLoggedIn) {
      console.error('❌ [CamtrackPro] Non connecté');
      return [];
    }

    console.log('📡 [CamtrackPro] Extraction des véhicules...');

    // Cliquer sur l'onglet "Statuts" si pas déjà dessus
    try {
      const statusTab = await this.page.$('a:has-text("Statuts"), span:has-text("Statuts"), [class*="tab"]:has-text("Statuts")');
      if (statusTab) {
        await statusTab.click();
        await this.page.waitForTimeout(2000);
      }
    } catch (e) { /* déjà sur Statuts */ }

    await this._screenshot('03_status_page');

    const vehicles = [];

    // Stratégie 1 : Extraire de la sidebar (liste à gauche)
    try {
      // Sur la capture, les véhicules sont listés à gauche avec le format:
      // "0826 TBS-MERCEDES-LPSA(LSS)"
      const sidebarItems = await this.page.$$('[class*="vehicle"] [class*="name"], [class*="unit"] [class*="name"], .sidebar [class*="item"], [class*="device"] [class*="name"]');
      
      if (sidebarItems.length > 0) {
        console.log(`   📋 ${sidebarItems.length} items trouvés dans la sidebar`);
        for (const item of sidebarItems) {
          const text = await item.textContent();
          if (text) {
            const parsed = this._parseVehicleName(text.trim());
            if (parsed) vehicles.push(parsed);
          }
        }
      }
    } catch (e) {
      console.warn(`   ⚠️ Stratégie sidebar: ${e.message}`);
    }

    // Stratégie 2 : Extraction par regex sur le contenu HTML
    if (vehicles.length === 0) {
      console.log('   🔄 Tentative extraction par regex...');
      const pageContent = await this.page.content();
      
      // Pattern CamtrackPro : "XXXX TXX-MARQUE-LPSA(LSS)"
      const regex = /(\d{4}\s*T[A-Z]{2,3})-([A-Z]+)-LPSA\(LSS\)/g;
      const matches = [...pageContent.matchAll(regex)];
      const unique = [...new Map(matches.map(m => [m[1], m])).values()];
      
      console.log(`   📋 ${unique.length} véhicules trouvés par regex`);
      for (const match of unique) {
        vehicles.push({
          plate: match[1].trim(),
          brand: match[2],
          fullName: match[0],
          platform: 'CamtrackPro',
          extractedAt: new Date().toISOString(),
        });
      }
    }

    // Stratégie 3 : Utiliser les véhicules connus de la config
    if (vehicles.length === 0) {
      console.log('   🔄 Utilisation de la liste connue...');
      for (const name of this.platform.knownVehicles) {
        const parsed = this._parseVehicleName(name);
        if (parsed) vehicles.push(parsed);
      }
    }

    // Maintenant, pour chaque véhicule, essayer de cliquer et extraire le statut
    for (const vehicle of vehicles) {
      try {
        // Cliquer sur le véhicule dans la sidebar pour voir ses détails
        const vehicleEl = await this.page.$(`text="${vehicle.fullName}"`);
        if (vehicleEl) {
          await vehicleEl.click();
          await this.page.waitForTimeout(1000);
          // Extraire les infos de statut depuis le panneau de droite
          const statusInfo = await this._extractStatusPanel();
          Object.assign(vehicle, statusInfo);
        }
      } catch (e) { /* skip */ }
    }

    console.log(`   ✅ [CamtrackPro] ${vehicles.length} véhicules extraits`);
    await this._screenshot('04_extraction_done');
    return vehicles;
  }

  async extractReport(reportType = 'positions') {
    // Navigation vers Rapports pour extraire l'historique
    console.log(`📊 [CamtrackPro] Extraction rapport: ${reportType}...`);
    try {
      const reportsTab = await this.page.$('a:has-text("Rapports"), span:has-text("Rapports")');
      if (reportsTab) {
        await reportsTab.click();
        await this.page.waitForTimeout(2000);
        await this._screenshot('05_reports_page');
      }
    } catch (e) {
      console.warn(`   ⚠️ Impossible d'accéder aux rapports: ${e.message}`);
    }
    return [];
  }

  _parseVehicleName(fullName) {
    // Parse "0826 TBS-MERCEDES-LPSA(LSS)" → { plate: "0826 TBS", brand: "MERCEDES", ... }
    const match = fullName.match(/^(\d{4}\s*T[A-Z]{2,3})-([A-Z\s]+?)-(?:LPSA|LSS)/);
    if (!match) {
      // Essayer le format simple "XXXX TXX"
      const simple = fullName.match(/^(\d{4}\s*T[A-Z]{2,3})/);
      if (simple) return { plate: simple[1], fullName, platform: 'CamtrackPro', extractedAt: new Date().toISOString() };
      return null;
    }
    return {
      plate: match[1].trim(),
      brand: match[2].trim(),
      fullName,
      platform: 'CamtrackPro',
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractStatusPanel() {
    // Extraire les informations du panneau de statut quand on clique sur un véhicule
    const info = {};
    try {
      // Chercher vitesse, position, etc. dans le panneau actif
      const panel = await this.page.$('[class*="info-panel"], [class*="detail"], [class*="popup"]');
      if (panel) {
        const text = await panel.textContent();
        // Extraire vitesse
        const speedMatch = text.match(/(\d+\.?\d*)\s*km\/h/i);
        if (speedMatch) info.speed = parseFloat(speedMatch[1]);
        // Extraire position
        const posMatch = text.match(/(?:position|adresse|address)[:\s]+([^\n]+)/i);
        if (posMatch) info.lastPosition = posMatch[1].trim();
      }
    } catch (e) { /* ignore */ }
    return info;
  }

  async _screenshot(name) {
    if (!config.browser.screenshotOnError && !name.includes('error')) return;
    const dir = path.join(__dirname, '..', config.output.screenshotsDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `camtrackpro_${name}.png`);
    try {
      await this.page.screenshot({ path: filePath, fullPage: false });
      console.log(`   📸 Screenshot: ${filePath}`);
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
