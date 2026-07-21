// ── Alertes de sécurité ───────────────────────────────────────────────

const alertTypes = [
  { type: 'Excès de vitesse', severity: 'high', icon: '⚡' },
  { type: 'Freinage brusque', severity: 'medium', icon: '🛑' },
  { type: 'Déviation de route', severity: 'high', icon: '↗️' },
  { type: 'Fatigue détectée', severity: 'critical', icon: '😴' },
  { type: 'Arrêt non autorisé', severity: 'medium', icon: '🅿️' },
  { type: 'Ouverture citerne', severity: 'critical', icon: '🔓' },
  { type: 'Perte signal GPS', severity: 'low', icon: '📡' },
  { type: 'Température anormale', severity: 'high', icon: '🌡️' },
  { type: 'Conduite hors horaires', severity: 'medium', icon: '🌙' },
];

const locations = [
  'RN7 – PK 145 (Antsirabe)', 'RN4 – PK 80 (Maevatanàna)',
  'RN2 – PK 120 (Moramanga)', 'RN7 – PK 320 (Ambalavao)',
  'RN34 – PK 200 (Miandrivazo)', 'RN1 – PK 90 (Tsiroanomandidy)',
  'Dépôt Ankorondrano', 'Zone portuaire Toamasina',
  'RN44 – PK 150 (Ambatondrazaka)', 'RN7 – PK 500 (Ihosy)',
];

function generateAlerts() {
  const alerts = [];
  const now = Date.now();

  for (let i = 1; i <= 60; i++) {
    const at = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const minutesAgo = Math.floor(Math.random() * 4320); // 3 jours
    const resolved = Math.random() < 0.55;

    alerts.push({
      id: `ALT-${String(i).padStart(4, '0')}`,
      type: at.type,
      severity: at.severity,
      icon: at.icon,
      vehicleId: `VH-${String(1 + Math.floor(Math.random() * 50)).padStart(3, '0')}`,
      driverName: '',
      location: locations[Math.floor(Math.random() * locations.length)],
      speed: at.type === 'Excès de vitesse' ? Math.floor(85 + Math.random() * 40) : null,
      timestamp: new Date(now - minutesAgo * 60000).toISOString(),
      resolved,
      resolvedAt: resolved ? new Date(now - (minutesAgo - Math.floor(Math.random() * 60)) * 60000).toISOString() : null,
      description: getDescription(at.type),
    });
  }

  alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return alerts;
}

function getDescription(type) {
  const descriptions = {
    'Excès de vitesse': 'Vitesse supérieure à la limite autorisée pour le transport de matières dangereuses (80 km/h max).',
    'Freinage brusque': 'Décélération soudaine détectée (> 0.5g). Risque de mouvement de charge dans la citerne.',
    'Déviation de route': 'Le véhicule a quitté l\'itinéraire prévu sans autorisation.',
    'Fatigue détectée': 'Signaux de fatigue détectés par le système (variations de trajectoire, micro-corrections).',
    'Arrêt non autorisé': 'Arrêt prolongé (> 10 min) en dehors des zones autorisées.',
    'Ouverture citerne': 'Capteur d\'ouverture de vanne activé en dehors d\'une zone de chargement/déchargement.',
    'Perte signal GPS': 'Signal GPS perdu pendant plus de 5 minutes.',
    'Température anormale': 'Température de la citerne hors plage normale (risque lié au produit transporté).',
    'Conduite hors horaires': 'Conduite détectée en dehors des créneaux autorisés (22h-5h).',
  };
  return descriptions[type] || '';
}

export const alerts = generateAlerts();

export const severityColors = {
  critical: '#E83A3A',
  high: '#E8751A',
  medium: '#F5C518',
  low: '#3B82F6',
};

export const severityLabels = {
  critical: 'Critique',
  high: 'Élevé',
  medium: 'Moyen',
  low: 'Faible',
};
