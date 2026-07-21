'use client';

import { useState, useMemo } from 'react';
import Header from '../../components/Header';
import { dailyTracking, DAILY_DATE, TCJ_SEUIL, TTJ_SEUIL } from '../../data/daily-tracking';

const situationColors = {
  'CHARGE': { bg: '#2ECC7120', color: '#2ECC71', label: '🟢 Chargé' },
  'VIDE': { bg: '#F5C51820', color: '#F5C518', label: '🟡 Vide' },
  'LIBRE': { bg: '#3B82F620', color: '#3B82F6', label: '🔵 Libre' },
};

const statusColors = {
  'En transit': '#2ECC71',
  'En attente': '#F5C518',
  'Déchargement': '#E8751A',
  'Maintenance': '#E83A3A',
  'Retour': '#3B82F6',
  'Repos': '#9E9EB0',
  'Remplacement TRR': '#9E9EB0',
  'Formation': '#9E9EB0',
  'Chauffeur malade': '#E83A3A',
  'Attente chauffeur': '#F5C518',
  'Visite médicale': '#3B82F6',
};

export default function SuiviJournalierPage() {
  const [filterSituation, setFilterSituation] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'cards'

  const filtered = useMemo(() => {
    let result = [...dailyTracking];
    if (filterSituation !== 'Tous') result = result.filter(v => v.situation === filterSituation);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.plate.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q) ||
        v.mission.toLowerCase().includes(q) ||
        (v.distributor && v.distributor.toLowerCase().includes(q)) ||
        (v.emplacement && v.emplacement.toLowerCase().includes(q))
      );
    }
    return result;
  }, [filterSituation, searchQuery]);

  // Stats
  const enTransit = dailyTracking.filter(v => v.status === 'En transit').length;
  const charges = dailyTracking.filter(v => v.situation === 'CHARGE').length;
  const vides = dailyTracking.filter(v => v.situation === 'VIDE').length;
  const libres = dailyTracking.filter(v => v.situation === 'LIBRE').length;
  const maintenance = dailyTracking.filter(v => v.status === 'Maintenance').length;
  const avecTCJ = dailyTracking.filter(v => v.tcjCumule).length;
  const tcjOk = dailyTracking.filter(v => v.tcjStatut === 'OK').length;

  return (
    <div>
      <Header
        title="Suivi journalier – Positions & Temps de conduite"
        subtitle={`LPSA – ${DAILY_DATE} | Seuil TCJ : ${TCJ_SEUIL} | Seuil TTJ : ${TTJ_SEUIL}`}
      />

      {/* KPIs du jour */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'En transit', value: enTransit, color: '#2ECC71', icon: '🚛' },
          { label: 'Chargés', value: charges, color: '#2ECC71', icon: '🟢' },
          { label: 'Vides', value: vides, color: '#F5C518', icon: '🟡' },
          { label: 'Libres', value: libres, color: '#3B82F6', icon: '🔵' },
          { label: 'Maintenance', value: maintenance, color: '#E83A3A', icon: '🔧' },
          { label: 'TCJ conforme', value: `${tcjOk}/${avecTCJ}`, color: '#2ECC71', icon: '✅' },
        ].map((kpi, i) => (
          <div key={i} className="card text-center py-3">
            <p className="text-lg">{kpi.icon}</p>
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[10px] text-gray-400">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher (plaque, chauffeur, mission, distributeur...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[250px] bg-dark-800 border border-dark-500 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange"
          />
          <div className="flex gap-2">
            {['Tous', 'CHARGE', 'VIDE', 'LIBRE'].map(s => (
              <button
                key={s}
                onClick={() => setFilterSituation(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterSituation === s ? 'text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-500'
                }`}
                style={filterSituation === s && s !== 'Tous' ? { backgroundColor: situationColors[s]?.color } : filterSituation === s ? { backgroundColor: '#E8751A' } : {}}
              >
                {s === 'Tous' ? 'Tous' : s === 'CHARGE' ? '🟢 Chargé' : s === 'VIDE' ? '🟡 Vide' : '🔵 Libre'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-dark-800 rounded-lg p-1">
            <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded text-xs ${viewMode === 'table' ? 'bg-accent-orange text-white' : 'text-gray-400'}`}>📋 Tableau</button>
            <button onClick={() => setViewMode('cards')} className={`px-3 py-1 rounded text-xs ${viewMode === 'cards' ? 'bg-accent-orange text-white' : 'text-gray-400'}`}>🃏 Cartes</button>
          </div>
        </div>
      </div>

      {/* Vue tableau */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dark-500 text-gray-400">
                  <th className="text-left py-3 px-2">N° CC</th>
                  <th className="text-left py-3 px-2">Chauffeur</th>
                  <th className="text-left py-3 px-2">Mission</th>
                  <th className="text-center py-3 px-2">Situation</th>
                  <th className="text-left py-3 px-2">Distributeur</th>
                  <th className="text-left py-3 px-2">Produit</th>
                  <th className="text-left py-3 px-2">Emplacement J-1</th>
                  <th className="text-left py-3 px-2">Position 08h</th>
                  <th className="text-center py-3 px-2">H. Départ</th>
                  <th className="text-center py-3 px-2">TCC</th>
                  <th className="text-center py-3 px-2">TCJ</th>
                  <th className="text-center py-3 px-2">TCJ rest.</th>
                  <th className="text-center py-3 px-2">TTJ</th>
                  <th className="text-center py-3 px-2">Pause</th>
                  <th className="text-center py-3 px-2">Statut</th>
                  <th className="text-center py-3 px-2">Détail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.plate} className="border-b border-dark-600/50 hover:bg-dark-600/30">
                    <td className="py-2.5 px-2 text-white font-bold whitespace-nowrap">{v.plate}</td>
                    <td className="py-2.5 px-2 text-white whitespace-nowrap">{v.driver || '—'}</td>
                    <td className="py-2.5 px-2 text-gray-300 max-w-[180px] truncate" title={v.mission}>{v.mission}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="badge" style={{ backgroundColor: situationColors[v.situation]?.bg, color: situationColors[v.situation]?.color }}>
                        {v.situation}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-gray-400">{v.distributor || '—'}</td>
                    <td className="py-2.5 px-2 text-gray-300 font-medium">{v.product || '—'}</td>
                    <td className="py-2.5 px-2 text-gray-400 max-w-[120px] truncate">{v.positions.j1 || '—'}</td>
                    <td className="py-2.5 px-2 text-gray-300 max-w-[120px] truncate">{v.positions.h08 || '—'}</td>
                    <td className="py-2.5 px-2 text-center text-gray-300">{v.depart || '—'}</td>
                    <td className="py-2.5 px-2 text-center text-gray-300">{v.tcc || '—'}</td>
                    <td className={`py-2.5 px-2 text-center font-bold ${v.tcjCumule ? 'text-accent-green' : 'text-gray-600'}`}>{v.tcjCumule || '—'}</td>
                    <td className="py-2.5 px-2 text-center text-gray-300">{v.tcjRestant || '—'}</td>
                    <td className="py-2.5 px-2 text-center text-gray-300">{v.ttj || '—'}</td>
                    <td className="py-2.5 px-2 text-center text-gray-400">{v.totalPause || '—'}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="text-xs font-medium" style={{ color: statusColors[v.status] || '#9E9EB0' }}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button onClick={() => setSelectedVehicle(v)} className="text-accent-orange hover:text-accent-orangeLight font-medium">→</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue cartes */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.plate} className="card cursor-pointer" onClick={() => setSelectedVehicle(v)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold text-sm">{v.plate}</span>
                <span className="badge" style={{ backgroundColor: situationColors[v.situation]?.bg, color: situationColors[v.situation]?.color }}>
                  {v.situation}
                </span>
              </div>
              <p className="text-gray-300 text-xs mb-1">👤 {v.driver || 'Non assigné'} {v.phone && `| ${v.phone}`}</p>
              <p className="text-gray-400 text-xs mb-2">{v.mission}</p>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className="text-gray-500">Distributeur:</span>
                <span className="text-gray-300">{v.distributor || '—'}</span>
                <span className="text-gray-500">Produit:</span>
                <span className="text-gray-300 font-medium">{v.product || '—'}</span>
                <span className="text-gray-500">Emplacement:</span>
                <span className="text-gray-300">{v.emplacement || '—'}</span>
                <span className="text-gray-500">Position 08h:</span>
                <span className="text-gray-300">{v.positions.h08 || '—'}</span>
              </div>
              {v.tcjCumule && (
                <div className="mt-2 pt-2 border-t border-dark-500 flex items-center gap-3 text-xs">
                  <span className="text-gray-500">TCJ:</span>
                  <span className="text-accent-green font-bold">{v.tcjCumule}</span>
                  <span className="text-gray-500">TTJ:</span>
                  <span className="text-gray-300">{v.ttj}</span>
                  <span className="badge bg-accent-green/10 text-accent-green">{v.tcjStatut}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal détail */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVehicle(null)}>
          <div className="bg-dark-700 rounded-2xl border border-dark-500 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">🚛 {selectedVehicle.plate}</h3>
                <span className="badge" style={{ backgroundColor: situationColors[selectedVehicle.situation]?.bg, color: situationColors[selectedVehicle.situation]?.color }}>
                  {selectedVehicle.situation}
                </span>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
              {[
                ['Chauffeur', `${selectedVehicle.driver} (${selectedVehicle.phone})`],
                ['Remorque', selectedVehicle.trailer],
                ['Transporteur', selectedVehicle.transporter],
                ['Mission', selectedVehicle.mission],
                ['Statut', selectedVehicle.status],
                ['Dépôt récepteur', selectedVehicle.depot || '—'],
                ['Distributeur', selectedVehicle.distributor || '—'],
                ['Produit', selectedVehicle.product || '—'],
                ['OT', selectedVehicle.ot || '—'],
                ['Emplacement', selectedVehicle.emplacement || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b border-dark-600/50">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Positions */}
            <h4 className="text-sm font-bold text-white mb-2">📍 Positions (toutes les 2h)</h4>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Object.entries(selectedVehicle.positions).map(([hour, pos]) => (
                <div key={hour} className="p-2 rounded-lg bg-dark-800 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">{hour === 'j1' ? 'J-1' : hour}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{pos || '—'}</p>
                </div>
              ))}
            </div>

            {/* Temps de conduite */}
            {selectedVehicle.tcjCumule && (
              <>
                <h4 className="text-sm font-bold text-white mb-2">⏱️ Temps de conduite</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                  {[
                    ['Heure départ', selectedVehicle.depart],
                    ['TCC (temps réel)', selectedVehicle.tcc],
                    ['TCJ cumulé', selectedVehicle.tcjCumule],
                    ['TCJ restant', selectedVehicle.tcjRestant],
                    ['Statut TCJ', selectedVehicle.tcjStatut],
                    ['TTJ (temps réel)', selectedVehicle.ttj],
                    ['Total pause', selectedVehicle.totalPause || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1 border-b border-dark-600/50">
                      <span className="text-gray-400">{label}</span>
                      <span className={`font-bold ${label.includes('TCJ cumulé') || label.includes('Statut') ? 'text-accent-green' : 'text-white'}`}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Trajets */}
            {selectedVehicle.trajets.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-white mb-2">🛣️ Détail trajets</h4>
                <div className="space-y-1">
                  {selectedVehicle.trajets.map((t, i) => (
                    <div key={i} className="flex gap-2 text-xs text-gray-300 bg-dark-800 rounded px-3 py-2">
                      <span className="text-gray-500">T{i + 1}:</span>
                      {t.fin && <span>Fin: {t.fin}</span>}
                      {t.deb && <span>| Déb: {t.deb}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-gray-600 text-xs">
        <p>Suivi journalier LPSA – Plateformes : MzoneX / CamtrackPro</p>
        <p className="mt-1">Tracking QHSE – Jean Frédéric Herinjanahary | Responsable Tracking & Opération QHSE</p>
      </div>
    </div>
  );
}
