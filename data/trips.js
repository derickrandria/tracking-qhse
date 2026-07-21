// ── Historique des trajets ────────────────────────────────────────────
// Données mock – remplacez par vos données réelles de tracking.

import { routes, products } from './vehicles';
import { drivers } from './drivers';

const cities = [
  'Antananarivo', 'Toamasina', 'Mahajanga', 'Fianarantsoa', 'Tulear',
  'Morondava', 'Antsirabe', 'Ambatondrazaka', 'Tsiroanomandidy',
  'Moramanga', 'Brickaville', 'Manakara', 'Farafangana',
];

const incidentTypes = [
  'Excès de vitesse', 'Freinage brusque', 'Déviation de route',
  'Arrêt non autorisé', 'Ouverture citerne détectée', 'Perte de signal GPS',
  'Conduite de nuit prolongée', 'Micro-sommeil détecté',
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateTrips() {
  const trips = [];
  const now = new Date('2026-07-20');
  const sixMonthsAgo = new Date('2026-01-20');

  for (let i = 1; i <= 300; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const departure = randomDate(sixMonthsAgo, now);
    const durationH = 2 + Math.random() * (route.km / 60);
    const arrival = new Date(departure.getTime() + durationH * 3600000);
    const distance = Math.floor(route.km * (0.85 + Math.random() * 0.3));
    const avgSpeed = Math.floor(distance / durationH);
    const maxSpeed = avgSpeed + Math.floor(10 + Math.random() * 30);
    const fuelUsed = Math.floor(distance * (0.3 + Math.random() * 0.2));
    const pauses = Math.max(1, Math.floor(durationH / 2));
    const pauseDuration = pauses * Math.floor(10 + Math.random() * 20);

    const hasIncident = Math.random() < 0.25;
    const incident = hasIncident
      ? incidentTypes[Math.floor(Math.random() * incidentTypes.length)]
      : null;

    const statusRoll = Math.random();
    let status;
    if (arrival < now) status = 'Terminé';
    else if (departure < now) status = 'En cours';
    else status = 'Planifié';

    let score = Math.floor(60 + Math.random() * 40);
    if (incident) score = Math.max(40, score - 20);

    trips.push({
      id: `TRP-${String(i).padStart(4, '0')}`,
      vehicleId: `VH-${String(1 + Math.floor(Math.random() * 50)).padStart(3, '0')}`,
      driverId: driver.id,
      driverName: driver.name,
      route: route.name,
      from: cities[Math.floor(Math.random() * cities.length)],
      to: cities[Math.floor(Math.random() * cities.length)],
      product,
      departure: departure.toISOString(),
      arrival: arrival.toISOString(),
      durationH: Math.round(durationH * 10) / 10,
      distance,
      avgSpeed,
      maxSpeed,
      fuelUsed,
      pauses,
      pauseDuration,
      incident,
      status,
      score,
      nightDriving: Math.random() < 0.3,
      harshBraking: Math.floor(Math.random() * 8),
      speedingEvents: Math.floor(Math.random() * 5),
    });
  }

  // Trier par date de départ décroissante
  trips.sort((a, b) => new Date(b.departure) - new Date(a.departure));
  return trips;
}

export const trips = generateTrips();

// Statistiques agrégées pour les graphiques
export function getMonthlyStats() {
  const months = {};
  for (const trip of trips) {
    const d = new Date(trip.departure);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) {
      months[key] = { month: key, trips: 0, totalKm: 0, incidents: 0, avgScore: 0, scores: [] };
    }
    months[key].trips++;
    months[key].totalKm += trip.distance;
    if (trip.incident) months[key].incidents++;
    months[key].scores.push(trip.score);
  }
  return Object.values(months).map(m => ({
    ...m,
    avgScore: Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length),
  })).sort((a, b) => a.month.localeCompare(b.month));
}

export function getRouteStats() {
  const routeMap = {};
  for (const trip of trips) {
    const key = trip.route.split('(')[0].trim();
    if (!routeMap[key]) {
      routeMap[key] = { route: key, trips: 0, totalKm: 0, incidents: 0, avgScore: 0, scores: [] };
    }
    routeMap[key].trips++;
    routeMap[key].totalKm += trip.distance;
    if (trip.incident) routeMap[key].incidents++;
    routeMap[key].scores.push(trip.score);
  }
  return Object.values(routeMap).map(r => ({
    ...r,
    avgScore: Math.round(r.scores.reduce((a, b) => a + b, 0) / r.scores.length),
  })).sort((a, b) => b.trips - a.trips);
}
