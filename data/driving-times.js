// ── Temps de conduite – Règles métier ─────────────────────────────────
// Règles strictes de la société de transport pétrolier
// Source : J.F. Herinjanahary – Responsable Tracking & Opération QHSE

import { drivers } from './drivers';
import { routes } from './vehicles';

// ── RÈGLES (constantes métier) ────────────────────────────────────────
export const DRIVING_RULES = {
  continuousMax: { h: 4, m: 30, label: '04:30:00', minutes: 270 },
  tcjMax: { h: 10, m: 0, label: '10:00:00', minutes: 600 },
  ttjMax: { h: 12, m: 0, label: '12:00:00', minutes: 720 },
};

export const CHECK_SCHEDULE = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
export const GPS_PLATFORMS = ['MzoneX', 'CamtrackPro'];

// ── Génération de données de temps de conduite (simulées) ─────────────
const seededRandom = (seed) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateDrivingTimes() {
  const records = [];
  const now = new Date('2026-07-20');

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(now.getTime() - dayOffset * 86400000);
    const dateStr = date.toISOString().split('T')[0];

    // 10-20 conducteurs actifs par jour
    const activeCount = 10 + Math.floor(seededRandom(dayOffset) * 10);

    for (let j = 0; j < activeCount; j++) {
      const r = (offset) => seededRandom(dayOffset * 100 + j * 10 + offset);
      const driver = drivers[Math.floor(r(1) * drivers.length)];
      const route = routes[Math.floor(r(2) * routes.length)];
      const platform = GPS_PLATFORMS[Math.floor(r(3) * 2)];

      // Temps de conduite continue (entre 2h et 5h30)
      const continuousMins = Math.floor(120 + r(4) * 210);
      const continuousOver = continuousMins > DRIVING_RULES.continuousMax.minutes;

      // Nombre de pauses (1 à 4)
      const nbPauses = 1 + Math.floor(r(5) * 4);
      const pausePerBreak = Math.floor(10 + r(6) * 25); // 10-35 min par pause
      const totalPauseMins = nbPauses * pausePerBreak;

      // TCJ = temps de conduite total (sans les pauses)
      const tcjMins = Math.floor(300 + r(7) * 420); // 5h à 12h
      const tcjOver = tcjMins > DRIVING_RULES.tcjMax.minutes;

      // TTJ = TCJ + total pauses
      const ttjMins = tcjMins + totalPauseMins;
      const ttjOver = ttjMins > DRIVING_RULES.ttjMax.minutes;

      // Dérogation
      const hasDerogation = (tcjOver || ttjOver) && r(8) > 0.5;
      const derogationRef = hasDerogation
        ? `DER-${dateStr.replace(/-/g, '')}-${String(j + 1).padStart(2, '0')}`
        : '';

      // Heure de début (4h-8h)
      const startH = 4 + Math.floor(r(9) * 5);
      const startM = Math.floor(r(10) * 60);
      const endTotalMins = startH * 60 + startM + ttjMins;
      const endH = Math.floor(endTotalMins / 60) % 24;
      const endM = endTotalMins % 60;

      records.push({
        id: `TC-${String(records.length + 1).padStart(4, '0')}`,
        date: dateStr,
        vehiclePlate: '', // sera rempli par le véhicule assigné
        driverId: driver.id,
        driverName: driver.shortName,
        driverFullName: driver.name,
        route: route.name,
        platform,
        startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        continuousDrivingMins: continuousMins,
        continuousDriving: minutesToHHMM(continuousMins),
        continuousOver,
        nbPauses,
        totalPauseMins,
        totalPauses: minutesToHHMM(totalPauseMins),
        tcjMins,
        tcj: minutesToHHMM(tcjMins),
        tcjCompliant: !tcjOver || hasDerogation,
        tcjOver,
        ttjMins,
        ttj: minutesToHHMM(ttjMins),
        ttjCompliant: !ttjOver || hasDerogation,
        ttjOver,
        hasDerogation,
        derogationRef,
        observations: continuousOver
          ? 'Conduite continue dépassée (> 4h30 sans pause)'
          : tcjOver && !hasDerogation
            ? 'INFRACTION : TCJ dépassé sans dérogation'
            : ttjOver && !hasDerogation
              ? 'INFRACTION : TTJ dépassé sans dérogation'
              : 'RAS',
      });
    }
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export const drivingTimes = generateDrivingTimes();

// ── Statistiques ──────────────────────────────────────────────────────
export function getComplianceStats() {
  const total = drivingTimes.length;
  const tcjOk = drivingTimes.filter(r => r.tcjCompliant).length;
  const ttjOk = drivingTimes.filter(r => r.ttjCompliant).length;
  const continuousOk = drivingTimes.filter(r => !r.continuousOver).length;
  const derogations = drivingTimes.filter(r => r.hasDerogation).length;

  return {
    total,
    tcjCompliance: Math.round((tcjOk / total) * 100),
    ttjCompliance: Math.round((ttjOk / total) * 100),
    continuousCompliance: Math.round((continuousOk / total) * 100),
    derogations,
    tcjViolations: total - tcjOk,
    ttjViolations: total - ttjOk,
    continuousViolations: total - continuousOk,
  };
}

export function getDailyStats(days = 14) {
  const byDate = {};
  for (const rec of drivingTimes) {
    if (!byDate[rec.date]) {
      byDate[rec.date] = { date: rec.date, count: 0, tcjViolations: 0, ttjViolations: 0, continuousViolations: 0, derogations: 0 };
    }
    byDate[rec.date].count++;
    if (rec.tcjOver && !rec.hasDerogation) byDate[rec.date].tcjViolations++;
    if (rec.ttjOver && !rec.hasDerogation) byDate[rec.date].ttjViolations++;
    if (rec.continuousOver) byDate[rec.date].continuousViolations++;
    if (rec.hasDerogation) byDate[rec.date].derogations++;
  }
  return Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);
}
