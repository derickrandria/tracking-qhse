// ═══════════════════════════════════════════════════════════════════════
// MOTEUR DE CALCUL – Temps de conduite (TCJ / TTJ / TCC)
// Détecte automatiquement les dépassements de seuils
// ═══════════════════════════════════════════════════════════════════════

const config = require('../config');

const { continuousMaxMinutes, tcjMaxMinutes, ttjMaxMinutes, minPauseMinutes } = config.rules;

/**
 * Convertit "HH:MM" ou "HH:MM:SS" en minutes
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/**
 * Convertit des minutes en "HH:MM"
 */
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Analyse les données de conduite d'un véhicule pour une journée
 * et calcule TCJ, TTJ, TCC + détecte les infractions
 * 
 * @param {Object} vehicleData - Données du véhicule
 * @param {Array} drivingPeriods - Périodes de conduite [{start, end}, ...]
 * @param {Array} pauses - Périodes de pause [{start, end}, ...]
 * @returns {Object} Résultat de l'analyse
 */
function analyzeDrivingTime(vehicleData, drivingPeriods = [], pauses = []) {
  // Calcul du temps de conduite continue max (TCC)
  let maxContinuous = 0;
  let currentContinuous = 0;

  for (const period of drivingPeriods) {
    const duration = timeToMinutes(period.end) - timeToMinutes(period.start);
    currentContinuous += duration;
    if (currentContinuous > maxContinuous) {
      maxContinuous = currentContinuous;
    }
    // Vérifier si une pause suit cette période
    const nextPause = pauses.find(p => timeToMinutes(p.start) >= timeToMinutes(period.end) - 1);
    if (nextPause && timeToMinutes(nextPause.end) - timeToMinutes(nextPause.start) >= minPauseMinutes) {
      currentContinuous = 0; // Reset après pause suffisante
    }
  }

  // Calcul du TCJ (total conduite - pauses non comptées dans la conduite)
  const tcjMinutes = drivingPeriods.reduce((sum, p) => {
    return sum + (timeToMinutes(p.end) - timeToMinutes(p.start));
  }, 0);

  // Calcul du total des pauses
  const totalPauseMinutes = pauses.reduce((sum, p) => {
    return sum + (timeToMinutes(p.end) - timeToMinutes(p.start));
  }, 0);

  // Calcul du TTJ = TCJ + total pauses
  const ttjMinutes = tcjMinutes + totalPauseMinutes;

  // Détection des infractions
  const infractions = [];

  if (maxContinuous > continuousMaxMinutes) {
    infractions.push({
      type: 'Conduite continue > 4h30 sans pause',
      severity: 2,
      detail: `TCC max: ${minutesToTime(maxContinuous)} (limite: ${minutesToTime(continuousMaxMinutes)})`,
    });
  }

  if (tcjMinutes > tcjMaxMinutes) {
    infractions.push({
      type: 'Dépassement TCJ (> 10h)',
      severity: 3,
      detail: `TCJ: ${minutesToTime(tcjMinutes)} (limite: ${minutesToTime(tcjMaxMinutes)})`,
    });
  }

  if (ttjMinutes > ttjMaxMinutes) {
    infractions.push({
      type: 'Dépassement TTJ (> 12h)',
      severity: 3,
      detail: `TTJ: ${minutesToTime(ttjMinutes)} (limite: ${minutesToTime(ttjMaxMinutes)})`,
    });
  }

  // Vérifier les pauses insuffisantes
  for (let i = 0; i < drivingPeriods.length - 1; i++) {
    const endCurrent = timeToMinutes(drivingPeriods[i].end);
    const startNext = timeToMinutes(drivingPeriods[i + 1].start);
    const gap = startNext - endCurrent;
    if (gap > 0 && gap < minPauseMinutes && maxContinuous > continuousMaxMinutes) {
      infractions.push({
        type: 'Non-respect pause obligatoire',
        severity: 2,
        detail: `Pause de ${Math.round(gap)} min (minimum requis: ${minPauseMinutes} min)`,
      });
      break;
    }
  }

  return {
    plate: vehicleData.plate || vehicleData.name,
    driver: vehicleData.driver,
    date: new Date().toISOString().split('T')[0],
    tcc: minutesToTime(maxContinuous),
    tccMinutes: Math.round(maxContinuous),
    tccOver: maxContinuous > continuousMaxMinutes,
    tcj: minutesToTime(tcjMinutes),
    tcjMinutes: Math.round(tcjMinutes),
    tcjOver: tcjMinutes > tcjMaxMinutes,
    tcjRemaining: minutesToTime(Math.max(0, tcjMaxMinutes - tcjMinutes)),
    ttj: minutesToTime(ttjMinutes),
    ttjMinutes: Math.round(ttjMinutes),
    ttjOver: ttjMinutes > ttjMaxMinutes,
    totalPause: minutesToTime(totalPauseMinutes),
    nbPauses: pauses.length,
    tcjStatut: tcjMinutes <= tcjMaxMinutes ? 'OK' : 'DÉPASSÉ',
    ttjStatut: ttjMinutes <= ttjMaxMinutes ? 'OK' : 'DÉPASSÉ',
    infractions,
    hasInfraction: infractions.length > 0,
  };
}

/**
 * Analyse une flotte complète
 */
function analyzeFleet(fleetData) {
  const results = [];
  const allInfractions = [];

  for (const vehicle of fleetData) {
    const analysis = analyzeDrivingTime(vehicle, vehicle.drivingPeriods || [], vehicle.pauses || []);
    results.push(analysis);
    if (analysis.hasInfraction) {
      allInfractions.push(...analysis.infractions.map(inf => ({
        ...inf,
        plate: analysis.plate,
        driver: analysis.driver,
        date: analysis.date,
      })));
    }
  }

  const summary = {
    date: new Date().toISOString().split('T')[0],
    totalVehicles: results.length,
    vehiclesWithInfraction: results.filter(r => r.hasInfraction).length,
    tcjCompliance: Math.round((results.filter(r => !r.tcjOver).length / results.length) * 100) || 100,
    ttjCompliance: Math.round((results.filter(r => !r.ttjOver).length / results.length) * 100) || 100,
    continuousCompliance: Math.round((results.filter(r => !r.tccOver).length / results.length) * 100) || 100,
    totalInfractions: allInfractions.length,
    infractions: allInfractions,
  };

  return { results, summary };
}

module.exports = { analyzeDrivingTime, analyzeFleet, timeToMinutes, minutesToTime };
