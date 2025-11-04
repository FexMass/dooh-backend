# DOOH Charging Station - Backend API

Fastify-based backend for DOOH charging station digital signage platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- FFmpeg (for video compression)

### 1. Install Dependencies

```bash
npm install
```

### 2. Install FFmpeg

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**

```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### 3. Setup Database

Create PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dooh_db;
```

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required environment variables:**

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_BUCKET_ID` - Backblaze B2 credentials

### 5. Run Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 6. Seed Database

```bash
node prisma/seed.js
```

This creates an admin user:

- **Email:** admin@dooh.com
- **Password:** admin123

⚠️ **Change this password in production!**

### 7. Create Uploads Directory

```bash
mkdir -p uploads
```

### 8. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Ads Management

- `POST /api/ads/upload` - Upload ad
- `GET /api/ads` - List ads
- `GET /api/ads/:id` - Get ad
- `PUT /api/ads/:id` - Update ad
- `DELETE /api/ads/:id` - Delete ad

### Device Management

- `POST /api/devices/register` - Register device (public)
- `POST /api/devices/:id/heartbeat` - Device heartbeat (public)
- `GET /api/devices` - List devices (protected)
- `GET /api/devices/:id` - Get device (protected)
- `POST /api/devices/:id/assign` - Assign ads (protected)

### Playlist (Android)

- `GET /api/playlist/:deviceId` - Get playlist (public)

### Statistics (Android)

- `POST /api/stats` - Send stats (public)

### Reports

- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/location/:id` - Location report
- `GET /api/reports/ad/:id` - Ad report
- `GET /api/reports/export/csv` - Export CSV

## 🛠 Development

### View Database

```bash
npm run prisma:studio
```

### Reset Database

```bash
npx prisma migrate reset
```

## 📦 Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Fastify 4
- **Database:** PostgreSQL 15 + Prisma ORM
- **Auth:** JWT
- **Storage:** Backblaze B2
- **Video Processing:** FFmpeg

## 🔐 Security Notes

- Change default admin password
- Use strong JWT_SECRET
- Enable HTTPS in production
- Set proper CORS origins
- Keep B2 credentials secure

## 📄 License

MIT
