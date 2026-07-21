'use client';

import { useState, useMemo } from 'react';
import Header from '../../components/Header';
import { infractions, severityLabels } from '../../data/infractions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function InfractionsPage() {
  const [filterSeverity, setFilterSeverity] = useState('Tous');
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = [...infractions];
    if (filterSeverity !== 'Tous') result = result.filter(i => i.severity === parseInt(filterSeverity));
    if (filterStatus !== 'Tous') result = result.filter(i => i.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.driverName.toLowerCase().includes(q) ||
        i.driverFullName.toLowerCase().includes(q) ||
        i.vehiclePlate.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [filterSeverity, filterStatus, searchQuery]);

  // Stats
  const totalInfractions = infractions.length;
  const critiques = infractions.filter(i => i.severity === 4).length;
  const graves = infractions.filter(i => i.severity === 3).length;
  const enCours = infractions.filter(i => i.status !== 'Traité').length;

  // Par type
  const byType = useMemo(() => {
    const map = {};
    for (const inf of infractions) {
      map[inf.type] = (map[inf.type] || 0) + 1;
    }
    return Object.entries(map).map(([type, count]) => ({ type: type.length > 25 ? type.slice(0, 25) + '…' : type, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // Par gravité (camembert)
  const bySeverity = [1, 2, 3, 4].map(s => ({
    name: severityLabels[s].label,
    value: infractions.filter(i => i.severity === s).length,
    color: severityLabels[s].color,
  }));

  return (
    <div>
      <Header
        title="Infractions & Sanctions"
        subtitle={`${totalInfractions} infractions enregistrées – ${enCours} en cours de traitement`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-red">{critiques}</p>
          <p className="text-xs text-gray-400 mt-1">Critiques (niv. 4)</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-orange">{graves}</p>
          <p className="text-xs text-gray-400 mt-1">Graves (niv. 3)</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-yellow">{enCours}</p>
          <p className="text-xs text-gray-400 mt-1">En cours de traitement</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-green">{totalInfractions - enCours}</p>
          <p className="text-xs text-gray-400 mt-1">Traitées</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="section-title"><span>📊</span> Infractions par type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byType.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#232946" />
              <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis type="category" dataKey="type" tick={{ fill: '#999', fontSize: 10 }} width={160} />
              <Tooltip contentStyle={{ background: '#1A1F35', border: '1px solid #2D3352', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#E8751A" name="Nombre" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title"><span>🎯</span> Répartition par gravité</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={bySeverity} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                {bySeverity.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1A1F35', border: '1px solid #2D3352', borderRadius: 8 }} />
              <Legend formatter={(v) => <span style={{ color: '#ccc', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher (chauffeur, plaque, type, lieu...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[250px] bg-dark-800 border border-dark-500 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange"
          />
          <div className="flex gap-2">
            {['Tous', '1', '2', '3', '4'].map(s => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterSeverity === s ? 'text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-500'
                }`}
                style={filterSeverity === s && s !== 'Tous' ? { backgroundColor: severityLabels[parseInt(s)].color } : filterSeverity === s ? { backgroundColor: '#E8751A' } : {}}
              >
                {s === 'Tous' ? 'Tous' : `Niv. ${s}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['Tous', 'En attente', 'En cours', 'Traité'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === s ? 'bg-accent-blue text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-500'
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
        <h3 className="section-title"><span>📋</span> {filtered.length} infractions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-dark-500 text-gray-400">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Heure</th>
                <th className="text-left py-3 px-2">Véhicule</th>
                <th className="text-left py-3 px-2">Chauffeur</th>
                <th className="text-left py-3 px-2">Type d'infraction</th>
                <th className="text-left py-3 px-2">Lieu</th>
                <th className="text-center py-3 px-2">Vitesse</th>
                <th className="text-center py-3 px-2">Gravité</th>
                <th className="text-left py-3 px-2">Sanction</th>
                <th className="text-center py-3 px-2">Statut</th>
                <th className="text-center py-3 px-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map((inf) => (
                <tr key={inf.id} className="border-b border-dark-600/50 hover:bg-dark-600/30">
                  <td className="py-2.5 px-2 text-gray-300 whitespace-nowrap">{inf.date.slice(5)}</td>
                  <td className="py-2.5 px-2 text-gray-300">{inf.heure}</td>
                  <td className="py-2.5 px-2 text-white font-medium whitespace-nowrap">{inf.vehiclePlate}</td>
                  <td className="py-2.5 px-2 text-white whitespace-nowrap">{inf.driverName}</td>
                  <td className="py-2.5 px-2 text-gray-300 max-w-[180px] truncate" title={inf.type}>{inf.type}</td>
                  <td className="py-2.5 px-2 text-gray-400 max-w-[150px] truncate">{inf.location}</td>
                  <td className="py-2.5 px-2 text-center">
                    {inf.speedObserved ? (
                      <span className="text-accent-red font-bold">{inf.speedObserved}</span>
                    ) : '—'}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className="badge"
                      style={{ backgroundColor: `${severityLabels[inf.severity].color}20`, color: severityLabels[inf.severity].color }}
                    >
                      {severityLabels[inf.severity].label}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-gray-300 whitespace-nowrap">{inf.sanction}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`badge ${
                      inf.status === 'Traité' ? 'bg-accent-green/10 text-accent-green' :
                      inf.status === 'En cours' ? 'bg-accent-yellow/10 text-accent-yellow' :
                      'bg-accent-red/10 text-accent-red'
                    }`}>
                      {inf.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-gray-500">{inf.source}</td>
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
