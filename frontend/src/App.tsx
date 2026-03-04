import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ScanBarcode } from './pages/ScanBarcode';
import { Reports } from './pages/Reports';
import { LowStock } from './pages/LowStock';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { StockIn } from './pages/StockIn';
import { StockSheet } from './pages/StockSheet';
import { LoginHistory } from './pages/LoginHistory';
import { AppLayout } from './components/AppLayout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Reports: Admin and Store Manager */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Login History: Admin only */}
            <Route
              path="/login-history"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppLayout>
                    <LoginHistory />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Low Stock: Admin and Store Manager */}
            <Route
              path="/low-stock"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LowStock />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Store Manager-only routes */}
            <Route
              path="/scan"
              element={
                <ProtectedRoute requiredRole="store_manager">
                  <AppLayout>
                    <ScanBarcode />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute requiredRole="store_manager">
                  <AppLayout>
                    <Categories />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-in"
              element={
                <ProtectedRoute requiredRole="store_manager">
                  <AppLayout>
                    <StockIn />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-sheet"
              element={
                <ProtectedRoute requiredRole="store_manager">
                  <AppLayout>
                    <StockSheet />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Shared routes (accessible to both roles) */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Products />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
