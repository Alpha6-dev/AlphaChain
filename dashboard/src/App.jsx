import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ShipmentList from './pages/ShipmentList';
import ShipmentDetail from './pages/ShipmentDetail';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/shipments', label: 'Shipments' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-navy-800 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">AlphaChain</h1>
        <p className="text-xs text-gray-400 mt-1">Logistics Platform</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ path, label }) => {
          const active = location.pathname === path ||
            (path === '/shipments' && location.pathname.startsWith('/shipments'));
          return (
            <Link
              key={path}
              to={path}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-alpha-600 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs text-gray-500">
        Alpha 6 &middot; Dakar, Senegal
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/shipments" element={<ShipmentList />} />
          <Route path="/shipments/:id" element={<ShipmentDetail />} />
        </Routes>
      </main>
    </div>
  );
}

function DashboardHome() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Active Shipments" value="--" color="bg-blue-500" />
        <StatCard label="In Transit" value="--" color="bg-yellow-500" />
        <StatCard label="Delivered" value="--" color="bg-green-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-gray-500 text-sm">
          Connect to the Fabric network to see live shipment data.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
