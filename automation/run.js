#!/usr/bin/env node
const config = require('./config');
const { scrapeAllPlatforms } = require('./scrapers/scraper');
const { analyzeDrivingTime, analyzeFleet } = require('./processors/driving-time');
const { generateDailyReport } = require('./outputs/excel-report');
const { triggerAlerts } = require('./outputs/alerts');
const fs = require('fs');
const path = require('path');
const command = process.argv[2] || 'full';

async function runScrape() {
  console.log('\n📡 PHASE 1 : SCRAPING DES PLATEFORMES GPS');
  const data = await scrapeAllPlatforms();
  return data;
}

async function runAnalyze(fleetData) {
  console.log('\n⏱️  PHASE 2 : ANALYSE DES TEMPS DE CONDUITE');
  var sev = 'Seuils : TCC <= 4h30 | TCJ <= 10h00 | TTJ <= 12h00';
  console.log(sev);
  var result = analyzeFleet(fleetData || []);
  var results = result.results;
  var summary = result.summary;
  console.log('   Vehicules: ' + summary.totalVehicles);
  console.log('   TCJ: ' + summary.tcjCompliance + '%');
  console.log('   TTJ: ' + summary.ttjCompliance + '%');
  console.log('   TCC: ' + summary.continuousCompliance + '%');
  console.log('   Infractions: ' + summary.totalInfractions);
  if (summary.totalInfractions > 0) {
    for (var i = 0; i < summary.infractions.length; i++) {
      var inf = summary.infractions[i];
      console.log('   ⚠️  ' + inf.plate + ' - ' + inf.type);
    }
  }
  return { results: results, summary: summary };
}

async function runReport(vehicleData, analysisResults) {
  console.log('\n📊 PHASE 3 : RAPPORT EXCEL');
  var outputPath = generateDailyReport(vehicleData || [], analysisResults || []);
  return outputPath;
}

async function runAlerts(infractions) {
  console.log('\n🚨 PHASE 4 : ALERTES');
  await triggerAlerts(infractions || []);
}

async function runFull() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   AUTOMATION QHSE - PIPELINE COMPLET     ║');
  console.log('╚═══════════════════════════════════════════╝');
  var scrapedData = await runScrape();
  var allVehicles = [].concat(scrapedData && scrapedData.mzonex || [], scrapedData && scrapedData.camtrackpro || []);
  var analysis = await runAnalyze(allVehicles);
  var results = analysis.results;
  var summary = analysis.summary;
  await runReport(allVehicles, results);
  await runAlerts(summary.infractions);
  var liveData = {
    date: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toLocaleString('fr-FR'),
    mzonex: allVehicles.filter(function(v) { return v.platform === 'MzoneX'; }),
    camtrackpro: allVehicles.filter(function(v) { return v.platform === 'CamtrackPro'; }),
    totalVehicles: allVehicles.length,
    infractions: summary ? summary.infractions : [],
    compliance: summary ? { tcj: summary.tcjCompliance, ttj: summary.ttjCompliance, tcc: summary.continuousCompliance } : null
  };
  var publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'live-data.json'), JSON.stringify(liveData, null, 2));
  console.log('   💾 Dashboard: public/live-data.json (' + liveData.totalVehicles + ' vehicules)');
  console.log('\n✅ PIPELINE TERMINÉ');
}

function runScheduler() {
  var intervalMs = config.scheduler.intervalMinutes * 60 * 1000;
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   PLANIFICATEUR ACTIVÉ                   ║');
  console.log('║   Intervalle: ' + config.scheduler.intervalMinutes + ' min                    ║');
  console.log('║   Ctrl+C pour arrêter                    ║');
  console.log('╚═══════════════════════════════════════════╝');
  runFull().catch(function(err) { console.error('❌ ' + err.message); });
  setInterval(function() {
    var now = new Date();
    var t = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    console.log('\n🔄 [' + t + '] Execution planifiee...');
    runFull().catch(function(err) { console.error('❌ ' + err.message); });
  }, intervalMs);
}

async function runTest() {
  console.log('TEST moteur analyse');
  var testFleet = [
    { plate: '5186 TBV', driver: 'MICHAEL', drivingPeriods: [{ start: '06:00', end: '08:03' }, { start: '08:45', end: '10:34' }], pauses: [{ start: '08:03', end: '08:45' }] },
    { plate: '7936 TCB', driver: 'ANDRY', drivingPeriods: [{ start: '07:04', end: '07:25' }, { start: '08:18', end: '09:41' }], pauses: [{ start: '07:25', end: '08:18' }] },
    { plate: 'TEST', driver: 'DEPASSEMENT', drivingPeriods: [{ start: '04:00', end: '09:30' }, { start: '09:45', end: '15:00' }], pauses: [{ start: '09:30', end: '09:45' }] }
  ];
  var analysis = await runAnalyze(testFleet);
  await runAlerts(analysis.summary.infractions);
  await runReport(testFleet, analysis.results);
}

async function main() {
  if (command === 'scrape') await runScrape();
  else if (command === 'analyze') await runAnalyze([]);
  else if (command === 'report') await runReport([], []);
  else if (command === 'full') await runFull();
  else if (command === 'schedule') runScheduler();
  else if (command === 'test') await runTest();
  else console.log('Usage: node automation/run.js [scrape|analyze|report|full|schedule|test]');
}

main().catch(function(err) { console.error('❌ Erreur: ' + err.message); process.exit(1); });