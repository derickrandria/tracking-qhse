'use client';

import { useState, useMemo } from 'react';
import Header from '../../components/Header';
import { vehicles, statusColors } from '../../data/vehicles';
import { drivers } from '../../data/drivers';

export default function VehiculesPage() {
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const filtered = useMemo(() => {
    let result = [...vehicles];
    if (filterStatus !== 'Tous') result = result.filter(v => v.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.id.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.route.toLowerCase().includes(q) ||
        v.driverId.toLowerCase().includes(q)
      );
    }
    return result;
  }, [filterStatus, searchQuery]);

  const getDriver = (id) => drivers.find(d => d.id === id);

  return (
    <div>
      <Header
        title="Véhicules"
        subtitle={`${vehicles.length} camions-citernes dans la flotte`}
      />

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher (ID, plaque, type, route...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[250px] bg-dark-800 border border-dark-500 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-orange"
          />
          <div className="flex gap-2 flex-wrap">
            {['Tous', ...Object.keys(statusColors)].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === s ? 'text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-500'
                }`}
                style={filterStatus === s ? { backgroundColor: statusColors[s] || '#E8751A' } : {}}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille véhicules */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(v => {
          const driver = getDriver(v.driverId);
          return (
            <div key={v.id} className="card cursor-pointer" onClick={() => setSelectedVehicle(v)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚛</span>
                  <div>
                    <p className="text-white font-bold text-sm">{v.id}</p>
                    <p className="text-gray-500 text-xs">{v.plate}</p>
                  </div>
                </div>
                <span
                  className="badge flex items-center gap-1.5"
                  style={{ backgroundColor: `${statusColors[v.status]}20`, color: statusColors[v.status] }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[v.status] }}></span>
                  {v.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-300">{v.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Produit</span>
                  <span className="text-gray-300">{v.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Route</span>
                  <span className="text-accent-blueLight text-xs">{v.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conducteur</span>
                  <span className="text-white">{driver?.name || v.driverId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vitesse</span>
                  <span className={v.speed > 80 ? 'text-accent-red font-bold' : 'text-gray-300'}>
                    {v.speed > 0 ? `${v.speed} km/h` : '—'}
                  </span>
                </div>
              </div>

              {/* Barre carburant */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>⛽ Carburant</span>
                  <span>{v.fuelLevel}%</span>
                </div>
                <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${v.fuelLevel}%`,
                      backgroundColor: v.fuelLevel < 20 ? '#E83A3A' : v.fuelLevel < 40 ? '#F5C518' : '#2ECC71',
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal détail véhicule */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVehicle(null)}>
          <div className="bg-dark-700 rounded-2xl border border-dark-500 max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">🚛 {selectedVehicle.id}</h3>
              <button onClick={() => setSelectedVehicle(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Plaque', selectedVehicle.plate],
                ['Type', selectedVehicle.type],
                ['Capacité', `${selectedVehicle.capacity.toLocaleString()} L`],
                ['Produit', selectedVehicle.product],
                ['Statut', selectedVehicle.status],
                ['Route', selectedVehicle.route],
                ['Progression', `${selectedVehicle.currentKm}/${selectedVehicle.routeKm} km`],
                ['Conducteur', getDriver(selectedVehicle.driverId)?.name || selectedVehicle.driverId],
                ['Vitesse actuelle', `${selectedVehicle.speed} km/h`],
                ['Carburant', `${selectedVehicle.fuelLevel}%`],
                ['Température citerne', `${selectedVehicle.temperature}°C`],
                ['Odomètre', `${selectedVehicle.odometer.toLocaleString()} km`],
                ['Prochaine maintenance', `dans ${selectedVehicle.nextMaintenance} km`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
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
