import QRCode from 'qrcode';
import api from '../api/client';

const STORAGE_KEY = 'digitech_printer_config';
const HISTORY_KEY = 'digitech_printer_history';

export const DEFAULT_PRINTER_CONFIG = {
  // Connection Mode: 'network' (Wireless Wi-Fi/LAN) | 'usb' (Direct USB) | 'bluetooth'
  mode: 'network',
  network: {
    ip: '192.168.1.200',
    port: 9100,
    protocol: 'TSPL', // 'TSPL' (TSC/Xprinter/Panda/Kassen) | 'ZPL' (Zebra) | 'ESC_POS'
    timeout: 3000
  },
  usb: {
    deviceName: 'Thermal Barcode Printer (USB/Kiosk)',
    vendorId: '',
    productId: '',
    autoKiosk: false // Silent print if supported
  },
  bluetooth: {
    deviceName: 'Mobile Bluetooth Thermal',
    deviceId: ''
  },
  label: {
    widthMm: 50,
    heightMm: 30,
    gapMm: 2,
    dpi: 203,
    density: 8,
    orientation: 'normal'
  },
  simulationMode: true // Enabled by default until real hardware is paired
};

/**
 * Get current printer configuration from localStorage
 */
export function getPrinterConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_PRINTER_CONFIG;
    return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_PRINTER_CONFIG;
  }
}

/**
 * Save printer configuration to localStorage
 */
export function savePrinterConfig(newConfig) {
  try {
    const current = getPrinterConfig();
    const merged = { ...current, ...newConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('digitech:printer-config-changed', { detail: merged }));
    return merged;
  } catch (err) {
    console.error('Failed to save printer config:', err);
    return newConfig;
  }
}

/**
 * Get print history logs
 */
export function getPrintHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Record a print job in history log
 */
