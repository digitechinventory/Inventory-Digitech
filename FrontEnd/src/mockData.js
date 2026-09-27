// =========================================================================
// DIGITECH IMS — OPERATIONAL MOCK DATA
// Domain: Mining Operations x Digitech Systems
// =========================================================================

export const INITIAL_SITES = [
  {
    id: "site-bib-01",
    name: "BIB Port Batulicin Terminal",
    code: "BIB-PORT-01",
    lat: -3.456200,
    lng: 115.984500,
    radius: 200, // meters
    areaName: "Kawasan Pelabuhan Khusus Batulicin",
    activeStaffCount: 18,
    status: "active"
  },
  {
    id: "site-bib-02",
    name: "BIB Pit Sebamban Base Workshop",
    code: "BIB-PIT-02",
    lat: -3.621500,
    lng: 115.654200,
    radius: 200,
    areaName: "Area Tambang Pit Sebamban KM 24",
    activeStaffCount: 34,
    status: "active"
  },
  {
    id: "site-bib-03",
    name: "BIB Central Heavy Equipment Warehouse",
    code: "BIB-WH-03",
    lat: -3.512300,
    lng: 115.821100,
    radius: 250,
    areaName: "Logistics Hub Angsana",
    activeStaffCount: 22,
    status: "active"
  }
];

