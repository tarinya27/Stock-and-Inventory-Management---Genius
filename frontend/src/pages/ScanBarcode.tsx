import React, { useState, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { BarcodeInput, type BarcodeInputHandle } from '../components/BarcodeInput';
import { getProductByBarcode, getGroupedProductByName } from '../services/productService';
import {
  getStockBalance,
  addStockIn,
  addStockOut,
  isBarcodeUsedForStockIn,
  isBarcodeUsedForStockOut,
  getSoldDateForBarcode
} from '../services/stockService';
import { Product, StockBalance } from '../types';
import { useAuth } from '../context/AuthContext';

const formatNumber = (num: number): string =>
  num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const BTN_COLOR = '#78121c';
const BTN_HOVER = '#5c0e15';

type ScanFeedback = 'none' | 'invalid' | 'duplicate_in' | 'duplicate_out' | 'duplicate_both' | 'success';

export const ScanBarcode: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [stockBalance, setStockBalance] = useState<StockBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<ScanFeedback>('none');
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [stockOutQuantity, setStockOutQuantity] = useState('1');
  const [date, setDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');
  const [stockOutReason, setStockOutReason] = useState<'invoice' | 'warranty' | 'damage'>('invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [usedForIn, setUsedForIn] = useState(false);
  const [usedForOut, setUsedForOut] = useState(false);
  const [soldDate, setSoldDate] = useState<Date | null>(null);
  const [productNameInput, setProductNameInput] = useState('');
  const [lookedUpByName, setLookedUpByName] = useState(false);
  const stockOutBarcodeRef = useRef<BarcodeInputHandle>(null);

  const handleScan = async (barcode: string) => {
    setLoading(true);
    setError('');
    setFeedback('none');
    setProduct(null);
    setStockBalance(null);
    setUsedForIn(false);
    setUsedForOut(false);
    setSoldDate(null);
    setLookedUpByName(false);

    try {
      const productData = await getProductByBarcode(barcode);
      if (!productData) {
        setError(`Product with barcode "${barcode}" not found.`);
        setFeedback('invalid');
        return;
      }

      const [balance, inUsed, outUsed, soldDateResult] = await Promise.all([
        getStockBalance(barcode),
        isBarcodeUsedForStockIn(barcode),
        isBarcodeUsedForStockOut(barcode),
        getSoldDateForBarcode(barcode)
      ]);

      setProduct(productData);
      setStockBalance(balance);
      setUsedForIn(inUsed);
      setUsedForOut(outUsed);
      setSoldDate(outUsed ? soldDateResult ?? null : null);

      if (inUsed && outUsed) {
        setFeedback('duplicate_both');
      } else if (inUsed) {
        setFeedback('duplicate_in');
      } else if (outUsed) {
        setFeedback('duplicate_out');
      } else {
        setFeedback('success');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Error fetching product');
      setFeedback('invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupByName = async () => {
    const name = productNameInput.trim();
    if (!name) return;
    setLoading(true);
    setError('');
    setFeedback('none');
    setProduct(null);
    setStockBalance(null);
    setUsedForIn(false);
    setUsedForOut(false);
    setSoldDate(null);
    setLookedUpByName(false);

    try {
      const group = await getGroupedProductByName(name);
      if (!group) {
        setError(`No product found with name "${name}".`);
        setFeedback('invalid');
        return;
      }
      setProduct(group.representative);
      setStockBalance({
        barcode: group.representative.barcode,
        totalIn: group.totalStockIn,
        totalOut: group.totalStockOut,
        balance: group.balance
      });
      setUsedForIn(false);
      setUsedForOut(false);
      setSoldDate(null);
      setLookedUpByName(true);
      setFeedback('success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Error looking up product');
      setFeedback('invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleStockIn = async () => {
    if (!product || !user) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity (minimum 1)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addStockIn(product.barcode, qty, user.uid, user.displayName ?? 'User', notes, date ?? undefined);
      setStockInOpen(false);
      setQuantity('1');
      setNotes('');
      setDate(new Date());
      const [balance, inUsed, outUsed] = await Promise.all([
        getStockBalance(product.barcode),
        isBarcodeUsedForStockIn(product.barcode),
        isBarcodeUsedForStockOut(product.barcode)
      ]);
      setStockBalance(balance);
      setUsedForIn(inUsed);
      setUsedForOut(outUsed);
      setFeedback(inUsed && outUsed ? 'duplicate_both' : inUsed ? 'duplicate_in' : 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Error adding stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockOut = async () => {
    if (!product || !user || !stockBalance) return;

    const qty = parseInt(stockOutQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity (minimum 1)');
      return;
    }
    if (stockBalance.balance < qty) {
      setError(`Insufficient stock. Available: ${stockBalance.balance}, Requested: ${qty}`);
      return;
    }

    if (stockOutReason === 'invoice' && !invoiceNumber.trim()) {
      setError('Please enter the Invoice Number');
      return;
    }
    if (stockOutReason === 'warranty' && !deliveryNoteNumber.trim()) {
      setError('Please enter the Delivery Note Number');
      return;
    }

    let notesToSave = '';
    if (stockOutReason === 'invoice') {
      notesToSave = `Invoice #: ${invoiceNumber.trim()}`;
    } else if (stockOutReason === 'warranty') {
      notesToSave = `Delivery Note #: ${deliveryNoteNumber.trim()}`;
    }

    setSubmitting(true);
    setError('');

    try {
      await addStockOut(
        product.barcode,
        qty,
        user.uid,
        user.displayName ?? 'User',
        stockOutReason.charAt(0).toUpperCase() + stockOutReason.slice(1),
        notesToSave,
        undefined
      );
      setStockOutOpen(false);
      setStockOutQuantity('1');
      setStockOutReason('invoice');
      setInvoiceNumber('');
      setDeliveryNoteNumber('');
      const [balance, inUsed, outUsed, newSoldDate] = await Promise.all([
        getStockBalance(product.barcode),
        isBarcodeUsedForStockIn(product.barcode),
        isBarcodeUsedForStockOut(product.barcode),
        getSoldDateForBarcode(product.barcode)
      ]);
      setStockBalance(balance);
      setUsedForIn(inUsed);
      setUsedForOut(outUsed);
      setSoldDate(outUsed ? newSoldDate ?? null : null);
      setFeedback(inUsed && outUsed ? 'duplicate_both' : outUsed ? 'duplicate_out' : 'success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Error recording stock out');
    } finally {
      setSubmitting(false);
    }
  };

  const isStoreManager = user?.role === 'store_manager';
  const isLowStock = product && stockBalance && stockBalance.balance <= product.lowStockThreshold;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Scan Barcode
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Each barcode = 1 physical unit. Each barcode can only be used once for Stock IN and once for Stock OUT.
          </Typography>
          <Button onClick={() => navigate('/dashboard')} sx={{ mb: 2, color: BTN_COLOR }}>
            ← Back to Dashboard
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <BarcodeInput onScan={handleScan} />
          {isStoreManager && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Or search by product name
              </Typography>
              <TextField
                fullWidth
                size="medium"
                placeholder="Enter product name, then press Enter"
                value={productNameInput}
                onChange={(e) => setProductNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupByName();
                  }
                }}
                InputProps={{
                  sx: {
                    '& .MuiOutlinedInput-input': { fontSize: '16px' },
                    '& fieldset': { borderColor: BTN_COLOR },
                    '&:hover fieldset': { borderColor: BTN_COLOR, borderWidth: '2px' },
                    '&.Mui-focused fieldset': { borderColor: BTN_COLOR, borderWidth: '2px' }
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" onClick={handleLookupByName} sx={{ color: BTN_COLOR }}>
                        Search
                      </Button>
                    </InputAdornment>
                  )
                }}
                sx={{ maxWidth: 480 }}
              />
            </Box>
          )}
        </Paper>

        {/* Visual feedback: invalid barcode */}
        {feedback === 'invalid' && (
          <Alert severity="error" sx={{ mb: 2 }} icon={false}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography color="error.main" fontWeight="bold">Invalid barcode</Typography>
              <Chip label="Not found" color="error" size="small" />
            </Box>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Visual feedback: product found */}
        {product && feedback !== 'invalid' && (
          <Alert severity="success" sx={{ mb: 2 }} icon={false}>
            <Typography fontWeight="bold">🟢 Product Found</Typography>
          </Alert>
        )}

        {(feedback === 'duplicate_out' || feedback === 'duplicate_both') && product && (
          <Alert severity="warning" sx={{ mb: 2 }} icon={false}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography color="warning.dark" fontWeight="bold">
                {feedback === 'duplicate_both'
                  ? 'Duplicate scan – barcode fully used (IN and OUT)'
                  : 'Duplicate scan – already used for Stock OUT'}
              </Typography>
              <Chip
                label={feedback === 'duplicate_both' ? 'Barcode lifecycle complete' : 'Barcode already stocked out'}
                color="warning"
                size="small"
              />
            </Box>
            <Typography variant="body2">
              {feedback === 'duplicate_both'
                ? 'This barcode cannot be used again for Stock IN or Stock OUT.'
                : 'This barcode was already used for Stock OUT.'}
            </Typography>
          </Alert>
        )}

        {error && feedback !== 'invalid' && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading && (
          <Paper sx={{ p: 3 }}>
            <Typography>{productNameInput.trim() ? 'Looking up product by name...' : 'Validating barcode and fetching product...'}</Typography>
          </Paper>
        )}

        {product && stockBalance && (
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
              <Card
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'background-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                  '&:hover': {
                    bgcolor: 'rgba(120, 18, 28, 0.06)',
                    boxShadow: '0 8px 24px rgba(120, 18, 28, 0.12)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ flex: 1, '& .MuiTypography-root': { fontSize: '1.25rem' } }}>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    Product Details
                  </Typography>
                  <Typography><strong>Name:</strong> {product.name}</Typography>
                  {!lookedUpByName && <Typography><strong>Barcode:</strong> {product.barcode}</Typography>}
                  {lookedUpByName && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
                      (Aggregated across all barcodes for this product)
                    </Typography>
                  )}
                  <Typography><strong>Category:</strong> {product.categoryCode || product.category}</Typography>
                  <Typography><strong>Purchase Price:</strong> Rs. {formatNumber(product.costPrice)}</Typography>
                  <Typography><strong>Selling Price:</strong> Rs. {formatNumber(product.sellingPrice ?? 0)}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
              <Card
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isLowStock && !usedForOut && !lookedUpByName ? 2 : 0,
                  borderColor: 'warning.main',
                  transition: 'background-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                  '&:hover': {
                    bgcolor: 'rgba(0, 137, 123, 0.08)',
                    boxShadow: '0 8px 24px rgba(0, 137, 123, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ flex: 1, p: 3, '&:last-child': { pb: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Stock Information
                  </Typography>
                  {lookedUpByName ? (
                    <>
                      <Typography variant="h3" component="p" sx={{ color: isLowStock ? 'warning.main' : 'success.main', fontWeight: 700, py: 2, px: 0 }}>
                        Available: {stockBalance.balance}
                      </Typography>
                      {isLowStock && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Low stock! Balance ({stockBalance.balance}) is at or below threshold ({product.lowStockThreshold})
                        </Alert>
                      )}
                    </>
                  ) : usedForOut ? (
                    <Box sx={{ py: 2, px: 0 }}>
                      <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.25rem' }}>
                        Status: SOLD
                      </Typography>
                      <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '1.125rem' }}>
                        Sold Date: {soldDate ? soldDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '–'}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography
                        variant="h3"
                        component="p"
                        sx={{
                          color: isLowStock ? 'warning.main' : 'success.main',
                          fontWeight: 700,
                          py: 2,
                          px: 0
                        }}
                      >
                        Available
                      </Typography>
                      {isLowStock && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Low stock! Balance ({stockBalance.balance}) is at or below threshold ({product.lowStockThreshold})
                        </Alert>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => setStockInOpen(true)}
                  size="large"
                  disabled={usedForIn || lookedUpByName}
                  sx={{ bgcolor: BTN_COLOR, '&:hover': { bgcolor: BTN_HOVER } }}
                >
                  Stock IN
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setStockOutOpen(true)}
                  size="large"
                  disabled={stockBalance.balance === 0 || usedForOut || lookedUpByName}
                  sx={{ bgcolor: BTN_COLOR, '&:hover': { bgcolor: BTN_HOVER } }}
                >
                  Stock OUT
                </Button>
                {lookedUpByName && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    Scan a barcode to record Stock In or Stock Out.
                  </Typography>
                )}
                {!lookedUpByName && usedForIn && (
                  <Chip label="This barcode already used for Stock IN" color="warning" size="small" sx={{ ml: 1 }} />
                )}
                {!lookedUpByName && usedForOut && (
                  <Chip label="This barcode already used for Stock OUT" color="warning" size="small" sx={{ ml: 1 }} />
                )}
              </Box>
            </Grid>
          </Grid>
        )}

        <Dialog open={stockInOpen} onClose={() => setStockInOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Stock IN (1 unit per barcode scan)</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Scan barcode to confirm product or switch to another
              </Typography>
              <BarcodeInput
                onScan={handleScan}
                label="Barcode"
                placeholder="Scan barcode here"
              />
            </Box>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              margin="normal"
              required
              inputProps={{ min: 1 }}
              helperText="Each barcode = 1 unit. Enter quantity for bulk entry."
            />
            <DatePicker
              label="Date"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStockInOpen(false)} sx={{ color: BTN_COLOR }}>Cancel</Button>
            <Button onClick={handleStockIn} variant="contained" disabled={submitting} sx={{ bgcolor: BTN_COLOR, '&:hover': { bgcolor: BTN_HOVER } }}>
              {submitting ? 'Adding...' : 'Add Stock'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={stockOutOpen}
          onClose={() => {
            setStockOutOpen(false);
            setStockOutQuantity('1');
            setStockOutReason('invoice');
            setInvoiceNumber('');
            setDeliveryNoteNumber('');
          }}
          maxWidth="sm"
          fullWidth
          disableAutoFocus
          TransitionProps={{
            onEntered: () => {
              setTimeout(() => stockOutBarcodeRef.current?.focus(), 150);
            }
          }}
        >
          <DialogTitle>Stock Out</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Scan barcode to confirm product or switch to another
              </Typography>
              <BarcodeInput
                ref={stockOutBarcodeRef}
                onScan={handleScan}
                label="Barcode"
                placeholder="Scan barcode here"
                minLength={1}
              />
            </Box>
            {product && stockBalance && (
              <>
                <Typography sx={{ mb: 2 }}>
                  Deduct from &quot;{product.name}&quot; (Available: {stockBalance.balance})
                </Typography>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={stockOutQuantity}
                  onChange={(e) => setStockOutQuantity(e.target.value)}
                  margin="normal"
                  required
                  inputProps={{ min: 1, max: stockBalance.balance }}
                  helperText={`Enter quantity to deduct (max: ${stockBalance.balance})`}
                />
                <TextField
                  fullWidth
                  select
                  label="Reason"
                  value={stockOutReason}
                  onChange={(e) => {
                    setStockOutReason(e.target.value as 'invoice' | 'warranty' | 'damage');
                    setInvoiceNumber('');
                    setDeliveryNoteNumber('');
                  }}
                  margin="normal"
                >
                  <MenuItem value="invoice">Invoice</MenuItem>
                  <MenuItem value="warranty">Warranty</MenuItem>
                  <MenuItem value="damage">Damage</MenuItem>
                </TextField>
                {stockOutReason === 'invoice' && (
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    margin="normal"
                    required
                    placeholder="Enter invoice number"
                  />
                )}
                {stockOutReason === 'warranty' && (
                  <TextField
                    fullWidth
                    label="Delivery Note Number"
                    value={deliveryNoteNumber}
                    onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                    margin="normal"
                    required
                    placeholder="Enter delivery note number"
                  />
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStockOutOpen(false)} sx={{ color: BTN_COLOR }}>Cancel</Button>
            <Button onClick={handleStockOut} variant="contained" disabled={submitting} sx={{ bgcolor: BTN_COLOR, '&:hover': { bgcolor: BTN_HOVER } }}>
              {submitting ? 'Recording...' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};
