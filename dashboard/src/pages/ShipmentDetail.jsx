import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import { fetchShipment } from '../utils/api';

// Demo shipment used when Fabric network is not connected
const DEMO_SHIPMENT = {
  shipmentId: 'SHIP-A1B2C3D4',
  origin: 'Guangzhou, China',
  destination: 'Dakar, Senegal',
  goodsDescription: 'Athletic gear — 500 units (shoes, jerseys, bags)',
  status: 'IN_TRANSIT',
  supplierId: 'supplier-guangzhou-01',
  buyerId: 'buyer-dakar-01',
  paymentAmount: 25000,
  paymentReleased: false,
  createdAt: '2026-03-15T08:00:00Z',
  updatedAt: '2026-03-28T14:30:00Z',
  events: [
    {
      status: 'CREATED',
      timestamp: '2026-03-15T08:00:00Z',
      location: 'Guangzhou, China',
      notes: 'Shipment created — athletic gear order confirmed',
      actor: { mspId: 'AlphaOrgMSP', id: 'supplier-guangzhou-01' },
    },
    {
      status: 'IN_TRANSIT',
      timestamp: '2026-03-18T06:30:00Z',
      location: 'Guangzhou Port, China',
      notes: 'Loaded onto vessel MSC DAKAR. ETA: 25 days',
      actor: { mspId: 'AlphaOrgMSP', id: 'transporter-maersk-01' },
    },
  ],
};

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchShipment(id);
        if (!cancelled) {
          setShipment(data);
          setUsingDemo(false);
        }
      } catch {
        // Fabric not connected — use demo if ID matches
        if (!cancelled) {
          setShipment(DEMO_SHIPMENT);
          setUsingDemo(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading shipment...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Shipment not found.</p>
        <Link to="/shipments" className="text-alpha-600 hover:underline">
          Back to shipments
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/shipments" className="text-gray-400 hover:text-gray-600 text-sm">
          &larr; Shipments
        </Link>
        <span className="text-gray-300">/</span>
        <h2 className="text-2xl font-bold">{shipment.shipmentId}</h2>
        <StatusBadge status={shipment.status} />
        {usingDemo && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full ml-auto">
            Demo Mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Shipment Details</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Origin</dt>
                <dd className="font-medium mt-0.5">{shipment.origin}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Destination</dt>
                <dd className="font-medium mt-0.5">{shipment.destination}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Goods Description</dt>
                <dd className="font-medium mt-0.5">{shipment.goodsDescription}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Supplier</dt>
                <dd className="font-medium mt-0.5">{shipment.supplierId}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Buyer</dt>
                <dd className="font-medium mt-0.5">{shipment.buyerId}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Payment Amount</dt>
                <dd className="font-medium font-mono mt-0.5">
                  {shipment.paymentAmount?.toLocaleString()} ACT
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Payment Released</dt>
                <dd className="mt-0.5">
                  {shipment.paymentReleased ? (
                    <span className="text-green-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-400">Pending delivery confirmation</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium mt-0.5">
                  {new Date(shipment.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="font-medium mt-0.5">
                  {new Date(shipment.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-3">Tracking QR Code</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-300">
                QR Code
              </div>
              <div className="text-sm text-gray-500">
                <p>Scan to track this shipment.</p>
                <p className="mt-1">
                  API endpoint:{' '}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                    GET /api/shipments/{shipment.shipmentId}/qrcode
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Event Timeline</h3>
          <StatusTimeline events={shipment.events} />
        </div>
      </div>
    </div>
  );
}
