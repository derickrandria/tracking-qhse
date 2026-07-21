'use client';

import { useState, useMemo } from 'react';
import Header from '../../components/Header';
import {
  drivingTimes, getComplianceStats, getDailyStats,
  DRIVING_RULES, CHECK_SCHEDULE, GPS_PLATFORMS,
} from '../../data/driving-times';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

export default function TempsConduitePage() {
  const [filterDriver, setFilterDriver] = useState('');
  const [filterCompliance, setFilterCompliance] = useState('Tous');
  const [filterDate, setFilterDate] = useState('');

  const stats = useMemo(() => getComplianceStats(), []);
  const dailyStats = useMemo(() => getDailyStats(14), []);

  const filtered = useMemo(() => {
    let result = [...drivingTimes];
    if (filterDriver) {
      const q = filterDriver.toLowerCase();
      result = result.filter(r =>
        r.driverName.toLowerCase().includes(q) ||
        r.driverFullName.toLowerCase().includes(q)
      );
    }
    if (filterCompliance === 'Conforme') result = result.filter(r => r.tcjCompliant && r.ttjCompliant && !r.continuousOver);
    if (filterCompliance === 'Infraction') result = result.filter(r => (!r.tcjCompliant || !r.ttjCompliant || r.continuousOver));
    if (filterCompliance === 'Dérogation') result = result.filter(r => r.hasDerogation);
    if (filterDate) result = result.filter(r => r.date === filterDate);
    return result;
  }, [filterDriver, filterCompliance, filterDate]);

  const kpiCards = [
    { label: 'Conformité TCJ (≤ 10h)', value: `${stats.tcjCompliance}%`, color: stats.tcjCompliance >= 90 ? '#2ECC71' : '#E83A3A', icon: '⏱️' },
    { label: 'Conformité TTJ (≤ 12h)', value: `${stats.ttjCompliance}%`, color: stats.ttjCompliance >= 90 ? '#2ECC71' : '#E83A3A', icon: '🕐' },
    { label: 'Conduite continue (≤ 4h30)', value: `${stats.continuousCompliance}%`, color: stats.continuousCompliance >= 85 ? '#2ECC71' : '#F5C518', icon: '🚛' },
    { label: 'Dérogations accordées', value: stats.derogations, color: '#3B82F6', icon: '📋' },
  ];

  const chartData = dailyStats.map(d => ({
    ...d,
    dateShort: d.date.slice(5),
  }));

  return (
    <div>
      <Header
        title="Temps de conduite"
        subtitle="Suivi TCJ, TTJ et conduite continue – Règles QHSE strictes"
      />

      {/* Règles rappel */}
      <div className="card mb-6 border-accent-orange/30">
        <h3 className="section-title"><span>📐</span> Règles en vigueur</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-dark-800 border-l-4 border-accent-orange">
            <p className="text-accent-orange font-bold text-lg">4h30 max</p>
            <p className="text-white text-sm font-medium">Conduite continue</p>
            <p className="text-gray-500 text-xs mt-1">Sans pause. Pause de 15 min obligatoire après.</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-800 border-l-4 border-accent-red">
            <p className="text-accent-red font-bold text-lg">10h00 max</p>
            <p className="text-white text-sm font-medium">TCJ – Temps Conduite Journalière</p>
            <p className="text-gray-500 text-xs mt-1">Total conduite – pauses. Sans dérogation.</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-800 border-l-4 border-accent-yellow">
            <p className="text-accent-yellow font-bold text-lg">12h00 max</p>
            <p className="text-white text-sm font-medium">TTJ – Temps Travail Journalier</p>
            <p className="text-gray-500 text-xs mt-1">TCJ + total pauses. Sans dérogation.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
          <span>📡 Plateformes : <span className="text-gray-300">{GPS_PLATFORMS.join(' / ')}</span></span>
          <span>🕐 Vérifications : <span className="text-gray-300">{CHECK_SCHEDULE.join(' – ')} + J-1</span></span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="card text-center">
            <p className="text-2xl mb-1">{kpi.icon}</p>
            <p className="text-3xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Graphique violations par jour */}
      <div className="card mb-6">
        <h3 className="section-title"><span>📊</span> Infractions par jour (14 derniers jours)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232946" />
            <XAxis dataKey="dateShort" tick={{ fill: '#666', fontSize: 10 }} />
            <YAxis tick={{ fill: '#666', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1A1F35', border: '1px solid #2D3352', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="tcjViolations" fill="#E83A3A" name="TCJ > 10h" radius={[3, 3, 0, 0]} />
            <Bar dataKey="ttjViolations" fill="#F5C518" name="TTJ > 12h" radius={[3, 3, 0, 0]} />
            <Bar dataKey="continuousViolations" fill="#E8751A" name="Continue > 4h30" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher un chauffeur..."
            value={filterDriver}
            onChange={(e) => setFilterDriver(e.target.value)}
            className="flex-1 min-w-[200px] bg-dark-800 border border-dark-500 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange"
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-dark-800 border border-dark-500 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-accent-orange"
          />
          <div className="flex gap-2">
            {['Tous', 'Conforme', 'Infraction', 'Dérogation'].map(s => (
              <button
                key={s}
                onClick={() => setFilterCompliance(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterCompliance === s
                    ? 'bg-accent-orange text-white'
                    : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <h3 className="section-title">
          <span>📋</span> {filtered.length} enregistrements
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-dark-500 text-gray-400">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Chauffeur</th>
                <th className="text-left py-3 px-2">Route</th>
                <th className="text-center py-3 px-2">Début</th>
                <th className="text-center py-3 px-2">Fin</th>
                <th className="text-center py-3 px-2">Continue</th>
                <th className="text-center py-3 px-2">Pauses</th>
                <th className="text-center py-3 px-2">TCJ</th>
                <th className="text-center py-3 px-2">TTJ</th>
                <th className="text-center py-3 px-2">Dérog.</th>
                <th className="text-center py-3 px-2">Source</th>
                <th className="text-center py-3 px-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map((rec) => (
                <tr key={rec.id} className="border-b border-dark-600/50 hover:bg-dark-600/30">
                  <td className="py-2.5 px-2 text-gray-300 whitespace-nowrap">{rec.date.slice(5)}</td>
                  <td className="py-2.5 px-2 text-white font-medium whitespace-nowrap">{rec.driverName}</td>
                  <td className="py-2.5 px-2 text-gray-400 whitespace-nowrap max-w-[150px] truncate">{rec.route}</td>
                  <td className="py-2.5 px-2 text-center text-gray-300">{rec.startTime}</td>
                  <td className="py-2.5 px-2 text-center text-gray-300">{rec.endTime}</td>
                  <td className={`py-2.5 px-2 text-center font-medium ${rec.continuousOver ? 'text-accent-red' : 'text-gray-300'}`}>
                    {rec.continuousDriving}
                    {rec.continuousOver && ' ⚠️'}
                  </td>
                  <td className="py-2.5 px-2 text-center text-gray-300">{rec.nbPauses}× ({rec.totalPauses})</td>
                  <td className={`py-2.5 px-2 text-center font-bold ${rec.tcjOver && !rec.hasDerogation ? 'text-accent-red' : rec.tcjOver ? 'text-accent-yellow' : 'text-accent-green'}`}>
                    {rec.tcj}
                  </td>
                  <td className={`py-2.5 px-2 text-center font-bold ${rec.ttjOver && !rec.hasDerogation ? 'text-accent-red' : rec.ttjOver ? 'text-accent-yellow' : 'text-accent-green'}`}>
                    {rec.ttj}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {rec.hasDerogation ? (
                      <span className="badge bg-accent-blue/10 text-accent-blueLight" title={rec.derogationRef}>📋</span>
                    ) : '—'}
                  </td>
                  <td className="py-2.5 px-2 text-center text-gray-500">{rec.platform}</td>
                  <td className="py-2.5 px-2 text-center">
                    {(!rec.tcjCompliant || !rec.ttjCompliant || rec.continuousOver) && !rec.hasDerogation ? (
                      <span className="badge bg-accent-red/10 text-accent-red">Infraction</span>
                    ) : rec.hasDerogation ? (
                      <span className="badge bg-accent-blue/10 text-accent-blueLight">Dérogation</span>
                    ) : (
                      <span className="badge bg-accent-green/10 text-accent-green">Conforme</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center text-gray-600 text-xs">
        <p>Tracking QHSE – Jean Frédéric Herinjanahary | Responsable Tracking & Opération QHSE</p>
      </div>
    </div>
  );
}