export const INITIAL_MOS_DOCUMENTS = [
  {
    id: "MOS-2026-09-001",
    title: "Pengadaan Spareparts Caterpillar 777D (Maintenance Overhaul)",
    vendor: "PT Trakindo Utama",
    poNumber: "PO-BIB-2026-0882",
    doNumber: "DO-TU-88912",
    siteId: "site-bib-02",
    siteName: "BIB Pit Sebamban Base Workshop",
    submittedBy: "arya-user",
    submittedRole: "Teknisi Lapangan",
    createdAt: "2026-09-20 08:30 WITA",
    status: "waiting_superadmin",
    totalItems: 3,
    items: [
      { id: "itm-1", name: "High Efficiency Lube Filter 1R-1808", sku: "BIB-CAT-777D-FLTR", qty: 24, unit: "PCS", condition: "Baik / Segel Utuh", rack: "R-02-B" },
      { id: "itm-2", name: "Fuel Water Separator Cat 777D 326-1644", sku: "BIB-CAT-777D-FWS", qty: 16, unit: "PCS", condition: "Baik / Segel Utuh", rack: "R-02-C" },
      { id: "itm-3", name: "O-Ring Seal Kit Hydraulic Cylinder", sku: "BIB-CAT-777D-ORKIT", qty: 10, unit: "SET", condition: "Baik / Standar OEM", rack: "R-04-A" }
    ],
    photoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    geotag: {
      lat: -3.621450,
      lng: 115.654180,
      accuracy: 4.2,
      distanceFromCenter: 18.4, // meters
      isWithinBounds: true
    },
    signatures: {
      slot1: {
        signerName: "arya-user",
        role: "Teknisi Lapangan",
        timestamp: "2026-09-20 08:45 WITA",
        signed: true,
        hash: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
      },
      slot2: {
        signerName: "arya-admin",
        role: "Supervisor Logistik",
        timestamp: "2026-09-20 14:10 WITA",
        signed: true,
        hash: "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      slot3: {
        signerName: "arya-superadmin",
        role: "Superadmin Digitech",
        timestamp: null,
        signed: false,
        hash: null
      }
    }
  },
  {
    id: "MOS-2026-09-002",
    title: "Pelumas & Hydraulic Oil Shell Tellus S2 V46 (Batch Pasokan Q3)",
    vendor: "PT Shell Indonesia Logistics",
    poNumber: "PO-BIB-2026-0879",
    doNumber: "DO-SH-4410",
    siteId: "site-bib-01",
    siteName: "BIB Port Batulicin Terminal",
    submittedBy: "arya-user",
    submittedRole: "Teknisi Lapangan",
    createdAt: "2026-09-18 14:15 WITA",
    status: "completed",
    totalItems: 2,
    items: [
      { id: "itm-4", name: "Shell Tellus S2 V 46 (Drum 209L)", sku: "BIB-OIL-TELLUS-46", qty: 20, unit: "DRUM", condition: "Kondisi Baik & Bersertifikat COA", rack: "WH-OIL-BAY-1" },
      { id: "itm-5", name: "Rotella T4 Heavy Duty Engine Oil 15W-40", sku: "BIB-OIL-ROT-15W40", qty: 15, unit: "DRUM", condition: "Baik", rack: "WH-OIL-BAY-2" }
    ],
    photoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
    geotag: {
      lat: -3.456220,
      lng: 115.984510,
      accuracy: 3.5,
      distanceFromCenter: 12.1,
      isWithinBounds: true
    },
    signatures: {
      slot1: { signerName: "arya-user", role: "Teknisi Lapangan", timestamp: "2026-09-18 14:30 WITA", signed: true, hash: "SHA256:4a2b8..." },
      slot2: { signerName: "arya-admin", role: "Supervisor Logistik", timestamp: "2026-09-18 16:00 WITA", signed: true, hash: "SHA256:9c1d3..." },
      slot3: { signerName: "arya-superadmin", role: "Superadmin Digitech", timestamp: "2026-09-18 17:15 WITA", signed: true, hash: "SHA256:bb72e..." }
    }
  },
  {
    id: "MOS-2026-09-003",
    title: "Perkakas Torsi Khusus & Sensor Telemetri Rig Pengeboran",
    vendor: "PT United Tractors Tbk",
    poNumber: "PO-BIB-2026-0895",
    doNumber: "DO-UT-1029",
    siteId: "site-bib-03",
    siteName: "BIB Central Heavy Equipment Warehouse",
    submittedBy: "arya-user",
    submittedRole: "Teknisi Lapangan",
    createdAt: "2026-09-21 11:00 WITA",
    status: "waiting_admin",
    totalItems: 2,
    items: [
      { id: "itm-6", name: "Snap-on Industrial Torque Wrench 1000 Nm", sku: "BIB-TL-TORQ-1000", qty: 2, unit: "UNIT", condition: "Baru / Kalibrasi Sertifikat Terlampir", rack: "TOOL-CAB-01" },
      { id: "itm-7", name: "Wireless Vibration & Temperature Sensor Node", sku: "BIB-SNSR-VIB-01", qty: 8, unit: "SET", condition: "Baik", rack: "ELEC-RACK-03" }
    ],
    photoUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
    geotag: {
      lat: -3.512320,
      lng: 115.821120,
      accuracy: 5.0,
      distanceFromCenter: 24.3,
      isWithinBounds: true
    },
    signatures: {
      slot1: { signerName: "arya-user", role: "Teknisi Lapangan", timestamp: "2026-09-21 11:20 WITA", signed: true, hash: "SHA256:88a1b..." },
      slot2: { signerName: null, role: "Supervisor Logistik", timestamp: null, signed: false, hash: null },
      slot3: { signerName: null, role: "Superadmin Digitech", timestamp: null, signed: false, hash: null }
    }
  },
  {
    id: "MOS-2026-09-004",
    title: "Kompresor Udara Portabel & Selang Tekanan Tinggi 5000 PSI",
    vendor: "PT Atlas Copco Indonesia",
    poNumber: "PO-BIB-2026-0901",
    doNumber: "DO-AC-7782",
    siteId: "site-bib-02",
    siteName: "BIB Pit Sebamban Base Workshop",
    submittedBy: "arya-user",
    submittedRole: "Teknisi Lapangan",
    createdAt: "2026-09-22 06:45 WITA",
    status: "draft",
    totalItems: 1,
    items: [
      { id: "itm-8", name: "Hydraulic Hose Spiral 1-inch 5000 PSI", sku: "BIB-HYD-HOSE-5K", qty: 40, unit: "MTR", condition: "Menunggu Pemeriksaan Fisik", rack: "R-05-A" }
    ],
    photoUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
    geotag: {
      lat: -3.621510,
      lng: 115.654210,
      accuracy: 3.8,
      distanceFromCenter: 8.5,
      isWithinBounds: true
    },
    signatures: {
      slot1: { signerName: null, role: "Teknisi Lapangan", timestamp: null, signed: false, hash: null },
      slot2: { signerName: null, role: "Supervisor Logistik VGT", timestamp: null, signed: false, hash: null },
      slot3: { signerName: null, role: "Superadmin Digitech", timestamp: null, signed: false, hash: null }
    }
  }
];

