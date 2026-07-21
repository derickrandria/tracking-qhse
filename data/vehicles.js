// ── Données réelles des véhicules ─────────────────────────────────────
// Source : Liste fournie par J.F. Herinjanahary – Responsable Tracking & QHSE
// Plaques d'immatriculation réelles de la flotte.

import { drivers } from './drivers';

// Plaques réelles de la flotte
const plates = [
  '0576 TCD', '0616 TCD', '0826 TBS', '0906 TBV', '0916 TBV',
  '0926 TBV', '0936 TBV', '2226 TBS', '2236 TBS', '2606 TBS',
  '2736 TCC', '2746 TCC', '3046 TBS', '3056 TBS', '3066 TBS',
  '3076 TBS', '3646 TBS', '4006 TBS', '4296 TCC', '4526 TCC',
  '4566 TCC', '4736 TCC', '4866 TBU', '4876 TBU', '4886 TBU',
  '4926 TBU', '5156 TBV', '5186 TBV', '5306 TBU', '5316 TBU',
  '5346 TBU', '5376 TBV', '5446 TBS', '5506 TBS', '5616 TCE',
  '5626 TCE', '5706 TBS', '5716 TBS', '6546 TCE', '7936 TCB',
  '7946 TCB', '8076 TCB', '8086 TCB', '8116 TCB', '8806 TCB',
  '9176 TCC', '9186 TCC', '9226 TCC', '9236 TCC', '9806 TCD',
  '9816 TCD', '9856 TCD',
];

const vehicleTypes = [
  { type: 'Citerne 20 000L', capacity: 20000 },
  { type: 'Citerne 30 000L', capacity: 30000 },
  { type: 'Citerne 40 000L', capacity: 40000 },
  { type: 'Semi-remorque 45 000L', capacity: 45000 },
];

const routes = [
  { name: 'RN7 (Tana → Tulear)', km: 936 },
  { name: 'RN4 (Tana → Mahajanga)', km: 560 },
  { name: 'RN2 (Tana → Toamasina)', km: 350 },
  { name: 'RN1 (Tana → Tsiroanomandidy)', km: 190 },
  { name: 'RN34 (Tana → Morondava)', km: 600 },
  { name: 'RN44 (Tana → Ambatondrazaka)', km: 300 },
  { name: 'Dépôt → Aéroport Ivato', km: 18 },
  { name: 'Dépôt → Zone industrielle Ankorondrano', km: 8 },
];

const products = ['Gasoil (GO)', 'Essence (SP95)', 'Pétrole lampant', 'Jet A1', 'Fuel lourd'];

const statuses = ['En route', 'En pause', 'Au dépôt', 'Maintenance', 'Alerte'];

const statusColors = {
  'En route': '#2ECC71',
  'En pause': '#F5C518',
  'Au dépôt': '#3B82F6',
  'Maintenance': '#E8751A',
  'Alerte': '#E83A3A',
};

// Génération déterministe basée sur la plaque (données simulées stables)
const seededRandom = (seed) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

function generateVehicles() {
  return plates.map((plate, i) => {
    const r = (offset) => seededRandom(i + offset + 100);

    const statusRoll = r(1);
    let status;
    if (statusRoll < 0.45) status = 'En route';
    else if (statusRoll < 0.60) status = 'En pause';
    else if (statusRoll < 0.80) status = 'Au dépôt';
    else if (statusRoll < 0.92) status = 'Maintenance';
    else status = 'Alerte';

    const vt = vehicleTypes[Math.floor(r(2) * vehicleTypes.length)];
    const route = routes[Math.floor(r(3) * routes.length)];
    const product = products[Math.floor(r(4) * products.length)];
    const speed = status === 'En route' ? Math.floor(40 + r(5) * 50) : 0;
    const fuelLevel = Math.floor(20 + r(6) * 80);
    const driverIndex = Math.floor(r(7) * drivers.length);

    return {
      id: `VH-${String(i + 1).padStart(3, '0')}`,
      plate,
      type: vt.type,
      capacity: vt.capacity,
      status,
      route: route.name,
      routeKm: route.km,
      currentKm: Math.floor(r(8) * route.km),
      product,
      speed,
      fuelLevel,
      driverId: drivers[driverIndex].id,
      lastUpdate: new Date(Date.now() - Math.floor(r(9) * 3600000)).toISOString(),
      odometer: Math.floor(80000 + r(10) * 400000),
      nextMaintenance: Math.floor(500 + r(11) * 5000),
      temperature: Math.floor(25 + r(12) * 15),
    };
  });
}

export const vehicles = generateVehicles();
export { statusColors, routes, products, vehicleTypes };
