import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { fetchShipments } from '../utils/api';

// Demo data used when Fabric network is not connected
const DEMO_SHIPMENTS = [
  {
    shipmentId: 'SHIP-A1B2C3D4',
    origin: 'Guangzhou, China',
    destination: 'Dakar, Senegal',
    goodsDescription: 'Athletic gear — 500 units (shoes, jerseys, bags)',
    status: 'IN_TRANSIT',
    supplierId: 'supplier-guangzhou-01',
    buyerId: 'buyer-dakar-01',
    paymentAmount: 25000,
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-03-28T14:30:00Z',
  },
  {
    shipmentId: 'SHIP-E5F6G7H8',
    origin: 'Shenzhen, China',
    destination: 'Dakar, Senegal',
    goodsDescription: 'Sports equipment — 200 units (weights, mats)',
    status: 'CUSTOMS_HOLD',
    supplierId: 'supplier-shenzhen-02',
    buyerId: 'buyer-dakar-01',
    paymentAmount: 18500,
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-04-01T09:15:00Z',
  },
  {
    shipmentId: 'SHIP-I9J0K1L2',
    origin: 'Shanghai, China',
    destination: 'Dakar, Senegal',
    goodsDescription: 'Training apparel — 1000 units',
    status: 'DELIVERED',
    supplierId: 'supplier-shanghai-03',
    buyerId: 'buyer-dakar-02',
    paymentAmount: 42000,
    createdAt: '2026-02-28T06:00:00Z',
    updatedAt: '2026-03-25T16:45:00Z',
  },
];

export default function ShipmentList() {
  const [shipments, setShipments] = useState(DEMO_SHIPMENTS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchShipments();
        if (!cancelled) {
          setShipments(data);
          setUsingDemo(false);
        }
      } catch {
        // Fabric not connected — keep demo data
        if (!cancelled) setUsingDemo(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.shipmentId.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) ||
      s.goodsDescription.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Shipments</h2>
        {usingDemo && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by ID, origin, destination, goods, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alpha-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Shipment ID</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Route</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Goods</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount (ACT)</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading shipments...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No shipments found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.shipmentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/shipments/${s.shipmentId}`}
                      className="text-alpha-600 font-medium hover:underline"
                    >
                      {s.shipmentId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.origin} &rarr; {s.destination}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {s.goodsDescription}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700">
                    {s.paymentAmount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
