#!/usr/bin/env node
/**
 * Génère les templates Excel à remplir par l'équipe QHSE.
 * Usage : node tools/generate_templates.js
 */

const XLSX = require('xlsx');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'templates');
const fs = require('fs');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 1 : INFRACTIONS
// ═══════════════════════════════════════════════════════════════════════
const infractionsData = [
  [
    'Date', 'Heure', 'N° Véhicule (Plaque)', 'Chauffeur (Nom ou Prénom)',
    'Type d\'infraction', 'Description', 'Route / Lieu',
    'Vitesse constatée (km/h)', 'Vitesse autorisée (km/h)',
    'Gravité (1-4)', 'Sanction / Action', 'Statut', 'Plateforme source',
  ],
  // Exemples de lignes
  ['2026-07-19', '08:30', '0906 TBV', 'JACKY', 'Excès de vitesse', 'Vitesse excessive en agglomération', 'RN7 – PK 12 (Antsirabe)', 95, 80, 3, 'Avertissement écrit', 'Traité', 'MzoneX'],
  ['2026-07-19', '14:15', '2736 TCC', 'DORÉ', 'Freinage brusque', 'Décélération > 0.5g détectée', 'RN4 – PK 80 (Maevatanàna)', null, null, 2, 'Rappel oral', 'Traité', 'CamtrackPro'],
  ['2026-07-18', '22:45', '5156 TBV', 'CLÉMENT', 'Conduite hors horaires', 'Conduite détectée après 22h sans autorisation', 'RN2 – PK 200 (Moramanga)', 65, null, 4, 'Mise à pied 1 jour', 'En cours', 'MzoneX'],
  ['2026-07-18', '10:00', '4866 TBU', 'VICTORINO', 'Dépassement TCJ', 'TCJ dépassé (10h45 > 10h00)', 'RN7 – PK 450 (Ambalavao)', null, null, 3, 'Dérogation demandée', 'En cours', 'CamtrackPro'],
  ['2026-07-17', '16:30', '7936 TCB', 'VINCELIN', 'Arrêt non autorisé', 'Arrêt > 15 min hors zone autorisée', 'RN34 – PK 150 (Miandrivazo)', null, null, 1, 'Rappel oral', 'Traité', 'MzoneX'],
];

const wsInfractions = XLSX.utils.aoa_to_sheet(infractionsData);

// Largeurs de colonnes
wsInfractions['!cols'] = [
  { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 25 },
  { wch: 22 }, { wch: 40 }, { wch: 28 },
  { wch: 14 }, { wch: 14 },
  { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 16 },
];

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 2 : TEMPS DE CONDUITE
// ═══════════════════════════════════════════════════════════════════════
const tempsData = [
  [
    'Date', 'N° Véhicule (Plaque)', 'Chauffeur (Nom ou Prénom)',
    'Heure début conduite', 'Heure fin conduite',
    'Temps conduite continue (HH:MM)', 'Nb pauses',
    'Durée totale pauses (HH:MM)',
    'TCJ - Temps Conduite Journalière (HH:MM)', 'TCJ conforme ? (OUI/NON)',
    'TTJ - Temps Travail Journalier (HH:MM)', 'TTJ conforme ? (OUI/NON)',
    'Dérogation ? (OUI/NON)', 'N° Dérogation',
    'Route', 'Plateforme source', 'Observations',
  ],
  // Exemples
  ['2026-07-19', '0906 TBV', 'JACKY', '06:00', '16:30', '04:15', 3, '01:30', '09:00', 'OUI', '10:30', 'OUI', 'NON', '', 'RN7 (Tana → Tulear)', 'MzoneX', 'RAS'],
  ['2026-07-19', '2736 TCC', 'DORÉ', '05:30', '18:00', '04:45', 2, '01:00', '10:30', 'NON', '11:30', 'OUI', 'OUI', 'DER-2026-0719-01', 'RN4 (Tana → Mahajanga)', 'CamtrackPro', 'Dérogation accordée par Resp. QHSE'],
  ['2026-07-19', '5156 TBV', 'CLÉMENT', '07:00', '14:00', '03:30', 2, '01:00', '06:00', 'OUI', '07:00', 'OUI', 'NON', '', 'RN2 (Tana → Toamasina)', 'MzoneX', 'Trajet court'],
  ['2026-07-18', '4866 TBU', 'VICTORINO', '04:30', '19:00', '05:00', 1, '00:30', '11:00', 'NON', '11:30', 'OUI', 'NON', '', 'RN7 (Tana → Tulear)', 'CamtrackPro', 'INFRACTION : TCJ dépassé sans dérogation'],
  ['2026-07-18', '7936 TCB', 'VINCELIN', '06:00', '12:00', '04:30', 2, '01:00', '05:00', 'OUI', '06:00', 'OUI', 'NON', '', 'RN34 (Tana → Morondava)', 'MzoneX', 'RAS'],
];

