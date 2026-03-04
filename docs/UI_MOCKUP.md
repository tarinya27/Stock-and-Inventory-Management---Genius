# UI Mockup and Design Guide

## Design Principles

- **Clean and Modern**: Material-UI components for consistent, professional look
- **Easy to Use**: Large buttons, clear labels, intuitive navigation
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Accessible**: High contrast, keyboard navigation support

## Screen Layouts

### 1. Login Screen

```
┌─────────────────────────────────────┐
│                                     │
│    Stock Management System          │
│    Computer Shop Inventory          │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Email: [________________]     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Password: [_______________]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │        [ Login ]             │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### 2. Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ [Stock Management]                    [Admin] [Logout]      │
├──────────┬──────────────────────────────────────────────────┤
│          │ Dashboard                                         │
│          │ Welcome, Admin (admin)                            │
│          │                                                   │
│ [Dashboard] │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│ [Scan]      │ │ Low  │ │Today │ │Today │ │ Net  │         │
│ [Reports]   │ │Stock │ │  IN  │ │ OUT  │ │Today │         │
│ [Low Stock] │ │  5   │ │  25  │ │  10  │ │  15  │         │
│ [Products]  │ └──────┘ └──────┘ └──────┘ └──────┘         │
│             │                                                   │
│             │ Quick Actions                                    │
│             │ [Scan Barcode] [View Reports] [Manage Products] │
│             │                                                   │
│             │ Recent Activities                                │
│             │ ┌─────────────────────────────────────────────┐ │
│             │ │ +10 • 1234567890123 • 2024-01-29 • Admin  │ │
│             │ │ -5  • 9876543210987 • 2024-01-29 • Manager│ │
│             │ │ ...                                         │ │
│             │ └─────────────────────────────────────────────┘ │
└─────────────┴──────────────────────────────────────────────────┘
```

### 3. Scan Barcode Screen

```
┌─────────────────────────────────────────────────────────────┐
│ [Stock Management]                    [Admin] [Logout]      │
├──────────┬──────────────────────────────────────────────────┤
│          │ Scan Barcode                                     │
│          │ [← Back to Dashboard]                            │
│          │                                                   │
│ [Dashboard] │ ┌──────────────────────────────────────────┐ │
│ [Scan]      │ │ Scan or enter barcode...                  │ │
│ [Reports]   │ └──────────────────────────────────────────┘ │
│ [Low Stock] │                                                   │
│ [Products]  │ ┌──────────────┐  ┌──────────────┐          │
│             │ │ Product      │  │ Stock        │          │
│             │ │ Details      │  │ Information  │          │
│             │ │              │  │              │          │
│             │ │ Name: Mouse  │  │ Total IN: 100│          │
│             │ │ Barcode: ... │  │ Total OUT: 50│          │
│             │ │ Category: ...│  │ Balance: 50  │          │
│             │ │ Cost: $15    │  │              │          │
│             │ │ Price: $25   │  │ [Low Stock!] │          │
│             │ └──────────────┘  └──────────────┘          │
│             │                                                   │
│             │ [Stock IN] [Stock OUT]                          │
└─────────────┴──────────────────────────────────────────────────┘
```

### 4. Stock IN Dialog

```
┌─────────────────────────────────────┐
│ Add Stock IN                        │
├─────────────────────────────────────┤
│ Quantity: [____]                    │
│ Date: [2024-01-29 ▼]                │
│ Notes (Optional):                   │
│ [________________________]          │
│ [________________________]          │
│                                     │
│ [Cancel]        [Add Stock]         │
└─────────────────────────────────────┘
```

### 5. Stock OUT Dialog

```
┌─────────────────────────────────────┐
│ Record Stock OUT                     │
├─────────────────────────────────────┤
│ Quantity: [____]                     │
│ Available: 50                        │
│ Reason: [Sale ▼]                     │
│   - Sale                             │
│   - Return                           │
│   - Damaged                          │
│   - Other                            │
│ Date: [2024-01-29 ▼]                │
│ Notes (Optional):                    │
│ [________________________]           │
│                                     │
│ [Cancel]      [Record Stock OUT]     │
└─────────────────────────────────────┘
```

### 6. Reports Screen

