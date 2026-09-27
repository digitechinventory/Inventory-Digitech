# Panduan Deploy Digitech IMS ke Local Server (Debian / CasaOS)

## Informasi Server
- IP Server: 100.100.98.113
- OS: Debian Linux (CasaOS)
- PostgreSQL: Port 5432, DB: digitech_ims
- Redis: Port 6379
- Backend: Port 3001

## Konfigurasi .env Backend di Server (gunakan localhost karena di server sendiri)

LOCAL_PG_HOST=localhost
LOCAL_PG_PORT=5432
LOCAL_PG_DATABASE=digitech_ims
LOCAL_PG_USER=ims_user
LOCAL_PG_PASSWORD=ims_password_2026
DATABASE_URL=postgresql://ims_user:ims_password_2026@localhost:5432/digitech_ims
REDIS_URL=redis://localhost:6379
PORT=3001
NODE_ENV=production
CLIENT_URL=http://100.100.98.113:3001

## Langkah Deploy

### 1. Pull kode dari GitHub
git pull origin main

### 2. Install backend dependencies
cd backend && npm install

### 3. Build frontend
cd ../FrontEnd && npm install && npm run build

### 4. Salin build ke backend
cp -r dist/ ../backend/dist/

### 5. Jalankan dengan PM2
cd ../backend && pm2 start index.js --name digitech-ims
pm2 save && pm2 startup

### 6. Akses
URL: http://100.100.98.113:3001
API: http://100.100.98.113:3001/api/health

## Akun Demo
- Superadmin: arya-superadmin@digitech.co.id / admin123
- Admin: arya-admin@digitech.co.id / admin123
- User: arya-user@digitech.co.id / admin123
