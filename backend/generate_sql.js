import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('supabase_dump.json', 'utf8'));

let sql = `-- ====================================================================
-- DIGITECH IMS - COMPREHENSIVE LOCAL POSTGRESQL SCHEMA WITH FULL RELATIONS
-- Central Entity: user_profiles has foreign keys to ALL tables
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    department VARCHAR(100),
    company VARCHAR(100) DEFAULT 'Digitech',
    site_id VARCHAR(100),
    is_approved BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    phone VARCHAR(50),
    telegram_chat_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SITES
CREATE TABLE IF NOT EXISTS sites (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    radius INTEGER DEFAULT 500,
    area_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    pic_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WAREHOUSES
CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    total_shelves INTEGER DEFAULT 200,
    occupied_shelves INTEGER DEFAULT 0,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    radius_meters INTEGER DEFAULT 300,
    manager_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(100) PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    current_stock NUMERIC(12, 2) DEFAULT 0,
    min_threshold NUMERIC(12, 2) DEFAULT 10,
    unit VARCHAR(50) DEFAULT 'PCS',
    rack VARCHAR(100),
    warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'optimal',
    price NUMERIC(15, 2) DEFAULT 0,
    image_url TEXT,
    created_by VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVENTORY LEDGER
CREATE TABLE IF NOT EXISTS inventory_ledger (
    id VARCHAR(100) PRIMARY KEY,
    item_id VARCHAR(100) REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    bin_location VARCHAR(100),
    qty_change NUMERIC(12, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_doc_id VARCHAR(255),
    notes TEXT,
    performed_by VARCHAR(255),
    performed_by_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MOS DOCUMENTS
CREATE TABLE IF NOT EXISTS mos_documents (
    id VARCHAR(100) PRIMARY KEY,
    doc_number VARCHAR(255) UNIQUE NOT NULL,
    mos_number VARCHAR(255),
    title VARCHAR(255),
    vendor_name VARCHAR(255),
    po_do_number VARCHAR(255),
    package_condition VARCHAR(100) DEFAULT 'Baik',
    photo_attachment_url TEXT,
    site_location VARCHAR(255),
    site_id VARCHAR(100) REFERENCES sites(id) ON DELETE SET NULL,
    pic_receiver_name VARCHAR(255),
    requester_name VARCHAR(255),
    requester_email VARCHAR(255),
    department VARCHAR(100),
    purpose TEXT,
    received_date DATE,
    status VARCHAR(50) DEFAULT 'draft',
    items JSONB DEFAULT '[]'::jsonb,
    signatures JSONB DEFAULT '{}'::jsonb,
    slot1_signature TEXT,
    slot1_signer VARCHAR(255),
    slot1_signed_at TIMESTAMPTZ,
    slot1_signer_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    slot2_signature TEXT,
    slot2_signer VARCHAR(255),
    slot2_signed_at TIMESTAMPTZ,
    slot2_signer_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    slot3_signature TEXT,
    slot3_signer VARCHAR(255),
    slot3_signed_at TIMESTAMPTZ,
    slot3_signer_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    rejection_notes TEXT,
    created_by VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TOOL LOANS
CREATE TABLE IF NOT EXISTS tool_loans (
    id VARCHAR(100) PRIMARY KEY,
    tool_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100),
    borrower_name VARCHAR(255) NOT NULL,
    borrower_email VARCHAR(255),
    borrower_user_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    loan_date DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    actual_return_date DATE,
    status VARCHAR(50) DEFAULT 'borrowed',
    condition VARCHAR(100) DEFAULT 'Baik',
    notes TEXT,
    approved_by_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STOCK OPNAME SESSIONS & ITEMS
CREATE TABLE IF NOT EXISTS stock_opname_sessions (
    id VARCHAR(100) PRIMARY KEY,
    opname_number VARCHAR(100) UNIQUE NOT NULL,
    zone VARCHAR(50) NOT NULL,
    warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    auditor_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    auditor_name VARCHAR(255),
    approved_by_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_opname_items (
    id VARCHAR(100) PRIMARY KEY,
    opname_id VARCHAR(100),
    item_id VARCHAR(100) REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    rack VARCHAR(100),
    system_qty NUMERIC(12, 2) DEFAULT 0,
    physical_qty NUMERIC(12, 2) DEFAULT 0,
    variance NUMERIC(12, 2) DEFAULT 0,
    variance_reason TEXT,
    audited_by_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MATERIAL REQUESTS
CREATE TABLE IF NOT EXISTS material_requests (
    id VARCHAR(100) PRIMARY KEY,
    mr_number VARCHAR(100) UNIQUE NOT NULL,
    site_location VARCHAR(255),
    department VARCHAR(100),
    purpose TEXT,
    requested_by_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    requested_by_name VARCHAR(255),
    approved_by_id VARCHAR(100) REFERENCES user_profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'approved',
    items JSONB DEFAULT '[]'::jsonb,
    signatures JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    const s = JSON.stringify(val).replace(/'/g, "''");
    return `'${s}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

// 1. Seed user_profiles
sql += `\n-- SEED user_profiles\n`;
for (const u of (dump.user_profiles || [])) {
  sql += `INSERT INTO user_profiles (id, email, full_name, role, department, company, site_id, is_approved, avatar_url, phone, is_active, created_at)
VALUES (${esc(u.id)}, ${esc(u.email)}, ${esc(u.full_name)}, ${esc(u.role)}, ${esc(u.department)}, ${esc(u.company)}, ${esc(u.site_id)}, ${esc(u.is_approved)}, ${esc(u.avatar_url)}, ${esc(u.phone)}, ${esc(u.is_active)}, ${esc(u.created_at)})
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;\n`;
}

