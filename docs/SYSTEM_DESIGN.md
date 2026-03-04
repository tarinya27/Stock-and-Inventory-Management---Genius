# System Design Document

## Overview

The Stock Management System is a web-based application designed for computer shops to manage inventory remotely with barcode scanning capabilities.

## User Roles

### Admin
- Full system access
- Manage users and roles
- View all stores and stock
- Generate reports
- Configure system settings

### Store Manager
- View and manage stock
- Add stock IN
- Record stock OUT
- View reports for assigned store(s)
- Cannot manage users

## Screen Flow

### 1. Login Screen
- Email and password input
- Role-based redirect after login
- "Remember me" option

### 2. Dashboard
- **Overview Cards**:
  - Total Products
  - Low Stock Items (count)
  - Today's Stock IN
  - Today's Stock OUT
- **Recent Activities**: Last 10 stock movements
- **Quick Actions**: Scan Barcode, Add Stock, View Reports

### 3. Barcode Scanner/Entry Screen
- **Barcode Input**: 
  - Auto-focus input field (for USB scanner)
  - Manual entry option
  - Search by product name (optional)
- **Product Display** (after scan):
  - Product Name
  - Category
  - Barcode
  - Cost Price
  - Selling Price
  - Stock Information:
    - Total IN
    - Total OUT
    - Balance (Total IN - Total OUT)
- **Action Buttons**:
  - Stock IN
  - Stock OUT
  - View History

### 4. Stock IN Screen
- Product details display
- Quantity input
- Date picker (defaults to today)
- Notes/Reason field
- Submit button
- Confirmation dialog

### 5. Stock OUT Screen
- Product details display
- Quantity input (with balance validation)
- Date picker (defaults to today)
- Reason/Sale type dropdown
- Notes field
- Submit button
- Confirmation dialog

### 6. Reports Screen
- **Filters**:
  - Date range (Daily, Weekly, Monthly, Custom)
  - Product/Category filter
  - Movement type (IN, OUT, Both)
- **Report Display**:
  - Table with columns: Date, Product, Barcode, Type (IN/OUT), Quantity, User
  - Export to CSV/PDF option
  - Summary statistics

### 7. Products Management Screen (Admin)
- Product list with search
- Add/Edit/Delete products
- Bulk import option

### 8. Low Stock Alerts Screen
- List of products below threshold
- Configurable threshold per product
- Alert notifications

## System Flow Diagram

```
Login → Dashboard
  ↓
Scan Barcode → Product Details
  ↓
[Stock IN] OR [Stock OUT]
  ↓
Confirmation → Update Database
  ↓
Return to Dashboard/Scanner
```

## Key Features

### Barcode Scanning
- USB barcode scanner works as keyboard input
- Auto-focus on barcode input field
- Automatic product lookup on scan
- Manual entry fallback

### Stock Balance Calculation
- **Balance = Total IN - Total OUT**
- Calculated in real-time
- Displayed on product details screen
- Used for validation in Stock OUT

### Remote Access
- Web-based application
- Firebase hosting
- Accessible from any device with internet
- Real-time database updates

### Data Validation
- Prevent negative balance
- Validate barcode uniqueness
- Required field validation
- Date range validation for reports

## Security

- Firebase Authentication for user management
- Firestore Security Rules for data access
- Role-based access control
- Audit trail (user tracking for all operations)

## Performance Considerations

- Indexed Firestore queries
- Pagination for large datasets
- Optimistic UI updates
- Caching frequently accessed products
