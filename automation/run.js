#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// POINT D'ENTRÉE – Système d'automation QHSE
// ═══════════════════════════════════════════════════════════════════════
//
// Usage :
//   node automation/run.js scrape        → Scraping des plateformes GPS
//   node automation/run.js analyze       → Analyse TCJ/TTJ + détection infractions
//   node automation/run.js report        → Génération du rapport Excel journalier
//   node automation/run.js full          → TOUT : scrape + analyze + report + alertes
//   node automation/run.js schedule      → Lancer le planificateur (toutes les 2h)
//   node automation/run.js test          → Test du moteur d'analyse avec données réelles
//
// ═══════════════════════════════════════════════════════════════════════

const config = require('./config');
const { scrapeAllPlatforms } = require('./scrapers/scraper');
const { analyzeDrivingTime, analyzeFleet } = require('./processors/driving-time');
const { generateDailyReport } = require('./outputs/excel-report');
const { triggerAlerts } = require('./outputs/alerts');
const fs = require('fs');
const path = require('path');

const command = process.argv[2] || 'full';

// ── SCRAPE : Récupérer les données des plateformes ────────────────────
async function runScrape() {
  console.log('\n📡 PHASE 1 : SCRAPING DES PLATEFORMES GPS');
  console.log('─────────────────────────────────────────');
  const data = await scrapeAllPlatforms();
  return data;
}

// ── ANALYZE : Calculer TCJ/TTJ + détecter les infractions ─────────────
async function runAnalyze(fleetData) {
  console.log('\n⏱️  PHASE 2 : ANALYSE DES TEMPS DE CONDUITE');
  console.log('─────────────────────────────────────────');
  console.log(`   Seuils : TCC ≤ 4h30 | TCJ ≤ 10h00 | TTJ ≤ 12h00`);

  const { results, summary } = analyzeFleet(fleetData || []);

  console.log(`\n   📊 RÉSULTATS :`);
  console.log(`   • Véhicules analysés : ${summary.totalVehicles}`);
  console.log(`   • Conformité TCJ : ${summary.tcjCompliance}%`);
  console.log(`   • Conformité TTJ : ${summary.ttjCompliance}%`);
  console.log(`   • Conformité TCC : ${summary.continuousCompliance}%`);
  console.log(`   • Infractions détectées : ${summary.totalInfractions}`);

  if (summary.totalInfractions > 0) {
    console.log(`\n   🚨 INFRACTIONS :`);
    for (const inf of summary.infractions) {
      console.log(`   ⚠️  ${inf.plate} (${inf.driver}) – ${inf.type}: ${inf.detail}`);
    }
  }

  return { results, summary };
}

// ── REPORT : Générer le fichier Excel ─────────────────────────────────
async function runReport(vehicleData, analysisResults) {
  console.log('\n📊 PHASE 3 : GÉNÉRATION DU RAPPORT EXCEL');
  console.log('─────────────────────────────────────────');
  const outputPath = generateDailyReport(vehicleData || [], analysisResults || []);
  return outputPath;
}

// ── ALERTS : Envoyer les alertes ──────────────────────────────────────
async function runAlerts(infractions) {
  console.log('\n🚨 PHASE 4 : ALERTES AUTOMATIQUES');
  console.log('─────────────────────────────────────────');
  await triggerAlerts(infractions || []);
}

