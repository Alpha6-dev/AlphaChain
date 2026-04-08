-- AlphaChain PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('supplier','transporter','customs','buyer','admin','port_operator','airline','warehouse')),
  org_msp VARCHAR(50) NOT NULL DEFAULT 'AlphaOrgMSP',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id SERIAL PRIMARY KEY,
  shipment_id VARCHAR(20) UNIQUE NOT NULL,
  origin VARCHAR(255),
  destination VARCHAR(255),
  goods_description TEXT,
  supplier_id VARCHAR(50),
  buyer_id VARCHAR(50),
  payment_amount DECIMAL(18,2),
  status VARCHAR(30),
  payment_released BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  raw_ledger JSONB
);

CREATE TABLE IF NOT EXISTS shipment_events (
  id SERIAL PRIMARY KEY,
  shipment_id VARCHAR(20) REFERENCES shipments(shipment_id) ON DELETE CASCADE,
  status VARCHAR(30),
  location VARCHAR(255),
  actor JSONB,
  notes TEXT,
  timestamp TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_supplier ON shipments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_buyer ON shipments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_events_shipment ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON shipment_events(timestamp);
