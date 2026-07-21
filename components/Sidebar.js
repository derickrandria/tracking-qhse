'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: '📊', key: 'dashboard' },
  { href: '/suivi-journalier', label: 'Suivi journalier', icon: '📋', key: 'suivi-journalier' },
  { href: '/historique', label: 'Historique trajets', icon: '🗺️', key: 'historique' },
  { href: '/temps-conduite', label: 'Temps de conduite', icon: '⏱️', key: 'temps-conduite' },
  { href: '/infractions', label: 'Infractions', icon: '⚠️', key: 'infractions' },
  { href: '/vehicules', label: 'Véhicules', icon: '🚛', key: 'vehicules' },
  { href: '/alertes', label: 'Alertes', icon: '🚨', key: 'alertes' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-800 border-r border-dark-500 flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-dark-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-orange flex items-center justify-center text-xl font-bold text-white">
            ⛽
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Tracking QHSE</h1>
            <p className="text-gray-500 text-xs">Transport Pétrolier</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-orange/15 text-accent-orange border border-accent-orange/30'
                  : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-dark-600 flex items-center justify-center text-sm">
            👤
          </div>
          <div>
            <p className="text-white text-xs font-semibold">J.F. Herinjanahary</p>
            <p className="text-gray-500 text-[10px]">Resp. Tracking & QHSE</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-600">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
          Système actif – Antananarivo, MG
        </div>
      </div>
    </aside>
  );
}
