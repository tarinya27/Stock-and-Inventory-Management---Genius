import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Button,
  Alert
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecentMovements } from '../services/stockService';
import { getGroupedProductsForStoreManager } from '../services/productService';
import { getLatestLoginLog } from '../services/loginLogService';
import type { LoginLog } from '../services/loginLogService';
import { auth } from '../config/firebase';
import { StockMovement } from '../types';
import { Inventory2, TrendingUp, TrendingDown, Warning, WavingHand, Inventory, ArrowForward, Person } from '@mui/icons-material';

const PRIMARY_RED = '#db342c';
const PRIMARY_BLUE = '#1976d2';
// Store manager: #78121c theme + 4 distinct card colors
const SM_PRIMARY = '#78121c';
const SM_PRIMARY_DARK = '#5c0e15';
const SM_CARD_IN = '#78121c';      // matches nav
const SM_CARD_OUT = '#00897b';     // teal
const SM_CARD_NET = '#546e7a';     // slate
const SM_CARD_LOW = '#ff8f00';     // amber

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isStoreManager = user?.role === 'store_manager';
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [lowStockList, setLowStockList] = useState<Array<{ name: string; balance: number; barcode: string }>>([]);
  const [todayIn, setTodayIn] = useState(0);
  const [todayOut, setTodayOut] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastLoginLog, setLastLoginLog] = useState<LoginLog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Ensure auth token is ready before Firestore requests (fixes "Missing or insufficient permissions" in Electron)
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      const [movements, groupedProducts, latestLog] = await Promise.all([
        getRecentMovements(10),
        getGroupedProductsForStoreManager(),
        getLatestLoginLog()
      ]);
      setLastLoginLog(latestLog);
      setRecentMovements(movements);
      setTotalProducts(groupedProducts.length);

      const totalIn = groupedProducts.reduce((sum, g) => sum + g.totalStockIn, 0);
      const totalOut = groupedProducts.reduce((sum, g) => sum + g.totalStockOut, 0);
      setTodayIn(totalIn);
      setTodayOut(totalOut);

      const lowStock = groupedProducts
        .filter((g) => g.balance <= g.lowStockThreshold)
        .map((g) => ({ name: g.productName, balance: g.balance, barcode: g.barcodes[0] ?? '' }));
      setLowStockList(lowStock);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      // Retry once if permission error (auth token may not have been ready)
      if (msg.toLowerCase().includes('permission') && auth.currentUser) {
        await new Promise((r) => setTimeout(r, 800));
        try {
          await auth.currentUser.getIdToken(true);
          const [movements, groupedProducts, latestLog] = await Promise.all([
            getRecentMovements(10),
            getGroupedProductsForStoreManager(),
            getLatestLoginLog()
          ]);
          setLastLoginLog(latestLog);
          setRecentMovements(movements);
          setTotalProducts(groupedProducts.length);
          const totalIn = groupedProducts.reduce((sum, g) => sum + g.totalStockIn, 0);
          const totalOut = groupedProducts.reduce((sum, g) => sum + g.totalStockOut, 0);
          setTodayIn(totalIn);
          setTodayOut(totalOut);
          const lowStock = groupedProducts
            .filter((g) => g.balance <= g.lowStockThreshold)
            .map((g) => ({ name: g.productName, balance: g.balance, barcode: g.barcodes[0] ?? '' }));
          setLowStockList(lowStock);
          setLoadError(null);
          return;
        } catch (retryError) {
          setLoadError(retryError instanceof Error ? retryError.message : String(retryError));
        }
      } else {
        setLoadError(msg);
      }
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isOnDashboard = location.pathname === '/dashboard' || location.pathname === '/';
    if (!isOnDashboard) return;
    // Brief delay so auth token is ready for Firestore (fixes Electron "permission denied")
    const timer = setTimeout(loadDashboardData, 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const d = timestamp.toDate?.() ?? new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatLoginDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const d = timestamp.toDate?.() ?? new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatLoginTime = (timestamp: any) => {
    if (!timestamp) return '—';
    const d = timestamp.toDate?.() ?? new Date(timestamp);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const maxToday = Math.max(todayIn + todayOut, 1);
  const inPercent = (todayIn / maxToday) * 100;
  const outPercent = (todayOut / maxToday) * 100;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Data load error - helps debug Firebase/network issues */}
      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={loadDashboardData}>
              Retry
            </Button>
          }
        >
          Could not load dashboard data. {loadError} Check internet connection and Firebase config.
        </Alert>
      )}

      {/* Last Logged In User widget - visible to admin and store_manager */}
      {lastLoginLog && (
        <Paper
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            border: '1px solid rgba(0,0,0,0.06)',
            bgcolor: 'rgba(255,255,255,0.8)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: isStoreManager ? 'rgba(120, 18, 28, 0.1)' : 'rgba(219, 52, 44, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Person sx={{ fontSize: 28, color: isStoreManager ? SM_PRIMARY : PRIMARY_RED }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Last Logged In User
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {lastLoginLog.userName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lastLoginLog.role === 'admin' ? 'Admin' : 'Store Manager'} • {formatLoginDate(lastLoginLog.loginTime)} • {formatLoginTime(lastLoginLog.loginTime)}
            </Typography>
          </Box>
        </Paper>
      )}

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <WavingHand
          sx={{
            fontSize: 32,
            color: isStoreManager ? SM_PRIMARY : '#ffc107',
            animation: 'wave 1.2s ease-in-out infinite',
            '@keyframes wave': {
              '0%, 100%': { transform: 'rotate(0deg)' },
              '25%': { transform: 'rotate(20deg)' },
              '75%': { transform: 'rotate(-10deg)' }
            }
          }}
        />
        <Typography
          variant={isStoreManager ? "h5" : "body1"}
          color="text.secondary"
          sx={{
            fontFamily: isStoreManager ? "'Inter', sans-serif" : "'Poppins', 'Segoe UI', sans-serif",
            ...(isStoreManager && {
              fontWeight: 600,
              color: SM_PRIMARY,
              fontSize: '1.25rem'
            }),
            ...(!isStoreManager && {
              fontSize: '1.4rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: 'text.primary'
            })
          }}
        >
          {isStoreManager ? `Welcome, ${user?.displayName}` : `Welcome back, ${user?.displayName}`}
        </Typography>
      </Box>

      {/* Statistic cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Store Manager: Stock IN first, Admin: Low Stock first */}
        {isStoreManager ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(25, 118, 210, 0.3)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Total Products
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        manage in Products
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: PRIMARY_BLUE }}>
                        {totalProducts}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(25, 118, 210, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Inventory sx={{ fontSize: 28, color: PRIMARY_BLUE }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(120, 18, 28, 0.3)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Total Stock In
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        from product table (all products)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: SM_CARD_IN }}>
                        {todayIn}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={inPercent}
                        sx={{
                          mt: 1.5,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(120, 18, 28, 0.12)',
                          '& .MuiLinearProgress-bar': { bgcolor: SM_CARD_IN, borderRadius: 3 }
                        }}
                      />
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(120, 18, 28, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp sx={{ fontSize: 28, color: SM_CARD_IN }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0, 137, 123, 0.3)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Total Stock Out
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        from product table (all products)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: SM_CARD_OUT }}>
                        {todayOut}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={outPercent}
                        sx={{
                          mt: 1.5,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(0, 137, 123, 0.12)',
                          '& .MuiLinearProgress-bar': { bgcolor: SM_CARD_OUT, borderRadius: 3 }
                        }}
                      />
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(0, 137, 123, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingDown sx={{ fontSize: 28, color: SM_CARD_OUT }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(84, 110, 122, 0.3)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Net Stock
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Stock In − Stock Out (product table)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: todayIn - todayOut >= 0 ? SM_CARD_NET : '#c62828' }}>
                        {todayIn - todayOut}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(84, 110, 122, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Inventory2 sx={{ fontSize: 28, color: SM_CARD_NET }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255, 143, 0, 0.35)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Low Stock Items
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: SM_CARD_LOW }}>
                        {lowStockList.length}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(lowStockList.length * 10, 100)}
                        sx={{
                          mt: 1.5,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 143, 0, 0.12)',
                          '& .MuiLinearProgress-bar': { bgcolor: SM_CARD_LOW, borderRadius: 3 }
                        }}
                      />
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(255, 143, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Warning sx={{ fontSize: 28, color: SM_CARD_LOW }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(25, 118, 210, 0.3)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Total Products
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        manage in Products
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: PRIMARY_BLUE }}>
                        {totalProducts}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.25s ease',
                        '.MuiCard-root:hover &': { transform: 'scale(1.05)' }
                      }}
                    >
                      <Inventory sx={{ fontSize: 28, color: PRIMARY_BLUE }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(219, 52, 44, 0.25)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Low Stock Items
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        view in Products
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: PRIMARY_RED }}>
                        {lowStockList.length}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(lowStockList.length * 10, 100)}
                        sx={{
                          mt: 1.5,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(219, 52, 44, 0.12)',
                          '& .MuiLinearProgress-bar': { bgcolor: PRIMARY_RED, transition: 'transform 0.5s ease' }
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'rgba(219, 52, 44, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.25s ease',
                        '.MuiCard-root:hover &': { transform: 'scale(1.05)' }
                      }}
                    >
                      <Warning sx={{ fontSize: 28, color: PRIMARY_RED }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(46, 125, 50, 0.25)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Total Stock In
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        from product table (all products)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                        {todayIn}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={inPercent}
                        sx={{
                          mt: 1.5,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(46, 125, 50, 0.12)',
                          '& .MuiLinearProgress-bar': { bgcolor: '#2e7d32', transition: 'transform 0.5s ease' }
                        }}
                      />
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(46, 125, 50, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.25s ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }}>
                      <TrendingUp sx={{ fontSize: 28, color: '#2e7d32' }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(21, 101, 192, 0.2)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Total Stock Out
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        from product table (all products)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565c0' }}>
                        {todayOut}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={outPercent}
                        sx={{
                          mt: 1.5,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(21, 101, 192, 0.12)',
                          '& .MuiLinearProgress-bar': { bgcolor: '#1565c0', transition: 'transform 0.5s ease' }
                        }}
                      />
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(21, 101, 192, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.25s ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }}>
                      <TrendingDown sx={{ fontSize: 28, color: '#1565c0' }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/products')}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255, 167, 38, 0.35)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Net Stock
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Stock In − Stock Out (product table)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: todayIn - todayOut >= 0 ? '#f57c00' : '#d32f2f' }}>
                        {todayIn - todayOut}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(255, 167, 38, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.25s ease', '.MuiCard-root:hover &': { transform: 'scale(1.05)' } }}>
                      <Inventory2 sx={{ fontSize: 28, color: '#f57c00' }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Quick Actions - Products section */}
      <Paper
        sx={{
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          p: 2,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isStoreManager ? SM_PRIMARY : '#1a1a1a', mb: 0.5 }}>
            Products Section
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage all products, stock levels, and inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={() => navigate('/products')}
          sx={{
            bgcolor: isStoreManager ? SM_PRIMARY : PRIMARY_RED,
            '&:hover': { bgcolor: isStoreManager ? SM_PRIMARY_DARK : '#c02e27' }
          }}
        >
          Manage Products
        </Button>
      </Paper>

      {/* Low stock alert card */}
      {lowStockList.length > 0 && (
        <Paper
          sx={{
            borderRadius: 3,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: isStoreManager ? '1px solid rgba(120, 18, 28, 0.25)' : '1px solid rgba(219, 52, 44, 0.2)',
            borderLeft: isStoreManager ? '4px solid ' + SM_PRIMARY : '4px solid ' + PRIMARY_RED,
            p: 2,
            mb: 3,
            ...(!isStoreManager && {
              transition: 'box-shadow 0.25s ease',
              '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }
            })
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isStoreManager ? SM_PRIMARY : PRIMARY_RED }}>
              Low Stock Alert
            </Typography>
            <Chip
              label={`${lowStockList.length} items`}
              size="small"
              sx={{ 
                bgcolor: isStoreManager ? 'rgba(120, 18, 28, 0.12)' : 'rgba(219, 52, 44, 0.12)', 
                color: isStoreManager ? SM_PRIMARY : PRIMARY_RED, 
                fontWeight: 600,
                ...(!isStoreManager && {
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': { transform: 'scale(1.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
                })
              }}
              onClick={() => navigate('/products')}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Product name and remaining quantity
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {lowStockList.slice(0, 5).map((item) => (
              <li key={item.barcode}>
                <Typography variant="body2">
                  <strong>{item.name}</strong> — Remaining: <Box component="span" sx={{ color: isStoreManager ? SM_PRIMARY : PRIMARY_RED, fontWeight: 600 }}>{item.balance}</Box>
                </Typography>
              </li>
            ))}
          </Box>
          {lowStockList.length > 5 && (
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: isStoreManager ? SM_PRIMARY : PRIMARY_RED,
                cursor: 'pointer',
                fontWeight: 500,
                ...(!isStoreManager && {
                  transition: 'opacity 0.2s ease',
                  '&:hover': { opacity: 0.85, textDecoration: 'underline' }
                })
              }}
              onClick={() => navigate('/products')}
            >
              View all ({lowStockList.length}) →
            </Typography>
          )}
        </Paper>
      )}

      {/* Recent Activity table */}
      <Paper
        sx={{
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          overflow: 'hidden',
          ...(!isStoreManager && {
            transition: 'box-shadow 0.25s ease',
            '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }
          })
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isStoreManager ? SM_PRIMARY : '#1a1a1a' }}>
            Recent Activity
          </Typography>
          {!isStoreManager && (
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/reports')}
              sx={{ color: PRIMARY_RED }}
            >
              View full Reports
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#5f5f5f', fontFamily: "'Inter', sans-serif" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5f5f5f' }}>Barcode</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5f5f5f' }} align="right">Quantity</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5f5f5f' }}>Date &amp; time</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5f5f5f' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#5f5f5f' }}>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Loading…
                  </TableCell>
                </TableRow>
              ) : recentMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No recent activity
                  </TableCell>
                </TableRow>
              ) : (
                recentMovements.map((m) => (
                  <TableRow
                    key={m.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 'none' },
                      ...(!isStoreManager && { transition: 'background-color 0.2s ease' })
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={m.type}
                        size="small"
                        sx={{
                          bgcolor: m.type === 'IN'
                            ? (isStoreManager ? 'rgba(0, 137, 123, 0.15)' : 'rgba(46, 125, 50, 0.12)')
                            : (isStoreManager ? 'rgba(120, 18, 28, 0.15)' : 'rgba(219, 52, 44, 0.12)'),
                          color: m.type === 'IN'
                            ? (isStoreManager ? SM_CARD_OUT : '#2e7d32')
                            : (isStoreManager ? SM_PRIMARY : PRIMARY_RED),
                          fontWeight: 600,
                          border: 'none'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{m.barcode}</TableCell>
                    <TableCell align="right" sx={{
                      fontWeight: 600,
                      color: m.type === 'OUT'
                        ? (isStoreManager ? SM_PRIMARY : PRIMARY_RED)
                        : (isStoreManager ? SM_CARD_OUT : '#2e7d32')
                    }}>
                      {m.type === 'IN' ? '+' : '−'}{m.quantity}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{formatDate(m.date)}</TableCell>
                    <TableCell>{m.userName || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{m.reason || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