```
┌─────────────────────────────────────────────────────────────┐
│ [Stock Management]                    [Admin] [Logout]      │
├──────────┬──────────────────────────────────────────────────┤
│          │ Stock Reports                                    │
│          │ [← Back to Dashboard]                            │
│          │                                                   │
│ [Dashboard] │ Date Range: [Daily ▼]                         │
│ [Scan]      │ Movement Type: [All ▼]                        │
│ [Reports]   │ [Generate Report]                             │
│ [Low Stock] │                                                   │
│ [Products]  │ ┌──────────────────────────────────────────┐ │
│             │ │ Date      │ Barcode │ Type │ Qty │ User │ │
│             │ ├───────────┼─────────┼──────┼─────┼──────┤ │
│             │ │ 2024-01-29│ 123...  │ IN   │ 10  │ Admin│ │
│             │ │ 2024-01-29│ 987...  │ OUT  │ 5   │ Mgr  │ │
│             │ │ ...       │ ...     │ ...  │ ... │ ...  │ │
│             │ └──────────────────────────────────────────┘ │
└─────────────┴──────────────────────────────────────────────────┘
```

### 7. Low Stock Screen

```
┌─────────────────────────────────────────────────────────────┐
│ [Stock Management]                    [Admin] [Logout]      │
├──────────┬──────────────────────────────────────────────────┤
│          │ Low Stock Alerts                                 │
│          │ [← Back to Dashboard]                            │
│          │                                                   │
│ [Dashboard] │ ┌──────────────────────────────────────────┐ │
│ [Scan]      │ │ Barcode │ Name │ Category │ Balance │   │ │
│ [Reports]   │ ├─────────┼──────┼──────────┼─────────┤   │ │
│ [Low Stock] │ │ 123...  │Mouse │ Mouse    │ 5 [Low] │   │ │
│ [Products]  │ │ 456...  │KB    │ Keyboard │ 0 [Out] │   │ │
│             │ │ ...     │ ...  │ ...      │ ...     │   │ │
│             │ └──────────────────────────────────────────┘ │
└─────────────┴──────────────────────────────────────────────────┘
```

### 8. Products Management Screen

```
┌─────────────────────────────────────────────────────────────┐
│ [Stock Management]                    [Admin] [Logout]      │
├──────────┬──────────────────────────────────────────────────┤
│          │ Products Management                              │
│          │ [← Back] [Add Product]                           │
│          │                                                   │
│ [Dashboard] │ ┌──────────────────────────────────────────┐ │
│ [Scan]      │ │ Barcode │ Name │ Category │ Cost │ Price│ │
│ [Reports]   │ ├─────────┼──────┼──────────┼──────┼──────┤ │
│ [Low Stock] │ │ 123...  │Mouse │ Mouse    │ $15  │ $25  │ │
│ [Products]  │ │ 456...  │KB    │ Keyboard │ $20  │ $35  │ │
│             │ │ ...     │ ...  │ ...      │ ...  │ ...  │ │
│             │ └──────────────────────────────────────────┘ │
└─────────────┴──────────────────────────────────────────────────┘
```

## Color Scheme

- **Primary**: Blue (#1976d2) - Main actions, headers
- **Success**: Green - Stock IN, positive values
- **Error**: Red - Stock OUT, negative values, warnings
- **Warning**: Orange - Low stock alerts
- **Background**: White/Light Gray - Clean, professional

## Typography

- **Headers**: Bold, 24-32px
- **Body**: Regular, 14-16px
- **Labels**: Medium, 12-14px
- **Inputs**: 18px (for barcode scanner visibility)

## Component Specifications

### Buttons
- Primary: Contained, blue background
- Secondary: Outlined, blue border
- Danger: Contained, red background (Stock OUT)
- Success: Contained, green background (Stock IN)
- Size: Large (48px height) for main actions

### Cards
- Elevation: 2-3 (subtle shadow)
- Padding: 16-24px
- Border radius: 4-8px

### Input Fields
- Barcode input: 18px font, auto-focus
- Standard inputs: 14-16px font
- Full width on mobile, constrained on desktop

### Tables
- Striped rows for readability
- Hover effects on rows
- Responsive: Scroll on mobile

## Responsive Breakpoints

- **Mobile**: < 600px - Single column, stacked layout
- **Tablet**: 600px - 960px - Two columns where appropriate
- **Desktop**: > 960px - Full layout with sidebar

## Accessibility Features

- Keyboard navigation support
- ARIA labels on icons
- High contrast text
- Focus indicators
- Screen reader friendly

## User Flow Diagrams

### Stock IN Flow
```
Scan Barcode → View Product → Click "Stock IN" → 
Enter Quantity → Enter Date → Add Notes → Submit → 
Confirmation → Return to Scanner
```

### Stock OUT Flow
```
Scan Barcode → View Product → Click "Stock OUT" → 
Enter Quantity → Select Reason → Enter Date → 
Add Notes → Submit → Validation (check balance) → 
Confirmation → Return to Scanner
```

### Report Generation Flow
```
Navigate to Reports → Select Date Range → 
Select Movement Type → Click "Generate" → 
View Results → (Optional) Export
```
