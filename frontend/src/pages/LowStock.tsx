import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getLowStockGroupedForStoreManager } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { GroupedProduct } from '../types';

const SM_PRIMARY = '#78121c';

export const LowStock: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStoreManager = user?.role === 'store_manager';
  const primaryColor = isStoreManager ? SM_PRIMARY : '#db342c';
  const lowStockChipColor = isStoreManager ? SM_PRIMARY : '#db342c';
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStockProducts();
  }, []);

  const loadLowStockProducts = async () => {
    try {
      const lowStock = await getLowStockGroupedForStoreManager();
      setGroupedProducts(lowStock);
    } catch (error) {
      console.error('Error loading low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Product Name', 'Category', 'Current Balance', 'Low Stock Threshold', 'Status'];
    const rows = groupedProducts.map((g) => [
      g.productName,
      g.category,
      g.balance,
      g.lowStockThreshold,
      g.balance === 0 ? 'Out of Stock' : 'Low Stock'
    ]);
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Low Stock Alert');
    XLSX.writeFile(wb, `low-stock-alert-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Low Stock Alerts
          </Typography>
          <Button onClick={() => navigate('/dashboard')} sx={{ color: primaryColor }}>
            ← Back to Dashboard
          </Button>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportExcel}
          disabled={loading || groupedProducts.length === 0}
          sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: isStoreManager ? '#5c0e15' : '#c02e27' } }}
        >
          Download Excel
        </Button>
      </Box>

      {groupedProducts.length === 0 && !loading && (
        <Alert severity="success" sx={{ mb: 2 }}>
          All products are above their low stock threshold!
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Current Balance</TableCell>
              <TableCell>Low Stock Threshold</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : groupedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No low stock items
                </TableCell>
              </TableRow>
            ) : (
              groupedProducts.map((g) => (
                <TableRow key={`${g.categoryCode}\n${g.productName}`}>
                  <TableCell>{g.productName}</TableCell>
                  <TableCell>{g.category}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color: g.balance === 0 ? (isStoreManager ? '#c62828' : '#db342c') : (isStoreManager ? SM_PRIMARY : '#e65100'),
                        fontWeight: 'bold'
                      }}
                    >
                      {g.balance}
                    </Typography>
                  </TableCell>
                  <TableCell>{g.lowStockThreshold}</TableCell>
                  <TableCell>
                    <Chip
                      label={g.balance === 0 ? 'Out of Stock' : 'Low Stock'}
                      size="small"
                      sx={
                        g.balance === 0
                          ? { bgcolor: isStoreManager ? '#c62828' : '#db342c', color: '#fff', '& .MuiChip-label': { color: '#fff' } }
                          : { bgcolor: isStoreManager ? 'rgba(120, 18, 28, 0.12)' : 'rgba(219, 52, 44, 0.12)', color: lowStockChipColor, border: isStoreManager ? '1px solid rgba(120, 18, 28, 0.3)' : '1px solid #db342c' }
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};
