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
  Alert
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getGroupedProductsForStoreManager } from '../services/productService';
import { GroupedProduct } from '../types';
import * as XLSX from 'xlsx';

const SM_PRIMARY = '#78121c';
const SM_PRIMARY_DARK = '#5c0e15';

const formatNumber = (num: number): string =>
  num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const StockSheet: React.FC = () => {
  const navigate = useNavigate();
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const grouped = await getGroupedProductsForStoreManager();
        setGroupedProducts(grouped);
      } catch (error) {
        console.error('Error loading stock:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportExcel = () => {
    const headers = ['Item', 'Item Category', 'Purchase Price (Rs.)', 'Selling Price (Rs.)', 'Quantity'];
    const rows = groupedProducts.map((g) => [
      g.productName,
      g.category,
      g.representative.costPrice,
      g.representative.sellingPrice,
      g.balance
    ]);
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Sheet');
    XLSX.writeFile(wb, `stock-sheet-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" component="h1">
          Stock Sheet
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportExcel}
            disabled={loading || groupedProducts.length === 0}
            sx={{ bgcolor: SM_PRIMARY, '&:hover': { bgcolor: SM_PRIMARY_DARK } }}
          >
            Export to Excel
          </Button>
          <Button onClick={() => navigate('/dashboard')} size="small" sx={{ color: SM_PRIMARY }}>
            ← Back to Dashboard
          </Button>
        </Box>
      </Box>

      {groupedProducts.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No products in the system yet. Add products in the Products section to generate a stock sheet.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Item Category</TableCell>
              <TableCell align="right">Purchase Price (Rs.)</TableCell>
              <TableCell align="right">Selling Price (Rs.)</TableCell>
              <TableCell align="right">Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              groupedProducts.map((group) => (
                <TableRow key={`${group.categoryCode}\n${group.productName}`} hover>
                  <TableCell>{group.productName}</TableCell>
                  <TableCell>{group.category}</TableCell>
                  <TableCell align="right">{formatNumber(group.representative.costPrice)}</TableCell>
                  <TableCell align="right">{formatNumber(group.representative.sellingPrice)}</TableCell>
                  <TableCell align="right">{group.balance}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};
