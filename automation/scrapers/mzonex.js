// ═══════════════════════════════════════════════════════════════════════
// SCRAPER MzoneX – live.mzoneweb.net v7.0.30
// Basé sur capture d'écran du 21/07/2026
// ═══════════════════════════════════════════════════════════════════════

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
    console.log(`🌐 [MzoneX] Lancement navigateur (headless: ${config.browser.headless})...`);
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
    console.log(`🔐 [MzoneX] Connexion à ${loginUrl}...`);

    await this.page.goto(loginUrl, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(2000);

    // Screenshot de la page de login (pour débogage)
    await this._screenshot('01_login_page');

    // Chercher les champs de connexion (plusieurs stratégies)
    const strategies = [
      // Stratégie 1 : sélecteurs de la config
      async () => {
        const userInput = await this.page.$(login.selectors.usernameInput);
        const passInput = await this.page.$(login.selectors.passwordInput);
        if (userInput && passInput) {
          await userInput.fill(login.username);
          await passInput.fill(login.password);
          const btn = await this.page.$(login.selectors.submitButton);
          if (btn) await btn.click();
          return true;
        }
        return false;
      },
      // Stratégie 2 : par placeholder
      async () => {
        const userInput = await this.page.$('input[placeholder*="mail" i], input[placeholder*="login" i], input[placeholder*="user" i]');
        const passInput = await this.page.$('input[type="password"]');
        if (userInput && passInput) {
          await userInput.fill(login.username);
          await passInput.fill(login.password);
          await this.page.keyboard.press('Enter');
          return true;
        }
        return false;
      },
      // Stratégie 3 : premier input text + premier password
      async () => {
        const inputs = await this.page.$$('input');
        let textInput = null;
        let passInput = null;
        for (const inp of inputs) {
          const type = await inp.getAttribute('type');
          if (type === 'password') passInput = inp;
          else if ((type === 'text' || type === 'email') && !textInput) textInput = inp;
        }
        if (textInput && passInput) {
          await textInput.fill(login.username);
          await passInput.fill(login.password);
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
      console.error('❌ [MzoneX] Impossible de trouver les champs de connexion');
      await this._screenshot('01_login_failed');
      return false;
    }

    // Attendre la redirection / chargement
    await this.page.waitForTimeout(5000);
    await this._screenshot('02_after_login');

    // Vérifier si on est connecté (présence de l'interface de travail)
    const currentUrl = this.page.url();
    console.log(`   📍 URL après login: ${currentUrl}`);

    if (currentUrl.includes('workspace') || currentUrl.includes('map')) {
      this.isLoggedIn = true;
      console.log('   ✅ [MzoneX] Connexion réussie');
    } else {
      // Essayer de naviguer directement vers la page véhicules
      await this.page.goto(this.platform.url, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(3000);
      this.isLoggedIn = true;
      console.log('   ✅ [MzoneX] Navigation vers workspace');
    }

    return this.isLoggedIn;
  }

  async extractVehicles() {
    if (!this.isLoggedIn) {
      console.error('❌ [MzoneX] Non connecté');
      return [];
    }

    console.log('📡 [MzoneX] Extraction de la grille véhicules...');

    // S'assurer qu'on est sur l'onglet Véhicules
    try {
      const vehTab = await this.page.$('button:has-text("Véhicules"), [class*="tab"]:has-text("Véhicules")');
      if (vehTab) await vehTab.click();
      await this.page.waitForTimeout(2000);
    } catch (e) { /* déjà sur l'onglet */ }

    await this._screenshot('03_vehicles_grid');

    const vehicles = [];

    // Stratégie 1 : Tableau HTML standard
    try {
      const rows = await this.page.$$('table tbody tr, [role="row"]:not([role="row"]:first-child), [class*="grid-row"]');
      console.log(`   📋 ${rows.length} lignes détectées (stratégie tableau)`);

      for (const row of rows) {
        const cells = await row.$$('td, [role="gridcell"], [role="cell"]');
        if (cells.length >= 6) {
          const getText = async (idx) => {
            if (idx >= cells.length) return null;
            const text = await cells[idx].textContent();
            return text ? text.trim() : null;
          };

          const cols = this.platform.selectors.columns;
          const vehicle = {
            description: await getText(cols.description),
            plate: await getText(cols.registration),
            eventType: await getText(cols.eventType),
            timestamp: await getText(cols.timestamp),
            speed: await getText(cols.speed),
            lastPosition: await getText(cols.lastPosition),
            odometer: await getText(cols.odometer),
            platform: 'MzoneX',
            extractedAt: new Date().toISOString(),
          };

          // Extraire la plaque propre (ex: "0576 TCD" depuis "0576 TCD (LSS)")
          if (vehicle.description && !vehicle.plate) {
            vehicle.plate = vehicle.description.replace(/\s*\(.*\)\s*$/, '').trim();
          }

          // Extraire la vitesse en nombre
          if (vehicle.speed) {
            vehicle.speedKmh = parseFloat(vehicle.speed) || 0;
          }

          // Extraire l'horodatage en minutes
          if (vehicle.timestamp) {
            vehicle.minutesAgo = this._parseTimestamp(vehicle.timestamp);
          }

          if (vehicle.plate) {
            vehicles.push(vehicle);
          }
        }
      }
    } catch (e) {
      console.warn(`   ⚠️ Stratégie tableau échouée: ${e.message}`);
    }

    // Stratégie 2 : Extraction par texte de la page (fallback)
    if (vehicles.length === 0) {
      console.log('   🔄 Tentative extraction par texte...');
      const pageContent = await this.page.content();
      // Chercher les patterns de plaques (ex: "0576 TCD")
      const plateRegex = /(\d{4}\s*T[A-Z]{2,3})/g;
      const foundPlates = [...new Set(pageContent.match(plateRegex) || [])];
      console.log(`   📋 ${foundPlates.length} plaques trouvées dans le HTML`);

      for (const plate of foundPlates) {
        vehicles.push({
          plate: plate.trim(),
          platform: 'MzoneX',
          extractedAt: new Date().toISOString(),
          note: 'Extrait par regex (détails non disponibles)',
        });
      }
    }

    // Stratégie 3 : API interne (interception des requêtes réseau)
    if (vehicles.length === 0) {
      console.log('   🔄 Tentative via interception API...');
      // MzoneX utilise probablement des appels API internes
      // On peut intercepter les réponses JSON
    }

    console.log(`   ✅ [MzoneX] ${vehicles.length} véhicules extraits`);
    await this._screenshot('04_extraction_done');
    return vehicles;
  }

  async extractEvents(vehiclePlate) {
    // Cliquer sur un véhicule pour voir ses événements/historique
    console.log(`   📍 [MzoneX] Extraction événements pour ${vehiclePlate}...`);
    // À implémenter selon l'interface de détail
    return [];
  }

  _parseTimestamp(ts) {
    // Parse "6d 19h 30m" ou "34m 18s" ou "0m 32s" en minutes
    if (!ts) return 0;
    let totalMinutes = 0;
    const days = ts.match(/(\d+)d/);
    const hours = ts.match(/(\d+)h/);
    const minutes = ts.match(/(\d+)m/);
    if (days) totalMinutes += parseInt(days[1]) * 1440;
    if (hours) totalMinutes += parseInt(hours[1]) * 60;
    if (minutes) totalMinutes += parseInt(minutes[1]);
    return totalMinutes;
  }

  async _screenshot(name) {
    if (!config.browser.screenshotOnError && !name.includes('error')) return;
    const dir = path.join(__dirname, '..', config.output.screenshotsDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `mzonex_${name}.png`);
    try {
      await this.page.screenshot({ path: filePath, fullPage: false });
      console.log(`   📸 Screenshot: ${filePath}`);
    } catch (e) { /* ignore */ }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 [MzoneX] Navigateur fermé');
    }
  }
}

module.exports = { MzoneXScraper };
