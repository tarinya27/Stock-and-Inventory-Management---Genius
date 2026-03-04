# Computer Shop Stock Management System

A centralized, web-based stock management system for computer shops with barcode scanning capabilities, remote access, and role-based authentication.

## Features

- 🔐 **Role-Based Authentication**: Admin and Store Manager roles
- 📊 **Barcode Scanning**: USB barcode scanner integration (works as keyboard input)
- 📦 **Stock Management**: Track stock IN, stock OUT, and automatic balance calculation
- 🌐 **Remote Access**: Centralized system accessible from anywhere
- 📈 **Reports**: Daily, weekly, and monthly stock movement reports
- ⚠️ **Low Stock Alerts**: Automatic notifications for low inventory
- 🏪 **Multi-Store Support**: Optional feature for multiple store locations

## Tech Stack

- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Firebase (Firestore + Authentication)
- **Barcode Scanner**: USB scanner (works as keyboard input)

## Project Structure

```
stock-management-system/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # Firebase and API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   └── utils/           # Utility functions
│   └── package.json
├── docs/                     # Documentation
│   ├── SYSTEM_DESIGN.md     # System architecture and flow
│   ├── DATABASE_SCHEMA.md   # Database structure
│   └── BARCODE_SETUP.md     # Barcode scanner setup guide
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Firebase account
- USB Barcode Scanner

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Copy Firebase config to `frontend/src/config/firebase.ts`

4. Run the application:
   ```bash
   npm start
   ```

## System Flow

1. **Login**: User authenticates with email/password
2. **Dashboard**: View stock overview and recent activities
3. **Scan/Enter Barcode**: Scan or manually enter product barcode
4. **View Product**: See product details and stock information
5. **Stock Operations**: Add stock IN or record stock OUT
6. **Reports**: Generate and view stock movement reports

## Database Structure

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for detailed database structure.

## Barcode Scanner Setup

See [BARCODE_SETUP.md](docs/BARCODE_SETUP.md) for barcode scanner integration instructions.

## License

MIT
