import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  InputAdornment,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllCategories } from '../services/categoryService';
import { getProductByBarcode, createProduct } from '../services/productService';
import { addStockIn } from '../services/stockService';
import { Category } from '../types';

const BTN_COLOR = '#78121c';
const BTN_HOVER = '#5c0e15';

// Helper function to format number with commas
const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

interface ScannedRow {
  barcode: string;
  name: string;
  purchasePrice: number;
  category: string;
  quantity: number;
}

export const StockIn: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('');
  const [totalQuantity, setTotalQuantity] = useState<number>(10);
  const [scanned, setScanned] = useState<ScannedRow[]>([]);
  const [scannedBarcodes, setScannedBarcodes] = useState<Set<string>>(new Set());
  const [barcodeInput, setBarcodeInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [itemCondition, setItemCondition] = useState<'new' | 'damaged' | 'returned'>('new');
  const [damageReason, setDamageReason] = useState<'transport' | 'manufacturing' | 'storage' | 'customer_return'>('transport');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = async () => {
    try {
      const list = await getAllCategories();
      setCategories(list);
      if (list.length > 0 && !selectedCategoryCode) setSelectedCategoryCode(list[0].categoryCode);
    } catch (e) {
      console.error(e);
    }
  };

  const selectedCategory = categories.find(c => c.categoryCode === selectedCategoryCode);
  const categoryName = selectedCategory?.name ?? selectedCategoryCode;

  const handleScan = async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed || !user || !selectedCategoryCode) return;

    setError('');
    setBarcodeInput('');

    if (scannedBarcodes.has(trimmed)) {
      setError('This barcode is already registered.');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    setLoading(true);
    try {
      let product = await getProductByBarcode(trimmed);
      if (!product) {
        await createProduct({
          barcode: trimmed,
          name: `Product ${trimmed}`,
          category: categoryName,
          categoryCode: selectedCategoryCode,
          costPrice: 0,
          sellingPrice: 0,
          lowStockThreshold: 3
        });
        product = await getProductByBarcode(trimmed);
      }
      if (!product) throw new Error('Failed to create or fetch product');
      await addStockIn(trimmed, 1, user.uid, user.displayName, 'Stock-in scan', undefined, itemCondition, (itemCondition === 'damaged' || itemCondition === 'returned') ? damageReason : undefined);
      setScannedBarcodes(prev => new Set(prev).add(trimmed));
      setScanned(prev => [...prev, {
        barcode: product!.barcode,
        name: product!.name,
        purchasePrice: product!.costPrice,
        category: product!.category || product!.categoryCode || categoryName,
        quantity: 1
      }]);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e: unknown) {
      setError((e as Error).message);
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = barcodeInput.trim();
      if (trimmed.length >= 5) handleScan(trimmed);
    }
  };

  const isComplete = scanned.length >= totalQuantity;
  const canScan = selectedCategoryCode && totalQuantity > 0 && scanned.length < totalQuantity;

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">Product Stock-In</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button onClick={() => navigate('/products')} size="small" sx={{ color: BTN_COLOR }}>
            View Products
          </Button>
          <Button onClick={() => navigate('/dashboard')} size="small" sx={{ color: BTN_COLOR }}>← Dashboard</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Step 1: Select category</Typography>
        <TextField
          select
          fullWidth
          size="small"
          label="Category"
          value={selectedCategoryCode}
          onChange={(e) => setSelectedCategoryCode(e.target.value)}
          sx={{ mb: 2, maxWidth: 320 }}
        >
          {categories.map((cat) => (
            <MenuItem key={cat.categoryCode} value={cat.categoryCode}>
              {cat.categoryCode} – {cat.name}
            </MenuItem>
          ))}
          {categories.length === 0 && (
            <MenuItem disabled>No categories. Create one in Category Management.</MenuItem>
          )}
        </TextField>
        <Button size="small" onClick={() => navigate('/categories')} sx={{ ml: 1, color: BTN_COLOR }}>
          Create new category
        </Button>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Step 2: Item Condition</Typography>
        <TextField
          select
          fullWidth
          size="small"
          label="Item Condition"
          value={itemCondition}
          onChange={(e) => {
            setItemCondition(e.target.value as 'new' | 'damaged' | 'returned');
            if (e.target.value === 'new') setDamageReason('transport');
          }}
          sx={{ mb: 2, mt: 1, maxWidth: 320 }}
        >
          <MenuItem value="new">New</MenuItem>
          <MenuItem value="damaged">Damaged</MenuItem>
          <MenuItem value="returned">Returned</MenuItem>
        </TextField>

        {(itemCondition === 'damaged' || itemCondition === 'returned') && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Damage Reason</Typography>
            <TextField
              select
              fullWidth
              size="small"
              label="Damage Reason"
              value={damageReason}
              onChange={(e) => setDamageReason(e.target.value as 'transport' | 'manufacturing' | 'storage' | 'customer_return')}
              sx={{ mb: 2, mt: 1, maxWidth: 320 }}
            >
              <MenuItem value="transport">Transport</MenuItem>
              <MenuItem value="manufacturing">Manufacturing</MenuItem>
              <MenuItem value="storage">Storage</MenuItem>
              <MenuItem value="customer_return">Customer Return</MenuItem>
            </TextField>
          </>
        )}

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Step 3: Total quantity to receive</Typography>
        <TextField
          type="number"
          size="small"
          value={totalQuantity}
          onChange={(e) => setTotalQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
          inputProps={{ min: 1 }}
          sx={{ maxWidth: 120, mt: 1 }}
        />

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Step 4: Scan each barcode (scanner or type + Enter)</Typography>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder="Scan or enter barcode, then press Enter"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!canScan || loading}
          InputProps={{
            startAdornment: <InputAdornment position="start">Barcode</InputAdornment>
          }}
          sx={{ mt: 1, maxWidth: 400 }}
        />
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          Scanned {scanned.length} of {totalQuantity}. {canScan && !isComplete ? 'Scan next item.' : isComplete ? 'Quantity reached.' : 'Select category and quantity first.'}
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}
      </Paper>

      <Paper>
        <Typography variant="subtitle1" sx={{ p: 2 }}>Scanned items (auto-filled from barcode)</Typography>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Barcode</TableCell>
                <TableCell>Product name</TableCell>
                <TableCell>Purchase Price (Rs.)</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scanned.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No items scanned yet.</TableCell></TableRow>
              ) : (
                scanned.map((row, idx) => (
                  <TableRow key={`${row.barcode}-${idx}`}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{row.barcode}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{formatNumber(row.purchasePrice)}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {scanned.length > 0 && (
          <Box sx={{ p: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setScanned([]);
                setScannedBarcodes(new Set());
                setError('');
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              sx={{ color: BTN_COLOR, borderColor: BTN_COLOR, '&:hover': { borderColor: BTN_HOVER, bgcolor: 'rgba(120, 18, 28, 0.04)' } }}
            >
              Clear list and start over
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
