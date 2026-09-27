import os
import tarfile
import paramiko
import tempfile
import sys
import time

HOST = '100.100.98.113'
USER = 'kraven'
PASS = '1256'

print("[1/6] Creating tar.gz of backend and FrontEnd/dist...")
temp_tar = os.path.join(tempfile.gettempdir(), 'ims_bundle.tar.gz')
if os.path.exists(temp_tar):
    try:
        os.remove(temp_tar)
    except:
        pass

with tarfile.open(temp_tar, 'w:gz') as tar:
    # Add backend files except node_modules
    backend_dir = os.path.abspath('backend')
    for root, dirs, files in os.walk(backend_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, backend_dir)
            tar.add(full_path, arcname=rel_path)

    # Add FrontEnd/dist as dist/
    dist_dir = os.path.abspath('FrontEnd/dist')
    if os.path.exists(dist_dir):
        for root, dirs, files in os.walk(dist_dir):
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.join('dist', os.path.relpath(full_path, dist_dir))
                tar.add(full_path, arcname=rel_path)

size_mb = os.path.getsize(temp_tar) / 1024 / 1024
print(f"Archive created: {temp_tar} ({size_mb:.2f} MB)")

print(f"[2/6] Connecting to {USER}@{HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)

def run_sudo(cmd):
    full_cmd = f"echo {PASS} | sudo -S {cmd}"
    stdin, stdout, stderr = ssh.exec_command(full_cmd)
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return out, err

def run_cmd(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return out, err

print("[3/6] Uploading bundle via SFTP...")
sftp = ssh.open_sftp()
sftp.put(temp_tar, '/tmp/ims_bundle.tar.gz')
sftp.close()
print("Uploaded to /tmp/ims_bundle.tar.gz")

print("[4/6] Preparing /DATA/AppData/ims-app and extracting...")
run_sudo('mkdir -p /DATA/AppData/ims-app')
run_sudo(f'chown -R {USER}:{USER} /DATA/AppData/ims-app')
run_cmd('tar -xzf /tmp/ims_bundle.tar.gz -C /DATA/AppData/ims-app')

# Create production .env on the server
server_env = """SUPABASE_URL=https://botwoojfvjzwjzivfzet.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdHdvb2pmdmp6d2p6aXZmemV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTkxMDIsImV4cCI6MjEwNTU5NTEwMn0.NlpLp1Q1If9USx6i6z8Zv3ZdCWcpEONcOX8dxpEDmM8
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
JWT_SECRET=digitech-gems-ims-secret-2026-super-secure
PORT=3001
NODE_ENV=production
CLIENT_URL=http://localhost:3001

# GMAIL SMTP CONFIGURATION
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=digitechinventory@gmail.com
SMTP_PASS=dmctrcrvjjvwcedq
SMTP_FROM="Digitech IMS <digitechinventory@gmail.com>"

# LOCAL POSTGRESQL (running in docker on the host)
LOCAL_PG_HOST=127.0.0.1
LOCAL_PG_PORT=5432
LOCAL_PG_DATABASE=digitech_ims
LOCAL_PG_USER=ims_user
LOCAL_PG_PASSWORD=ims_password_2026
DATABASE_URL=postgresql://ims_user:ims_password_2026@127.0.0.1:5432/digitech_ims
"""

with open('temp_server.env', 'w') as f:
    f.write(server_env)

sftp = ssh.open_sftp()
sftp.put('temp_server.env', '/DATA/AppData/ims-app/.env')
sftp.close()
if os.path.exists('temp_server.env'):
    os.remove('temp_server.env')

print("[5/6] Installing production dependencies via npm...")
out, err = run_cmd('cd /DATA/AppData/ims-app && npm install --omit=dev')
print("npm output:", out[:200])

# Configure systemd service
service_file = """[Unit]
Description=Digitech IMS Production Server (Frontend SPA + Backend + Dual DB)
After=network.target

[Service]
Type=simple
User=kraven
WorkingDirectory=/DATA/AppData/ims-app
ExecStart=/usr/bin/node --experimental-websocket index.js
Restart=always
RestartSec=5
EnvironmentFile=/DATA/AppData/ims-app/.env

[Install]
WantedBy=multi-user.target
"""


run_sudo(f"bash -c 'cat > /etc/systemd/system/digitech-ims.service << \"EOF\"\n{service_file}\nEOF'")
run_sudo('systemctl daemon-reload')
run_sudo('systemctl enable digitech-ims.service')
run_sudo('systemctl restart digitech-ims.service')
time.sleep(3)

print("[6/6] Registering Digitech IMS on CasaOS Dashboard...")
run_sudo('mkdir -p /var/lib/casaos/apps/digitech-ims')

casaos_compose = """name: digitech-ims
services:
    digitech-ims:
        container_name: digitech-ims
        image: alpine:latest
        network_mode: host
        restart: unless-stopped
        command: ["sleep", "infinity"]
        labels:
            icon: https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/inventory.svg
        x-casaos:
            ports:
                - container: "3001"
                  description:
                    en_US: Digitech IMS Web UI
x-casaos:
    architectures:
        - amd64
        - arm64
    main: digitech-ims
    description:
        en_US: Digitech IMS - Mining Inventory & Asset Management System with Dual Database
        id_ID: Sistem Manajemen Inventaris Tambang & Logistik Suku Cadang Digitech
    tagline:
        en_US: Mining Inventory & Document Tracking System
        id_ID: Sistem Manajemen Suku Cadang & Pelacakan Dokumen MOS/MR
    title:
        en_US: Digitech IMS
        id_ID: Digitech IMS
    icon: https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/inventory.svg
    port_map: "3001"
    index: /
    scheme: http
"""

run_sudo(f"bash -c 'cat > /var/lib/casaos/apps/digitech-ims/docker-compose.yml << \"EOF\"\n{casaos_compose}\nEOF'")

# Apply to CasaOS app management
out, err = run_sudo('casaos-cli app-management apply digitech-ims --file /var/lib/casaos/apps/digitech-ims/docker-compose.yml 2>&1 || casaos-cli app-management install -f /var/lib/casaos/apps/digitech-ims/docker-compose.yml 2>&1')
print("CasaOS registration output:", out)

# Check CasaOS list
out, _ = run_sudo('casaos-cli app-management list apps')
sys.stdout.buffer.write(b"\n=== CASAOS APPS LIST ===\n" + out.encode('utf-8') + b"\n")

# Check service status
out, _ = run_sudo('systemctl status digitech-ims.service --no-pager')
sys.stdout.buffer.write(b"\n=== SYSTEMD SERVICE STATUS ===\n" + out[:500].encode('utf-8') + b"\n")

# Test Health Check
out, _ = run_cmd('curl -s http://localhost:3001/api/health')
sys.stdout.buffer.write(b"\n=== HEALTH CHECK API ===\n" + out.encode('utf-8') + b"\n")

# Test Frontend HTTP response
out, _ = run_cmd('curl -s -I http://localhost:3001/')
sys.stdout.buffer.write(b"\n=== FRONTEND HTTP HEADER ===\n" + out.encode('utf-8') + b"\n")

ssh.close()
print("\nDeployment successfully finished!")

