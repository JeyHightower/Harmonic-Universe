# Harmonic Universe - Database Restoration Guide

## Overview

This guide covers the complete database restoration process for the Harmonic Universe application after a Docker VM reset. The restoration supports both **Docker** and **Local** development environments.

## ✅ Restoration Status

- **Docker Environment**: ✅ Fully functional
- **Local Environment**: ✅ Fully functional
- **Demo Data**: ✅ Created
- **Verification**: ✅ Both environments tested and working

## 🚀 Quick Start

### For Both Environments (Recommended)

```bash
./restore-database.sh both
```

### For Docker Only

```bash
./restore-database.sh docker
```

### For Local Development Only

```bash
./restore-database.sh local
```

### Verify Setup

```bash
./restore-database.sh verify
```

## 📋 Database Configuration

### Docker Environment

- **Host**: localhost
- **Port**: 5432
- **Database**: harmonic_universe
- **User**: harmonic_user
- **Password**: harmonic_password

### Local Environment

- **Host**: localhost
- **Port**: 5432 (local PostgreSQL)
- **Database**: harmonic_universe
- **User**: harmonic_user
- **Password**: harmonic_password

## 🛠️ Available Scripts

### 1. Database Restoration Script

**File**: `restore-database.sh`

```bash
# Full restoration (both environments)
./restore-database.sh both

# Docker only
./restore-database.sh docker

# Local only
./restore-database.sh local

# Verify both environments
./restore-database.sh verify

# Help
./restore-database.sh help
```

### 2. Environment Setup Script

**File**: `setup-env.sh`

Creates `.env` files for both frontend and backend if they don't exist.

```bash
./setup-env.sh
```

## 📊 Database Schema

The following tables have been created and verified:

### Core Tables

- `users` - User accounts and authentication
- `universes` - Story universes
- `scenes` - Individual scenes within universes
- `characters` - Characters in the story
- `character_scenes` - Many-to-many relationship

### Audio/Music Tables

- `sound_profiles` - Audio configuration profiles
- `audio_samples` - Audio file references
- `music_pieces` - Music compositions
- `music` - Generated music data
- `harmonies` - Musical harmony data
- `musical_themes` - Character/scene themes

### Physics Tables

- `physics_objects` - 3D objects with physics properties
- `physics_2d` - 2D physics world configuration
- `physics_3d` - 3D physics world configuration
- `physics_constraints` - Physics constraints between objects
- `physics_parameters` - Global physics parameters

### Notes Tables

- `notes` - User notes with 3D positioning
- `scene_notes` - Scene-specific notes

## 👤 Demo Data

**Demo User Account**:

- Email: `demo@example.com`
- Password: `demo123`
- Username: `demo_user`

**Demo Universe**:

- Name: "Test Universe"
- Description: "A test universe for demo user"
- Public: Yes

## 🚦 Starting the Application

### Docker Environment

```bash
# Start all services
docker-compose up

# Start only specific services
docker-compose up db backend
docker-compose up frontend
```

### Local Environment

```bash
# Start backend (in backend directory)
cd backend
flask run

# Start frontend (in frontend directory)
cd frontend
npm run dev
# or
pnpm dev
```

## 🌐 Application URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Database**: localhost:5432

## 🔧 Environment Files

### Backend `.env`

```bash
# Database Configuration
DATABASE_URL=postgresql://harmonic_user:harmonic_password@localhost:5432/harmonic_universe

# Flask Configuration
FLASK_APP=wsgi.py
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=development_secret_key_change_in_production

# Server Configuration
PORT=5001
HOST=0.0.0.0

# Development Settings
PYTHONPATH=/app
DEBUG=True
```

### Frontend `.env`

```bash
# API Configuration
VITE_API_URL=http://localhost:5001

# Development Settings
NODE_ENV=development
HOST=0.0.0.0
PORT=5173

# Build Settings
NODE_OPTIONS=--max_old_space_size=2048
```

## 🧪 Testing Database Connection

### Docker

```bash
docker-compose exec db psql -U harmonic_user -d harmonic_universe -c "SELECT COUNT(*) FROM users;"
```

### Local

```bash
PGPASSWORD=harmonic_password psql -h localhost -U harmonic_user -d harmonic_universe -c "SELECT COUNT(*) FROM users;"
```

## ❗ Troubleshooting

### Common Issues

1. **Docker not running**

   ```bash
   # Start Docker Desktop or Docker service
   open -a Docker
   ```

2. **Local PostgreSQL not running**

   ```bash
   brew services start postgresql@15
   ```

3. **Port conflicts**

   - Check if ports 5432, 5001, or 5173 are already in use
   - Stop conflicting services or change ports in configuration

4. **Permission issues**
   ```bash
   chmod +x restore-database.sh
   chmod +x setup-env.sh
   ```

### Reset Everything

If you need to completely reset and restore:

```bash
# Stop all containers
docker-compose down

# Run full restoration
./restore-database.sh both
```

## 📝 Notes

- The restoration process includes proper database extensions (`uuid-ossp`, `pgcrypto`)
- All tables include proper indexes and foreign key constraints
- The schema supports both 2D and 3D physics simulations
- Audio and music data is stored with proper metadata
- Notes system supports 3D positioning for spatial organization

## 🔄 Post-Docker VM Reset

This restoration was performed after a Docker VM reset that cleared:

- All Docker containers and images
- All Docker volumes and data
- PostgreSQL database content

The restoration process successfully:

- ✅ Recreated the database schema
- ✅ Set up both Docker and local environments
- ✅ Created demo data for testing
- ✅ Verified all connections and functionality
- ✅ Documented the complete process

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your environment files are correct
3. Ensure all required services are running
4. Check the application logs for detailed error messages