export function logPrintJob(job) {
  try {
    const list = getPrintHistory();
    const record = {
      id: `print-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...job
    };
    const updated = [record, ...list].slice(0, 50); // Keep max 50 recent jobs
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return record;
  } catch {
    return null;
  }
}

/**
 * Generate high-definition QR Code Data URL
 */
export async function generateQRCodeDataUrl(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 256,
      margin: options.margin || 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}

/**
 * Generate standard TSPL command string (TSC, Xprinter, Kassen, Panda, Honeywell)
 */
export function generateTSPL(labelData, config = {}) {
  const widthMm = config.label?.widthMm || 50;
  const heightMm = config.label?.heightMm || 30;
  const gapMm = config.label?.gapMm || 2;
  const density = config.label?.density || 8;
  const speed = 4;

  const sku = labelData.sku || 'SKU-000';
  const name = (labelData.name || 'MATERIAL SITE').substring(0, 26).toUpperCase();
  const rack = labelData.rack || 'R-A01';
  const qty = labelData.qty || '1 PCS';
  const dateStr = labelData.date || new Date().toLocaleDateString('id-ID');
  const qrPayload = labelData.qrCode || `IMS:SKU:${sku}`;

  return [
    `SIZE ${widthMm} mm, ${heightMm} mm`,
    `GAP ${gapMm} mm, 0 mm`,
    `SPEED ${speed}`,
    `DENSITY ${density}`,
    `DIRECTION 1`,
    `REFERENCE 0,0`,
    `CLS`,
    // Header brand
    `TEXT 20,15,"2",0,1,1,"DIGITECH INVENTORY"`,
    `TEXT 20,38,"1",0,1,1,"${name}"`,
    // QR Code: X, Y, ECC, cell_width, mode, rotation, "content"
    `QRCODE 20,65,M,4,A,0,"${qrPayload}"`,
    // Right column metadata
    `TEXT 150,65,"2",0,1,1,"SKU: ${sku}"`,
    `TEXT 150,92,"1",0,1,1,"RAK : ${rack}"`,
    `TEXT 150,115,"1",0,1,1,"QTY : ${qty}"`,
    `TEXT 150,138,"1",0,1,1,"TGL : ${dateStr}"`,
    // Bottom border / separator line
    `BAR 20,165,360,2`,
    `TEXT 20,175,"1",0,1,1,"SISTEM MONITORING LOGISTIK & ASET"`,
    `PRINT 1,1`,
    ``
  ].join('\r\n');
}

/**
 * Generate standard ZPL command string (Zebra printers)
 */
export function generateZPL(labelData, config = {}) {
  const sku = labelData.sku || 'SKU-000';
  const name = (labelData.name || 'MATERIAL SITE').substring(0, 24).toUpperCase();
  const rack = labelData.rack || 'R-A01';
  const qty = labelData.qty || '1 PCS';
  const qrPayload = labelData.qrCode || `IMS:SKU:${sku}`;

  return [
    `^XA`,
    `^PW400`,
    `^LL240`,
    `^FO20,15^A0N,20,20^FD* DIGITECH INVENTORY *^FS`,
    `^FO20,40^A0N,18,18^FD${name}^FS`,
    `^FO20,70^BQN,2,4^FDMM,A${qrPayload}^FS`,
    `^FO150,70^A0N,20,20^FDSKU: ${sku}^FS`,
    `^FO150,95^A0N,18,18^FDRAK: ${rack}^FS`,
    `^FO150,120^A0N,18,18^FDQTY: ${qty}^FS`,
    `^XZ`,
    ``
  ].join('\r\n');
}

/**
 * Test connectivity to configured printer
 */
export async function testPrinterConnection(customConfig = null) {
  const config = customConfig || getPrinterConfig();

  // If in Simulation Mode, simulate realistic handshake
  if (config.simulationMode) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      success: true,
      mode: config.mode,
      isSimulation: true,
      latencyMs: 16,
      printerModel: `Digitech Virtual Thermal (${config.mode.toUpperCase()}) 50x30mm`,
      message: 'Mode Simulasi Siap. Sistem dapat mencetak label virtual preview dan sinkron dengan aplikasi.'
    };
  }

  // Real Network Wireless/Wi-Fi mode
  if (config.mode === 'network') {
    try {
      const res = await api.post('/printer/ping', {
        ip: config.network.ip,
        port: config.network.port,
        timeout: config.network.timeout || 3000
      });
      const data = res.data?.data || {};
      return {
        success: !!data.online,
        mode: 'network',
        isSimulation: false,
        latencyMs: data.latencyMs || 0,
        ip: config.network.ip,
        port: config.network.port,
        message: res.data?.message || (data.online ? 'Printer Online & Siap Digunakan' : 'Printer Offline')
      };
    } catch (err) {
      return {
        success: false,
        mode: 'network',
        isSimulation: false,
        error: err.message,
        message: `Gagal menghubungi server proxy printer: ${err.message}`
      };
    }
  }

  // Real USB mode
  if (config.mode === 'usb') {
    if (typeof navigator !== 'undefined' && navigator.usb) {
      try {
        const devices = await navigator.usb.getDevices();
        return {
          success: true,
          mode: 'usb',
          isSimulation: false,
          devicesFound: devices.length,
          message: devices.length > 0 
            ? `Terhubung ke ${devices.length} perangkat USB printer.` 
            : 'Driver USB Spooler Windows siap digunakan (Native Print Dialog).'
        };
      } catch {
        // Fall back to browser driver
      }
    }
    return {
      success: true,
      mode: 'usb',
      isSimulation: false,
      message: 'Driver Printer USB Windows / Browser Spooler Aktif.'
    };
  }

  // Real Bluetooth mode
  if (config.mode === 'bluetooth') {
    const hasBt = typeof navigator !== 'undefined' && !!navigator.bluetooth;
    return {
      success: hasBt,
      mode: 'bluetooth',
      isSimulation: false,
      message: hasBt ? 'Web Bluetooth API tersedia di browser ini.' : 'Browser tidak mendukung Web Bluetooth (disarankan Google Chrome Mobile).'
    };
  }

  return {
    success: false,
    message: 'Mode koneksi belum dikenali.'
  };
}

/**
 * Execute thermal sticker print
 */
export async function executePrintSticker(labelData, options = {}) {
  const config = getPrinterConfig();
  const labelCount = options.count || 1;

  // Log this print job
  logPrintJob({
    sku: labelData.sku,
    name: labelData.name,
    count: labelCount,
    mode: config.simulationMode ? `${config.mode} (simulasi)` : config.mode,
    timestamp: new Date().toISOString()
  });

  // If Simulation Mode: Return preview data immediately
  if (config.simulationMode) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      isSimulation: true,
      mode: config.mode,
      labelCount,
      message: `[Simulasi] Berhasil mencetak ${labelCount} lembar stiker untuk ${labelData.sku} (Mode Simulasi Aktif).`
    };
  }

  // Real Network Wireless Mode: Send RAW TSPL/ZPL payload to backend socket proxy
  if (config.mode === 'network') {
    const rawData = config.network.protocol === 'ZPL' 
      ? generateZPL(labelData, config)
      : generateTSPL(labelData, config);

    try {
      const res = await api.post('/printer/raw-print', {
        ip: config.network.ip,
        port: config.network.port,
        rawData,
        labelCount
      });
      return {
        success: true,
        isSimulation: false,
        mode: 'network',
        labelCount,
        message: res.data?.message || `Berhasil mengirim ${labelCount} tiket cetak ke printer ${config.network.ip}`
      };
    } catch (err) {
      throw new Error(`Gagal mencetak ke printer network: ${err.response?.data?.message || err.message}`);
    }
  }

  // Real USB / Browser Print Mode
  if (config.mode === 'usb') {
    // Trigger standard browser thermal label print dialog
    printViaBrowserDialog(labelData, config, labelCount);
    return {
      success: true,
      isSimulation: false,
      mode: 'usb',
      labelCount,
      message: `Dialog cetak browser dibuka untuk ${labelCount} lembar stiker.`
    };
  }

  return {
    success: true,
    message: 'Perintah cetak diproses.'
  };
}

/**
 * Open standard browser print for 50x30mm thermal label
 */
export function printViaBrowserDialog(labelData, config = {}, count = 1) {
  const widthMm = config.label?.widthMm || 50;
  const heightMm = config.label?.heightMm || 30;

  const printWindow = window.open('', '_blank', 'width=450,height=400');
  if (!printWindow) {
    alert('Pop-up terblokir. Izinkan pop-up browser untuk mencetak label.');
    return;
  }

  const qrSrc = labelData.qrCodeDataUrl || '';
  const sku = labelData.sku || 'SKU-001';
  const name = labelData.name || 'MATERIAL NAME';
  const rack = labelData.rack || 'R-A01';
  const qty = labelData.qty || '1 PCS';
  const dateStr = labelData.date || new Date().toLocaleDateString('id-ID');

  let labelHtml = '';
  for (let i = 0; i < count; i++) {
    labelHtml += `
      <div class="label-page">
        <div class="label-container">
          <div class="label-header">
            <span class="brand">DIGITECH INVENTORY</span>
            <span class="badge">ORIGINAL ASSET</span>
          </div>
          <div class="item-title">${name}</div>
          <div class="label-body">
            <div class="qr-col">
              <img src="${qrSrc}" alt="QR" class="qr-img" />
            </div>
            <div class="meta-col">
              <div class="meta-row"><strong>SKU:</strong> ${sku}</div>
              <div class="meta-row"><strong>RAK:</strong> ${rack}</div>
              <div class="meta-row"><strong>QTY:</strong> ${qty}</div>
              <div class="meta-row"><strong>TGL:</strong> ${dateStr}</div>
            </div>
          </div>
          <div class="label-footer">
            <span>SISTEM TRACKING GUDANG & LOGISTIK</span>
          </div>
        </div>
      </div>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cetak Label Stiker - ${sku}</title>
        <style>
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
          }
          body {
            background: #fff;
          }
          .label-page {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            page-break-after: always;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 1.5mm;
          }
          .label-container {
            width: 100%;
            height: 100%;
            border: 1px solid #000;
            border-radius: 1.5mm;
            padding: 1.5mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .label-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 0.5px solid #000;
            padding-bottom: 0.8mm;
          }
          .brand {
            font-size: 7.5pt;
            font-weight: 900;
            letter-spacing: 0.5px;
          }
          .badge {
            font-size: 5.5pt;
            font-weight: bold;
            border: 0.5px solid #000;
            padding: 0.2mm 1mm;
            border-radius: 0.5mm;
          }
          .item-title {
            font-size: 6.8pt;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0.8mm 0;
          }
          .label-body {
            display: flex;
            align-items: center;
            gap: 2mm;
            flex: 1;
          }
          .qr-col {
            width: 14mm;
            height: 14mm;
            flex-shrink: 0;
          }
          .qr-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .meta-col {
            flex: 1;
            font-size: 5.8pt;
            line-height: 1.25;
          }
          .meta-row {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .label-footer {
            border-top: 0.5px solid #000;
            padding-top: 0.5mm;
            text-align: center;
            font-size: 4.5pt;
            font-weight: 600;
            letter-spacing: 0.3px;
          }
        </style>
      </head>
      <body>
        ${labelHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
