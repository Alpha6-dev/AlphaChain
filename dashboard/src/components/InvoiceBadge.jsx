import React from 'react';

const SOURCE_COLORS = {
  email: 'bg-blue-100 text-blue-800',
  whatsapp: 'bg-green-100 text-green-800',
  unknown: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS = {
  received: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  processed: 'bg-emerald-100 text-emerald-800',
  error: 'bg-red-100 text-red-800',
};

export function SourceBadge({ source }) {
  const colors = SOURCE_COLORS[source] || SOURCE_COLORS.unknown;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors}`}>
      {source}
    </span>
  );
}

export function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.received;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors}`}>
      {status}
    </span>
  );
}
