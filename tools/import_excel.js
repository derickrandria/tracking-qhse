#!/usr/bin/env node
/**
 * Script d'import : convertit vos fichiers Excel en JSON pour le dashboard.
 * 
 * Usage :
 *   node tools/import_excel.js <chemin_fichier.xlsx> <type>
 * 
 * Types :
 *   infractions  → Importe les infractions
 *   temps        → Importe les temps de conduite
 *   gps          → Importe les relevés GPS
 * 
 * Exemples :
 *   node tools/import_excel.js ./mes_infractions.xlsx infractions
 *   node tools/import_excel.js ./temps_conduite_juillet.xlsx temps
 *   node tools/import_excel.js ./releves_gps.xlsx gps
 * 
 * Le fichier JSON généré est sauvegardé dans data/imported/
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node tools/import_excel.js <fichier.xlsx> <type>');
  console.log('Types: infractions | temps | gps');
  process.exit(1);
}

const [filePath, type] = args;
const importDir = path.join(__dirname, '..', 'data', 'imported');
if (!fs.existsSync(importDir)) fs.mkdirSync(importDir, { recursive: true });

console.log(`📂 Lecture de : ${filePath}`);
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

console.log(`   Feuille : "${sheetName}" – ${rows.length} lignes détectées`);

let output = [];

if (type === 'infractions') {
  output = rows.map((row, i) => ({
    id: `INF-${String(i + 1).padStart(4, '0')}`,
    date: row['Date'] || row['date'] || '',
    heure: row['Heure'] || row['heure'] || '',
    vehiclePlate: row['N° Véhicule (Plaque)'] || row['Plaque'] || row['plaque'] || '',
    driver: row['Chauffeur (Nom ou Prénom)'] || row['Chauffeur'] || row['chauffeur'] || '',
    type: row["Type d'infraction"] || row['Type'] || row['type'] || '',
    description: row['Description'] || row['description'] || '',
    location: row['Route / Lieu'] || row['Lieu'] || row['lieu'] || '',
    speedObserved: row['Vitesse constatée (km/h)'] || null,
    speedLimit: row['Vitesse autorisée (km/h)'] || null,
    severity: row['Gravité (1-4)'] || row['Gravité'] || 1,
    sanction: row['Sanction / Action'] || row['Sanction'] || '',
    status: row['Statut'] || row['statut'] || 'En cours',
    source: row['Plateforme source'] || row['Source'] || '',
  }));
} else if (type === 'temps') {
  output = rows.map((row, i) => ({
    id: `TC-${String(i + 1).padStart(4, '0')}`,
    date: row['Date'] || row['date'] || '',
    vehiclePlate: row['N° Véhicule (Plaque)'] || row['Plaque'] || '',
    driver: row['Chauffeur (Nom ou Prénom)'] || row['Chauffeur'] || '',
    startTime: row['Heure début conduite'] || '',
    endTime: row['Heure fin conduite'] || '',
    continuousDriving: row['Temps conduite continue (HH:MM)'] || '',
    nbPauses: row['Nb pauses'] || 0,
    totalPauses: row['Durée totale pauses (HH:MM)'] || '',
    tcj: row['TCJ - Temps Conduite Journalière (HH:MM)'] || '',
    tcjCompliant: (row['TCJ conforme ? (OUI/NON)'] || '').toUpperCase() === 'OUI',
    ttj: row['TTJ - Temps Travail Journalier (HH:MM)'] || '',
    ttjCompliant: (row['TTJ conforme ? (OUI/NON)'] || '').toUpperCase() === 'OUI',
    derogation: (row['Dérogation ? (OUI/NON)'] || '').toUpperCase() === 'OUI',
    derogationRef: row['N° Dérogation'] || '',
    route: row['Route'] || '',
    source: row['Plateforme source'] || '',
    observations: row['Observations'] || '',
  }));
} else if (type === 'gps') {
  output = rows.map((row, i) => ({
    id: `GPS-${String(i + 1).padStart(4, '0')}`,
    date: row['Date'] || '',
    vehiclePlate: row['N° Véhicule (Plaque)'] || '',
    driver: row['Chauffeur (Nom ou Prénom)'] || '',
    positions: {
      '08h': row['Heure 08h'] || '',
      '10h': row['Heure 10h'] || '',
      '12h': row['Heure 12h'] || '',
      '14h': row['Heure 14h'] || '',
      '16h': row['Heure 16h'] || '',
      '18h': row['Heure 18h'] || '',
    },
    lastPositionJ1: row['Dernier emplacement J-1'] || '',
    odometer: row['Km au compteur'] || null,
    status: row['Statut (En route/En pause/Au dépôt)'] || '',
    source: row['Plateforme source'] || '',
  }));
} else {
  console.error(`❌ Type inconnu : "${type}". Utilisez : infractions | temps | gps`);
  process.exit(1);
}

const outputFile = path.join(importDir, `${type}.json`);
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
console.log(`✅ ${output.length} enregistrements importés → ${outputFile}`);
console.log('');
console.log('💡 Pour utiliser ces données dans le dashboard :');
console.log('   Les fichiers JSON sont dans data/imported/');
console.log('   Le dashboard les charge automatiquement s\'ils existent.');