export const INVENTORY_LEDGER = [
  {
    sku: "BIB-CAT-777D-FLTR",
    name: "High Efficiency Lube Filter 1R-1808",
    category: "Filters & Lubrication",
    equipment: "Caterpillar 777D Haul Truck",
    rack: "R-02-B",
    currentStock: 48,
    minThreshold: 20,
    unit: "PCS",
    lastRestocked: "2026-09-14",
    unitCost: "IDR 680,000",
    status: "optimal"
  },
  {
    sku: "BIB-HYD-HOSE-5K",
    name: "Hydraulic Hose Spiral 1-inch 5000 PSI",
    category: "Hydraulics & Hoses",
    equipment: "Excavator PC2000 / Cat 390F",
    rack: "R-05-A",
    currentStock: 14,
    minThreshold: 25,
    unit: "MTR",
    lastRestocked: "2026-08-28",
    unitCost: "IDR 1,450,000",
    status: "critical_low" // Trigger alert!
  },
  {
    sku: "BIB-OIL-TELLUS-46",
    name: "Shell Tellus S2 V 46 (Drum 209L)",
    category: "Bulk Lubricants",
    equipment: "Universal Hydraulic Fleet",
    rack: "WH-OIL-BAY-1",
    currentStock: 28,
    minThreshold: 10,
    unit: "DRUM",
    lastRestocked: "2026-09-18",
    unitCost: "IDR 11,800,000",
    status: "optimal"
  },
  {
    sku: "BIB-KOM-BRK-PAD",
    name: "Komatsu HD785 Brake Lining Assembly",
    category: "Brake & Friction Parts",
    equipment: "Komatsu HD785-7 Dump Truck",
    rack: "R-03-C",
    currentStock: 6,
    minThreshold: 12,
    unit: "SET",
    lastRestocked: "2026-08-15",
    unitCost: "IDR 14,200,000",
    status: "critical_low" // Trigger alert!
  },
  {
    sku: "BIB-TL-TORQ-1000",
    name: "Snap-on Heavy Duty Torque Wrench 1000 Nm",
    category: "Tool Tracking / Asset",
    equipment: "Workshop Calibration Tool",
    rack: "TOOL-CAB-01",
    currentStock: 3,
    minThreshold: 2,
    unit: "UNIT",
    lastRestocked: "2026-07-10",
    unitCost: "IDR 32,500,000",
    status: "borrowed_active"
  },
  {
    sku: "BIB-TIRE-2700R49",
    name: "Bridgestone 27.00R49 Mining Haul Truck Tire",
    category: "Tires & Underbar",
    equipment: "Cat 777D / HD785",
    rack: "TIRE-YARD-BAY",
    currentStock: 16,
    minThreshold: 8,
    unit: "PCS",
    lastRestocked: "2026-09-02",
    unitCost: "IDR 85,000,000",
    status: "optimal"
  }
];

export const CURRENT_USERS = [
  {
    id: "usr-1",
    name: "arya-user",
    email: "arya-user@digitech.co.id",
    role: "User",
    badgeTitle: "Teknisi Lapangan",
    siteAssignment: "Pit Sebamban Base Workshop"
  },
  {
    id: "usr-2",
    name: "arya-admin",
    email: "arya-admin@digitech.co.id",
    role: "Admin",
    badgeTitle: "Supervisor Logistik",
    siteAssignment: "Site Operasional"
  },
  {
    id: "usr-3",
    name: "arya-superadmin",
    email: "arya-superadmin@digitech.co.id",
    role: "Superadmin",
    badgeTitle: "Lead Engineer / Digitech Systems",
    siteAssignment: "Akses Global Sistem"
  }
];

// Formula Haversine Spasial Presisi Tinggi (Meters)
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Hasil dalam meter
}

