'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import { vehicles, statusColors } from '../data/vehicles';
import { alerts, severityColors, severityLabels } from '../data/alerts';
import { trips } from '../data/trips';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // KPIs
  const enRoute = vehicles.filter(v => v.status === 'En route').length;
  const alertCount = alerts.filter(a => !a.resolved).length;
  const activeAlerts = alerts.filter(a => !a.resolved);
  const totalKmToday = vehicles.reduce((s, v) => s + v.currentKm, 0);
  const avgSpeed = Math.round(
    vehicles.filter(v => v.speed > 0).reduce((s, v) => s + v.speed, 0) /
    Math.max(1, vehicles.filter(v => v.speed > 0).length)
  );

  const stats = [
    { label: 'Véhicules en route', value: enRoute, icon: '🚛', color: '#2ECC71', change: '+3 vs hier', changePositive: true },
    { label: 'Alertes actives', value: alertCount, icon: '🚨', color: '#E83A3A', change: `${alerts.length} total`, changePositive: false },
    { label: 'Km parcourus (flotte)', value: totalKmToday.toLocaleString(), icon: '📏', color: '#3B82F6', change: '+12% cette semaine', changePositive: true },
    { label: 'Vitesse moyenne', value: `${avgSpeed} km/h`, icon: '⚡', color: '#F5C518', change: 'Limite: 80 km/h', changePositive: true },
  ];

  // Données pour le graphique statut
  const statusData = Object.entries(
    vehicles.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value, color: statusColors[name] }));

  // Dernières alertes
  const recentAlerts = alerts.slice(0, 6);

  // Données vitesse par heure (simulé)
  const speedData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}h`,
    vitesse: h >= 5 && h <= 20 ? Math.floor(45 + Math.random() * 35) : 0,
    limite: 80,
  }));

  // Trajets récents
  const recentTrips = trips.slice(0, 5);

  return (
    <div>
      <Header
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la flotte – Transport pétrolier"
      />

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Graphique vitesse */}
        <div className="card xl:col-span-2">
          <h3 className="section-title">
            <span>⚡</span> Vitesse moyenne de la flotte (24h)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232946" />
              <XAxis dataKey="hour" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1A1F35', border: '1px solid #2D3352', borderRadius: 8 }}
                labelStyle={{ color: '#999' }}
              />
              <Area type="monotone" dataKey="vitesse" stroke="#E8751A" fill="#E8751A22" strokeWidth={2} name="Vitesse moy." />
              <Area type="monotone" dataKey="limite" stroke="#E83A3A55" fill="none" strokeWidth={1} strokeDasharray="5 5" name="Limite 80" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition statuts */}
        <div className="card">
          <h3 className="section-title">
            <span>📊</span> Statut de la flotte
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1A1F35', border: '1px solid #2D3352', borderRadius: 8 }}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#ccc', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Alertes récentes */}
        <div className="card">
          <h3 className="section-title">
            <span>🚨</span> Alertes récentes
          </h3>
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 border border-dark-500"
              >
                <span className="text-lg">{alert.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{alert.type}</p>
                  <p className="text-xs text-gray-500 truncate">{alert.vehicleId} – {alert.location}</p>
                </div>
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${severityColors[alert.severity]}20`,
                    color: severityColors[alert.severity],
                  }}
                >
                  {severityLabels[alert.severity]}
                </span>
                <span className={`w-2 h-2 rounded-full ${alert.resolved ? 'bg-accent-green' : 'bg-accent-red animate-pulse'}`}></span>
              </div>
            ))}
          </div>
        </div>

        {/* Trajets récents */}
        <div className="card">
          <h3 className="section-title">
            <span>🗺️</span> Derniers trajets
          </h3>
          <div className="space-y-2">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 border border-dark-500"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">
                    {trip.from} → {trip.to}
                  </p>
                  <p className="text-xs text-gray-500">
                    {trip.driverName} • {trip.distance} km • {trip.durationH}h
                  </p>
                </div>
                <span
                  className="badge"
                  style={{
                    backgroundColor: trip.status === 'Terminé' ? '#2ECC7120' : '#3B82F620',
                    color: trip.status === 'Terminé' ? '#2ECC71' : '#3B82F6',
                  }}
                >
                  {trip.status}
                </span>
                <span className={`text-sm font-bold ${trip.score >= 80 ? 'text-accent-green' : trip.score >= 65 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                  {trip.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer signature */}
      <div className="mt-8 text-center text-gray-600 text-xs">
        <p>Tracking QHSE – Société de Transport Pétrolier – Antananarivo, Madagascar</p>
        <p className="mt-1">Jean Frédéric Herinjanahary | Responsable Tracking & Opération QHSE</p>
      </div>
    </div>
  );
}