// 2. Seed sites
sql += `\n-- SEED sites\n`;
for (const s of (dump.sites || [])) {
  sql += `INSERT INTO sites (id, name, code, lat, lng, radius, area_name, status, pic_id, created_at)
VALUES (${esc(s.id)}, ${esc(s.name)}, ${esc(s.code)}, ${esc(s.lat)}, ${esc(s.lng)}, ${esc(s.radius)}, ${esc(s.area_name)}, ${esc(s.status)}, 'demo-user-001', ${esc(s.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}

// 3. Seed warehouses
sql += `\n-- SEED warehouses\n`;
for (const w of (dump.warehouses || [])) {
  sql += `INSERT INTO warehouses (id, name, code, location, total_shelves, occupied_shelves, latitude, longitude, radius_meters, manager_id, created_at)
VALUES (${esc(w.id)}, ${esc(w.name)}, ${esc(w.code)}, ${esc(w.location)}, ${esc(w.total_shelves)}, ${esc(w.occupied_shelves)}, ${esc(w.latitude)}, ${esc(w.longitude)}, ${esc(w.radius_meters)}, 'demo-admin-001', ${esc(w.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}

// 4. Seed inventory_items
sql += `\n-- SEED inventory_items\n`;
for (const i of (dump.inventory_items || [])) {
  sql += `INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES (${esc(i.id)}, ${esc(i.sku)}, ${esc(i.name)}, ${esc(i.category)}, ${esc(i.current_stock)}, ${esc(i.min_threshold)}, ${esc(i.unit)}, ${esc(i.rack)}, ${esc(i.warehouse_id)}, ${esc(i.status)}, ${esc(i.price)}, ${esc(i.image_url)}, 'demo-admin-001', ${esc(i.created_at)})
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;\n`;
}

// 5. Seed inventory_ledger
sql += `\n-- SEED inventory_ledger\n`;
for (const l of (dump.inventory_ledger || [])) {
  sql += `INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES (${esc(l.id)}, ${esc(l.item_name)}, ${esc(l.part_number)}, ${esc(l.bin_location)}, ${esc(l.qty_change)}, ${esc(l.transaction_type)}, ${esc(l.reference_doc_id)}, ${esc(l.notes)}, ${esc(l.performed_by)}, 'demo-user-001', ${esc(l.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}

// 6. Seed mos_documents
sql += `\n-- SEED mos_documents\n`;
for (const m of (dump.mos_documents || [])) {
  sql += `INSERT INTO mos_documents (id, doc_number, mos_number, title, vendor_name, po_do_number, package_condition, photo_attachment_url, site_location, site_id, pic_receiver_name, requester_name, requester_email, department, purpose, received_date, status, items, signatures, slot1_signature, slot1_signer, slot1_signed_at, slot1_signer_id, slot2_signature, slot2_signer, slot2_signed_at, slot2_signer_id, slot3_signature, slot3_signer, slot3_signer_id, created_by, created_at)
VALUES (${esc(m.id)}, ${esc(m.doc_number || m.mos_number)}, ${esc(m.mos_number || m.doc_number)}, ${esc(m.title)}, ${esc(m.vendor_name || 'PT Trakindo Utama')}, ${esc(m.po_do_number)}, ${esc(m.package_condition)}, ${esc(m.photo_attachment_url)}, ${esc(m.site_location)}, ${esc(m.site_id)}, ${esc(m.pic_receiver_name)}, ${esc(m.requester_name)}, ${esc(m.requester_email)}, ${esc(m.department)}, ${esc(m.purpose)}, ${esc(m.received_date)}, ${esc(m.status)}, ${esc(m.items)}, ${esc(m.signatures)}, ${esc(m.slot1_signature)}, ${esc(m.slot1_signer)}, ${esc(m.slot1_signed_at)}, 'demo-user-001', ${esc(m.slot2_signature)}, ${esc(m.slot2_signer)}, ${esc(m.slot2_signed_at)}, 'demo-admin-001', ${esc(m.slot3_signature)}, ${esc(m.slot3_signer)}, 'demo-sa-001', 'demo-user-001', ${esc(m.created_at)})
ON CONFLICT (doc_number) DO NOTHING;\n`;
}

// 7. Seed tool_loans
sql += `\n-- SEED tool_loans\n`;
for (const tl of (dump.tool_loans || [])) {
  sql += `INSERT INTO tool_loans (id, tool_name, serial_number, borrower_name, borrower_email, borrower_user_id, loan_date, expected_return_date, actual_return_date, status, condition, notes, approved_by_id, created_at)
VALUES (${esc(tl.id)}, ${esc(tl.tool_name)}, ${esc(tl.serial_number)}, ${esc(tl.borrower_name)}, ${esc(tl.borrower_email)}, 'demo-user-001', ${esc(tl.loan_date)}, ${esc(tl.expected_return_date)}, ${esc(tl.actual_return_date)}, ${esc(tl.status)}, ${esc(tl.condition)}, ${esc(tl.notes)}, 'demo-admin-001', ${esc(tl.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}

// 8. Seed stock_opname_items
sql += `\n-- SEED stock_opname_items\n`;
for (const so of (dump.stock_opname_items || [])) {
  sql += `INSERT INTO stock_opname_items (id, opname_id, item_name, sku, rack, system_qty, physical_qty, variance, variance_reason, audited_by_id, created_at)
VALUES (${esc(so.id)}, ${esc(so.opname_id)}, ${esc(so.item_name)}, ${esc(so.sku)}, ${esc(so.rack)}, ${esc(so.system_qty)}, ${esc(so.physical_qty)}, ${esc(so.variance)}, ${esc(so.variance_reason)}, 'demo-admin-001', ${esc(so.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}

fs.writeFileSync('schema_and_seed.sql', sql);
console.log('schema_and_seed.sql successfully written. Total size:', sql.length, 'bytes');
