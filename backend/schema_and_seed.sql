-- ====================================================================
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

-- SEED user_profiles
INSERT INTO user_profiles (id, email, full_name, role, department, company, site_id, is_approved, avatar_url, phone, is_active, created_at)
VALUES ('demo-user-001', 'arya-user@digitech.co.id', 'arya-user', 'User', 'Operations', 'Digitech', 'site-bib-02', TRUE, NULL, NULL, TRUE, '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
INSERT INTO user_profiles (id, email, full_name, role, department, company, site_id, is_approved, avatar_url, phone, is_active, created_at)
VALUES ('demo-admin-001', 'arya-admin@digitech.co.id', 'arya-admin', 'Admin', 'Inventory Control', 'Digitech', 'site-bib-02', TRUE, NULL, NULL, TRUE, '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
INSERT INTO user_profiles (id, email, full_name, role, department, company, site_id, is_approved, avatar_url, phone, is_active, created_at)
VALUES ('demo-sa-001', 'arya-superadmin@digitech.co.id', 'arya-superadmin', 'Superadmin', 'System Administration', 'Digitech', NULL, TRUE, NULL, NULL, TRUE, '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- SEED sites
INSERT INTO sites (id, name, code, lat, lng, radius, area_name, status, pic_id, created_at)
VALUES ('site-bib-02', 'Pit South Site BIB-02', 'BIB-02', -3.7389, 115.612, 200, 'Kec. Angsana, Kab. Tanah Bumbu', 'active', 'demo-user-001', '2026-09-22T02:39:26.086951+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sites (id, name, code, lat, lng, radius, area_name, status, pic_id, created_at)
VALUES ('site-bib-01', 'Pit North Workshop Site BIB-01', 'BIB-01', -3.725, 115.602, 200, 'Sebamban Pit North', 'active', 'demo-user-001', '2026-09-22T02:39:26.086951+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sites (id, name, code, lat, lng, radius, area_name, status, pic_id, created_at)
VALUES ('site-bib-port', 'Pelabuhan Khusus Sebamban Port', 'BIB-PORT', -3.695, 115.68, 300, 'Kec. Sungai Loban, Kalsel', 'active', 'demo-user-001', '2026-09-22T02:39:26.086951+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sites (id, name, code, lat, lng, radius, area_name, status, pic_id, created_at)
VALUES ('site-vgt-office', 'Office VGT', 'VGT-OFFICE', -3.74211, 115.58912, 200, 'Kantor Operasional VGT Pit 2', 'active', 'demo-user-001', '2026-09-22T23:49:11.796076+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sites (id, name, code, lat, lng, radius, area_name, status, pic_id, created_at)
VALUES ('site-bib-ws', 'Workshop Main BIB', 'BIB-WS', -3.731, 115.605, 350, 'Workshop Sentral Tambang BIB', 'active', 'demo-user-001', '2026-09-22T23:49:11.796076+00:00')
ON CONFLICT (id) DO NOTHING;

-- SEED warehouses
INSERT INTO warehouses (id, name, code, location, total_shelves, occupied_shelves, latitude, longitude, radius_meters, manager_id, created_at)
VALUES ('wh-01', 'Warehouse 1 (Main Pit Site BIB-02)', 'BIB-WH1', 'Kec. Angsana, Kab. Tanah Bumbu, Kalsel', 240, 134, -3.7389, 115.612, 200, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouses (id, name, code, location, total_shelves, occupied_shelves, latitude, longitude, radius_meters, manager_id, created_at)
VALUES ('wh-02', 'Warehouse 2 (Central Workshop)', 'BIB-WH2', 'Workshop Sentral Tambang BIB', 180, 95, -3.742, 115.618, 200, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouses (id, name, code, location, total_shelves, occupied_shelves, latitude, longitude, radius_meters, manager_id, created_at)
VALUES ('wh-03', 'Warehouse 3 (Sebamban Port Logistics)', 'BIB-WH3', 'Pelabuhan Khusus Batubara Sebamban', 200, 110, -3.695, 115.68, 300, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouses (id, name, code, location, total_shelves, occupied_shelves, latitude, longitude, radius_meters, manager_id, created_at)
VALUES ('wh-04', 'Warehouse 4 (Sub-Depot Angsana)', 'BIB-WH4', 'Depot Penunjang Pit Selatan', 120, 48, -3.75, 115.605, 200, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (id) DO NOTHING;

-- SEED inventory_items
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-A05', 'BIB-KOM-785-BELT', 'Fan V-Belt Komatsu HD785-7', 'Mechanical', 22, 8, 'SET', 'A5', 'wh-01', 'optimal', 850000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-A06', 'BIB-CAT-777D-TURBO', 'Turbocharger Cartridge CAT 3508', 'Mechanical', 3, 2, 'UNIT', 'A6', 'wh-01', 'optimal', 48500000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-A07', 'BIB-VOL-FH16-CLTCH', 'Clutch Plate Kit Volvo FH16 610HP', 'Mechanical', 6, 4, 'SET', 'A7', 'wh-01', 'optimal', 16200000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-A12', 'BIB-CUM-QSK60-INJ', 'Fuel Injector Cummins QSK60 High Pressure', 'Mechanical', 16, 6, 'PCS', 'A12', 'wh-01', 'optimal', 7400000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-B01', 'BIB-KOM-PC2000-HYD', 'Hydraulic Cylinder Seal Kit PC2000 Boom', 'Hydraulics', 18, 8, 'SET', 'B1', 'wh-01', 'optimal', 8900000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-B03', 'BIB-CAT-777D-PUMP', 'Main Hydraulic Pump Parker P31', 'Hydraulics', 2, 3, 'UNIT', 'B3', 'wh-01', 'critical', 65000000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-B06', 'BIB-AERO-HOSE-100', 'Hydraulic Hose SAE 100R15 1-1/2 Inch (50m)', 'Hydraulics', 8, 5, 'ROLL', 'B6', 'wh-01', 'optimal', 12800000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-B07', 'BIB-REX-VALVE-PVG', 'Proportional Valve Rexroth 4WRPEH', 'Hydraulics', 5, 2, 'UNIT', 'B7', 'wh-01', 'optimal', 28500000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-B08', 'BIB-HYD-O-RING-BOX', 'Universal Fluorocarbon O-Ring Kit 400pcs', 'Hydraulics', 24, 10, 'BOX', 'B8', 'wh-01', 'optimal', 1250000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-B09', 'BIB-KOM-STEER-CYL', 'Steering Cylinder Komatsu HD465-7R', 'Hydraulics', 4, 2, 'SET', 'B9', 'wh-01', 'optimal', 34000000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-B12', 'BIB-HYD-QUICK-COUP', 'Quick Release Coupler ISO 7241-A 1/2 Inch', 'Hydraulics', 45, 15, 'PCS', 'B12', 'wh-01', 'optimal', 380000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C01', 'BIB-LUB-SHL-T68', 'Shell Tellus S2 V 68 Hydraulic Oil', 'Lubricants', 6, 20, 'DRUM', 'C1', 'wh-01', 'critical', 4750000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C02', 'BIB-LUB-MOB-15W40', 'Mobil Delvac Modern 15W-40 Super Defense', 'Lubricants', 38, 15, 'DRUM', 'C2', 'wh-01', 'optimal', 5200000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C03', 'BIB-LUB-CAS-EP2', 'Castrol Spheerol EPL 2 Mining Grease', 'Lubricants', 14, 10, 'PAIL', 'C3', 'wh-01', 'optimal', 2100000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C05', 'BIB-CLT-AF-OAT', 'Extended Life Coolant Premix 50/50 Red', 'Lubricants', 50, 20, 'PAIL', 'C5', 'wh-01', 'optimal', 1150000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C06', 'BIB-LUB-TRANS-50', 'Cat TDTO SAE 50 Drivetrain Oil', 'Lubricants', 12, 10, 'DRUM', 'C6', 'wh-01', 'optimal', 5600000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C07', 'BIB-BRK-CLEANER', 'Industrial Brake & Parts Cleaner 500ml', 'Lubricants', 96, 30, 'CAN', 'C7', 'wh-01', 'optimal', 75000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C10', 'BIB-GEAR-85W140', 'Total Transmission Axle 85W-140', 'Lubricants', 15, 8, 'DRUM', 'C10', 'wh-01', 'optimal', 4900000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C11', 'BIB-DEF-UREA-IBC', 'AdBlue Aqueous Urea Solution 32.5%', 'Lubricants', 8, 4, 'IBC', 'C11', 'wh-01', 'optimal', 8200000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-C12', 'BIB-SPILL-KIT-240L', 'Oil Only Hazmat Spill Response Kit 240L', 'Lubricants', 5, 3, 'SET', 'C12', 'wh-01', 'optimal', 3600000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-D01', 'BIB-ELE-ALT-24V', 'Delco Remy 24V 150A Brushless Alternator', 'Electrical', 9, 5, 'PCS', 'D1', 'wh-01', 'optimal', 6100000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-D04', 'BIB-GET-CAT-TIP', 'Bucket Tooth Tip Heavy Duty 777D (9W8452)', 'Tools & GET', 65, 25, 'PCS', 'D4', 'wh-01', 'optimal', 920000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-D05', 'BIB-GET-PIN-RETAIN', 'Side Pin & Retainer Lock Kit 777D', 'Tools & GET', 120, 50, 'SET', 'D5', 'wh-01', 'optimal', 185000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-D06', 'BIB-BAT-12V-200AH', 'Yuasa Heavy Heavy Duty Battery 12V 200Ah', 'Electrical', 14, 8, 'UNIT', 'D6', 'wh-01', 'optimal', 3850000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-D07', 'BIB-LED-LIGHTBAR', 'Nordic Lights 100W Heavy Duty Mining Flood LED', 'Electrical', 28, 10, 'PCS', 'D7', 'wh-01', 'optimal', 4200000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-D10', 'BIB-HARNESS-ECM', 'CAT C27 ECM Engine Wiring Harness Assembly', 'Electrical', 3, 2, 'SET', 'D10', 'wh-01', 'optimal', 22400000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-D11', 'BIB-SENSOR-PRESS', 'Bosch Common Rail Fuel Pressure Sensor 2000 Bar', 'Electrical', 11, 5, 'PCS', 'D11', 'wh-01', 'optimal', 2650000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;
INSERT INTO inventory_items (id, sku, name, category, current_stock, min_threshold, unit, rack, warehouse_id, status, price, image_url, created_by, created_at)
VALUES ('itm-A02', 'BIB-CAT-777D-FLTR', 'Cat 777D Engine Oil Filter (P550388)', 'Mechanical', 2, 10, 'PCS', 'A2', 'wh-01', 'critical', 1450000, NULL, 'demo-admin-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;

-- SEED inventory_ledger
INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES ('d9dd4168-5b19-42ac-a49d-4247072bcce0', 'Cat 777D Engine Oil Filter', 'BIB-CAT-777D-FLTR', 'R-A01', 12, 'MOS_IN', '001/VGT/MOS/MNTOA/BIBOA/VIII/2026', 'Penerimaan barang vendor via DO #DO-BIB-8821', 'arya-admin', 'demo-user-001', '2026-09-22T23:49:20.046561+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES ('dd93e970-a0bd-441b-bcdd-c67cd9f6347b', 'Cat 777D Engine Oil Filter', 'BIB-CAT-777D-FLTR', 'R-A01', -8, 'MR_OUT', 'MR-2026-09-001', 'Pengambilan material penggantian oli unit DT-04', 'arya-user', 'demo-user-001', '2026-09-22T23:49:20.046561+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES ('b1834e63-0f0a-4972-820f-6652a2fd1150', 'Komatsu PC2000 Hydraulic Seal Kit', 'BIB-KOM-PC2000-HYD', 'R-A02', 20, 'MOS_IN', '002/VGT/MOS/MNTOA/BIBOA/VIII/2026', 'Penerimaan sparepart hidrolik', 'arya-superadmin', 'demo-user-001', '2026-09-22T23:49:20.046561+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES ('26cec0cd-a73a-4531-8b45-c35ffdc2ed2e', 'Hydraulic Pump Komatsu PC2000', 'BIB-KOM-PC2000-PMP', 'R-A03', 2, 'MOS_IN', '452/VGT/MOS/MNTOA/BIBOA/IX/2026', 'Auto-ledger penambahan stok MOS completed (452/VGT/MOS/MNTOA/BIBOA/IX/2026)', 'arya-superadmin', 'demo-user-001', '2026-09-23T06:53:52.328+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES ('620ed48f-a16e-4c8e-9be7-129c67eb7060', 'Brake Actuator Seal Kit HD785-7', 'BIB-KOM-785-SEAL', 'R-A02', 18, 'OPNAME_ADJUSTMENT', 'SO-2026-1937', 'Penyesuaian stok opname: 2 unit rusak di rak', 'arya-superadmin', 'demo-user-001', '2026-09-23T06:54:12.366+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES ('797a47b4-3214-4146-8a77-b1ca1f4f6799', 'Heavy Duty Alternator 24V 150A', 'DIG-ALT-24V-HD', 'R-D01', 4, 'MOS_IN', '470/VGT/MOS/MNTOA/BIBOA/IX/2026', 'Auto-ledger penambahan stok MOS completed (470/VGT/MOS/MNTOA/BIBOA/IX/2026)', 'arya-superadmin', 'demo-user-001', '2026-09-23T11:57:15.948+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES ('7d4b3836-fdf4-4c88-8407-2e79ea516511', 'Heavy Duty Alternator 24V 150A', 'DIG-ALT-24V-HD', 'R-D01', 3, 'OPNAME_ADJUSTMENT', 'SO-2026-6631', 'Penyesuaian stok opname: 1 unit terpakai darurat untuk perbaikan genset', 'arya-superadmin', 'demo-user-001', '2026-09-23T11:57:17.07+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_ledger (id, item_name, part_number, bin_location, qty_change, transaction_type, reference_doc_id, notes, performed_by, performed_by_id, created_at)
VALUES ('8d832745-cf28-467b-8e2c-6b609c577c86', 'Cat 777D Engine Oil Filter', 'BIB-CAT-777D-FLTR', 'R-A01', -2, 'MR_OUT', 'MR-2026-8467', 'Penggantian oli berkala', 'arya-user', 'demo-user-001', '2026-09-27T07:19:28.467+00:00')
ON CONFLICT (id) DO NOTHING;

-- SEED mos_documents
INSERT INTO mos_documents (id, doc_number, mos_number, title, vendor_name, po_do_number, package_condition, photo_attachment_url, site_location, site_id, pic_receiver_name, requester_name, requester_email, department, purpose, received_date, status, items, signatures, slot1_signature, slot1_signer, slot1_signed_at, slot1_signer_id, slot2_signature, slot2_signer, slot2_signed_at, slot2_signer_id, slot3_signature, slot3_signer, slot3_signer_id, created_by, created_at)
VALUES ('mos-001', 'MOS-2026-BIB-001', 'MOS-2026-BIB-001', NULL, 'PT Trakindo Utama', NULL, NULL, NULL, NULL, 'site-bib-02', NULL, 'arya-user', 'arya-user@digitech.co.id', 'Hauling Maintenance', 'Penggantian Filter Oli & Seal Kit Dump Truck 777D Unit DT-402', NULL, 'approved', '[{"qty":2,"sku":"BIB-CAT-777D-FLTR","name":"Cat 777D Engine Oil Filter"},{"qty":1,"sku":"BIB-HYD-O-RING-BOX","name":"Universal Fluorocarbon O-Ring Kit"}]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, 'demo-user-001', NULL, NULL, NULL, 'demo-admin-001', NULL, NULL, 'demo-sa-001', 'demo-user-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (doc_number) DO NOTHING;
INSERT INTO mos_documents (id, doc_number, mos_number, title, vendor_name, po_do_number, package_condition, photo_attachment_url, site_location, site_id, pic_receiver_name, requester_name, requester_email, department, purpose, received_date, status, items, signatures, slot1_signature, slot1_signer, slot1_signed_at, slot1_signer_id, slot2_signature, slot2_signer, slot2_signed_at, slot2_signer_id, slot3_signature, slot3_signer, slot3_signer_id, created_by, created_at)
VALUES ('mos-002', 'MOS-2026-BIB-002', 'MOS-2026-BIB-002', NULL, 'PT Trakindo Utama', NULL, NULL, NULL, NULL, 'site-bib-02', NULL, 'arya-user', 'arya-user@digitech.co.id', 'Excavation Pit North', 'Pergantian Tooth Bucket Excavator PC2000 EX-108', NULL, 'pending_vgt', '[{"qty":6,"sku":"BIB-GET-CAT-TIP","name":"Bucket Tooth Tip Heavy Duty 777D"}]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, 'demo-user-001', NULL, NULL, NULL, 'demo-admin-001', NULL, NULL, 'demo-sa-001', 'demo-user-001', '2026-09-22T02:38:49.957792+00:00')
ON CONFLICT (doc_number) DO NOTHING;
INSERT INTO mos_documents (id, doc_number, mos_number, title, vendor_name, po_do_number, package_condition, photo_attachment_url, site_location, site_id, pic_receiver_name, requester_name, requester_email, department, purpose, received_date, status, items, signatures, slot1_signature, slot1_signer, slot1_signed_at, slot1_signer_id, slot2_signature, slot2_signer, slot2_signed_at, slot2_signer_id, slot3_signature, slot3_signer, slot3_signer_id, created_by, created_at)
VALUES ('mos-1790146363372', '372/VGT/MOS/MNTOA/BIBOA/IX/2026', '372/VGT/MOS/MNTOA/BIBOA/IX/2026', 'Penerimaan Material Brake Actuator Seal Kit HD785-7 (372/VGT/MOS/MNTOA/BIBOA/IX/2026)', 'PT Trakindo Utama', 'PO-2026-TEST-777 / DO-BIB-9901', 'Baik', NULL, 'Pit South Site BIB-02', 'site-bib-02', 'arya-user', 'arya-user', 'arya-user@digitech.co.id', 'Operasional Lapangan', 'Penerimaan Material Brake Actuator Seal Kit HD785-7 (372/VGT/MOS/MNTOA/BIBOA/IX/2026)', '2026-09-23', 'completed', '[{"id":"item-1","unit":"SET","notes":"Kemasan original Komatsu","qty_do":5,"warranty":"Standar Vendor","item_name":"Brake Actuator Seal Kit HD785-7","part_number":"BIB-KOM-785-SEAL","qty_received":5,"serial_number":"SN-SEAL-88219","item_condition":"Baru","assigned_bin_location":"R-A02"}]'::jsonb, '{"slot1":{"hash":"SHA256:a8bcb06ae8d57f4080ca2b71a0bcc7e1a5020955214cd01f68a91118ff3cae80","role":"User","signed":true,"slot_type":"creator","timestamp":"2026-09-23T06:52:43.372Z","signer_name":"Doni Pratama","signer_title":"Teknisi VGT Lapangan","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},"slot2":{"hash":"SHA256:96e7bdd268d787441d38d2ad151231fea10e0758be8bb360ec63302805ed0379","role":"Admin","notes":"Pemeriksaan fisik sesuai standar gudang.","signed":true,"slot_type":"reviewer","timestamp":"2026-09-23T06:52:43.775Z","signer_name":"Zainal Fahriandy","signer_title":"Supervisor Logistik VGT","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},"slot3":{"hash":"SHA256:28b9aa904130a51bd12552f1d674befbb4c7be37c46db995d9460c97734afdf0","role":"Superadmin","notes":"Disetujui untuk penambahan inventaris resmi.","signed":true,"slot_type":"acknowledgement","timestamp":"2026-09-23T06:52:44.095Z","signer_name":"Harris Maulana","signer_title":"Superadmin Digitech / BIB","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}}'::jsonb, NULL, NULL, NULL, 'demo-user-001', NULL, NULL, NULL, 'demo-admin-001', NULL, NULL, 'demo-sa-001', 'demo-user-001', '2026-09-23T06:52:43.372+00:00')
ON CONFLICT (doc_number) DO NOTHING;
INSERT INTO mos_documents (id, doc_number, mos_number, title, vendor_name, po_do_number, package_condition, photo_attachment_url, site_location, site_id, pic_receiver_name, requester_name, requester_email, department, purpose, received_date, status, items, signatures, slot1_signature, slot1_signer, slot1_signed_at, slot1_signer_id, slot2_signature, slot2_signer, slot2_signed_at, slot2_signer_id, slot3_signature, slot3_signer, slot3_signer_id, created_by, created_at)
VALUES ('mos-1790146431452', '452/VGT/MOS/MNTOA/BIBOA/IX/2026', '452/VGT/MOS/MNTOA/BIBOA/IX/2026', 'Penerimaan Material Hydraulic Pump Komatsu PC2000 (452/VGT/MOS/MNTOA/BIBOA/IX/2026)', 'PT Trakindo Utama', 'PO-2026-TEST-888 / DO-BIB-9902', 'Baik', NULL, 'Pit South Site BIB-02', 'site-bib-02', 'arya-user', 'arya-user', 'arya-user@digitech.co.id', 'Operasional Lapangan', 'Penerimaan Material Hydraulic Pump Komatsu PC2000 (452/VGT/MOS/MNTOA/BIBOA/IX/2026)', '2026-09-23', 'completed', '[{"id":"item-1","unit":"UNIT","notes":"Segel resmi distributor utuh","qty_do":2,"warranty":"Standar Vendor","item_name":"Hydraulic Pump Komatsu PC2000","part_number":"BIB-KOM-PC2000-PMP","qty_received":2,"serial_number":"SN-PMP-55410","item_condition":"Baru","assigned_bin_location":"R-A03"}]'::jsonb, '{"slot1":{"hash":"SHA256:02e2eaf01b5d4474778de1f225a56ebd6dba78ad814540c3ec4c22534d106531","role":"User","signed":true,"slot_type":"creator","timestamp":"2026-09-23T06:53:51.452Z","signer_name":"Doni Pratama","signer_title":"Teknisi VGT Lapangan","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},"slot2":{"hash":"SHA256:cc3b1a1e7f890fc8b9e33792534a2f67713fa7124cff6d7416fa0df4b0e2090e","role":"Admin","notes":"Pemeriksaan fisik sesuai standar gudang.","signed":true,"slot_type":"reviewer","timestamp":"2026-09-23T06:53:51.926Z","signer_name":"Zainal Fahriandy","signer_title":"Supervisor Logistik VGT","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},"slot3":{"hash":"SHA256:a2d35ec79092b13d1fa58788180dbf3a02b591bf919ffde316c63a03628532d0","role":"Superadmin","notes":"Disetujui untuk penambahan inventaris resmi.","signed":true,"slot_type":"acknowledgement","timestamp":"2026-09-23T06:53:52.328Z","signer_name":"Harris Maulana","signer_title":"Superadmin Digitech / BIB","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}}'::jsonb, NULL, NULL, NULL, 'demo-user-001', NULL, NULL, NULL, 'demo-admin-001', NULL, NULL, 'demo-sa-001', 'demo-user-001', '2026-09-23T06:53:51.452+00:00')
ON CONFLICT (doc_number) DO NOTHING;
INSERT INTO mos_documents (id, doc_number, mos_number, title, vendor_name, po_do_number, package_condition, photo_attachment_url, site_location, site_id, pic_receiver_name, requester_name, requester_email, department, purpose, received_date, status, items, signatures, slot1_signature, slot1_signer, slot1_signed_at, slot1_signer_id, slot2_signature, slot2_signer, slot2_signed_at, slot2_signer_id, slot3_signature, slot3_signer, slot3_signer_id, created_by, created_at)
VALUES ('mos-1790164635470', '470/VGT/MOS/MNTOA/BIBOA/IX/2026', '470/VGT/MOS/MNTOA/BIBOA/IX/2026', 'Penerimaan Material Heavy Duty Alternator 24V 150A (470/VGT/MOS/MNTOA/BIBOA/IX/2026)', 'PT Trakindo Utama', 'PO-2026-DIG-991 / DO-DIG-991', 'Baik', NULL, 'Pit South Site BIB-02', 'site-bib-02', 'arya-user', 'arya-user', 'arya-user@digitech.co.id', 'Operasional Lapangan', 'Penerimaan Material Heavy Duty Alternator 24V 150A (470/VGT/MOS/MNTOA/BIBOA/IX/2026)', '2026-09-23', 'completed', '[{"id":"item-1","unit":"UNIT","notes":"Unit alternator original","qty_do":4,"warranty":"Standar Vendor","item_name":"Heavy Duty Alternator 24V 150A","part_number":"DIG-ALT-24V-HD","qty_received":4,"serial_number":"SN-ALT-77192","item_condition":"Baru","assigned_bin_location":"R-D01"}]'::jsonb, '{"slot1":{"hash":"SHA256:6bbe940caa4aa9cf7ab7d2b438de358b50220c46b45d2634124a6b21cc10742f","role":"User","signed":true,"slot_type":"creator","timestamp":"2026-09-23T11:57:15.470Z","signer_name":"arya-user","signer_title":"Teknisi VGT Lapangan","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},"slot2":{"hash":"SHA256:2a83a07a52e93f00068ab1469968aa4af5983f6c25a2dbbfeac445aaf258bfd8","role":"Admin","notes":"Pemeriksaan fisik sesuai standar gudang Digitech IMS.","signed":true,"slot_type":"reviewer","timestamp":"2026-09-23T11:57:15.757Z","signer_name":"arya-admin","signer_title":"Supervisor Logistik VGT","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},"slot3":{"hash":"SHA256:3726381172feaad04ebd1049dfcc3d79d4dc66dba32218e15f059e78a4cd14d8","role":"Superadmin","notes":"Disahkan oleh Superadmin Digitech. Stok masuk ke rak.","signed":true,"slot_type":"acknowledgement","timestamp":"2026-09-23T11:57:15.948Z","signer_name":"arya-superadmin","signer_title":"Superadmin Digitech / BIB","signature_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}}'::jsonb, NULL, NULL, NULL, 'demo-user-001', NULL, NULL, NULL, 'demo-admin-001', NULL, NULL, 'demo-sa-001', 'demo-user-001', '2026-09-23T11:57:15.471+00:00')
ON CONFLICT (doc_number) DO NOTHING;

-- SEED tool_loans
INSERT INTO tool_loans (id, tool_name, serial_number, borrower_name, borrower_email, borrower_user_id, loan_date, expected_return_date, actual_return_date, status, condition, notes, approved_by_id, created_at)
VALUES ('749b3cf6-d5e3-4644-a50c-81a510d625d1', 'Fluke 87V Industrial Multimeter', 'SN-FLK-88192', 'Harris Maulana', 'harris@digitech.co.id', 'demo-user-001', '2026-09-23', '2026-09-30', '2026-09-23', 'returned', 'Baik (Fungsi Normal)', 'Pekerjaan selesai, multimeter dikembalikan dalam kondisi prima.', 'demo-admin-001', '2026-09-23T06:53:59.99+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tool_loans (id, tool_name, serial_number, borrower_name, borrower_email, borrower_user_id, loan_date, expected_return_date, actual_return_date, status, condition, notes, approved_by_id, created_at)
VALUES ('fdb4f6c9-8dbc-44dd-a5d9-86f42a9da267', 'Digital Torque Wrench 1/2" Heavy Duty', 'TW-2026-089', 'arya-user', 'arya-user@digitech.co.id', 'demo-user-001', '2026-09-20', '2026-09-25', NULL, 'borrowed', 'Baik', 'Pekerjaan overhaul engine Cat 777D', 'demo-admin-001', '2026-09-22T23:49:16.476099+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tool_loans (id, tool_name, serial_number, borrower_name, borrower_email, borrower_user_id, loan_date, expected_return_date, actual_return_date, status, condition, notes, approved_by_id, created_at)
VALUES ('76edb421-ec0e-4f41-9015-73bf27b0d28b', 'Fluke 87V Industrial Multimeter', 'FLUKE-87V-4421', 'arya-user', 'arya-user@digitech.co.id', 'demo-user-001', '2026-09-12', '2026-09-20', NULL, 'overdue', 'Baik', 'Perbaikan panel sensor Pit North (Overdue 2 hari)', 'demo-admin-001', '2026-09-22T23:49:16.476099+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tool_loans (id, tool_name, serial_number, borrower_name, borrower_email, borrower_user_id, loan_date, expected_return_date, actual_return_date, status, condition, notes, approved_by_id, created_at)
VALUES ('98bc3f6c-ea45-446c-99f4-d66a4ab0514d', 'Hydraulic Pressure Test Kit 600 Bar', 'HYD-TST-600B', 'arya-admin', 'arya-admin@digitech.co.id', 'demo-user-001', '2026-09-17', '2026-09-21', NULL, 'returned', 'Baik', 'Pengecekan valve manifold pompa hidrolik', 'demo-admin-001', '2026-09-22T23:49:16.476099+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tool_loans (id, tool_name, serial_number, borrower_name, borrower_email, borrower_user_id, loan_date, expected_return_date, actual_return_date, status, condition, notes, approved_by_id, created_at)
VALUES ('e4648457-2e0c-4058-8ab8-56c4bc8469c0', 'Thermal Imaging Camera FLIR E8-XT', 'DIG-FLIR-0912', 'arya-admin', 'arya-admin@digitech.co.id', 'demo-user-001', '2026-09-23', '2026-09-30', '2026-09-23', 'returned', 'Baik (Fungsi Normal)', 'Pengembalian tepat waktu', 'demo-admin-001', '2026-09-23T11:57:16.351+00:00')
ON CONFLICT (id) DO NOTHING;

-- SEED stock_opname_items
INSERT INTO stock_opname_items (id, opname_id, item_name, sku, rack, system_qty, physical_qty, variance, variance_reason, audited_by_id, created_at)
VALUES ('b3bef89f-eba2-425b-a2ee-87fe5246b425', '9ff5ebb6-ff51-4acc-8f8e-7f602e6e675a', 'Cat 777D Engine Oil Filter', 'BIB-CAT-777D-FLTR', 'R-A01', 4, 3, -1, 'Kemungkinan belum terpotong pada tiket MR perbaikan darurat', 'demo-admin-001', '2026-09-22T23:49:25.89051+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_opname_items (id, opname_id, item_name, sku, rack, system_qty, physical_qty, variance, variance_reason, audited_by_id, created_at)
VALUES ('32b7a5f0-79ee-4709-b853-96d16d5821e2', '9ff5ebb6-ff51-4acc-8f8e-7f602e6e675a', 'Komatsu PC2000 Hydraulic Seal Kit', 'BIB-KOM-PC2000-HYD', 'R-A02', 18, 18, 0, 'Sesuai fisik', 'demo-admin-001', '2026-09-22T23:49:25.89051+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_opname_items (id, opname_id, item_name, sku, rack, system_qty, physical_qty, variance, variance_reason, audited_by_id, created_at)
VALUES ('158b6df5-7ef3-4378-baaa-bc22130f4aeb', '9ff5ebb6-ff51-4acc-8f8e-7f602e6e675a', 'Volvo FMX 440 Brake Lining Assm', 'BIB-VOL-FMX-BRK', 'R-B01', 32, 34, 2, 'Kelebihan fisik sisa retur proyek pembongkaran', 'demo-admin-001', '2026-09-22T23:49:25.89051+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_opname_items (id, opname_id, item_name, sku, rack, system_qty, physical_qty, variance, variance_reason, audited_by_id, created_at)
VALUES ('bef7f66e-b39c-4ac5-b625-d3156adbd3de', '4f87a42b-1581-4ea5-9f3c-b398cf1e0bfd', 'Brake Actuator Seal Kit HD785-7', 'BIB-KOM-785-SEAL', 'R-A02', 0, 18, 18, '2 unit rusak di rak', 'demo-admin-001', '2026-09-23T06:54:12.957817+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_opname_items (id, opname_id, item_name, sku, rack, system_qty, physical_qty, variance, variance_reason, audited_by_id, created_at)
VALUES ('35bf8838-bdec-489d-a7a0-fec6f67ed019', 'ec202ffb-f80f-41cb-a030-2c91d0aacbde', 'Heavy Duty Alternator 24V 150A', 'DIG-ALT-24V-HD', 'R-D01', 0, 3, 3, '1 unit terpakai darurat untuk perbaikan genset', 'demo-admin-001', '2026-09-23T11:57:17.454129+00:00')
ON CONFLICT (id) DO NOTHING;
