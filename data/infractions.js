// ── Infractions – Données ─────────────────────────────────────────────
// Remplacez par vos données Excel via : node tools/import_excel.js <fichier> infractions

import { drivers } from './drivers';
import { vehicles } from './vehicles';

const infractionTypes = [
  'Excès de vitesse',
  'Freinage brusque',
  'Conduite hors horaires',
  'Dépassement TCJ (> 10h)',
  'Dépassement TTJ (> 12h)',
  'Conduite continue > 4h30 sans pause',
  'Arrêt non autorisé',
  'Déviation de route',
  'Ouverture citerne non autorisée',
  'Non-respect pause obligatoire',
  'Perte signal GPS',
  'Défaut de pointage (check 2h)',
];

const locations = [
  'RN7 – PK 12 (Antsirabe)', 'RN7 – PK 145 (Ambositra)', 'RN7 – PK 320 (Ambalavao)',
  'RN7 – PK 500 (Ihosy)', 'RN4 – PK 80 (Maevatanàna)', 'RN4 – PK 280 (Ambato-Boeni)',
  'RN2 – PK 120 (Moramanga)', 'RN2 – PK 250 (Brickaville)',
  'RN34 – PK 150 (Miandrivazo)', 'RN1 – PK 90 (Tsiroanomandidy)',
  'RN44 – PK 150 (Ambatondrazaka)', 'Dépôt Ankorondrano',
  'Zone portuaire Toamasina', 'Zone industrielle Ankorondrano',
];

const sanctions = [
  'Rappel oral', 'Avertissement écrit', 'Mise à pied 1 jour',
  'Mise à pied 3 jours', 'Formation obligatoire', 'Retenue sur salaire',
  'Avertissement final',
];

const seededRandom = (seed) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

function generateInfractions() {
  const infractions = [];
  const now = new Date('2026-07-20');

  for (let i = 0; i < 120; i++) {
    const r = (offset) => seededRandom(i + offset + 500);
    const driver = drivers[Math.floor(r(1) * drivers.length)];
    const vehicle = vehicles[Math.floor(r(2) * vehicles.length)];
    const type = infractionTypes[Math.floor(r(3) * infractionTypes.length)];
    const location = locations[Math.floor(r(4) * locations.length)];
    const daysAgo = Math.floor(r(5) * 90);
    const date = new Date(now.getTime() - daysAgo * 86400000);
    const hour = 5 + Math.floor(r(6) * 16);
    const min = Math.floor(r(7) * 60);

    let severity;
    if (type.includes('TCJ') || type.includes('TTJ') || type.includes('hors horaires')) severity = 3;
    else if (type.includes('vitesse') || type.includes('citerne')) severity = 3;
    else if (type.includes('Freinage') || type.includes('Déviation')) severity = 2;
    else if (type.includes('continue')) severity = 2;
    else severity = 1;

    // Ajuster sévérité aléatoirement
    severity = Math.min(4, Math.max(1, severity + (r(8) > 0.8 ? 1 : 0) - (r(9) > 0.9 ? 1 : 0)));

    const isSpeeding = type === 'Excès de vitesse';
    const statusRoll = r(10);
    const status = statusRoll < 0.5 ? 'Traité' : statusRoll < 0.8 ? 'En cours' : 'En attente';

    infractions.push({
      id: `INF-${String(i + 1).padStart(4, '0')}`,
      date: date.toISOString().split('T')[0],
      heure: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      vehiclePlate: vehicle.plate,
      driverId: driver.id,
      driverName: driver.shortName,
      driverFullName: driver.name,
      type,
      description: getDescription(type),
      location,
      speedObserved: isSpeeding ? 80 + Math.floor(r(11) * 45) : null,
      speedLimit: isSpeeding ? 80 : null,
      severity,
      sanction: sanctions[Math.floor(r(12) * sanctions.length)],
      status,
      source: r(13) > 0.5 ? 'MzoneX' : 'CamtrackPro',
    });
  }

  return infractions.sort((a, b) => b.date.localeCompare(a.date) || b.heure.localeCompare(a.heure));
}

function getDescription(type) {
  const desc = {
    'Excès de vitesse': 'Vitesse supérieure à 80 km/h (limite transport matières dangereuses).',
    'Freinage brusque': 'Décélération soudaine > 0.5g détectée par le boîtier télématique.',
    'Conduite hors horaires': 'Conduite détectée entre 22h et 5h sans autorisation préalable.',
    'Dépassement TCJ (> 10h)': 'Temps de Conduite Journalière supérieur à 10h00 sans dérogation.',
    'Dépassement TTJ (> 12h)': 'Temps de Travail Journalier supérieur à 12h00 sans dérogation.',
    'Conduite continue > 4h30 sans pause': 'Période de conduite continue supérieure à 4h30 sans pause de 15 min.',
    'Arrêt non autorisé': 'Arrêt > 15 min en dehors des zones de stationnement autorisées.',
    'Déviation de route': 'Le véhicule a quitté l\'itinéraire prévu sans notification.',
    'Ouverture citerne non autorisée': 'Capteur d\'ouverture vanne activé hors zone de chargement/déchargement.',
    'Non-respect pause obligatoire': 'Pause de 15 min non effectuée après 4h30 de conduite continue.',
    'Perte signal GPS': 'Signal GPS perdu > 10 min sans justification.',
    'Défaut de pointage (check 2h)': 'Position non vérifiée lors du contrôle bimensuel (8h/10h/12h/14h/16h/18h).',
  };
  return desc[type] || '';
}

export const infractions = generateInfractions();

export const severityLabels = {
  1: { label: 'Mineure', color: '#3B82F6' },
  2: { label: 'Modérée', color: '#F5C518' },
  3: { label: 'Grave', color: '#E8751A' },
  4: { label: 'Critique', color: '#E83A3A' },
};
