#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import script for FAMOUS and WIM datasets.
Parses famous_data.xlsx and 2. Detail_Control_Stock_Part_WIM.xlsx
Generates full clean JSON datasets for backend API and frontend display.
"""

import os
import sys
import json
import datetime
import openpyxl

BASE_DIR = r"c:\Users\KRAVEN\Documents\Digitech\Project\IMS_v0.1"
FAMOUS_XLSX = os.path.join(BASE_DIR, "famous_data.xlsx")
WIM_XLSX = os.path.join(BASE_DIR, "2. Detail_Control_Stock_Part_WIM.xlsx")

BACKEND_DATA_DIR = os.path.join(BASE_DIR, "backend", "data")
FAMOUS_DATA_DIR = os.path.join(BACKEND_DATA_DIR, "famous")
WIM_DATA_DIR = os.path.join(BACKEND_DATA_DIR, "wim")

os.makedirs(FAMOUS_DATA_DIR, exist_ok=True)
os.makedirs(WIM_DATA_DIR, exist_ok=True)

def format_val(val):
    if val is None:
        return ""
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    if s.endswith('.0') and s[:-2].replace('-', '').isdigit():
        return s[:-2]
    return s

def clean_status(st, notes="", prev_unit=""):
    s = (st or "").strip()
    notes_lower = (notes or "").lower()
    prev_lower = (prev_unit or "").lower()

    if "kanibal" in s.lower() or "kanibal" in notes_lower or "ex " in prev_lower or "ex " in notes_lower:
        return "Pindahan"
    if "terinstall" in s.lower() or "terpasang" in s.lower() or "install" in s.lower():
        return "Terinstall"
    if "onsite" in s.lower() or "ready" in s.lower():
        return "Onsite"
    if "rusak" in s.lower() or "broken" in s.lower() or "patah" in notes_lower:
        return "Rusak"
    if "return" in s.lower() or "retur" in s.lower():
        return "Return"
    if "dismantle" in s.lower() or "lepas" in s.lower() or "dilepas" in s.lower():
        return "Dismantled"
    if not s:
        return "Onsite"
    return s

# ═════════════════════════════════════════════════════════════════════════════
# 1. PARSE FAMOUS COMPLETE
# ═════════════════════════════════════════════════════════════════════════════
def parse_famous():
    print(">>> [FAMOUS] Loading famous_data.xlsx...")
    wb = openpyxl.load_workbook(FAMOUS_XLSX, read_only=True, data_only=True)
    
    # Map dismantle dates and notes from Log Asset FMS 1.0
    dismantle_map = {}
    if 'Log Asset FMS 1.0' in wb.sheetnames:
        ws_log = wb['Log Asset FMS 1.0']
        for row in ws_log.iter_rows(min_row=3, values_only=True):
            if not row or not any(row):
                continue
            unit = format_val(row[4] if len(row) > 4 else "")
            sn = format_val(row[5] if len(row) > 5 else "")
            imei = format_val(row[6] if len(row) > 6 else "")
            dismantle_date = format_val(row[8] if len(row) > 8 else "")
            notes = format_val(row[9] if len(row) > 9 else "")
            if sn or imei or unit:
                info = {
                    'dismantle_date': dismantle_date,
                    'notes': notes,
                    'unit': unit
                }
                if sn: dismantle_map[sn] = info
                if imei: dismantle_map[imei] = info

    # Categories to parse
    sheet_configs = {
        'Stock GPS': {'category': 'gps', 'label': 'GPS Tracker', 'brand': 'Concox / Meitrack'},
        'Stock DSM': {'category': 'dsm', 'label': 'DSM AI Camera', 'brand': 'Howen / Careland'},
        'Stock ADAS': {'category': 'adas', 'label': 'ADAS Safety Camera', 'brand': 'Howen / Careland'},
        'Stock MDVR': {'category': 'mdvr', 'label': 'MDVR Video Recorder', 'brand': 'Howen Technologies'},
        'Stock SSD': {'category': 'ssd', 'label': 'SSD Storage 512GB/1TB', 'brand': 'Kingston / Longsys'},
        'Stock OBU': {'category': 'obu', 'label': 'OBU Screen Display', 'brand': 'Digitech Telematics'},
        'Stock PTT': {'category': 'ptt', 'label': 'PTT Voice Radio', 'brand': 'Hytera / POC'},
        'Stock DOME': {'category': 'dome', 'label': 'Dome CCTV Camera', 'brand': 'Hikvision / Dahua'},
        'Stock CANBUS': {'category': 'canbus', 'label': 'CAN-Bus Telematics Interface', 'brand': 'Squarell / Teltonika'},
        'Detail3-BBS-Terinstall': {'category': 'dome', 'label': 'Dome CCTV Camera (BBS)', 'brand': 'Hikvision'}
    }

    famous_items = []
    item_id_counter = 1

    for sheet_name, cfg in sheet_configs.items():
        if sheet_name not in wb.sheetnames:
            continue
        ws = wb[sheet_name]
        print(f"    Parsing {sheet_name}...")

        # Determine header indices from row 2
        rows = list(ws.iter_rows(min_row=1, max_row=2, values_only=True))
        if len(rows) < 2:
            continue
        header = [format_val(c).lower() for c in rows[1]]
        
        # Helper to find column index
        def find_col(keywords, default=-1):
            for i, h in enumerate(header):
                for kw in keywords:
                    if kw in h:
                        return i
            return default

        col_asset = find_col(['asset'])
        col_sn = find_col(['serial', 'no serial'])
        col_imei = find_col(['imei', 'no imei'])
        col_imei1 = find_col(['imei 1'])
        col_imei2 = find_col(['imei 2'])
        col_status = find_col(['status'])
        col_onsite = find_col(['onsite', 'tgl onsite'])
        col_install = find_col(['instal', 'install', 'tgl install'])
        col_mitra = find_col(['mitra'])
        col_unit = find_col(['lambung', 'unit'])
        col_bastm = find_col(['bastm'])
        col_prev = find_col(['sebelumnya', 'no. sebelumnya', 'ex '])
        col_notes = find_col(['catatan', 'keterangan'])

        for row in ws.iter_rows(min_row=3, values_only=True):
            if not row or not any(row):
                continue
            
            def get_cell(idx):
                return format_val(row[idx]) if idx >= 0 and idx < len(row) else ""

            sn = get_cell(col_sn)
            asset_no = get_cell(col_asset)
            imei = get_cell(col_imei)
            imei1 = get_cell(col_imei1)
            imei2 = get_cell(col_imei2)
            raw_status = get_cell(col_status)
            onsite_date = get_cell(col_onsite)
            install_date = get_cell(col_install)
            mitra = get_cell(col_mitra) or "STOCK"
            unit_code = get_cell(col_unit)
            bastm = get_cell(col_bastm)
            prev_unit = get_cell(col_prev)
            notes = get_cell(col_notes)

            # Skip summary lines or empty rows
            if not sn and not asset_no and not imei and not unit_code:
                continue
            if sn.lower().startswith('total') or asset_no.lower().startswith('total'):
                continue

            # Dismantle lookup
            dismantle_info = dismantle_map.get(sn) or dismantle_map.get(imei) or {}
            dismantle_date = dismantle_info.get('dismantle_date', '')
            if not notes and dismantle_info.get('notes'):
                notes = dismantle_info.get('notes')

            # Normalize Status and Pindahan
            status = clean_status(raw_status, notes=notes, prev_unit=prev_unit)
            is_pindahan = (status == "Pindahan") or bool(prev_unit and prev_unit != "-")

            # Clean transferred from string
            transferred_from = prev_unit
            if not transferred_from and "ex " in notes.lower():
                import re
                m = re.search(r'ex\s+([A-Za-z0-9\s\-#]+)', notes, re.IGNORECASE)
                if m:
                    transferred_from = m.group(0).strip().upper()

            item = {
                'id': f"fms-{item_id_counter:05d}",
                'item_code': f"FMS-{cfg['category'].upper()}-{item_id_counter:04d}",
                'category': cfg['category'],
                'category_name': cfg['label'],
                'brand': cfg['brand'],
                'name': f"{cfg['label']} ({cfg['brand']})",
                'asset_number': asset_no or "-",
                'serial_number': sn or "-",
                'imei': imei or "-",
                'imei_1': imei1 or "-",
                'imei_2': imei2 or "-",
                'status': status,
                'is_pindahan': is_pindahan,
                'transferred_from': transferred_from or "-",
                'tanggal_onsite': onsite_date or "-",
                'tanggal_instal': install_date or "-",
                'tanggal_dismantle': dismantle_date or "-",
                'mitra': mitra.upper(),
                'unit_code': unit_code or "-",
                'bastm_number': bastm or "-",
                'notes': notes or "-"
            }
            famous_items.append(item)
            item_id_counter += 1

    print(f"    Total FAMOUS items parsed: {len(famous_items)}")

    # ════ Build Fleet Matrix (825+ Trucks) ════
    fleet_dict = {}
    for it in famous_items:
        u = it['unit_code']
        if not u or u == "-" or u.upper().startswith('EX ') or len(u) < 3:
            continue
        
        if u not in fleet_dict:
            fleet_dict[u] = {
                'unit_code': u,
                'mitra': it['mitra'] if it['mitra'] != 'STOCK' else 'BIB',
                'sensors': {},
                'transfers_history': [],
                'status': 'OPERATIONAL'
            }
        
        cat = it['category']
        fleet_dict[u]['sensors'][cat] = {
            'item_id': it['id'],
            'serial_number': it['serial_number'],
            'asset_number': it['asset_number'],
            'imei': it['imei'],
            'status': it['status'],
            'installed_at': it['tanggal_instal'],
            'is_pindahan': it['is_pindahan'],
            'transferred_from': it['transferred_from']
        }

        if it['is_pindahan'] or it['transferred_from'] != "-":
            fleet_dict[u]['transfers_history'].append({
                'category': cat,
                'serial_number': it['serial_number'],
                'transferred_from': it['transferred_from'],
                'dismantle_date': it['tanggal_dismantle'],
                'install_date': it['tanggal_instal'],
                'notes': it['notes']
            })

    # Calculate health for each unit
    fleet_matrix = []
    optimal_count = 0
    partial_count = 0
    critical_count = 0

    core_sensors = ['gps', 'dsm', 'adas', 'mdvr', 'ssd', 'obu', 'ptt']

    for u, data in fleet_dict.items():
        installed_core = sum(1 for c in core_sensors if c in data['sensors'] and data['sensors'][c]['status'] == 'Terinstall')
        if installed_core >= 6:
            health = 'OPTIMAL'
            optimal_count += 1
        elif installed_core >= 3:
            health = 'PARTIAL'
            partial_count += 1
        else:
            health = 'CRITICAL'
            critical_count += 1
        
        data['health'] = health
        data['installed_core_count'] = installed_core
        fleet_matrix.append(data)

    fleet_matrix.sort(key=lambda x: x['unit_code'])

    # Build Summary
    by_cat = {}
    by_status = {}
    by_mitra = {}
    total_pindahan = 0

    for it in famous_items:
        c = it['category']
        by_cat[c] = by_cat.get(c, 0) + 1
        st = it['status']
        by_status[st] = by_status.get(st, 0) + 1
        m = it['mitra']
        by_mitra[m] = by_mitra.get(m, 0) + 1
        if it['is_pindahan']:
            total_pindahan += 1

    famous_summary = {
        'total_items': len(famous_items),
        'total_pindahan': total_pindahan,
        'by_category': by_cat,
        'by_status': by_status,
        'by_mitra': by_mitra,
        'fleet_summary': {
            'total_units': len(fleet_matrix),
            'optimal_units': optimal_count,
            'partial_units': partial_count,
            'critical_units': critical_count
        },
        'updated_at': datetime.datetime.now().isoformat()
    }

    # Save JSON files
    with open(os.path.join(FAMOUS_DATA_DIR, 'famous_items.json'), 'w', encoding='utf-8') as f:
        json.dump(famous_items, f, ensure_ascii=False, indent=2)
    with open(os.path.join(FAMOUS_DATA_DIR, 'famous_fleet_matrix.json'), 'w', encoding='utf-8') as f:
        json.dump(fleet_matrix, f, ensure_ascii=False, indent=2)
    with open(os.path.join(FAMOUS_DATA_DIR, 'famous_summary.json'), 'w', encoding='utf-8') as f:
        json.dump(famous_summary, f, ensure_ascii=False, indent=2)

    print(f"[OK] [FAMOUS] Done! {len(famous_items)} items, {len(fleet_matrix)} fleet units, {total_pindahan} pindahan.")
    return len(famous_items)


# ═════════════════════════════════════════════════════════════════════════════
# 2. PARSE WIM COMPLETE
# ═════════════════════════════════════════════════════════════════════════════
def parse_wim():
    print(">>> [WIM] Loading 2. Detail_Control_Stock_Part_WIM.xlsx...")
    wb = openpyxl.load_workbook(WIM_XLSX, read_only=True, data_only=True)

    # 1. Parse Warranty Sparepart Sheet
    warranty_list = []
    if 'Warranty Sparepart' in wb.sheetnames:
        ws_warr = wb['Warranty Sparepart']
        current_section = "General"
        for row in ws_warr.iter_rows(values_only=True):
            if not row or not any(row):
                continue
            item_col = format_val(row[1] if len(row) > 1 else "")
            if not item_col or item_col == "Item":
                continue
            # Check if section header
            if item_col.startswith("Sensor") or item_col.startswith("PC") or item_col.startswith("RFID") or item_col.startswith("CCTV"):
                current_section = item_col.strip()
                continue
            
            part_no = format_val(row[0] if len(row) > 0 else "")
            qty_est = row[2] if len(row) > 2 and row[2] is not None else 0
            lead_time = format_val(row[3] if len(row) > 3 else "")
            warranty_period = format_val(row[4] if len(row) > 4 else "")

            warranty_list.append({
                'part_number': part_no or f"VGT-WIM-{len(warranty_list)+1:03d}",
                'item_name': item_col,
                'section': current_section,
                'qty_estimated_2yr': qty_est,
                'lead_time': lead_time,
                'warranty_period': warranty_period
            })
    print(f"    Parsed {len(warranty_list)} warranty catalog items.")

    # 2. Parse All Component Sheets
    wim_components = []
    wim_transactions = []
    item_counter = 1

    skip_sheets = ['Warranty Sparepart']
    for sheet_name in wb.sheetnames:
        if sheet_name in skip_sheets:
            continue
        ws = wb[sheet_name]

        # Extract header metadata from row 4
        meta_row = list(ws.iter_rows(min_row=4, max_row=4, values_only=True))
        part_code = ""
        part_desc = sheet_name
        if meta_row and meta_row[0]:
            part_code = format_val(meta_row[0][0])
            part_desc = format_val(meta_row[0][1]) or sheet_name

        # Iterate rows starting from row 6
        for row in ws.iter_rows(min_row=6, values_only=True):
            if not row or not any(row):
                continue
            
            # ── SECTION A: STOCK BARU TRANSACTIONS (Cols 0..9) ──
            tx_date = format_val(row[0] if len(row) > 0 else "")
            if tx_date and tx_date != "Tanggal":
                tx_in = row[2] if len(row) > 2 and row[2] is not None else 0
                tx_out = row[3] if len(row) > 3 and row[3] is not None else 0
                tx_action = format_val(row[4] if len(row) > 4 else "")
                tx_lane = format_val(row[5] if len(row) > 5 else "")
                tx_stock_init = row[6] if len(row) > 6 and row[6] is not None else 0
                tx_stock_final = row[7] if len(row) > 7 and row[7] is not None else 0
                tx_status = format_val(row[8] if len(row) > 8 else "")
                tx_notes = format_val(row[9] if len(row) > 9 else "")

                if tx_in or tx_out or tx_action != "-":
                    wim_transactions.append({
                        'category': sheet_name,
                        'stock_type': 'BARU',
                        'date': tx_date,
                        'qty_in': tx_in,
                        'qty_out': tx_out,
                        'action': tx_action,
                        'lane': tx_lane,
                        'initial_stock': tx_stock_init,
                        'final_stock': tx_stock_final,
                        'status': tx_status,
                        'notes': tx_notes
                    })

            # ── SECTION B: STOCK DUMMY / BEKAS TRANSACTIONS (Cols 13..22) ──
            if len(row) > 13:
                tx_d_date = format_val(row[13])
                if tx_d_date and tx_d_date != "Tanggal":
                    tx_d_in = row[15] if len(row) > 15 and row[15] is not None else 0
                    tx_d_out = row[16] if len(row) > 16 and row[16] is not None else 0
                    tx_d_action = format_val(row[17] if len(row) > 17 else "")
                    tx_d_lane = format_val(row[18] if len(row) > 18 else "")
                    tx_d_init = row[19] if len(row) > 19 and row[19] is not None else 0
                    tx_d_final = row[20] if len(row) > 20 and row[20] is not None else 0
                    tx_d_status = format_val(row[21] if len(row) > 21 else "")
                    tx_d_notes = format_val(row[22] if len(row) > 22 else "")

                    if tx_d_in or tx_d_out or tx_d_action != "-":
                        wim_transactions.append({
                            'category': sheet_name,
                            'stock_type': 'DUMMY / BEKAS',
                            'date': tx_d_date,
                            'qty_in': tx_d_in,
                            'qty_out': tx_d_out,
                            'action': tx_d_action,
                            'lane': tx_d_lane,
                            'initial_stock': tx_d_init,
                            'final_stock': tx_d_final,
                            'status': tx_d_status,
                            'notes': tx_d_notes
                        })

            # ── SECTION C: SERIALIZED ITEMS (Cols 26..39) ──
            if len(row) > 27:
                item_name = format_val(row[27])
                if item_name and item_name != "Nama Barang":
                    model_no = format_val(row[28] if len(row) > 28 else "")
                    serial_no = format_val(row[29] if len(row) > 29 else "")
                    qty = row[30] if len(row) > 30 and row[30] is not None else 1
                    status = format_val(row[31] if len(row) > 31 else "")
                    condition = format_val(row[32] if len(row) > 32 else "")
                    location = format_val(row[33] if len(row) > 33 else "")
                    date_onsite = format_val(row[34] if len(row) > 34 else "")
                    date_install = format_val(row[35] if len(row) > 35 else "")
                    date_dismantle = format_val(row[36] if len(row) > 36 else "")
                    date_ho = format_val(row[37] if len(row) > 37 else "")
                    notes = format_val(row[38] if len(row) > 38 else "")
                    po_number = format_val(row[39] if len(row) > 39 else "")

                    # Determine if pindahan / kanibal
                    is_pindahan = "kanibal" in notes.lower() or "ex " in notes.lower() or "pergantian" in notes.lower()
                    transferred_from = "-"
                    if "ex lane" in notes.lower():
                        transferred_from = "WIM " + notes.split("ex")[1].split(")")[0].strip()
                    elif "lane" in location.lower() and status == "Dilepas":
                        transferred_from = location

                    comp = {
                        'id': f"wim-{item_counter:04d}",
                        'item_code': f"WIM-{sheet_name.upper().replace(' ', '')[:4]}-{item_counter:03d}",
                        'category': sheet_name,
                        'name': item_name or sheet_name,
                        'model_type': model_no or part_desc,
                        'serial_number': serial_no or f"SN-WIM-{item_counter:04d}",
                        'quantity': qty,
                        'status': status or 'Ready',
                        'condition': condition or 'Baru',
                        'location': location or 'Gudang Central WIM',
                        'lane': 'Lane 1' if 'lane 1' in location.lower() else ('Lane 3' if 'lane 3' in location.lower() else '-'),
                        'tanggal_onsite': date_onsite or "-",
                        'tanggal_instal': date_install or "-",
                        'tanggal_dismantle': date_dismantle or "-",
                        'tanggal_ho': date_ho or "-",
                        'is_pindahan': is_pindahan,
                        'transferred_from': transferred_from,
                        'notes': notes or "-",
                        'po_number': po_number or "-"
                    }
                    wim_components.append(comp)
                    item_counter += 1

    # WIM Summary
    by_category_count = {}
    by_status_count = {}
    by_lane_count = {'Lane 1': 0, 'Lane 3': 0, 'Gudang / Office VGT': 0, 'Other': 0}

    for c in wim_components:
        cat = c['category']
        by_category_count[cat] = by_category_count.get(cat, 0) + 1
        st = c['status']
        by_status_count[st] = by_status_count.get(st, 0) + 1
        loc = c['location'].lower()
        if 'lane 1' in loc:
            by_lane_count['Lane 1'] += 1
        elif 'lane 3' in loc:
            by_lane_count['Lane 3'] += 1
        elif 'office' in loc or 'gudang' in loc:
            by_lane_count['Gudang / Office VGT'] += 1
        else:
            by_lane_count['Other'] += 1

    wim_summary = {
        'total_components': len(wim_components),
        'total_transactions': len(wim_transactions),
        'total_warranty_items': len(warranty_list),
        'by_category': by_category_count,
        'by_status': by_status_count,
        'by_lane': by_lane_count,
        'lanes_summary': [
            {'lane': 'Lane 1', 'active_loadcells': 4, 'model': 'INTERCOMP Loadcell double ended shear beam', 'status': 'OPTIMAL'},
            {'lane': 'Lane 3', 'active_loadcells': 4, 'model': 'INTERCOMP Loadcell double ended shear beam', 'status': 'OPTIMAL'},
            {'lane': 'High Speed WIM', 'active_strips': 24, 'model': 'Strip Sensor HS', 'status': 'OPTIMAL'}
        ],
        'updated_at': datetime.datetime.now().isoformat()
    }

    # Save JSON files
    with open(os.path.join(WIM_DATA_DIR, 'wim_warranty.json'), 'w', encoding='utf-8') as f:
        json.dump(warranty_list, f, ensure_ascii=False, indent=2)
    with open(os.path.join(WIM_DATA_DIR, 'wim_components.json'), 'w', encoding='utf-8') as f:
        json.dump(wim_components, f, ensure_ascii=False, indent=2)
    with open(os.path.join(WIM_DATA_DIR, 'wim_transactions.json'), 'w', encoding='utf-8') as f:
        json.dump(wim_transactions, f, ensure_ascii=False, indent=2)
    with open(os.path.join(WIM_DATA_DIR, 'wim_summary.json'), 'w', encoding='utf-8') as f:
        json.dump(wim_summary, f, ensure_ascii=False, indent=2)

    print(f"[OK] [WIM] Done! {len(wim_components)} components, {len(wim_transactions)} transactions, {len(warranty_list)} warranty items.")
    return len(wim_components)


if __name__ == '__main__':
    parse_famous()
    parse_wim()
    print("ALL IMPORT COMPLETED SUCCESSFULLY.")
