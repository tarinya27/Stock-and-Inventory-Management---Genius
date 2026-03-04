# Supermarket-Style Inventory Design

## Overview

The Product section and related flows have been redesigned to work like a supermarket inventory system with categories, automated stock-in, and clear reports.

---

## 1. Category Management

- **Location:** Sidebar → **Categories**
- **Category code:** Auto-generated (e.g. CAT0001, CAT0002) when you create a new category.
- **Actions:** Create (name only; code is generated), Edit name, Delete.
- **Creating a category on the fly:** From **Stock In** you can open “Create new category” to add a category, then continue with stock-in.

---

## 2. Product Stock-In Process

- **Location:** Sidebar → **Stock In**
- **Flow:**
  1. **Select category** (or create one via “Create new category”).
  2. **Enter total quantity** to receive (e.g. 100).
  3. **Scan each barcode** in the single barcode field (scanner or type + Enter).
- **Behaviour:**
  - One scan = one unit added (quantity 1) for that barcode.
  - After each scan the system looks up the product by barcode:
    - **If found:** Product name, purchase price, category, etc. are shown; one unit is added to stock.
    - **If not found:** A new product is created with the selected category, name “Product {barcode}”, purchase price 0 (editable later), and one unit is added to stock.
  - A table lists all scanned items with product name, purchase price, category, and quantity (auto-filled from barcode).
- **No manual product form** during stock-in; details come from existing product or from the new product created on first scan.

---

## 3. Product Management

- **Location:** Sidebar → **Products**
- **Table:** Barcode, Name, Category, Purchase price, Selling price, **Balance**, Low stock, Actions.
- **Actions:**
  - **Edit (e.g. purchase price):** Open product dialog; edit purchase price, selling price, name, category, low stock threshold, etc.
  - **Adjust stock:** Open dialog; choose **Stock In** (add) or **Stock Out** (remove), enter quantity; balance updates automatically.
  - **Delete:** Delete product (with confirmation).
- **Balance** is computed from stock_in and stock_out and updates after every transaction.

---

## 4. Inventory (Stock In / Stock Out / Balance)

- **Stock In:** Via **Stock In** page (bulk scan) or **Products** → Adjust stock → Stock In.
- **Stock Out:** Via **Scan Barcode** (existing) or **Products** → Adjust stock → Stock Out.
- **Balance:** Shown in Products table and in Scan Barcode; always **Total IN − Total OUT**, updated after each transaction.

---

## 5. Low Stock Alert

- **Dashboard:** If any product is below its low stock threshold, a **Low Stock Alert** block shows:
  - Product name  
  - Remaining quantity  
  - Barcode  
  - Link to “View all low stock”.
- **Low Stock page:** Full list of low stock items (unchanged).

---

## 6. Reports

- **Location:** Sidebar → **Reports**
- **Report types:**
  - **Stock In Report:** Movements of type IN (filterable by date and category).
  - **Stock Out Report:** Movements of type OUT (filterable by date and category).
  - **Current Stock Report:** All products (or by category) with current balance.
  - **Low Stock Report:** Products below threshold (filterable by category).
- **Filters:** Date range (for In/Out), **Category** (for all report types).

---

## Data Model (summary)

- **categories:** `categoryCode` (document ID, e.g. CAT0001), `name`, `createdAt`.
- **products:** `barcode` (document ID), `name`, `category`, `categoryCode`, `costPrice`, `sellingPrice`, `lowStockThreshold`, timestamps.
- **stock_in / stock_out:** Unchanged (barcode, quantity, date, user, notes/reason); balance = sum(in) − sum(out).

---

## Navigation (sidebar)

- Dashboard  
- Scan Barcode  
- **Stock In** (new)  
- Reports  
- Low Stock  
- **Categories** (new)  
- Products  

All of the above is implemented and wired to the existing Firebase/Firestore backend.
