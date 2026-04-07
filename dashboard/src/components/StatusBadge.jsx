import React from 'react';

const BADGE_STYLES = {
  CREATED:          'bg-blue-100 text-blue-800',
  IN_TRANSIT:       'bg-yellow-100 text-yellow-800',
  CUSTOMS_HOLD:     'bg-orange-100 text-orange-800',
  CUSTOMS_CLEARED:  'bg-teal-100 text-teal-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED:        'bg-green-100 text-green-800',
  CONFIRMED:        'bg-emerald-100 text-emerald-800',
};

const LABELS = {
  CREATED: 'Created',
  IN_TRANSIT: 'In Transit',
  CUSTOMS_HOLD: 'Customs Hold',
  CUSTOMS_CLEARED: 'Customs Cleared',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CONFIRMED: 'Confirmed',
};

export default function StatusBadge({ status }) {
  const style = BADGE_STYLES[status] || 'bg-gray-100 text-gray-800';
  const label = LABELS[status] || status;

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
