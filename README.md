# ChargeMate - EV Charging Station Management System

A comprehensive platform for managing electric vehicle charging stations, battery swap stations, reservations, and user wallets. Built with a modern tech stack focusing on security, scalability, and user experience.

## 🚀 Features

- **Multi-Role System**: EV Drivers, Station Operators, and Admins
- **Charging Station Management**: Book slots, track availability, manage stations
- **Battery Swap Stations**: Quick battery exchange system
- **Wallet System**: Top-up funds, track transactions
- **Real-time Reservations**: Book charging slots with deposit system
- **Automated Penalty System**: Cron job for missed reservations
- **Interactive Map**: Find nearby charging and swap stations
- **Admin Dashboard**: Platform analytics and user management

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3) with PostgreSQL support
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: bcryptjs, express-rate-limit, cors
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router DOM
- **Maps**: Leaflet + React Leaflet
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ChargeMate Project
```

2. **Install root dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

5. **Set up environment variables**

Copy the `.env.example` file to `.env` in the backend directory:
```bash
cd ../backend
cp ../.env.example .env
```

Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
```

## 🚀 Running the Application

### Development Mode (Both Frontend & Backend)
From the root directory:
```bash
npm run dev
```
This will start both the backend (port 5000) and frontend (port 5173) concurrently.

### Backend Only
```bash
cd backend
npm run dev
```

### Frontend Only
```bash
cd frontend
npm run dev
```

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd ../backend
npm start
```

## 🗄️ Database

### Initial Setup
The database is automatically initialized when the server starts. The `init-db.js` script creates all necessary tables and seeds initial data.

### Seeding Stations
To seed the database with sample charging and battery swap stations:
```bash
curl -X POST http://localhost:5000/api/stations/seed
```

### Database Schema
- **Users**: User accounts with roles and wallet balances
- **ChargingStations**: EV charging stations with slots and pricing
- **BatterySwapStations**: Battery exchange stations
- **Reservations**: Booking system with deposit management
- **Transactions**: Wallet transaction history
- **Batteries**: Battery inventory tracking
- **SwapLogs**: Battery swap history

## 🔐 Security Features

- **Input Validation**: All API endpoints validated using Joi schemas
- **Rate Limiting**: Configurable rate limits for API endpoints
- **CORS Protection**: Configured for specific frontend origin
- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Error Handling**: Comprehensive error handling middleware
- **Environment Variables**: Sensitive data stored in environment variables

## 📁 Project Structure

```
ChargeMate Project/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── jobs/            # Cron jobs
│   │   ├── init-db.js       # Database initialization
│   │   └── server.js        # Entry point
│   ├── package.json
│   └── chargemate.db        # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context
│   │   ├── pages/           # Page components
│   │   ├── assets/          # Static assets
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Docker configuration
└── package.json             # Root package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Wallet
- `GET /api/wallet` - Get wallet balance and transactions
- `POST /api/wallet` - Top up wallet

### Stations
- `GET /api/stations/charging` - Get all charging stations
- `GET /api/stations/battery-swap` - Get all battery swap stations
- `GET /api/stations/:id` - Get station by ID
- `POST /api/stations` - Create new station (Operator only)
- `POST /api/stations/seed` - Seed sample stations

### Reservations
- `GET /api/reservations` - Get user reservations
- `GET /api/reservations/operator` - Get operator reservations
- `POST /api/reservations/book` - Book a slot
- `POST /api/reservations/:id/checkin` - Check in to reservation
- `POST /api/reservations/:id/complete` - Complete charging session
- `POST /api/reservations/swap` - Request battery swap

### Admin
- `GET /api/admin/overview` - Get platform overview (Admin only)

## 🎨 User Roles

### EV Driver
- Browse charging and swap stations
- Book charging slots
- Manage wallet balance
- View reservation history
- Request battery swaps

### Station Operator
- Create and manage stations
- View station bookings
- Track earnings
- Manage station inventory

### Admin
- View platform analytics
- Manage users
- Monitor transactions
- oversee network operations

## 🔧 Configuration

Key configuration options in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRE | Token expiration | 30d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |
| RESERVATION_DEPOSIT | Booking deposit amount | 10.00 |
| SESSION_COMPLETION_FEE | Final session fee | 5.00 |
| BATTERY_SWAP_FEE | Battery swap cost | 15.00 |
| PENALTY_AMOUNT | Missed reservation penalty | 1.00 |

## 🐛 Troubleshooting

### Database Issues
If you encounter database errors, delete the `backend/chargemate.db` file and restart the server to reinitialize.

### Port Conflicts
If port 5000 or 5173 is in use, update the PORT in `.env` or the frontend dev server configuration.

### CORS Errors
Ensure `FRONTEND_URL` in `.env` matches your frontend development server URL.

## 📝 Recent Improvements

### Security Enhancements
- Added comprehensive input validation using Joi
- Implemented rate limiting for API endpoints
- Configured CORS with specific origins
- Added proper error handling middleware
- Implemented secure JWT configuration

### Code Quality
- Extracted hardcoded values to configuration
- Added async error handling wrapper
- Improved controller error handling
- Added validation schemas for all endpoints
- Centralized configuration management

### Infrastructure
- Added `.gitignore` for sensitive files
- Created `.env.example` for environment setup
- Improved project documentation
- Added comprehensive README

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Final Year Project Team

## 🙏 Acknowledgments

- Leaflet for mapping functionality
- Lucide for icons
- The open-source community
