'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '../../components/Header';
import { dailyTracking, DAILY_DATE, TCJ_SEUIL, TTJ_SEUIL } from '../../data/daily-tracking';

const situationColors = {
  'CHARGE': { bg: '#F5C51830', color: '#F5C518', border: '#F5C518' },
  'VIDE': { bg: '#3B82F630', color: '#3B82F6', border: '#3B82F6' },
  'LIBRE': { bg: '#2ECC7130', color: '#2ECC71', border: '#2ECC71' },
};

export default function SuiviJournalierPage() {
    const [liveData, setLiveData] = useState(null);
  useEffect(() => {
    fetch('/live-data.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setLiveData(data); })
      .catch(() => {});
  }, []);
  const [filterSituation, setFilterSituation] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  // Afficher les données live si disponibles
  const displayData = liveData ? liveData.mzonex.map(v => ({
    plate: v.plate, driver: '', phone: '', desc: '', transporter: '',
    mission: v.eventType || '', situation: 'CHARGE', statutColor: 'yellow',
    depot: '', distributeur: '', produit: '', ot: '',
    j1: '', h08: v.lastPosition || '', dist08: '', h10: '', dist10: '',
    h12: null, dist12: null, h14: null, dist14: null, h16: null, dist16: null, h18: null, dist18: null,
    depart: null, tcc: null, tcj: null, tcjRest: null, tcjStatut: null, ttj: null,
    finT1: null, debT2: null, finT2: null, debT3: null, finT3: null, arret: null, totalPause: null,
    speed: v.speed || '', platform: v.platform || '',
  })) : dailyTracking;
  const filtered = useMemo(() => {
        let result = [...displayData];;
    if (filterSituation !== 'Tous') result = result.filter(v => v.situation === filterSituation);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.plate.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q) ||
        v.mission.toLowerCase().includes(q) ||
        (v.distributeur && v.distributeur.toLowerCase().includes(q)) ||
        (v.depot && v.depot.toLowerCase().includes(q))
      );
    }
    return result;
  }, [filterSituation, searchQuery]);

  // Stats
  const charges = dailyTracking.filter(v => v.situation === 'CHARGE').length;
  const vides = dailyTracking.filter(v => v.situation === 'VIDE').length;
  const libres = dailyTracking.filter(v => v.situation === 'LIBRE').length;
  const avecTCJ = dailyTracking.filter(v => v.tcj).length;
  const tcjOk = dailyTracking.filter(v => v.tcjStatut === 'OK').length;

  return (
    <div>
      <Header
        title="Suivi journalier – Positions & Temps de conduite"
        subtitle={`LPSA – ${DAILY_DATE} | Seuil TCJ : ${TCJ_SEUIL} | Seuil TTJ : ${TTJ_SEUIL}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: '🟡 Chargés', value: charges, color: '#F5C518' },
          { label: '🔵 Vides', value: vides, color: '#3B82F6' },
          { label: '🟢 Libres', value: libres, color: '#2ECC71' },
          { label: '⏱️ Avec TCJ', value: avecTCJ, color: '#E8751A' },
          { label: '✅ TCJ OK', value: `${tcjOk}/${avecTCJ}`, color: '#2ECC71' },
        ].map((kpi, i) => (
          <div key={i} className="card text-center py-3">
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[10px] text-gray-400">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Plaque, chauffeur, mission, dépôt, distributeur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[250px] bg-dark-800 border border-dark-500 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange"
          />
          <div className="flex gap-2">
            {['Tous', 'CHARGE', 'VIDE', 'LIBRE'].map(s => (
              <button key={s} onClick={() => setFilterSituation(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterSituation === s ? 'text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-500'}`}
                style={filterSituation === s && s !== 'Tous' ? { backgroundColor: situationColors[s]?.color } : filterSituation === s ? { backgroundColor: '#E8751A' } : {}}>
                {s === 'Tous' ? 'Tous' : s === 'CHARGE' ? '🟡 CHARGÉ' : s === 'VIDE' ? '🔵 VIDE' : '🟢 LIBRE'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLEAU – Format identique au Google Sheets */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-dark-800 text-gray-300 border-b border-dark-500">
                <th className="py-2 px-2 text-left sticky left-0 bg-dark-800 z-10">N°CC</th>
                <th className="py-2 px-2 text-left">Chauffeur</th>
                <th className="py-2 px-2 text-left">Téléphone</th>
                <th className="py-2 px-2 text-left">Description</th>
                <th className="py-2 px-2 text-center">Transport.</th>
                <th className="py-2 px-2 text-left">Mission</th>
                <th className="py-2 px-2 text-center">Situation</th>
                <th className="py-2 px-2 text-center">Dépôt</th>
                <th className="py-2 px-2 text-center">Distrib.</th>
                <th className="py-2 px-2 text-center">Produit</th>
                <th className="py-2 px-2 text-left">OT</th>
                <th className="py-2 px-2 text-left bg-dark-700">Empl. J-1</th>
                <th className="py-2 px-2 text-left bg-green-900/30">08h00</th>
                <th className="py-2 px-2 text-left">Distance</th>
                <th className="py-2 px-2 text-left bg-green-900/30">10h00</th>
                <th className="py-2 px-2 text-left">Distance</th>
                <th className="py-2 px-2 text-left bg-green-900/30">12h00</th>
                <th className="py-2 px-2 text-left">Distance</th>
                <th className="py-2 px-2 text-left bg-green-900/30">14h00</th>
                <th className="py-2 px-2 text-left">Distance</th>
                <th className="py-2 px-2 text-left bg-green-900/30">16h00</th>
                <th className="py-2 px-2 text-left">Distance</th>
                <th className="py-2 px-2 text-left bg-green-900/30">18h00</th>
                <th className="py-2 px-2 text-left">Distance</th>
                <th className="py-2 px-2 text-center bg-yellow-900/30">H. Départ</th>
                <th className="py-2 px-2 text-center bg-yellow-900/30">TCC</th>
                <th className="py-2 px-2 text-center bg-yellow-900/30">TCJ</th>
                <th className="py-2 px-2 text-center bg-yellow-900/30">TCJ rest.</th>
                <th className="py-2 px-2 text-center bg-yellow-900/30">Statut</th>
                <th className="py-2 px-2 text-center bg-yellow-900/30">TTJ</th>
                <th className="py-2 px-2 text-center bg-red-900/30">Fin T1</th>
                <th className="py-2 px-2 text-center bg-red-900/30">Deb T2</th>
                <th className="py-2 px-2 text-center bg-red-900/30">Fin T2</th>
                <th className="py-2 px-2 text-center">Pause</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const sitColor = situationColors[v.situation] || { bg: '#333', color: '#999', border: '#555' };
                return (
                  <tr key={v.plate} className="border-b border-dark-600/30 hover:bg-dark-600/20 cursor-pointer" onClick={() => setSelectedVehicle(v)}>
                    {/* N°CC */}
                    <td className="py-1.5 px-2 font-bold text-white sticky left-0 bg-dark-700 z-10 whitespace-nowrap"
                      style={{ borderLeft: `3px solid ${sitColor.border}` }}>
                      {v.plate}
                    </td>
                    {/* Chauffeur */}
                    <td className="py-1.5 px-2 text-white font-medium whitespace-nowrap">{v.driver || '—'}</td>
                    {/* Téléphone */}
                    <td className="py-1.5 px-2 text-gray-400 whitespace-nowrap">{v.phone || '—'}</td>
                    {/* Description */}
                    <td className="py-1.5 px-2 text-gray-400 whitespace-nowrap">{v.desc}</td>
                    {/* Transporteur */}
                    <td className="py-1.5 px-2 text-center text-gray-300">{v.transporter}</td>
                    {/* Mission */}
                    <td className="py-1.5 px-2 text-gray-300 max-w-[200px] truncate" title={v.mission}>{v.mission}</td>
                    {/* Situation (badge coloré) */}
                    <td className="py-1.5 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: sitColor.bg, color: sitColor.color, border: `1px solid ${sitColor.border}` }}>
                        {v.situation === 'CHARGE' ? 'CHAR...' : v.situation === 'VIDE' ? 'VIDE' : 'LIBRE'}
                      </span>
                    </td>
                    {/* Dépôt */}
                    <td className="py-1.5 px-2 text-center text-gray-300">{v.depot || '—'}</td>
                    {/* Distributeur */}
                    <td className="py-1.5 px-2 text-center">
                      {v.distributeur ? <span className="text-gray-300">{v.distributeur.slice(0,4)}...</span> : '—'}
                    </td>
                    {/* Produit */}
                    <td className="py-1.5 px-2 text-center">
                      {v.produit ? <span className="px-1 py-0.5 rounded bg-accent-orange/20 text-accent-orange text-[10px] font-bold">{v.produit}</span> : '—'}
                    </td>
                    {/* OT */}
                    <td className="py-1.5 px-2 text-gray-400">{v.ot || '—'}</td>
                    {/* Empl. J-1 */}
                    <td className="py-1.5 px-2 text-gray-300 bg-dark-700/50 whitespace-nowrap">{v.j1 || '—'}</td>
                    {/* 08h */}
                    <td className="py-1.5 px-2 text-gray-300 whitespace-nowrap">{v.h08 || '—'}</td>
                    <td className="py-1.5 px-2 text-gray-400 whitespace-nowrap">{v.dist08 || ''}</td>
                    {/* 10h */}
                    <td className="py-1.5 px-2 text-gray-300 whitespace-nowrap">{v.h10 || '—'}</td>
                    <td className="py-1.5 px-2 text-gray-400 whitespace-nowrap">{v.dist10 || ''}</td>
                    {/* 12h */}
                    <td className="py-1.5 px-2 text-gray-300 whitespace-nowrap">{v.h12 || '—'}</td>
                    <td className="py-1.5 px-2 text-gray-400 whitespace-nowrap">{v.dist12 || ''}</td>
                    {/* 14h */}
                    <td className="py-1.5 px-2 text-gray-300 whitespace-nowrap">{v.h14 || '—'}</td>
                    <td className="py-1.5 px-2 text-gray-400 whitespace-nowrap">{v.dist14 || ''}</td>
                    {/* 16h */}
                    <td className="py-1.5 px-2 text-gray-300 whitespace-nowrap">{v.h16 || '—'}</td>
                    <td className="py-1.5 px-2 text-gray-400 whitespace-nowrap">{v.dist16 || ''}</td>
                    {/* 18h */}
                    <td className="py-1.5 px-2 text-gray-300 whitespace-nowrap">{v.h18 || '—'}</td>
                    <td className="py-1.5 px-2 text-gray-400 whitespace-nowrap">{v.dist18 || ''}</td>
                    {/* TCJ/TTJ */}
                    <td className="py-1.5 px-2 text-center text-gray-300 bg-yellow-900/10">{v.depart || '—'}</td>
                    <td className="py-1.5 px-2 text-center text-gray-300 bg-yellow-900/10">{v.tcc || '—'}</td>
                    <td className="py-1.5 px-2 text-center font-bold bg-yellow-900/10" style={{ color: v.tcj ? '#2ECC71' : '#555' }}>{v.tcj || '—'}</td>
                    <td className="py-1.5 px-2 text-center text-gray-300 bg-yellow-900/10">{v.tcjRest || '—'}</td>
                    <td className="py-1.5 px-2 text-center bg-yellow-900/10">
                      {v.tcjStatut ? <span className="text-accent-green font-bold">{v.tcjStatut}</span> : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-center text-gray-300 bg-yellow-900/10">{v.ttj || '—'}</td>
                    {/* Trajets */}
                    <td className="py-1.5 px-2 text-center text-gray-300 bg-red-900/10">{v.finT1 || '—'}</td>
                    <td className="py-1.5 px-2 text-center text-gray-300 bg-red-900/10">{v.debT2 || '—'}</td>
                    <td className="py-1.5 px-2 text-center text-gray-300 bg-red-900/10">{v.finT2 || '—'}</td>
                    <td className="py-1.5 px-2 text-center text-gray-400">{v.totalPause || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détail */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVehicle(null)}>
          <div className="bg-dark-700 rounded-2xl border border-dark-500 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">🚛 {selectedVehicle.plate}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: situationColors[selectedVehicle.situation]?.bg, color: situationColors[selectedVehicle.situation]?.color }}>
                  {selectedVehicle.situation}
                </span>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
              {[
                ['Chauffeur', selectedVehicle.driver],
                ['Téléphone', selectedVehicle.phone],
                ['Description', selectedVehicle.desc],
                ['Transporteur', selectedVehicle.transporter],
                ['Mission', selectedVehicle.mission],
                ['Dépôt Récepteur', selectedVehicle.depot],
                ['Distributeur', selectedVehicle.distributeur],
                ['Produit', selectedVehicle.produit],
                ['OT', selectedVehicle.ot],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b border-dark-600/50">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium text-right">{value || '—'}</span>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-bold text-white mb-2">📍 Positions</h4>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[['J-1', selectedVehicle.j1], ['08h', selectedVehicle.h08], ['10h', selectedVehicle.h10],
                ['12h', selectedVehicle.h12], ['14h', selectedVehicle.h14], ['16h', selectedVehicle.h16],
                ['18h', selectedVehicle.h18]].map(([h, pos]) => (
                <div key={h} className="p-2 rounded-lg bg-dark-800 text-center">
                  <p className="text-[10px] text-gray-500">{h}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{pos || '—'}</p>
                </div>
              ))}
            </div>

            {selectedVehicle.tcj && (
              <>
                <h4 className="text-sm font-bold text-white mb-2">⏱️ Temps de conduite</h4>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[['H. Départ', selectedVehicle.depart], ['TCC', selectedVehicle.tcc], ['TCJ', selectedVehicle.tcj],
                    ['TCJ restant', selectedVehicle.tcjRest], ['Statut TCJ', selectedVehicle.tcjStatut], ['TTJ', selectedVehicle.ttj],
                    ['Fin T1', selectedVehicle.finT1], ['Deb T2', selectedVehicle.debT2], ['Total pause', selectedVehicle.totalPause],
                  ].map(([label, value]) => (
                    <div key={label} className="p-2 rounded-lg bg-dark-800 text-center">
                      <p className="text-[10px] text-gray-500">{label}</p>
                      <p className={`text-sm font-bold mt-0.5 ${label === 'Statut TCJ' ? 'text-accent-green' : 'text-white'}`}>{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-gray-600 text-xs">
        <p>Tracking QHSE – Jean Frédéric Herinjanahary | Responsable Tracking & Opération QHSE</p>
      </div>
    </div>
  );
}
