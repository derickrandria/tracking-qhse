'use client';

import { useState, useMemo } from 'react';
import Header from '../../components/Header';
import { alerts, severityColors, severityLabels } from '../../data/alerts';
import { vehicles } from '../../data/vehicles';
import { drivers } from '../../data/drivers';

export default function AlertesPage() {
  const [filterSeverity, setFilterSeverity] = useState('Tous');
  const [filterResolved, setFilterResolved] = useState('Toutes');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = [...alerts];
    if (filterSeverity !== 'Tous') result = result.filter(a => a.severity === filterSeverity);
    if (filterResolved === 'Actives') result = result.filter(a => !a.resolved);
    if (filterResolved === 'Résolues') result = result.filter(a => a.resolved);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.type.toLowerCase().includes(q) ||
        a.vehicleId.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [filterSeverity, filterResolved, searchQuery]);

  const criticalCount = alerts.filter(a => !a.resolved && a.severity === 'critical').length;
  const activeCount = alerts.filter(a => !a.resolved).length;

  const getDriverName = (vehicleId) => {
    const v = vehicles.find(v => v.id === vehicleId);
    if (!v) return '';
    const d = drivers.find(d => d.id === v.driverId);
    return d?.name || v.driverId;
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div>
      <Header
        title="Centre d'alertes"
        subtitle={`${activeCount} alertes actives dont ${criticalCount} critiques`}
      />

      {/* KPIs alertes */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {Object.entries(severityLabels).map(([key, label]) => {
          const count = alerts.filter(a => a.severity === key && !a.resolved).length;
          return (
            <div key={key} className="card text-center">
              <p className="text-2xl font-bold" style={{ color: severityColors[key] }}>{count}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher (type, véhicule, lieu...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] bg-dark-800 border border-dark-500 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange"
          />
          <div className="flex gap-2">
            {['Tous', 'critical', 'high', 'medium', 'low'].map(s => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterSeverity === s ? 'text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-500'
                }`}
                style={filterSeverity === s ? { backgroundColor: s === 'Tous' ? '#E8751A' : severityColors[s] } : {}}
              >
                {s === 'Tous' ? 'Tous' : severityLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['Toutes', 'Actives', 'Résolues'].map(s => (
              <button
                key={s}
                onClick={() => setFilterResolved(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterResolved === s
                    ? 'bg-accent-blue text-white'
                    : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste alertes */}
      <div className="space-y-3">
        {filtered.map(alert => (
          <div
            key={alert.id}
            className={`card flex items-start gap-4 ${!alert.resolved && alert.severity === 'critical' ? 'border-accent-red/50' : ''}`}
          >
            <div className="text-2xl mt-1">{alert.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-semibold text-sm">{alert.type}</p>
                <span
                  className="badge"
                  style={{ backgroundColor: `${severityColors[alert.severity]}20`, color: severityColors[alert.severity] }}
                >
                  {severityLabels[alert.severity]}
                </span>
                {alert.resolved ? (
                  <span className="badge bg-accent-green/10 text-accent-green">✓ Résolue</span>
                ) : (
                  <span className="badge bg-accent-red/10 text-accent-red animate-pulse">● Active</span>
                )}
              </div>
              <p className="text-gray-400 text-xs mb-1">{alert.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>🚛 {alert.vehicleId}</span>
                <span>👤 {getDriverName(alert.vehicleId)}</span>
                <span>📍 {alert.location}</span>
                {alert.speed && <span className="text-accent-red">⚡ {alert.speed} km/h</span>}
                <span>🕐 {timeAgo(alert.timestamp)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{alert.id}</p>
              {!alert.resolved && (
                <button className="mt-2 px-3 py-1 bg-accent-orange/15 text-accent-orange rounded-lg text-xs font-medium hover:bg-accent-orange/25 transition-all">
                  Traiter
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-gray-600 text-xs">
        <p>Tracking QHSE – Jean Frédéric Herinjanahary | Responsable Tracking & Opération QHSE</p>
      </div>
    </div>
  );
}
