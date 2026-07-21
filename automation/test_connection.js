#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// TEST DE CONNEXION – Vérifie que le scraping fonctionne
// Prend des captures d'écran à chaque étape
//
// Usage :
//   MZONEX_USER=mon@email.com MZONEX_PASS=monmdp node automation/test_connection.js
// ═══════════════════════════════════════════════════════════════════════

const { MzoneXScraper } = require('./scrapers/mzonex');
const { CamtrackProScraper } = require('./scrapers/camtrackpro');
const config = require('./config');

async function testConnection() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   TEST DE CONNEXION AUX PLATEFORMES                     ║');
  console.log('║   Des captures d\'écran seront prises à chaque étape     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  // Vérifier que les identifiants sont configurés
  if (config.platforms.mzonex.login.username === 'VOTRE_IDENTIFIANT') {
    console.log('⚠️  ATTENTION : Les identifiants ne sont pas configurés !');
    console.log('');
    console.log('Configurez-les de deux façons :');
    console.log('');
    console.log('  Option 1 – Variables d\'environnement :');
    console.log('    export MZONEX_USER="votre_email"');
    console.log('    export MZONEX_PASS="votre_mdp"');
    console.log('    export CAMTRACK_USER="votre_email"');
    console.log('    export CAMTRACK_PASS="votre_mdp"');
    console.log('');
    console.log('  Option 2 – Modifier automation/config.js directement');
    console.log('');
    console.log('Puis relancez : node automation/test_connection.js');
    process.exit(1);
  }

  // Forcer le mode visible pour le test (on voit le navigateur)
  config.browser.headless = false;
  config.browser.screenshotOnError = true;

  // ── Test MzoneX ──
  console.log('\n════════════════════════════════════════');
  console.log('🔍 TEST MzoneX');
  console.log('════════════════════════════════════════');
  try {
    const mzonex = new MzoneXScraper();
    await mzonex.init();
    const loginOk = await mzonex.login();
    if (loginOk) {
      console.log('\n✅ MzoneX : CONNEXION RÉUSSIE');
      const vehicles = await mzonex.extractVehicles();
      console.log(`\n📊 ${vehicles.length} véhicules extraits`);
      if (vehicles.length > 0) {
        console.log('\n   Premiers véhicules détectés :');
        vehicles.slice(0, 5).forEach(v => {
          console.log(`   • ${v.plate} | ${v.eventType || '—'} | ${v.speed || '—'} | ${v.lastPosition || '—'}`);
        });
      }
    } else {
      console.log('\n❌ MzoneX : CONNEXION ÉCHOUÉE');
      console.log('   → Vérifiez vos identifiants dans automation/config.js');
      console.log('   → Consultez les captures dans automation/debug/screenshots/');
    }
    await mzonex.close();
  } catch (err) {
    console.error(`\n❌ MzoneX ERREUR : ${err.message}`);
  }

  // ── Test CamtrackPro ──
  console.log('\n════════════════════════════════════════');
  console.log('🔍 TEST CamtrackPro');
  console.log('════════════════════════════════════════');
  try {
    const camtrack = new CamtrackProScraper();
    await camtrack.init();
    const loginOk = await camtrack.login();
    if (loginOk) {
      console.log('\n✅ CamtrackPro : CONNEXION RÉUSSIE');
      const vehicles = await camtrack.extractVehicles();
      console.log(`\n📊 ${vehicles.length} véhicules extraits`);
      if (vehicles.length > 0) {
        console.log('\n   Premiers véhicules détectés :');
        vehicles.slice(0, 5).forEach(v => {
          console.log(`   • ${v.plate} (${v.brand || '—'}) | ${v.speed ? v.speed + ' km/h' : '—'}`);
        });
      }
    } else {
      console.log('\n❌ CamtrackPro : CONNEXION ÉCHOUÉE');
      console.log('   → Vérifiez vos identifiants dans automation/config.js');
    }
    await camtrack.close();
  } catch (err) {
    console.error(`\n❌ CamtrackPro ERREUR : ${err.message}`);
  }

  console.log('\n════════════════════════════════════════');
  console.log('📸 Les captures d\'écran sont dans :');
  console.log('   automation/debug/screenshots/');
  console.log('════════════════════════════════════════');
  console.log('\n💡 Si les sélecteurs ne correspondent pas, envoyez-moi');
  console.log('   les captures d\'écran générées et j\'adapterai le code.');
}

testConnection().catch(err => {
  console.error('❌ Erreur fatale:', err.message);
  process.exit(1);
});
