'use client';

import { useState, useMemo } from 'react';
import Header from '../../components/Header';
import { trips, getMonthlyStats, getRouteStats } from '../../data/trips';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell,
} from 'recharts';

const statusStyles = {
  'Terminé': { bg: '#2ECC7120', color: '#2ECC71' },
  'En cours': { bg: '#3B82F620', color: '#3B82F6' },
  'Planifié': { bg: '#F5C51820', color: '#F5C518' },
};

export default function HistoriquePage() {
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const monthlyStats = useMemo(() => getMonthlyStats(), []);
  const routeStats = useMemo(() => getRouteStats(), []);

  const filteredTrips = useMemo(() => {
    let result = [...trips];
    if (filterStatus !== 'Tous') {
      result = result.filter(t => t.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.driverName.toLowerCase().includes(q) ||
        t.route.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        t.vehicleId.toLowerCase().includes(q) ||
        t.product.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.departure) - new Date(b.departure);
      else if (sortBy === 'score') cmp = a.score - b.score;
      else if (sortBy === 'distance') cmp = a.distance - b.distance;
      else if (sortBy === 'driver') cmp = a.driverName.localeCompare(b.driverName);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [filterStatus, searchQuery, sortBy, sortDir]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sortIcon = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const totalPages = trips.reduce((s, t) => s + t.distance, 0);
  const totalIncidents = trips.filter(t => t.incident).length;
  const avgScore = Math.round(trips.reduce((s, t) => s + t.score, 0) / trips.length);

  return (
    <div>
      <Header
        title="Historique des trajets"
        subtitle={`${trips.length} trajets enregistrés – ${totalPages.toLocaleString()} km parcourus – ${totalIncidents} incidents`}
      />

      {/* Graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="section-title"><span>📈</span> Trajets & incidents par mois</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232946" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1A1F35', border: '1px solid #2D3352', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="trips" fill="#3B82F6" name="Trajets" radius={[4, 4, 0, 0]} />
              <Bar dataKey="incidents" fill="#E83A3A" name="Incidents" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title"><span>🛣️</span> Score moyen par route</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={routeStats.slice(0, 7)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#232946" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis type="category" dataKey="route" tick={{ fill: '#999', fontSize: 10 }} width={140} />
              <Tooltip contentStyle={{ background: '#1A1F35', border: '1px solid #2D3352', borderRadius: 8 }} />
              <Bar dataKey="avgScore" name="Score moyen" radius={[0, 4, 4, 0]}>
                {routeStats.slice(0, 7).map((entry, i) => (
                  <Cell key={i} fill={entry.avgScore >= 80 ? '#2ECC71' : entry.avgScore >= 65 ? '#F5C518' : '#E83A3A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher (conducteur, route, véhicule, produit...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[250px] bg-dark-800 border border-dark-500 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange"
          />
          <div className="flex gap-2">
            {['Tous', 'Terminé', 'En cours', 'Planifié'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === s
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <span>📋</span> {filteredTrips.length} trajets
          </h3>
          <span className="text-xs text-gray-500">
            Score moyen flotte : <span className="text-accent-orange font-bold">{avgScore}/100</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="text-left py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                  Date{sortIcon('date')}
                </th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('driver')}>
                  Conducteur{sortIcon('driver')}
                </th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">Trajet</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">Produit</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('distance')}>
                  Distance{sortIcon('distance')}
                </th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">Durée</th>
                <th className="text-center py-3 px-3 text-gray-400 font-medium">Pauses</th>
                <th className="text-center py-3 px-3 text-gray-400 font-medium">Incident</th>
                <th className="text-center py-3 px-3 text-gray-400 font-medium">Statut</th>
                <th className="text-center py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('score')}>
                  Score{sortIcon('score')}
                </th>
                <th className="text-center py-3 px-3 text-gray-400 font-medium">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.slice(0, 50).map((trip) => (
                <tr key={trip.id} className="border-b border-dark-600/50 hover:bg-dark-600/30 transition-colors">
                  <td className="py-3 px-3 text-gray-300 whitespace-nowrap">
                    {new Date(trip.departure).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-3 text-white font-medium whitespace-nowrap">{trip.driverName}</td>
                  <td className="py-3 px-3 text-gray-300">
                    <span className="text-accent-blueLight">{trip.from}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    <span className="text-accent-orangeLight">{trip.to}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{trip.product}</td>
                  <td className="py-3 px-3 text-right text-gray-300">{trip.distance} km</td>
                  <td className="py-3 px-3 text-right text-gray-300">{trip.durationH}h</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`badge ${trip.pauses >= Math.ceil(trip.durationH / 2) ? 'text-accent-green bg-accent-green/10' : 'text-accent-red bg-accent-red/10'}`}>
                      {trip.pauses}×
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {trip.incident ? (
                      <span className="badge bg-accent-red/10 text-accent-red" title={trip.incident}>
                        ⚠️ {trip.incident.length > 15 ? trip.incident.slice(0, 15) + '…' : trip.incident}
                      </span>
                    ) : (
                      <span className="text-accent-green text-xs">✓ RAS</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="badge" style={statusStyles[trip.status]}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`font-bold ${trip.score >= 80 ? 'text-accent-green' : trip.score >= 65 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                      {trip.score}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedTrip(trip)}
                      className="text-accent-orange hover:text-accent-orangeLight text-xs font-medium"
                    >
                      Voir →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détail trajet */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTrip(null)}>
          <div className="bg-dark-700 rounded-2xl border border-dark-500 max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">🗺️ Trajet {selectedTrip.id}</h3>
              <button onClick={() => setSelectedTrip(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Conducteur</span>
                <span className="text-white font-medium">{selectedTrip.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Véhicule</span>
                <span className="text-white">{selectedTrip.vehicleId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trajet</span>
                <span className="text-accent-blueLight">{selectedTrip.from} → <span className="text-accent-orangeLight">{selectedTrip.to}</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Route</span>
                <span className="text-gray-300">{selectedTrip.route}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Produit</span>
                <span className="text-gray-300">{selectedTrip.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Départ</span>
                <span className="text-gray-300">{new Date(selectedTrip.departure).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Arrivée</span>
                <span className="text-gray-300">{new Date(selectedTrip.arrival).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Distance</span>
                <span className="text-white font-medium">{selectedTrip.distance} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Durée</span>
                <span className="text-gray-300">{selectedTrip.durationH}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vitesse moy. / max</span>
                <span className="text-gray-300">{selectedTrip.avgSpeed} / {selectedTrip.maxSpeed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pauses</span>
                <span className={selectedTrip.pauses >= Math.ceil(selectedTrip.durationH / 2) ? 'text-accent-green' : 'text-accent-red'}>
                  {selectedTrip.pauses}× ({selectedTrip.pauseDuration} min)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Conduite de nuit</span>
                <span className={selectedTrip.nightDriving ? 'text-accent-yellow' : 'text-accent-green'}>
                  {selectedTrip.nightDriving ? '🌙 Oui' : '☀️ Non'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Freinages brusques</span>
                <span className={selectedTrip.harshBraking > 3 ? 'text-accent-red' : 'text-gray-300'}>{selectedTrip.harshBraking}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Excès de vitesse</span>
                <span className={selectedTrip.speedingEvents > 0 ? 'text-accent-red' : 'text-accent-green'}>{selectedTrip.speedingEvents}</span>
              </div>
              {selectedTrip.incident && (
                <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/30">
                  <p className="text-accent-red font-medium">⚠️ Incident : {selectedTrip.incident}</p>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-dark-500">
                <span className="text-gray-400">Score de conduite</span>
                <span className={`text-2xl font-bold ${selectedTrip.score >= 80 ? 'text-accent-green' : selectedTrip.score >= 65 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                  {selectedTrip.score}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-gray-600 text-xs">
        <p>Tracking QHSE – Jean Frédéric Herinjanahary | Responsable Tracking & Opération QHSE</p>
      </div>
    </div>
  );
}