// =========================================================================
// 2D WAREHOUSE RACK MATRIX DATA (PRD Bab 4.2.2 & IronNest Layout)
// 4 Bays: A (Engine & Filtration), B (Hydraulics & Fluids), C (Electrical & Sensors), D (Heavy GET & Tools)
// 12 Shelves per Bay = 48 interactive shelves
// =========================================================================
export const WAREHOUSE_ZONES = [
  {
    id: "bay-a",
    code: "A",
    title: "A-Engine & Filters",
    category: "Filtration & Lubrication",
    capacityLabel: "8/12 Terpakai",
    usagePercent: 67,
    shelves: [
      { id: "A1", status: "optimal", sku: "BIB-CAT-777D-FLTR", itemName: "Lube Filter 1R-1808", qty: 24, maxQty: 30, temp: "26°C" },
      { id: "A2", status: "full", sku: "BIB-CAT-777D-FWS", itemName: "Fuel Water Separator Cat 777D", qty: 20, maxQty: 20, temp: "25°C" },
      { id: "A3", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 25, temp: "24°C" },
      { id: "A4", status: "optimal", sku: "BIB-CAT-AIR-PRIMARY", itemName: "Engine Air Cleaner Element", qty: 12, maxQty: 15, temp: "26°C" },
      { id: "A5", status: "full", sku: "BIB-CAT-TRANSM-FLTR", itemName: "Transmission Oil Filter", qty: 18, maxQty: 18, temp: "25°C" },
      { id: "A6", status: "optimal", sku: "BIB-CUMMINS-QSK60", itemName: "Cummins Lube Filter Fleetguard", qty: 15, maxQty: 20, temp: "26°C" },
      { id: "A7", status: "warning", sku: "BIB-CAT-BREATHER", itemName: "Crankcase Breather Element", qty: 2, maxQty: 15, temp: "25°C" },
      { id: "A8", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 25, temp: "24°C" },
      { id: "A9", status: "optimal", sku: "BIB-CAT-777D-HYDFLT", itemName: "Hydraulic Tank Filter 093-7521", qty: 14, maxQty: 20, temp: "26°C" },
      { id: "A10", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 25, temp: "24°C" },
      { id: "A11", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 25, temp: "24°C" },
      { id: "A12", status: "optimal", sku: "BIB-CAT-COOLANT-ADD", itemName: "SCA Coolant Conditioner", qty: 22, maxQty: 25, temp: "24°C" }
    ]
  },
  {
    id: "bay-b",
    code: "B",
    title: "B-Hydraulics & Seals",
    category: "Hydraulics & Hoses",
    capacityLabel: "9/12 Terpakai",
    usagePercent: 75,
    shelves: [
      { id: "B1", status: "optimal", sku: "BIB-CAT-777D-ORKIT", itemName: "O-Ring Seal Kit Hydraulic", qty: 10, maxQty: 15, temp: "23°C" },
      { id: "B2", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 20, temp: "24°C" },
      { id: "B3", status: "optimal", sku: "BIB-HYD-HOSE-2IN", itemName: "High Pressure Hydraulic Hose 2\"", qty: 8, maxQty: 10, temp: "24°C" },
      { id: "B4", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 20, temp: "24°C" },
      { id: "B5", status: "warning", sku: "BIB-CYL-ROD-SEAL", itemName: "Hoist Cylinder Rod Seal 160mm", qty: 3, maxQty: 12, temp: "23°C" },
      { id: "B6", status: "full", sku: "BIB-SH-TELLUS-V46", itemName: "Shell Tellus S2 V46 (Drum 209L)", qty: 12, maxQty: 12, temp: "27°C" },
      { id: "B7", status: "optimal", sku: "BIB-CAT-VALVE-RELIEF", itemName: "Main Hydraulic Relief Valve", qty: 5, maxQty: 6, temp: "25°C" },
      { id: "B8", status: "optimal", sku: "BIB-KOM-SEAL-PUMP", itemName: "Hydraulic Pump Seal Komatsu", qty: 7, maxQty: 10, temp: "24°C" },
      { id: "B9", status: "optimal", sku: "BIB-HYD-COUPLING-FLG", itemName: "Split Flange Code 62 Fitting", qty: 32, maxQty: 40, temp: "25°C" },
      { id: "B10", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 20, temp: "24°C" },
      { id: "B11", status: "full", sku: "BIB-CAT-ACCUMULATOR", itemName: "Brake Hydraulic Accumulator", qty: 4, maxQty: 4, temp: "24°C" },
      { id: "B12", status: "optimal", sku: "BIB-MOBIL-DTE-10", itemName: "Mobil DTE 10 Excel 46 Drum", qty: 8, maxQty: 10, temp: "27°C" }
    ]
  },
  {
    id: "bay-c",
    code: "C",
    title: "C-Electrical & Sensors",
    category: "Electrical & Instrumentation",
    capacityLabel: "7/12 Terpakai",
    usagePercent: 58,
    shelves: [
      { id: "C1", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 20, temp: "22°C" },
      { id: "C2", status: "optimal", sku: "BIB-CAT-ECM-777D", itemName: "Electronic Control Module (A4E4)", qty: 2, maxQty: 3, temp: "21°C" },
      { id: "C3", status: "optimal", sku: "BIB-PRESSURE-XDUCER", itemName: "Brake Oil Pressure Transducer", qty: 6, maxQty: 8, temp: "22°C" },
      { id: "C4", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 20, temp: "22°C" },
      { id: "C5", status: "optimal", sku: "BIB-ALT-24V-150A", itemName: "Heavy Duty Alternator 24V 150A", qty: 4, maxQty: 5, temp: "24°C" },
      { id: "C6", status: "full", sku: "BIB-STARTER-CAT-C32", itemName: "Electric Starter Motor Cat C32", qty: 3, maxQty: 3, temp: "24°C" },
      { id: "C7", status: "warning", sku: "BIB-HARNESS-CHASSIS", itemName: "Main Chassis Wiring Harness", qty: 1, maxQty: 4, temp: "22°C" },
      { id: "C8", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 20, temp: "22°C" },
      { id: "C9", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 20, temp: "22°C" },
      { id: "C10", status: "optimal", sku: "BIB-TEMP-SENSOR-ENG", itemName: "Coolant Temperature Sensor", qty: 11, maxQty: 15, temp: "22°C" },
      { id: "C11", status: "optimal", sku: "BIB-BATTERY-12V-200AH", itemName: "Mining Heavy Battery 200Ah", qty: 8, maxQty: 10, temp: "23°C" },
      { id: "C12", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 20, temp: "22°C" }
    ]
  },
  {
    id: "bay-d",
    code: "D",
    title: "D-GET & Heavy Tools",
    category: "Tool Tracking / Asset",
    capacityLabel: "8/12 Terpakai",
    usagePercent: 67,
    shelves: [
      { id: "D1", status: "optimal", sku: "BIB-TL-TORQ-1000", itemName: "Snap-on Torque Wrench 1000 Nm", qty: 3, maxQty: 4, temp: "24°C" },
      { id: "D2", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 10, temp: "25°C" },
      { id: "D3", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 10, temp: "25°C" },
      { id: "D4", status: "full", sku: "BIB-CAT-777D-BRK-DISC", itemName: "Rear Brake Friction Disc 777D", qty: 12, maxQty: 12, temp: "25°C" },
      { id: "D5", status: "optimal", sku: "BIB-GET-BUCKET-TOOTH", itemName: "Cat Heavy Excavator Bucket Tooth", qty: 28, maxQty: 30, temp: "26°C" },
      { id: "D6", status: "optimal", sku: "BIB-GET-ADAPTER-LIP", itemName: "Corner Adapter Lip Protector", qty: 8, maxQty: 10, temp: "26°C" },
      { id: "D7", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 10, temp: "25°C" },
      { id: "D8", status: "empty", sku: null, itemName: "Slot Kosong (Siap Alokasi)", qty: 0, maxQty: 10, temp: "25°C" },
      { id: "D9", status: "optimal", sku: "BIB-CUTTING-EDGE-16M", itemName: "Grader 16M Curved Cutting Edge", qty: 6, maxQty: 8, temp: "26°C" },
      { id: "D10", status: "optimal", sku: "BIB-TRACK-PIN-PULLER", itemName: "Hydraulic Track Pin Press Tool", qty: 2, maxQty: 2, temp: "24°C" },
      { id: "D11", status: "full", sku: "BIB-TIRE-2700R49", itemName: "Bridgestone 27.00R49 OTR Tire", qty: 16, maxQty: 16, temp: "30°C" },
      { id: "D12", status: "warning", sku: "BIB-PNEUMATIC-GUN-1IN", itemName: "Ingersoll Rand 1\" Impact Wrench", qty: 1, maxQty: 3, temp: "24°C" }
    ]
  }
];

export const SECTION_USAGE_STATS = {
  locationUsedPercent: 68,
  totalShelves: 240,
  emptyShelves: 76,
  fullShelves: 124,
  newlyAdded: 20,
  ordersReceived: 4236,
  ordersShipped: 2778,
  ordersReturned: 147,
  ordersCanceled: 537
};
