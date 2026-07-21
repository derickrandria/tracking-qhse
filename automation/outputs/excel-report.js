// ═══════════════════════════════════════════════════════════════════════
// GÉNÉRATEUR DE RAPPORT EXCEL – Suivi journalier automatique
// Reproduit le format du fichier de suivi LPSA
// ═══════════════════════════════════════════════════════════════════════

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Génère le fichier Excel de suivi journalier
 * @param {Array} vehicleData - Données des véhicules avec positions + temps de conduite
 * @param {Object} analysisResults - Résultats d'analyse TCJ/TTJ
 */
function generateDailyReport(vehicleData, analysisResults, date = null) {
  const reportDate = date || new Date().toISOString().split('T')[0];
  const fileName = config.output.dailyReportName.replace('{DATE}', reportDate.replace(/-/g, ''));
  const outputDir = path.join(__dirname, '..', config.output.reportsDir);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, fileName);

  // En-têtes (reproduit le format LPSA)
  const headers = [
    'N° CC', 'Prénom Chauffeur', 'N° Téléphone', 'Remorque', 'Transporteur',
    'Mission / Description', 'Situation', 'Statut',
    'Dépôt Récepteur', 'Distributeur', 'Produit', 'OT', 'Emplacement',
    // Positions
    'Empl. J-1', '08h00', 'Distance', '10h00', 'Distance',
    '12h00', 'Distance', '14h00', 'Distance',
    '16h00', 'Distance', '18h00', 'Distance',
    '20h00', 'Distance', '22h00', 'Distance',
    // Temps de conduite
    'H. Départ', 'TCC (temps réel)', 'TCJ cumulé', 'TCJ restant',
    'Statut TCJ', 'TTJ (temps réel)',
    // Trajets
    'Fin T1', 'Deb T2', 'Fin T2', 'Deb T3', 'Fin T3',
    'Deb T4', 'Fin T4', 'Deb T5', 'Fin T5',
    // Arrêt final + pause
    'Arrêt Final', 'Total pause',
    // Alertes automatiques
    '⚠️ Alerte TCJ', '⚠️ Alerte TTJ', '⚠️ Alerte TCC',
  ];

  const rows = [headers];

  for (const v of vehicleData) {
    const analysis = analysisResults?.find(a => a.plate === v.plate) || {};

    rows.push([
      v.plate || '', v.driver || '', v.phone || '', v.trailer || '', v.transporter || '',
      v.mission || '', v.situation || '', v.status || '',
      v.depot || '', v.distributor || '', v.product || '', v.ot || '', v.emplacement || '',
      // Positions
      v.positions?.j1 || '', v.positions?.h08 || '', v.distances?.h08 || '',
      v.positions?.h10 || '', v.distances?.h10 || '',
      v.positions?.h12 || '', v.distances?.h12 || '',
      v.positions?.h14 || '', v.distances?.h14 || '',
      v.positions?.h16 || '', v.distances?.h16 || '',
      v.positions?.h18 || '', v.distances?.h18 || '',
      v.positions?.h20 || '', v.distances?.h20 || '',
      v.positions?.h22 || '', v.distances?.h22 || '',
      // Temps de conduite
      v.depart || analysis.tcc ? v.depart || '' : '',
      analysis.tcc || '', analysis.tcj || '', analysis.tcjRemaining || '',
      analysis.tcjStatut || '', analysis.ttj || '',
      // Trajets
      v.trajets?.[0]?.fin || '', v.trajets?.[0]?.deb || '', v.trajets?.[1]?.fin || '',
      v.trajets?.[1]?.deb || '', v.trajets?.[2]?.fin || '',
      v.trajets?.[2]?.deb || '', v.trajets?.[3]?.fin || '',
      v.trajets?.[3]?.deb || '', v.trajets?.[4]?.fin || '',
      // Arrêt + pause
      v.arretFinal || '', analysis.totalPause || v.totalPause || '',
      // Alertes
      analysis.tcjOver ? '⚠️ TCJ DÉPASSÉ' : 'OK',
      analysis.ttjOver ? '⚠️ TTJ DÉPASSÉ' : 'OK',
      analysis.tccOver ? '⚠️ TCC > 4h30' : 'OK',
    ]);
  }

  // Créer le workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Largeurs de colonnes
  ws['!cols'] = headers.map((h, i) => ({
    wch: i < 13 ? 20 : i < 31 ? 14 : i < 37 ? 12 : 10,
  }));

  // Feuille de résumé
  const summaryData = [
    ['SUIVI JOURNALIER — POSITIONS & TEMPS DE CONDUITE | LPSA'],
    [`Date : ${reportDate}`],
    [`Seuil TCJ : ${config.rules.tcjMaxMinutes / 60}h00 | Seuil TTJ : ${config.rules.ttjMaxMinutes / 60}h00 | TCC max : 4h30`],
    [''],
    ['RÉSUMÉ AUTOMATIQUE'],
    ['Total véhicules', vehicleData.length],
    ['En transit', vehicleData.filter(v => v.status === 'En transit').length],
    ['Chargés', vehicleData.filter(v => v.situation === 'CHARGE').length],
    ['Vides', vehicleData.filter(v => v.situation === 'VIDE').length],
    ['Maintenance', vehicleData.filter(v => v.status === 'Maintenance').length],
    [''],
    ['CONFORMITÉ'],
    ['TCJ conforme (%)', analysisResults ? Math.round((analysisResults.filter(a => !a.tcjOver).length / analysisResults.length) * 100) : '—'],
    ['TTJ conforme (%)', analysisResults ? Math.round((analysisResults.filter(a => !a.ttjOver).length / analysisResults.length) * 100) : '—'],
    ['TCC conforme (%)', analysisResults ? Math.round((analysisResults.filter(a => !a.tccOver).length / analysisResults.length) * 100) : '—'],
    [''],
    ['INFRACTIONS DÉTECTÉES AUTOMATIQUEMENT'],
    ...(analysisResults?.filter(a => a.hasInfraction).map(a => [
      `⚠️ ${a.plate} (${a.driver})`, ...a.infractions.map(i => i.type + ' – ' + i.detail),
    ]) || []),
    [''],
    ['Généré automatiquement par le système d\'automation QHSE'],
    ['Jean Frédéric Herinjanahary – Responsable Tracking & Opération QHSE'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 50 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Suivi Journalier');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé & Alertes');

  XLSX.writeFile(wb, outputPath);
  console.log(`📊 Rapport Excel généré: ${outputPath}`);
  return outputPath;
}

module.exports = { generateDailyReport };
