'use client';

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="card flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: `${stat.color}18`, color: stat.color }}
          >
            {stat.icon}
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium">{stat.label}</p>
            <p className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </p>
            {stat.change && (
              <p className={`text-xs mt-0.5 ${stat.changePositive ? 'text-accent-green' : 'text-accent-red'}`}>
                {stat.changePositive ? '▲' : '▼'} {stat.change}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
