// ═══════════════════════════════════════════════════════════════════════
// SCRAPER PRINCIPAL – Orchestre MzoneX + CamtrackPro
// ═══════════════════════════════════════════════════════════════════════

const { MzoneXScraper } = require('./mzonex');
const { CamtrackProScraper } = require('./camtrackpro');
const config = require('../config');
const fs = require('fs');
const path = require('path');

class PlatformScraper {
  constructor(platformKey) {
    this.platformKey = platformKey;
    this.platformConfig = config.platforms[platformKey];
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log(`🌐 [${this.platformConfig.name}] Lancement du navigateur...`);
    this.browser = await chromium.launch({
      headless: true, // Mettre à false pour déboguer visuellement
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
    });
    this.page = await context.newPage();
  }

  async login() {
    const { url, login } = this.platformConfig;
    console.log(`🔐 [${this.platformConfig.name}] Connexion à ${url}...`);

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await this.page.waitForTimeout(2000);

    // Remplir le formulaire de connexion
    const { usernameInput, passwordInput, submitButton } = login.selectors;

    // Essayer plusieurs sélecteurs possibles
    const userInput = await this.page.$(usernameInput);
    if (userInput) {
      await userInput.fill(login.username);
      console.log(`   ✓ Identifiant saisi`);
    } else {
      console.warn(`   ⚠️ Sélecteur username introuvable: ${usernameInput}`);
    }

    const passInput = await this.page.$(passwordInput);
    if (passInput) {
      await passInput.fill(login.password);
      console.log(`   ✓ Mot de passe saisi`);
    } else {
      console.warn(`   ⚠️ Sélecteur password introuvable: ${passwordInput}`);
    }

    const submitBtn = await this.page.$(submitButton);
    if (submitBtn) {
      await submitBtn.click();
      await this.page.waitForTimeout(3000);
      console.log(`   ✓ Connexion soumise`);
    }

    // Vérifier la connexion
    const currentUrl = this.page.url();
    console.log(`   📍 URL après connexion: ${currentUrl}`);
  }

  async extractVehicleData() {
    console.log(`📡 [${this.platformConfig.name}] Extraction des données véhicules...`);
    const { selectors } = this.platformConfig;
    const vehicles = [];

    try {
      // Attendre que la liste des véhicules soit chargée
      await this.page.waitForSelector(selectors.vehicleList, { timeout: 15000 });

      // Extraire les données de chaque véhicule
      const elements = await this.page.$$(selectors.vehicleList);
      console.log(`   📋 ${elements.length} véhicules détectés`);

      for (const el of elements) {
        try {
          const getText = async (selector) => {
            try {
              const child = await el.$(selector);
              return child ? (await child.textContent()).trim() : null;
            } catch { return null; }
          };

          const vehicle = {
            name: await getText(selectors.vehicleName),
            position: await getText(selectors.position),
            speed: await getText(selectors.speed),
            status: await getText(selectors.status),
            lastUpdate: await getText(selectors.lastUpdate),
            platform: this.platformConfig.name,
            timestamp: new Date().toISOString(),
          };

          if (vehicle.name) {
            vehicles.push(vehicle);
          }
        } catch (err) {
          console.warn(`   ⚠️ Erreur extraction véhicule: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Erreur: ${err.message}`);
      // Capturer une screenshot pour débogage
      const screenshotPath = path.join(__dirname, '..', 'debug', `${this.platformKey}_error.png`);
      const debugDir = path.dirname(screenshotPath);
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Screenshot de débogage: ${screenshotPath}`);
    }

    console.log(`   ✅ ${vehicles.length} véhicules extraits de ${this.platformConfig.name}`);
    return vehicles;
  }

  async extractDrivingTime(vehicleId) {
    // Navigation vers la page de détail d'un véhicule pour extraire les temps de conduite
    // (à adapter selon l'interface de chaque plateforme)
    console.log(`   ⏱️ Extraction temps de conduite pour ${vehicleId}...`);
    // Cette méthode devra être adaptée selon la structure de MzoneX/CamtrackPro
    return null;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log(`🔒 [${this.platformConfig.name}] Navigateur fermé`);
    }
  }
}

// ── Fonction principale de scraping ───────────────────────────────────
async function scrapeAllPlatforms() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🚀 DÉMARRAGE DU SCRAPING – ${new Date().toLocaleString('fr-FR')}`);
  console.log('═══════════════════════════════════════════════════════════');

  const allData = { mzonex: [], camtrackpro: [] };

  // ── MzoneX ──
  try {
    const mzonex = new MzoneXScraper();
    await mzonex.init();
    const loggedIn = await mzonex.login();
    if (loggedIn) {
      allData.mzonex = await mzonex.extractVehicles();
    }
    await mzonex.close();
  } catch (err) {
    console.error(`❌ [MzoneX] Erreur: ${err.message}`);
  }

  // ── CamtrackPro ──
  try {
    const camtrack = new CamtrackProScraper();
    await camtrack.init();
    const loggedIn = await camtrack.login();
    if (loggedIn) {
      allData.camtrackpro = await camtrack.extractVehicles();
    }
    await camtrack.close();
  } catch (err) {
    console.error(`❌ [CamtrackPro] Erreur: ${err.message}`);
  }

  // Sauvegarder les données brutes
  const outputDir = path.join(__dirname, '..', config.output.dataDir);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(outputDir, `raw_positions_${timestamp}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
  console.log(`\n💾 Données brutes sauvegardées: ${outputFile}`);

  // Résumé
  console.log(`\n📊 RÉSUMÉ :`);
  console.log(`   MzoneX : ${allData.mzonex.length} véhicules`);
  console.log(`   CamtrackPro : ${allData.camtrackpro.length} véhicules`);

  return allData;
}

module.exports = { PlatformScraper, scrapeAllPlatforms };

// Exécution directe
if (require.main === module) {
  scrapeAllPlatforms().catch(console.error);
}