const wsTemps = XLSX.utils.aoa_to_sheet(tempsData);
wsTemps['!cols'] = [
  { wch: 12 }, { wch: 18 }, { wch: 25 },
  { wch: 16 }, { wch: 16 },
  { wch: 20 }, { wch: 8 },
  { wch: 18 },
  { wch: 24 }, { wch: 16 },
  { wch: 24 }, { wch: 16 },
  { wch: 16 }, { wch: 16 },
  { wch: 24 }, { wch: 16 }, { wch: 35 },
];

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 3 : RELEVÉS GPS (positions toutes les 2h)
// ═══════════════════════════════════════════════════════════════════════
const gpsData = [
  [
    'Date', 'N° Véhicule (Plaque)', 'Chauffeur (Nom ou Prénom)',
    'Heure 08h', 'Heure 10h', 'Heure 12h', 'Heure 14h', 'Heure 16h', 'Heure 18h',
    'Dernier emplacement J-1', 'Km au compteur',
    'Statut (En route/En pause/Au dépôt)', 'Plateforme source',
  ],
  ['2026-07-19', '0906 TBV', 'JACKY', 'Antsirabe PK12', 'Ambositra PK45', 'Pause déjeuner', 'Fianarantsoa PK120', 'Ambalavao PK200', 'Ihosy PK320', 'Ihosy PK320 (arrêt nuit)', 245320, 'En route', 'MzoneX'],
  ['2026-07-19', '2736 TCC', 'DORÉ', 'Dépôt Ankorondrano', 'Maevatanàna PK80', 'Maevatanàna PK80', 'Tsaratanana PK180', 'Ambato-Boeni PK280', 'Mahajanga PK450', 'Mahajanga – Zone dépotage', 312450, 'En route', 'CamtrackPro'],
  ['2026-07-19', '5156 TBV', 'CLÉMENT', 'Dépôt Ankorondrano', 'Moramanga PK80', 'Brickaville PK150', 'Toamasina PK300', 'Toamasina – Port', 'Toamasina – Port', 'Dépôt Ankorondrano', 189200, 'Au dépôt', 'MzoneX'],
];

const wsGps = XLSX.utils.aoa_to_sheet(gpsData);
wsGps['!cols'] = [
  { wch: 12 }, { wch: 18 }, { wch: 25 },
  { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
  { wch: 28 }, { wch: 14 },
  { wch: 22 }, { wch: 16 },
];

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 4 : FEUILLE DE RÈGLES (référence)
// ═══════════════════════════════════════════════════════════════════════
const rulesData = [
  ['RÈGLES DE TEMPS DE CONDUITE – Société de Transport Pétrolier'],
  [''],
  ['Règle', 'Limite maximale', 'Définition', 'Sans dérogation', 'Observations'],
  ['Temps de conduite continue', '04:30:00', 'Durée maximale sans pause entre deux arrêts', 'OUI', 'Pause obligatoire de 15 min minimum après 4h30'],
  ['TCJ – Temps de Conduite Journalière', '10:00:00', 'Total temps de conduite dans la journée, déduction faite de toutes les pauses', 'OUI', 'TCJ = Somme des périodes de conduite – Pauses'],
  ['TTJ – Temps de Travail Journalier', '12:00:00', 'Temps total de travail = TCJ + total des pauses', 'OUI', 'TTJ = TCJ + Total pauses. Inclut temps d\'attente, manutention, etc.'],
  [''],
  ['PLATEFORMES GPS UTILISÉES'],
  ['Plateforme', 'Usage'],
  ['MzoneX', 'Suivi position, temps de conduite, alertes'],
  ['CamtrackPro', 'Suivi position, temps de conduite, alertes'],
  [''],
  ['HORAIRES DE VÉRIFICATION'],
  ['Heure', 'Action'],
  ['08:00', 'Vérification position + statut'],
  ['10:00', 'Vérification position + statut'],
  ['12:00', 'Vérification position + statut'],
  ['14:00', 'Vérification position + statut'],
  ['16:00', 'Vérification position + statut'],
  ['18:00', 'Vérification position + statut'],
  ['J-1 (fin de journée)', 'Dernier emplacement + bilan TCJ/TTJ'],
  [''],
  ['GRAVITÉ DES INFRACTIONS'],
  ['Niveau', 'Libellé', 'Exemples', 'Action'],
  ['1', 'Mineure', 'Arrêt non autorisé court, léger dépassement vitesse', 'Rappel oral'],
  ['2', 'Modérée', 'Freinage brusque répété, pause insuffisante', 'Avertissement écrit'],
  ['3', 'Grave', 'Dépassement TCJ, excès vitesse > 15 km/h', 'Mise à pied / Formation'],
  ['4', 'Critique', 'Conduite hors horaires, dépassement TTJ, récidive', 'Mise à pied / Licenciement'],
];

const wsRules = XLSX.utils.aoa_to_sheet(rulesData);
wsRules['!cols'] = [{ wch: 35 }, { wch: 16 }, { wch: 60 }, { wch: 16 }, { wch: 50 }];

// ── Création des fichiers ──────────────────────────────────────────────
const wbInfractions = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbInfractions, wsInfractions, 'Infractions');
XLSX.writeFile(wbInfractions, path.join(outputDir, 'TEMPLATE_infractions.xlsx'));

const wbTemps = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbTemps, wsTemps, 'Temps de conduite');
XLSX.writeFile(wbTemps, path.join(outputDir, 'TEMPLATE_temps_conduite.xlsx'));

const wbGps = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbGps, wsGps, 'Relevés GPS');
XLSX.writeFile(wbGps, path.join(outputDir, 'TEMPLATE_releves_gps.xlsx'));

const wbRules = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbRules, wsRules, 'Règles & Références');
XLSX.writeFile(wbRules, path.join(outputDir, 'REFERENCE_regles_conduite.xlsx'));

console.log('✅ Templates générés dans /templates/ :');
console.log('   - TEMPLATE_infractions.xlsx');
console.log('   - TEMPLATE_temps_conduite.xlsx');
console.log('   - TEMPLATE_releves_gps.xlsx');
console.log('   - REFERENCE_regles_conduite.xlsx');
