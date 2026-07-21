'use client';

export default function Header({ title, subtitle, actions }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        <p className="text-gray-600 text-xs mt-0.5 capitalize">{dateStr} – Antananarivo, Madagascar</p>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
