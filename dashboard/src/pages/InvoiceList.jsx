import React, { useState, useEffect } from 'react';
import { SourceBadge, StatusBadge } from '../components/InvoiceBadge';
import { fetchInvoices } from '../utils/api';

const DEMO_INVOICES = [
  {
    id: 'INV-DEMO0001',
    originalName: 'facture-lucart-mars2026.pdf',
    filename: '1711929600000-facture-lucart-mars2026.pdf',
    size: 245120,
    mimetype: 'application/pdf',
    source: 'email',
    status: 'received',
    receivedAt: '2026-03-31T23:30:20Z',
  },
  {
    id: 'INV-DEMO0002',
    originalName: 'invoice-guangzhou-shipment.pdf',
    filename: '1711843200000-invoice-guangzhou-shipment.pdf',
    size: 189440,
    mimetype: 'application/pdf',
    source: 'whatsapp',
    status: 'received',
    receivedAt: '2026-03-27T15:04:32Z',
  },
  {
    id: 'INV-DEMO0003',
    originalName: 'bon-de-commande-dakar.pdf',
    filename: '1711756800000-bon-de-commande-dakar.pdf',
    size: 312000,
    mimetype: 'application/pdf',
    source: 'email',
    status: 'received',
    receivedAt: '2026-03-26T11:36:32Z',
  },
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatType(mimetype) {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.startsWith('image/')) return mimetype.split('/')[1].toUpperCase();
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'Excel';
  return 'File';
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState(DEMO_INVOICES);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchInvoices();
        if (!cancelled && data && data.length > 0) {
          setInvoices(data);
          setUsingDemo(false);
        }
      } catch {
        if (!cancelled) setUsingDemo(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.id.toLowerCase().includes(q) ||
      inv.originalName.toLowerCase().includes(q) ||
      inv.source.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Invoices</h2>
        {usingDemo && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by ID, filename, source, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alpha-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice ID</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Filename</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Source</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Size</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading invoices...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No invoices found.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-alpha-600 font-medium">
                    {inv.id}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={inv.originalName}>
                    {inv.originalName}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={inv.source} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatType(inv.mimetype)}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">
                    {formatSize(inv.size)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(inv.receivedAt).toLocaleDateString()}
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