// ── FULL : Tout le pipeline ───────────────────────────────────────────
async function runFull() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   AUTOMATION QHSE – PIPELINE COMPLET                    ║');
  console.log('║   Transport Pétrolier – Antananarivo, Madagascar        ║');
  console.log(`║   ${new Date().toLocaleString('fr-FR').padEnd(53)}║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Phase 1 : Scraping
  const scrapedData = await runScrape();

  // Phase 2 : Analyse
  const allVehicles = [
    ...(scrapedData?.mzonex || []),
    ...(scrapedData?.camtrackpro || []),
  ];
  const { results, summary } = await runAnalyze(allVehicles);

  // Phase 3 : Rapport Excel
  await runReport(allVehicles, results);

  // Phase 4 : Alertes
  await runAlerts(summary.infractions);

  console.log('\n✅ PIPELINE TERMINÉ AVEC SUCCÈS');
  console.log('─────────────────────────────────────────');
}

// ── SCHEDULE : Planificateur (toutes les 2h) ──────────────────────────
function runScheduler() {
  const intervalMs = config.scheduler.intervalMinutes * 60 * 1000;

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   PLANIFICATEUR QHSE – ACTIVÉ                          ║');
  console.log(`║   Intervalle : toutes les ${config.scheduler.intervalMinutes} minutes                      ║`);
  console.log(`║   Rapport journalier : ${config.scheduler.dailyReportTime}                       ║`);
  console.log(`║   Vérification J-1 : ${config.scheduler.j1CheckTime}                           ║`);
  console.log('║   Appuyez sur Ctrl+C pour arrêter                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Exécution immédiate
  runFull().catch(err => console.error('❌ Erreur:', err.message));

  // Planification récurrente
  setInterval(() => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    console.log(`\n🔄 [${timeStr}] Exécution planifiée...`);
    runFull().catch(err => console.error('❌ Erreur:', err.message));
  }, intervalMs);
}

// ── TEST : Tester le moteur avec les données réelles du 21/07 ─────────
async function runTest() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   TEST – Moteur d\'analyse avec données réelles 21/07    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Simuler des données de conduite basées sur le fichier réel
  const testFleet = [
    {
      plate: '5186 TBV', driver: 'MICHAËL',
      drivingPeriods: [
        { start: '06:00', end: '08:03' },
        { start: '08:45', end: '10:34' },
      ],
      pauses: [
        { start: '08:03', end: '08:45' },
      ],
    },
    {
      plate: '7936 TCB', driver: 'ANDRY MICKAEL',
      drivingPeriods: [
        { start: '07:04', end: '07:25' },
        { start: '08:18', end: '08:26' },
        { start: '08:26', end: '09:41' },
      ],
      pauses: [
        { start: '07:25', end: '08:18' },
        { start: '08:26', end: '08:26' },
      ],
    },
    {
      plate: '9186 TCC', driver: 'SEPTO',
      drivingPeriods: [
        { start: '06:02', end: '06:19' },
        { start: '08:29', end: '08:41' },
        { start: '08:41', end: '10:24' },
      ],
      pauses: [
        { start: '06:19', end: '08:29' },
        { start: '08:41', end: '08:41' },
      ],
    },
    {
      // Exemple de dépassement TCJ
      plate: 'TEST TCJ', driver: 'EXEMPLE DÉPASSEMENT',
      drivingPeriods: [
        { start: '04:00', end: '09:30' },
        { start: '09:45', end: '15:00' },
      ],
      pauses: [
        { start: '09:30', end: '09:45' },
      ],
    },
  ];

  const { results, summary } = await runAnalyze(testFleet);
  await runAlerts(summary.infractions);

  // Générer un rapport de test
  await runReport(testFleet, results);
}

// ── Exécution ─────────────────────────────────────────────────────────
async function main() {
  switch (command) {
    case 'scrape': await runScrape(); break;
    case 'analyze': await runAnalyze([]); break;
    case 'report': await runReport([], []); break;
    case 'full': await runFull(); break;
    case 'schedule': runScheduler(); break;
    case 'test': await runTest(); break;
    default:
      console.log('Usage: node automation/run.js <command>');
      console.log('');
      console.log('Commandes :');
      console.log('  scrape     → Scraping des plateformes GPS (MzoneX / CamtrackPro)');
      console.log('  analyze    → Analyse TCJ/TTJ + détection infractions');
      console.log('  report     → Génération du rapport Excel journalier');
      console.log('  full       → Pipeline complet (scrape + analyze + report + alertes)');
      console.log('  schedule   → Planificateur (exécution automatique toutes les 2h)');
      console.log('  test       → Test du moteur avec données réelles');
      break;
  }
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err.message);
  process.exit(1);
});
