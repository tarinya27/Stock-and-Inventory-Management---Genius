import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Alert,
  Card,
  CardContent,
  Grid,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import {
  getCurrentStockReport,
  getStockMovementReport,
  getReservedStockReport,
  getFastMovingProductsReport,
  getInventoryValueReport
} from '../services/reportService';
import type { StockStatus } from '../services/reportService';
import { Inventory2, Warning, Cancel, CheckCircle, LocalShipping, Search, Download } from '@mui/icons-material';
import * as XLSX from 'xlsx';

const ADMIN_RED = '#db342c';
const GREEN = '#2e7d32';
const ORANGE = '#ff8f00';
const CARD_STYLE = {
  borderRadius: 3,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  border: '1px solid rgba(0,0,0,0.04)',
  transition: 'all 0.2s ease',
  '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
};

type ReportTab = 'current_stock' | 'movement' | 'reserved' | 'fast_moving' | 'inventory_value';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStoreManager = user?.role === 'store_manager';
  const [activeTab, setActiveTab] = useState<ReportTab>('current_stock');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Report 1: Current Stock
  const [currentStock, setCurrentStock] = useState<Awaited<ReturnType<typeof getCurrentStockReport>> | null>(null);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus | ''>('');
  const [stockSortBy, setStockSortBy] = useState<'balance' | 'name' | 'category'>('balance');
  const [stockSortOrder, setStockSortOrder] = useState<'asc' | 'desc'>('asc');

  const stockCategories = useMemo(
    () => (currentStock ? Array.from(new Set(currentStock.items.map((i) => i.category))).sort() : []),
    [currentStock]
  );

  const stockFilteredItems = useMemo(() => {
    if (!currentStock) return [];
    let list = currentStock.items;
    if (stockSearchQuery.trim()) {
      const q = stockSearchQuery.toLowerCase();
      list = list.filter((i) => i.productName.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    if (stockCategoryFilter) list = list.filter((i) => i.category === stockCategoryFilter);
    if (stockStatusFilter) list = list.filter((i) => i.status === stockStatusFilter);
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (stockSortBy === 'balance') cmp = a.balance - b.balance;
      else if (stockSortBy === 'name') cmp = a.productName.localeCompare(b.productName);
      else cmp = a.category.localeCompare(b.category);
      return stockSortOrder === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [currentStock, stockSearchQuery, stockCategoryFilter, stockStatusFilter, stockSortBy, stockSortOrder]);

  // Report 2: Movement
  const [movementPeriod, setMovementPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [movementStart, setMovementStart] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [movementEnd, setMovementEnd] = useState<Date | null>(new Date());
  const [movementData, setMovementData] = useState<Awaited<ReturnType<typeof getStockMovementReport>> | null>(null);

  // Report 3: Pending Delivery
  const [reservedData, setReservedData] = useState<Awaited<ReturnType<typeof getReservedStockReport>> | null>(null);
  const [reservedStart, setReservedStart] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d;
  });
  const [reservedEnd, setReservedEnd] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  });
  const [reservedStatusFilter, setReservedStatusFilter] = useState<'all' | 'overdue' | 'due_soon' | 'scheduled'>('all');
  const [reservedSearch, setReservedSearch] = useState('');
  const [reservedSortBy, setReservedSortBy] = useState<'expectedDate' | 'daysPending' | 'product'>('expectedDate');
  const [reservedSortOrder, setReservedSortOrder] = useState<'asc' | 'desc'>('asc');

  const reservedFilteredItems = useMemo(() => {
    if (!reservedData) return [];
    let list = reservedData.items;
    if (reservedSearch.trim()) {
      const q = reservedSearch.toLowerCase();
      list = list.filter((i) => i.productName.toLowerCase().includes(q) || i.barcode.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (reservedSortBy === 'expectedDate') {
        const da = a.expectedDate?.getTime() ?? 0;
        const db = b.expectedDate?.getTime() ?? 0;
        cmp = da - db;
      } else if (reservedSortBy === 'daysPending') cmp = a.daysPending - b.daysPending;
      else cmp = a.productName.localeCompare(b.productName);
      return reservedSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [reservedData, reservedSearch, reservedSortBy, reservedSortOrder]);

  // Report 4: Fast-moving
  const [fastStart, setFastStart] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [fastEnd, setFastEnd] = useState<Date | null>(new Date());
  const [fastMovingData, setFastMovingData] = useState<Awaited<ReturnType<typeof getFastMovingProductsReport>> | null>(null);
  const [fastSearch, setFastSearch] = useState('');
  const [fastSortBy, setFastSortBy] = useState<'productName' | 'totalOut' | 'latestSaleDate'>('totalOut');
  const [fastSortOrder, setFastSortOrder] = useState<'asc' | 'desc'>('desc');

  const fastFilteredItems = useMemo(() => {
    if (!fastMovingData) return [];
    let list = fastMovingData.items;
    if (fastSearch.trim()) {
      const q = fastSearch.toLowerCase();
      list = list.filter((i) => i.productName.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (fastSortBy === 'productName') cmp = a.productName.localeCompare(b.productName);
      else if (fastSortBy === 'totalOut') cmp = a.totalOut - b.totalOut;
      else cmp = (a.latestSaleDate ?? '').localeCompare(b.latestSaleDate ?? '');
      return fastSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [fastMovingData, fastSearch, fastSortBy, fastSortOrder]);

  // Report 5: Inventory value
  const [inventoryData, setInventoryData] = useState<Awaited<ReturnType<typeof getInventoryValueReport>> | null>(null);

  const inventoryTableItems = useMemo(() => {
    if (!inventoryData) return [];
    return [...inventoryData.byProduct].sort((a, b) => b.value - a.value);
  }, [inventoryData]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (activeTab === 'current_stock') {
        const data = await getCurrentStockReport();
        setCurrentStock(data);
      } else if (activeTab === 'movement') {
        const start = movementStart ?? new Date(Date.now() - 7 * 86400000);
        const end = movementEnd ?? new Date();
        const data = await getStockMovementReport(movementPeriod, start, end);
        setMovementData(data);
      } else if (activeTab === 'reserved') {
        const start = reservedStart ?? new Date(Date.now() - 30 * 86400000);
        const end = reservedEnd ?? new Date();
        const data = await getReservedStockReport(start, end, reservedStatusFilter);
        setReservedData(data);
      } else if (activeTab === 'fast_moving') {
        const start = fastStart ?? new Date(Date.now() - 30 * 86400000);
        const end = fastEnd ?? new Date();
        const data = await getFastMovingProductsReport(start, end);
        setFastMovingData(data);
      } else if (activeTab === 'inventory_value') {
        const data = await getInventoryValueReport();
        setInventoryData(data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setLoadError((error as Error).message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [activeTab, movementPeriod, movementStart, movementEnd, reservedStart, reservedEnd, reservedStatusFilter, fastStart, fastEnd]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const formatPeriodLabel = (value: string, period: 'day' | 'week' | 'month'): string => {
    if (!value) return value;
    const d = new Date();
    if (/^\d{4}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      d.setFullYear(y, m - 1, 1);
      return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }
    if (/^\d{4}-W\d{2}$/.test(value)) {
      const [y, w] = value.split('-');
      const weekNum = parseInt(w.replace('W', ''), 10);
      return `Week ${weekNum}, ${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, day] = value.split('-').map(Number);
      d.setFullYear(y, m - 1, day);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return value;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" fontWeight={600} color="#1a1a1a">
            {isStoreManager ? 'Store_Manager Reports' : 'Admin Reports'}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ color: ADMIN_RED, borderColor: ADMIN_RED, '&:hover': { borderColor: ADMIN_RED, bgcolor: 'rgba(219,52,44,0.04)' } }}>
            ← Back to Dashboard
          </Button>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v as ReportTab)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 56,
              px: 1,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 40,
                borderRadius: '9999px',
                mx: 0.5,
                fontWeight: 500,
                transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.15s ease',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(219, 52, 44, 0.08)',
                  color: ADMIN_RED,
                },
              },
              '& .Mui-selected': {
                bgcolor: 'rgba(219, 52, 44, 0.15)',
                color: ADMIN_RED,
                '&:hover': {
                  bgcolor: 'rgba(219, 52, 44, 0.22)',
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            <Tab label="Current Stock" value="current_stock" />
            <Tab label="Stock Movement" value="movement" />
            <Tab label="Pending Delivery" value="reserved" />
            <Tab label="Fast-Moving" value="fast_moving" />
            <Tab label="Inventory Value" value="inventory_value" />
          </Tabs>

          <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {(activeTab === 'movement') && (
              <>
                <TextField
                  select
                  size="small"
                  label="Period"
                  value={movementPeriod}
                  onChange={(e) => setMovementPeriod(e.target.value as 'day' | 'week' | 'month')}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="day">Daily</MenuItem>
                  <MenuItem value="week">Weekly</MenuItem>
                  <MenuItem value="month">Monthly</MenuItem>
                </TextField>
                <DatePicker label="Start" value={movementStart} onChange={(v) => setMovementStart(v)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
                <DatePicker label="End" value={movementEnd} onChange={(v) => setMovementEnd(v)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
              </>
            )}
            {(activeTab === 'reserved') && (
              <>
                <DatePicker label="Start" value={reservedStart} onChange={(v) => setReservedStart(v)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
                <DatePicker label="End" value={reservedEnd} onChange={(v) => setReservedEnd(v)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={reservedStatusFilter}
                  onChange={(e) => setReservedStatusFilter(e.target.value as 'all' | 'overdue' | 'due_soon' | 'scheduled')}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="due_soon">Due Soon</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                </TextField>
              </>
            )}
            {(activeTab === 'fast_moving') && (
              <>
                <DatePicker label="Start" value={fastStart} onChange={(v) => setFastStart(v)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
                <DatePicker label="End" value={fastEnd} onChange={(v) => setFastEnd(v)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
              </>
            )}
            <Button variant="contained" onClick={loadReport} disabled={loading} sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}>
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mt: 2 }}>
            <Typography sx={{ mb: 1 }}>Loading report...</Typography>
            <Typography variant="body2">Please wait.</Typography>
          </Paper>
        ) : loadError ? (
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mt: 2 }}>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>Report failed to load</Typography>
            <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>
            <Button variant="contained" onClick={loadReport} sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}>
              Retry
            </Button>
          </Paper>
        ) : activeTab === 'movement' && !movementData ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mt: 2 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Select period and date range, then click &quot;Generate Report&quot; to load the Stock Movement report.</Typography>
            <Button variant="contained" onClick={loadReport} sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}>
              Generate Report
            </Button>
          </Paper>
        ) : activeTab === 'reserved' && !reservedData ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mt: 2 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Select date range and status filter, then click &quot;Generate Report&quot; to load the Pending Delivery report.</Typography>
            <Button variant="contained" onClick={loadReport} sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}>
              Generate Report
            </Button>
          </Paper>
        ) : activeTab === 'fast_moving' && !fastMovingData ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mt: 2 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>Fast-Moving Products Report</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Select date range above, then click &quot;Generate Report&quot; to load sales data.</Typography>
            <Button variant="contained" size="large" onClick={loadReport} sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}>
              Generate Report
            </Button>
          </Paper>
        ) : activeTab === 'current_stock' && !currentStock ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mt: 2 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Click &quot;Generate Report&quot; to load the Current Stock report.</Typography>
            <Button variant="contained" onClick={loadReport} sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}>
              Generate Report
            </Button>
          </Paper>
        ) : activeTab === 'inventory_value' && !inventoryData ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mt: 2 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Click &quot;Generate Report&quot; to load the Inventory Value report.</Typography>
            <Button variant="contained" onClick={loadReport} sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}>
              Generate Report
            </Button>
          </Paper>
        ) : null}

        {/* Report 1: Current Stock - Redesigned */}
        {activeTab === 'current_stock' && !loading && !loadError && currentStock && (() => {
          const donutData = [
            { name: 'OK', value: currentStock.healthyStockCount, color: GREEN },
            { name: 'Low', value: currentStock.lowStockCount, color: ORANGE },
            { name: 'Out of stock', value: currentStock.outOfStockCount, color: ADMIN_RED }
          ].filter((d) => d.value > 0);

          const barData = [...stockFilteredItems].slice(0, 12).reverse();

          const hasProducts = currentStock.items.length > 0;

          const handleDownloadExcel = () => {
            const summaryData = [
              ['Current Stock Report'],
              ['Generated', new Date().toLocaleString()],
              [],
              ['Summary'],
              ['Total Products', currentStock.totalProducts],
              ['Low Stock Items', currentStock.lowStockCount],
              ['Out of Stock', currentStock.outOfStockCount],
              ['Healthy Stock', currentStock.healthyStockCount],
              ['Pending Delivery', currentStock.pendingDeliveryCount],
              [],
              ['Product Name', 'Category', 'Balance', 'Status']
            ];
            const tableRows = stockFilteredItems.map((r) => [
              r.productName,
              r.category,
              r.balance,
              r.status === 'out' ? 'Out of Stock' : r.status === 'low' ? 'Low' : 'OK'
            ]);
            const wsData = [...summaryData, ...tableRows];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Current Stock');
            XLSX.writeFile(wb, `current-stock-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
          };

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={600} color="text.primary">Current Stock Report</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={handleDownloadExcel}
                  sx={{ color: ADMIN_RED, borderColor: ADMIN_RED, '&:hover': { borderColor: ADMIN_RED, bgcolor: 'rgba(219,52,44,0.04)' } }}
                >
                  Download Excel
                </Button>
              </Box>
              {!hasProducts && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No products in the system yet. Add products in the Products section to see stock data here.
                </Alert>
              )}
              {/* 1. KPI Cards */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Card sx={{ ...CARD_STYLE, cursor: 'default', flex: '1 1 180px', minWidth: 160 }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Inventory2 sx={{ fontSize: 28, color: '#1976d2' }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Products</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="#1976d2">{currentStock.totalProducts}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, cursor: 'default', flex: '1 1 180px', minWidth: 160 }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Warning sx={{ fontSize: 28, color: ORANGE }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Low Stock Items</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={700} color={ORANGE}>{currentStock.lowStockCount}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, cursor: 'default', flex: '1 1 180px', minWidth: 160 }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Cancel sx={{ fontSize: 28, color: ADMIN_RED }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Out of Stock</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={700} color={ADMIN_RED}>{currentStock.outOfStockCount}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, cursor: 'default', flex: '1 1 180px', minWidth: 160 }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <CheckCircle sx={{ fontSize: 28, color: GREEN }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Healthy Stock</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={700} color={GREEN}>{currentStock.healthyStockCount}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, cursor: 'pointer', flex: '1 1 180px', minWidth: 160 }} onClick={() => setActiveTab('reserved')}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <LocalShipping sx={{ fontSize: 28, color: '#546e7a' }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Pending Delivery</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="#546e7a">{currentStock.pendingDeliveryCount}</Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* 2. Charts Section */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>Stock balance per product (top 12)</Typography>
                    <Box sx={{ height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" horizontal vertical={false} />
                          <XAxis type="number" tick={{ fontSize: 12 }} axisLine={{ stroke: '#e0e0e0' }} />
                          <YAxis
                            type="category"
                            dataKey="productName"
                            width={200}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => (typeof v === 'string' && v.length > 24 ? v.slice(0, 21) + '…' : v)}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                          />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: 8 }} labelFormatter={(_, payload) => payload?.[0]?.payload?.productName ?? ''} />
                          <Bar dataKey="balance" name="Balance" radius={[0, 4, 4, 0]}>
                            {barData.map((entry, i) => (
                              <Cell key={i} fill={entry.status === 'out' ? ADMIN_RED : entry.status === 'low' ? ORANGE : GREEN} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>Stock status breakdown</Typography>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData.length > 0 ? donutData : [{ name: 'No data', value: 1, color: '#e0e0e0' }]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                            paddingAngle={2} dataKey="value" nameKey="name"
                            label={({ name, value, percent }) => (name !== 'No data' && percent != null && percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : name)}
                          >
                            {(donutData.length > 0 ? donutData : [{ color: '#e0e0e0' }]).map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Items']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* 3. Smart Alerts */}
              {(currentStock.lowStockCount > 0 || currentStock.outOfStockCount > 0) && (
                <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', bgcolor: '#fffbf5' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                    {currentStock.outOfStockCount > 0 && (
                      <Alert severity="error" sx={{ borderRadius: 2, flex: '1 1 200px' }} icon={<Cancel />}>
                        {currentStock.outOfStockCount} product(s) out of stock
                      </Alert>
                    )}
                    {currentStock.lowStockCount > 0 && (
                      <Alert severity="warning" sx={{ borderRadius: 2, flex: '1 1 200px' }} icon={<Warning />}>
                        {currentStock.lowStockCount} product(s) low in stock
                      </Alert>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate('/low-stock')}
                      sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}
                    >
                      View low stock items
                    </Button>
                  </Box>
                </Paper>
              )}

              {/* 4. Detailed Table */}
              <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    size="small"
                    placeholder="Search product or category..."
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    sx={{ minWidth: 220 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField select size="small" label="Category" value={stockCategoryFilter} onChange={(e) => setStockCategoryFilter(e.target.value)} sx={{ minWidth: 160 }}>
                    <MenuItem value="">All</MenuItem>
                    {stockCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <TextField select size="small" label="Status" value={stockStatusFilter} onChange={(e) => setStockStatusFilter(e.target.value as StockStatus | '')} sx={{ minWidth: 140 }}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="ok">OK</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="out">Out of stock</MenuItem>
                  </TextField>
                  <TextField select size="small" label="Sort by" value={stockSortBy} onChange={(e) => setStockSortBy(e.target.value as 'balance' | 'name' | 'category')} sx={{ minWidth: 120 }}>
                    <MenuItem value="balance">Balance</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                  </TextField>
                  <Button size="small" onClick={() => setStockSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}>
                    {stockSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>Category</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>Balance</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockFilteredItems.map((r) => (
                        <TableRow key={r.productName} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                          <TableCell>{r.productName}</TableCell>
                          <TableCell>{r.category}</TableCell>
                          <TableCell align="right">{r.balance}</TableCell>
                          <TableCell>
                            <Chip
                              label={r.status === 'out' ? 'OUT' : r.status === 'low' ? 'LOW' : 'OK'}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: r.status === 'out' ? 'rgba(219,52,44,0.12)' : r.status === 'low' ? 'rgba(255,143,0,0.12)' : 'rgba(46,125,50,0.12)',
                                color: r.status === 'out' ? ADMIN_RED : r.status === 'low' ? ORANGE : GREEN
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          );
        })()}

        {/* Report 2: Stock Movement - Redesigned */}
        {activeTab === 'movement' && !loading && movementData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary">Stock Movement Report</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download />}
                onClick={() => {
                  const summaryData = [
                    ['Stock Movement Report'],
                    ['Period', movementPeriod === 'day' ? 'Daily' : movementPeriod === 'week' ? 'Weekly' : 'Monthly'],
                    ['Generated', new Date().toLocaleString()],
                    [],
                    ['Summary'],
                    ['Total Stock In', movementData.totalIn],
                    ['Total Stock Out', movementData.totalOut],
                    ['Net Change', movementData.netChange],
                    movementData.highestStockOutDay ? ['Highest Stock-Out Day', `${movementData.highestStockOutDay.period} (${movementData.highestStockOutDay.value})`] : [],
                    [],
                    ['Date', 'Stock In', 'Stock Out', 'Net Movement', 'Cumulative Balance']
                  ].filter((r) => r.length > 0);
                  const tableRows = movementData.aggregates.map((a) => [formatPeriodLabel(a.period, movementPeriod), a.stockIn, a.stockOut, a.netMovement, a.cumulativeBalance]);
                  const wsData = [...summaryData, ...tableRows];
                  const ws = XLSX.utils.aoa_to_sheet(wsData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Stock Movement');
                  XLSX.writeFile(wb, `stock-movement-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
                }}
                sx={{ color: ADMIN_RED, borderColor: ADMIN_RED, '&:hover': { borderColor: ADMIN_RED, bgcolor: 'rgba(219,52,44,0.04)' } }}
              >
                Download Excel
              </Button>
            </Box>

            {/* KPI Cards */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Card sx={{ ...CARD_STYLE, flex: '1 1 160px', minWidth: 140 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GREEN }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Stock In</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color={GREEN}>{movementData.totalIn}</Typography>
                </CardContent>
              </Card>
              <Card sx={{ ...CARD_STYLE, flex: '1 1 160px', minWidth: 140 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ADMIN_RED }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Stock Out</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color={ADMIN_RED}>{movementData.totalOut}</Typography>
                </CardContent>
              </Card>
              <Card sx={{ ...CARD_STYLE, flex: '1 1 160px', minWidth: 140 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976d2' }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Net Change</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} sx={{ color: movementData.netChange >= 0 ? '#1976d2' : ADMIN_RED }}>
                    {movementData.netChange >= 0 ? '+' : ''}{movementData.netChange}
                  </Typography>
                </CardContent>
              </Card>
              {movementData.highestStockOutDay && (
                <Card sx={{ ...CARD_STYLE, flex: '1 1 160px', minWidth: 140 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Warning sx={{ fontSize: 18, color: ORANGE }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Highest Stock-Out Day</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600} color={ORANGE}>{formatPeriodLabel(movementData.highestStockOutDay.period, movementPeriod)}</Typography>
                    <Typography variant="caption" color="text.secondary">({movementData.highestStockOutDay.value} units)</Typography>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* A. Grouped Bar Chart */}
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2, fontSize: 15 }}>Stock In vs Stock Out (Grouped)</Typography>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={movementData.aggregates} margin={{ top: 16, right: 16, left: 8, bottom: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                    <XAxis dataKey="period" tick={{ fontSize: 16, fontWeight: 500 }} tickFormatter={(v) => formatPeriodLabel(v, movementPeriod)} height={50} interval={0} axisLine={{ stroke: '#e0e0e0' }} />
                    <YAxis tick={{ fontSize: 15 }} axisLine={{ stroke: '#e0e0e0' }} label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fontSize: 15 } }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 14 }} labelFormatter={(label) => `Date: ${formatPeriodLabel(label, movementPeriod)}`} />
                    <Legend wrapperStyle={{ paddingTop: 8, fontSize: 14 }} />
                    <Bar dataKey="stockIn" fill={GREEN} name="Stock In" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stockOut" fill={ADMIN_RED} name="Stock Out" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* B. Net Movement Line Chart */}
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2, fontSize: 15 }}>Net Movement (Stock In − Stock Out)</Typography>
              <Box sx={{ height: 260, overflow: 'visible', pr: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={movementData.aggregates} margin={{ top: 16, right: 100, left: 8, bottom: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                    <XAxis dataKey="period" tick={{ fontSize: 16, fontWeight: 500 }} tickFormatter={(v) => formatPeriodLabel(v, movementPeriod)} height={50} interval={0} axisLine={{ stroke: '#e0e0e0' }} />
                    <YAxis tick={{ fontSize: 15 }} axisLine={{ stroke: '#e0e0e0' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 14 }}
                      formatter={(value: number | undefined) => [`Net: ${value ?? 0}`, '']}
                      labelFormatter={(label) => `Date: ${formatPeriodLabel(label, movementPeriod)}`}
                    />
                    <Line type="monotone" dataKey="netMovement" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} name="Net Movement" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* C. Stock Balance Trend Area Chart */}
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2, fontSize: 15 }}>Stock Balance Trend (Cumulative)</Typography>
              <Box sx={{ height: 260, overflow: 'visible', pr: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={movementData.aggregates} margin={{ top: 16, right: 100, left: 8, bottom: 100 }}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#90caf9" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#90caf9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                    <XAxis dataKey="period" tick={{ fontSize: 16, fontWeight: 500 }} tickFormatter={(v) => formatPeriodLabel(v, movementPeriod)} height={50} interval={0} axisLine={{ stroke: '#e0e0e0' }} />
                    <YAxis tick={{ fontSize: 15 }} axisLine={{ stroke: '#e0e0e0' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 14 }}
                      formatter={(value: number | undefined) => [`Balance: ${value ?? 0}`, '']}
                      labelFormatter={(label) => `Date: ${formatPeriodLabel(label, movementPeriod)}`}
                    />
                    <Area type="monotone" dataKey="cumulativeBalance" stroke="#1976d2" fill="url(#balanceGradient)" strokeWidth={2} name="Cumulative Balance" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Report 3: Pending Delivery - Redesigned */}
        {activeTab === 'reserved' && !loading && reservedData && (() => {
          const DONUT_COLORS = { overdue: ADMIN_RED, due_soon: ORANGE, due_today: '#f9a825', scheduled: '#1976d2' };
          const donutData = [
            { name: 'Overdue', value: reservedData.deliveryStatusCounts.overdue, color: DONUT_COLORS.overdue },
            { name: 'Due Soon (1–3 days)', value: reservedData.deliveryStatusCounts.due_soon, color: DONUT_COLORS.due_soon },
            { name: 'Due Today', value: reservedData.deliveryStatusCounts.due_today, color: DONUT_COLORS.due_today },
            { name: 'Scheduled Later', value: reservedData.deliveryStatusCounts.scheduled, color: DONUT_COLORS.scheduled }
          ].filter((d) => d.value > 0);
          const barData = reservedData.byDate.map((b) => ({ ...b, fill: b.status === 'overdue' ? ADMIN_RED : b.status === 'due_soon' || b.status === 'due_today' ? ORANGE : GREEN }));
          const formatDate = (s: string | undefined) => (!s ? '—' : new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }));
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={600} color="text.primary">Pending Delivery Report</Typography>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => {
                  const summaryData = [['Pending Delivery Report'], ['Generated', new Date().toLocaleString()], ['Date Range', `${formatDate(reservedStart?.toISOString().slice(0, 10))} – ${formatDate(reservedEnd?.toISOString().slice(0, 10))}`], ['Status Filter', reservedStatusFilter === 'all' ? 'All' : reservedStatusFilter === 'overdue' ? 'Overdue' : reservedStatusFilter === 'due_soon' ? 'Due Soon' : 'Scheduled'], [], ['Summary'], ['Total Pending Orders', reservedData.kpis.totalOrders], ['Overdue Deliveries', reservedData.kpis.overdueCount], ['Due Today / Next 2 Days', reservedData.kpis.dueSoonCount], ['Total Pending Quantity', reservedData.kpis.totalQuantity], [], ['Order ID', 'Customer', 'Product', 'Ordered Qty', 'Delivered Qty', 'Pending Qty', 'Expected Date', 'Days Pending', 'Status']];
                  const tableRows = reservedFilteredItems.map((r) => [r.id, '—', r.productName, r.quantity, 0, r.quantity, r.expectedDeliveryDate ?? '—', r.daysPending, r.deliveryStatus === 'overdue' ? 'Overdue' : r.deliveryStatus === 'due_soon' ? 'Due Soon' : r.deliveryStatus === 'due_today' ? 'Due Today' : 'Scheduled']);
                  const ws = XLSX.utils.aoa_to_sheet([...summaryData, ...tableRows]);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Pending Delivery');
                  XLSX.writeFile(wb, `pending-delivery-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
                }} sx={{ color: ADMIN_RED, borderColor: ADMIN_RED, '&:hover': { borderColor: ADMIN_RED, bgcolor: 'rgba(219,52,44,0.04)' } }}>Download Excel</Button>
              </Box>
              {reservedData.insights.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {reservedData.insights.map((s, i) => (
                    <Alert key={i} severity={reservedData.kpis.overdueCount > 0 ? 'warning' : 'info'} sx={{ borderRadius: 2 }}>{s}</Alert>
                  ))}
                </Box>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Card sx={{ ...CARD_STYLE, flex: '1 1 160px', minWidth: 140 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Inventory2 sx={{ fontSize: 18, color: '#1976d2' }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Pending Orders</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color="#1976d2">{reservedData.kpis.totalOrders}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, flex: '1 1 160px', minWidth: 140 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Warning sx={{ fontSize: 18, color: ADMIN_RED }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Overdue Deliveries</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color={ADMIN_RED}>{reservedData.kpis.overdueCount}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, flex: '1 1 160px', minWidth: 140 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ORANGE }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Due Today / Next 2 Days</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color={ORANGE}>{reservedData.kpis.dueSoonCount}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, flex: '1 1 160px', minWidth: 140 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <LocalShipping sx={{ fontSize: 18, color: GREEN }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Pending Quantity</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color={GREEN}>{reservedData.kpis.totalQuantity}</Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', flex: '1 1 280px', minWidth: 280 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2, fontSize: 15 }}>Delivery Status Breakdown</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData.length > 0 ? donutData : [{ name: 'No data', value: 1 }]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, percent }) => (name !== 'No data' && percent != null ? `${name} ${(percent * 100).toFixed(0)}%` : name)}>
                          {donutData.length > 0 ? donutData.map((d, i) => <Cell key={i} fill={d.color} />) : [<Cell key={0} fill="#e0e0e0" />]}
                        </Pie>
                        <Tooltip formatter={(v, _n, props) => [`${v ?? 0} (${reservedData.kpis.totalOrders > 0 && props?.payload && typeof v === 'number' ? ((v / reservedData.kpis.totalOrders) * 100).toFixed(1) : 0}%)`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
                <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', flex: '1 1 400px', minWidth: 320 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2, fontSize: 15 }}>Pending Quantity by Expected Date</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 16, right: 24, left: 8, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => formatDate(v)} angle={-35} textAnchor="end" height={70} interval={0} />
                        <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: '#e0e0e0' }} label={{ value: 'Pending Qty', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(value, _, props) => [`${value ?? 0} units (${(props as { payload?: { orderCount: number } })?.payload?.orderCount ?? 0} orders)`, 'Pending Qty']} labelFormatter={(label) => `Date: ${formatDate(label)}`} />
                        <Bar dataKey="quantity" name="Pending Qty" radius={[4, 4, 0, 0]}>{barData.map((_, i) => <Cell key={i} fill={barData[i]?.fill ?? '#1976d2'} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Box>
              {reservedData.overdueTrend.length > 0 && (
                <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2, fontSize: 15 }}>Overdue Trend</Typography>
                  <Box sx={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reservedData.overdueTrend} margin={{ top: 16, right: 24, left: 8, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => formatDate(v)} angle={-35} textAnchor="end" height={70} interval={0} />
                        <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: '#e0e0e0' }} label={{ value: 'Overdue Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} labelFormatter={(v) => formatDate(v)} formatter={(v) => [`${v ?? 0} orders`, 'Overdue']} />
                        <Line type="monotone" dataKey="overdueCount" stroke={ADMIN_RED} strokeWidth={2} dot={{ r: 4 }} name="Overdue" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              )}
              <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ fontSize: 15 }}>Delivery Priorities</Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Search orders..." value={reservedSearch} onChange={(e) => setReservedSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }} sx={{ minWidth: 200 }} />
                    <TextField select size="small" label="Sort by" value={reservedSortBy} onChange={(e) => setReservedSortBy(e.target.value as 'expectedDate' | 'daysPending' | 'product')} sx={{ minWidth: 140 }}>
                      <MenuItem value="expectedDate">Expected Date</MenuItem>
                      <MenuItem value="daysPending">Days Pending</MenuItem>
                      <MenuItem value="product">Product</MenuItem>
                    </TextField>
                    <TextField select size="small" label="Order" value={reservedSortOrder} onChange={(e) => setReservedSortOrder(e.target.value as 'asc' | 'desc')} sx={{ minWidth: 100 }}>
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </TextField>
                  </Box>
                </Box>
                <TableContainer sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Ordered Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Delivered Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Pending Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Expected Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Days Pending</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reservedFilteredItems.length === 0 ? (
                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>No pending delivery items match the filters.</TableCell></TableRow>
                      ) : (
                        reservedFilteredItems.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.id.length > 8 ? `${r.id.slice(0, 8)}…` : r.id}</TableCell>
                            <TableCell>—</TableCell>
                            <TableCell>{r.productName}</TableCell>
                            <TableCell align="right">{r.quantity}</TableCell>
                            <TableCell align="right">0</TableCell>
                            <TableCell align="right">{r.quantity}</TableCell>
                            <TableCell>{formatDate(r.expectedDeliveryDate)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: r.daysPending < 0 ? 600 : 500, color: r.daysPending < 0 ? ADMIN_RED : 'inherit' }}>{r.daysPending}</TableCell>
                            <TableCell>
                              <Chip label={r.deliveryStatus === 'overdue' ? 'Overdue' : r.deliveryStatus === 'due_soon' ? 'Due Soon' : r.deliveryStatus === 'due_today' ? 'Due Today' : 'Scheduled'} size="small" sx={{ fontSize: 11, fontWeight: 600, bgcolor: r.deliveryStatus === 'overdue' ? 'rgba(219,52,44,0.12)' : r.deliveryStatus === 'due_soon' || r.deliveryStatus === 'due_today' ? 'rgba(255,143,0,0.12)' : 'rgba(46,125,50,0.12)', color: r.deliveryStatus === 'overdue' ? ADMIN_RED : r.deliveryStatus === 'due_soon' || r.deliveryStatus === 'due_today' ? ORANGE : GREEN }} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          );
        })()}

        {/* Report 4: Fast-Moving - Pareto Chart Redesign */}
        {activeTab === 'fast_moving' && !loading && !loadError && fastMovingData && (() => {
          const totalSold = fastMovingData.totalSold ?? fastMovingData.items.reduce((s, i) => s + i.totalOut, 0);
          let cumulative = 0;
          const paretoData = fastMovingData.items.map((item, idx) => {
            cumulative += item.totalOut;
            return {
              ...item,
              cumulativePct: totalSold > 0 ? Math.round((cumulative / totalSold) * 100) : 0,
              isTop5: idx < 5
            };
          });
          const formatDate = (s: string | undefined) => (!s ? '—' : new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }));
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={600} color="text.primary">Fast-Moving Products Report</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={() => {
                    const summaryData = [
                      ['Fast-Moving Products Report'],
                      ['Generated', new Date().toLocaleString()],
                      ['Date Range', `${formatDate(fastStart?.toISOString().slice(0, 10))} – ${formatDate(fastEnd?.toISOString().slice(0, 10))}`],
                      ['Total Sold', totalSold],
                      [],
                      ['Product Name', 'Quantity Sold', 'Sales Date', 'Cumulative %']
                    ];
                    const tableRows = paretoData.map((r) => [r.productName, r.totalOut, r.latestSaleDate ? formatDate(r.latestSaleDate) : '—', `${r.cumulativePct}%`]);
                    const ws = XLSX.utils.aoa_to_sheet([...summaryData, ...tableRows]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Fast Moving');
                    XLSX.writeFile(wb, `fast-moving-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
                  }}
                  sx={{
                    color: ADMIN_RED,
                    borderColor: ADMIN_RED,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(219,52,44,0.15)',
                    '&:hover': { borderColor: ADMIN_RED, bgcolor: 'rgba(219,52,44,0.06)', boxShadow: '0 4px 12px rgba(219,52,44,0.2)' }
                  }}
                >
                  Download Excel
                </Button>
              </Box>
              {fastMovingData.insights.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {fastMovingData.insights.map((s, i) => (
                    <Alert key={i} severity="info" sx={{ borderRadius: 2 }}>{s}</Alert>
                  ))}
                </Box>
              )}
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
                  overflow: 'hidden'
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} color={ADMIN_RED} sx={{ mb: 2 }}>
                  Pareto Chart – Quantity Sold vs Cumulative %
                </Typography>
                {paretoData.length === 0 ? (
                  <Box sx={{ height: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, gap: 1 }}>
                    <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>No sales data in the selected date range</Typography>
                    <Typography variant="body2" color="text.secondary">Try adjusting the Start and End dates above, or add stock-out records.</Typography>
                  </Box>
                ) : (
                <Box sx={{ height: 420, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={paretoData} layout="vertical" margin={{ top: 40, right: 50, left: 140, bottom: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" horizontal={true} vertical={false} />
                      <XAxis xAxisId="qty" type="number" tick={{ fontSize: 12 }} axisLine={{ stroke: '#e0e0e0' }} />
                      <XAxis xAxisId="pct" type="number" orientation="top" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: '#c62828' }} />
                      <YAxis dataKey="productName" type="category" width={130} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }} formatter={(v, name) => [name === 'Quantity Sold' ? v : `${v}%`, name]} labelFormatter={(label) => `Product: ${label}`} />
                      <Legend wrapperStyle={{ paddingTop: 8 }} />
                      <Bar xAxisId="qty" dataKey="totalOut" name="Quantity Sold" radius={[0, 4, 4, 0]}>
                        {paretoData.map((entry, index) => (
                          <Cell key={index} fill={entry.isTop5 ? ADMIN_RED : 'rgba(219,52,44,0.35)'} />
                        ))}
                      </Bar>
                      <Line xAxisId="pct" type="monotone" dataKey="cumulativePct" name="Cumulative %" stroke="#c62828" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
                )}
              </Paper>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ fontSize: 15 }}>Product Details</Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Search products..." value={fastSearch} onChange={(e) => setFastSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }} sx={{ minWidth: 200 }} />
                    <TextField select size="small" label="Sort by" value={fastSortBy} onChange={(e) => setFastSortBy(e.target.value as 'productName' | 'totalOut' | 'latestSaleDate')} sx={{ minWidth: 140 }}>
                      <MenuItem value="totalOut">Quantity Sold</MenuItem>
                      <MenuItem value="productName">Product Name</MenuItem>
                      <MenuItem value="latestSaleDate">Sales Date</MenuItem>
                    </TextField>
                    <TextField select size="small" label="Order" value={fastSortOrder} onChange={(e) => setFastSortOrder(e.target.value as 'asc' | 'desc')} sx={{ minWidth: 100 }}>
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </TextField>
                  </Box>
                </Box>
                <TableContainer sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(219,52,44,0.06)' }}>
                        <TableCell sx={{ fontWeight: 600, color: ADMIN_RED }}>Product Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: ADMIN_RED }} align="right">Quantity Sold</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: ADMIN_RED }}>Sales Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fastFilteredItems.length === 0 ? (
                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>No products match the filters.</TableCell></TableRow>
                      ) : (
                        fastFilteredItems.map((r) => (
                          <TableRow key={r.productName} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                            <TableCell>{r.productName}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 500 }}>{r.totalOut}</TableCell>
                            <TableCell>{formatDate(r.latestSaleDate)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          );
        })()}

        {/* Report 5: Inventory Value - Redesigned */}
        {activeTab === 'inventory_value' && !loading && !loadError && inventoryData && (() => {
          const total = inventoryData.totalValue || 0;
          const CAT_COLORS = ['#db342c', '#1976d2', '#2e7d32', '#ff8f00', '#7b1fa2', '#0288d1', '#c62828', '#1565c0'];
          const donutChartData = (inventoryData.byCategory ?? [])
            .filter((c) => c && c.value > 0)
            .map((cat, i) => ({ name: cat.name, value: cat.value, color: CAT_COLORS[i % CAT_COLORS.length] }));

          const maxValue = Math.max(...inventoryTableItems.map((p) => p.value), 1);

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={600} color="text.primary">Inventory Value Report</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={() => {
                    const headers = ['Product', 'Category', 'Balance', 'Cost', 'Value', 'Low Stock'];
                    const rows = inventoryTableItems.map((p) => [p.productName, p.category, p.balance, p.costPrice, p.value, p.isLowStock ? 'Yes' : 'No']);
                    const ws = XLSX.utils.aoa_to_sheet([['Inventory Value Report'], ['Total Value', total], ['Low Stock Count', inventoryData.lowStockCount ?? 0], [], headers, ...rows]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Value');
                    XLSX.writeFile(wb, `inventory-value-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
                  }}
                  sx={{ color: ADMIN_RED, borderColor: ADMIN_RED, '&:hover': { borderColor: ADMIN_RED, bgcolor: 'rgba(219,52,44,0.04)' } }}
                >
                  Download Excel
                </Button>
              </Box>

              {/* KPI Cards */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Card sx={{ ...CARD_STYLE, flex: '1 1 180px', minWidth: 160 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Inventory2 sx={{ fontSize: 18, color: '#1976d2' }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Inventory Value</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color="#1976d2">LKR {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, flex: '1 1 180px', minWidth: 160 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ADMIN_RED }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Highest Value Category</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={600} color={ADMIN_RED}>{(inventoryData as { highestValueCategory?: { name: string } }).highestValueCategory?.name ?? '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">LKR {((inventoryData as { highestValueCategory?: { value: number } }).highestValueCategory?.value ?? 0).toLocaleString()}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ ...CARD_STYLE, flex: '1 1 180px', minWidth: 160 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Warning sx={{ fontSize: 18, color: ORANGE }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Low Stock Items</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color={ORANGE}>{inventoryData.lowStockCount ?? 0}</Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Donut Chart - Value by Category */}
              <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(180deg,#fff 0%,#fafbfc 100%)' }}>
                <Typography variant="subtitle1" fontWeight={600} color={ADMIN_RED} sx={{ mb: 2 }}>Value by Category (Donut)</Typography>
                <Box sx={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutChartData.length > 0 ? donutChartData : [{ name: 'No data', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => (name !== 'No data' && percent != null ? `${name} ${(percent * 100).toFixed(0)}%` : name)}
                      >
                        {donutChartData.length > 0
                          ? donutChartData.map((d, i) => <Cell key={i} fill={d.color} />)
                          : [<Cell key={0} fill="#e0e0e0" />]}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        labelFormatter={(label) => label}
                        formatter={(v) => [
                          `LKR ${(v ?? 0).toLocaleString()}${total > 0 && typeof v === 'number' ? ` (${((v / total) * 100).toFixed(1)}%)` : ''}`,
                          ''
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Data Table */}
              <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="subtitle1" fontWeight={600} color={ADMIN_RED} sx={{ mb: 2 }}>Product Details (sorted by Value descending)</Typography>
                <TableContainer sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: 'rgba(219,52,44,0.06)' }}><TableCell sx={{ fontWeight: 600 }}>Product</TableCell><TableCell sx={{ fontWeight: 600 }}>Category</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Cost</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Value</TableCell></TableRow></TableHead>
                    <TableBody>
                      {inventoryTableItems.map((p) => {
                        const intensity = maxValue > 0 ? Math.min(0.95, 0.15 + (p.value / maxValue) * 0.8) : 0.3;
                        return (
                          <TableRow
                            key={p.productName}
                            hover
                            sx={{
                              bgcolor: p.isLowStock ? 'rgba(219,52,44,0.12)' : `rgba(25,118,210,${intensity})`,
                              '& td': { color: p.isLowStock ? ADMIN_RED : 'inherit' }
                            }}
                          >
                            <TableCell sx={{ fontWeight: p.isLowStock ? 600 : 500 }}>{p.productName}</TableCell>
                            <TableCell>{p.category}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: p.isLowStock ? 600 : 500 }}>{p.balance}</TableCell>
                            <TableCell align="right">LKR {p.costPrice.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>LKR {p.value.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          );
        })()}
      </Container>
    </LocalizationProvider>
  );
};
