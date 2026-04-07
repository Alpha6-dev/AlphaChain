import React from 'react';

const STATUS_CONFIG = {
  CREATED:          { color: 'bg-blue-500',   label: 'Created' },
  IN_TRANSIT:       { color: 'bg-yellow-500', label: 'In Transit' },
  CUSTOMS_HOLD:     { color: 'bg-orange-500', label: 'Customs Hold' },
  CUSTOMS_CLEARED:  { color: 'bg-teal-500',   label: 'Customs Cleared' },
  OUT_FOR_DELIVERY: { color: 'bg-purple-500', label: 'Out for Delivery' },
  DELIVERED:        { color: 'bg-green-500',   label: 'Delivered' },
  CONFIRMED:        { color: 'bg-emerald-600', label: 'Confirmed' },
};

export default function StatusTimeline({ events }) {
  if (!events || events.length === 0) {
    return <p className="text-gray-400 text-sm">No events recorded.</p>;
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {events.map((event, idx) => {
          const config = STATUS_CONFIG[event.status] || { color: 'bg-gray-400', label: event.status };
          const isLatest = idx === events.length - 1;

          return (
            <div key={idx} className="relative flex items-start gap-4 pl-10">
              {/* Dot on the timeline */}
              <div
                className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${config.color} ${
                  isLatest ? 'ring-2 ring-offset-1 ring-alpha-500' : ''
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>

                {event.location && (
                  <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                )}
                {event.notes && (
                  <p className="text-sm text-gray-500 mt-0.5 italic">{event.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
