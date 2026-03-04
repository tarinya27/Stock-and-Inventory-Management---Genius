import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Autocomplete,
  InputAdornment,
  MenuItem
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { createProduct, getProductByBarcode, getAllProducts } from '../services/productService';
import { addStockIn } from '../services/stockService';
import { useAuth } from '../context/AuthContext';
import { Category, Product } from '../types';

const formatNumber = (num: number): string =>
  num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const parseNumber = (str: string): number => parseFloat(str.replace(/,/g, '')) || 0;

const SM_PRIMARY = '#78121c';
const SM_PRIMARY_DARK = '#5c0e15';
const EDIT_COLOR = '#00897b';
const DELETE_COLOR = '#c62828';

interface StoreManagerStockInFormProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
  onEditProduct?: (product: Product) => void;
}

export const StoreManagerStockInForm: React.FC<StoreManagerStockInFormProps> = ({
  open,
  onClose,
  categories,
  onSuccess,
  onEditProduct
}) => {
  const { user } = useAuth();
  const [categoryCode, setCategoryCode] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productName, setProductName] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [duplicateError, setDuplicateError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [itemCondition, setItemCondition] = useState<'new' | 'damaged' | 'returned'>('new');
  const [damageReason, setDamageReason] = useState<'transport' | 'manufacturing' | 'storage' | 'customer_return'>('transport');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) getAllProducts().then(setProducts);
  }, [open]);

  const category = categories.find(c => c.categoryCode === categoryCode);
  const balance = barcodes.length;

  const handleAddBarcode = () => {
    const trimmed = barcodeInput.trim();
    if (!trimmed) return;
    if (barcodes.includes(trimmed)) {
      setDuplicateError('Barcode already added');
      return;
    }
    if (barcodes.length >= quantity) {
      setDuplicateError(`Maximum ${quantity} barcodes allowed`);
      return;
    }
    setDuplicateError('');
    setBarcodes([...barcodes, trimmed]);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  const handleRemoveBarcode = (b: string) => {
    setBarcodes(barcodes.filter(x => x !== b));
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBarcode();
    }
  };

  const handleProductNameChange = (_: unknown, value: string | Product | null) => {
    if (typeof value === 'string') {
      setProductName(value);
      setSelectedProduct(null);
    } else if (value && typeof value === 'object' && 'barcode' in value) {
      const p = value as Product;
      setSelectedProduct(p);
      setProductName(p.name);
      setProductNameInput(p.name);
      setSellingPrice(typeof p.sellingPrice === 'number' ? formatNumber(p.sellingPrice) : '');
    } else {
      setProductName('');
      setProductNameInput('');
      setSelectedProduct(null);
      setSellingPrice('');
    }
  };

  const handleProductNameInputChange = (_: unknown, v: string) => {
    setProductNameInput(v);
    if (!selectedProduct) setProductName(v);
  };

  const handleSave = async () => {
    if (!user || !categoryCode || !productName.trim()) {
      alert('Please fill Category and Product name.');
      return;
    }
    const costPrice = parseNumber(purchasePrice);
    const sellPrice = parseNumber(sellingPrice);
    if (barcodes.length === 0) {
      alert('Please add at least one barcode.');
      return;
    }

    setSubmitting(true);
    try {
      for (const barcode of barcodes) {
        const existing = await getProductByBarcode(barcode);
        if (!existing) {
          await createProduct({
            barcode,
            name: productName.trim(),
            category: category?.name ?? categoryCode,
            categoryCode,
            costPrice,
            sellingPrice: sellPrice,
            lowStockThreshold: 3
          });
        }
        await addStockIn(barcode, 1, user.uid, user.displayName || 'Store Manager', undefined, undefined, itemCondition, (itemCondition === 'damaged' || itemCondition === 'returned') ? damageReason : undefined);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategoryCode('');
    setQuantity(10);
    setBarcodes([]);
    setBarcodeInput('');
    setProductName('');
    setProductNameInput('');
    setSelectedProduct(null);
    setPurchasePrice('');
    setSellingPrice('');
    setDuplicateError('');
    setItemCondition('new');
    setDamageReason('transport');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create / Stock-In Product</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          select
          label="Category"
          value={categoryCode}
          onChange={(e) => setCategoryCode(e.target.value)}
          margin="normal"
          required
          SelectProps={{
            displayEmpty: true,
            renderValue: (v: unknown) =>
              v ? `${v} – ${categories.find(c => c.categoryCode === v)?.name ?? ''}` : 'Select category'
          }}
        >
          <MenuItem value="">
            <em>Select category</em>
          </MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.categoryCode} value={c.categoryCode}>
              {c.categoryCode} – {c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          type="number"
          label="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
          margin="normal"
          inputProps={{ min: 1 }}
          helperText="Number of items to receive"
        />

        <TextField
          fullWidth
          select
          label="Item Condition"
          value={itemCondition}
          onChange={(e) => {
            setItemCondition(e.target.value as 'new' | 'damaged' | 'returned');
            if (e.target.value === 'new') setDamageReason('transport');
          }}
          margin="normal"
        >
          <MenuItem value="new">New</MenuItem>
          <MenuItem value="damaged">Damaged</MenuItem>
          <MenuItem value="returned">Returned</MenuItem>
        </TextField>

        {(itemCondition === 'damaged' || itemCondition === 'returned') && (
          <TextField
            fullWidth
            select
            label="Damage Reason"
            value={damageReason}
            onChange={(e) => setDamageReason(e.target.value as 'transport' | 'manufacturing' | 'storage' | 'customer_return')}
            margin="normal"
          >
            <MenuItem value="transport">Transport</MenuItem>
            <MenuItem value="manufacturing">Manufacturing</MenuItem>
            <MenuItem value="storage">Storage</MenuItem>
            <MenuItem value="customer_return">Customer Return</MenuItem>
          </TextField>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
          Barcodes ({barcodes.length}/{quantity})
        </Typography>
        <TextField
          inputRef={barcodeInputRef}
          fullWidth
          size="small"
          placeholder="Scan or type barcode, press Enter"
          value={barcodeInput}
          onChange={(e) => {
            setBarcodeInput(e.target.value);
            setDuplicateError('');
          }}
          onKeyDown={handleBarcodeKeyDown}
          error={!!duplicateError}
          helperText={duplicateError}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button size="small" onClick={handleAddBarcode} sx={{ color: SM_PRIMARY }}>
                  Add
                </Button>
              </InputAdornment>
            )
          }}
          sx={{ mb: 1 }}
        />
        {barcodes.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, maxHeight: 120, overflow: 'auto' }}>
            {barcodes.map((b) => (
              <Chip
                key={b}
                label={b}
                size="small"
                onDelete={() => handleRemoveBarcode(b)}
                sx={{ '& .MuiChip-deleteIcon': { color: DELETE_COLOR } }}
              />
            ))}
          </Box>
        )}

        <Autocomplete
          freeSolo
          options={products}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
          value={selectedProduct || productName || null}
          inputValue={productNameInput !== undefined ? productNameInput : productName}
          onInputChange={handleProductNameInputChange}
          onChange={handleProductNameChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Product name"
              margin="normal"
              required
              helperText="Search existing or type new product name"
            />
          )}
        />

        <TextField
          fullWidth
          label="Purchase Price (Rs.)"
          value={purchasePrice}
          onChange={(e) => {
            let v = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
            const parts = v.split('.');
            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
            setPurchasePrice(v);
          }}
          onBlur={(e) => {
            const n = parseNumber(e.target.value);
            if (n > 0) setPurchasePrice(formatNumber(n));
          }}
          margin="normal"
          helperText="Applied to all items"
        />

        <TextField
          fullWidth
          label="Selling Price (Rs.)"
          value={sellingPrice}
          onChange={(e) => {
            let v = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
            const parts = v.split('.');
            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
            setSellingPrice(v);
          }}
          onBlur={(e) => {
            const n = parseNumber(e.target.value);
            if (n > 0) setSellingPrice(formatNumber(n));
          }}
          margin="normal"
          helperText="Applied to all items"
        />

        <TextField
          fullWidth
          label="Balance"
          value={balance}
          margin="normal"
          InputProps={{ readOnly: true }}
          helperText="Items being added (Stock In − Stock Out)"
        />

        <TextField
          fullWidth
          label="Low Stock Threshold"
          value={3}
          margin="normal"
          InputProps={{ readOnly: true }}
          helperText="Fixed: 3 units. Triggers admin notifications when balance ≤ 3."
        />

        {selectedProduct && onEditProduct && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }} role="group" aria-label="Product actions">
            <IconButton
              size="small"
              onClick={() => onEditProduct(selectedProduct)}
              sx={{ color: EDIT_COLOR }}
              title="Edit product"
            >
              <Edit />
            </IconButton>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ color: SM_PRIMARY }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={submitting || !categoryCode || !productName.trim() || barcodes.length === 0}
          sx={{ bgcolor: SM_PRIMARY, '&:hover': { bgcolor: SM_PRIMARY_DARK } }}
        >
          {submitting ? 'Saving...' : 'Save / Stock In'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
