import React, { useEffect, useState, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  MenuItem
} from '@mui/material';
import { Add, Edit, Search, SwapHoriz, AddCircleOutline } from '@mui/icons-material';
import { StoreManagerStockInForm } from '../components/StoreManagerStockInForm';
import { useNavigate } from 'react-router-dom';
import {
  createProduct,
  updateProduct,
  getGroupedProductsForStoreManager,
  updateProductGroup
} from '../services/productService';
import { addStockIn, addStockOut } from '../services/stockService';
import { getAllCategories } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { Product, Category, GroupedProduct } from '../types';

// Helper function to format number with commas
const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper function to parse comma-separated string to number
const parseNumber = (str: string): number => {
  return parseFloat(str.replace(/,/g, '')) || 0;
};

const ADMIN_RED = '#db342c';
const SM_PRIMARY = '#78121c';
const SM_PRIMARY_DARK = '#5c0e15';

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStoreManager = user?.role === 'store_manager';
  const primaryColor = isStoreManager ? SM_PRIMARY : ADMIN_RED;
  const primaryHover = isStoreManager ? SM_PRIMARY_DARK : '#c02e27';
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [groupToAdjust, setGroupToAdjust] = useState<GroupedProduct | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingGroup, setEditingGroup] = useState<GroupedProduct | null>(null);
  const [stockInFormOpen, setStockInFormOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    categoryCode: '',
    costPrice: '',
    sellingPrice: '',
    lowStockThreshold: '3'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const list = await getAllCategories();
      setCategories(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProducts = async () => {
    try {
      const grouped = await getGroupedProductsForStoreManager();
      setGroupedProducts(grouped);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredGroupedProducts = useMemo(() => {
    let list = groupedProducts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (g) =>
          g.productName.toLowerCase().includes(q) ||
          (g.category && g.category.toLowerCase().includes(q)) ||
          (g.categoryCode && g.categoryCode.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) {
      list = list.filter((g) => g.categoryCode === categoryFilter);
    }
    return list;
  }, [groupedProducts, searchQuery, categoryFilter]);


  const handleAdjustStockGroup = (group: GroupedProduct) => {
    setProductToAdjust(group.representative);
    setGroupToAdjust(group);
    setAdjustQty('');
    setAdjustType('in');
    setAdjustOpen(true);
  };

  const handleAdjustSubmit = async () => {
    if (!productToAdjust || !user) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Enter a valid quantity.');
      return;
    }
    try {
      if (adjustType === 'in') {
        await addStockIn(productToAdjust.barcode, qty, user.uid, user.displayName);
      } else {
        await addStockOut(productToAdjust.barcode, qty, user.uid, user.displayName, 'Adjustment');
      }
      setAdjustOpen(false);
      setProductToAdjust(null);
      setGroupToAdjust(null);
      loadProducts();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const handleOpenStockInForm = () => {
    setStockInFormOpen(true);
  };

  const handleEditFromStockIn = (product: Product) => {
    setStockInFormOpen(false);
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      category: product.category || '',
      categoryCode: product.categoryCode || '',
      costPrice: formatNumber(product.costPrice),
      sellingPrice: product.sellingPrice.toString(),
      lowStockThreshold: product.lowStockThreshold.toString()
    });
    setDialogOpen(true);
  };

  const handleOpenDialogGroup = (group: GroupedProduct) => {
    setEditingGroup(group);
    setEditingProduct(group.representative);
    setFormData({
      barcode: group.representative.barcode,
      name: group.productName,
      category: group.category || '',
      categoryCode: group.categoryCode || '',
      costPrice: formatNumber(group.representative.costPrice),
      sellingPrice: group.representative.sellingPrice.toString(),
      lowStockThreshold: group.lowStockThreshold.toString()
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setEditingGroup(null);
  };

  const handleSubmit = async () => {
    try {
      const cat = categories.find(c => c.categoryCode === formData.categoryCode);
      const productData = {
        barcode: formData.barcode,
        name: formData.name,
        category: cat?.name ?? formData.category,
        categoryCode: formData.categoryCode || undefined,
        costPrice: parseNumber(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 3
      };

      if (editingGroup) {
        await updateProductGroup(editingGroup.productName, editingGroup.categoryCode, {
          name: productData.name,
          category: productData.category,
          categoryCode: productData.categoryCode,
          costPrice: productData.costPrice,
          sellingPrice: productData.sellingPrice,
          lowStockThreshold: productData.lowStockThreshold
        });
      } else if (editingProduct) {
        await updateProduct(editingProduct.barcode, productData);
      } else {
        await createProduct(productData);
      }

      handleCloseDialog();
      loadProducts();
    } catch (error: any) {
      alert(error.message || 'Error saving product');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" component="h1">
          Products
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {isStoreManager && (
            <Button
              onClick={() => navigate('/stock-in')}
              size="small"
              startIcon={<AddCircleOutline />}
              sx={{ color: primaryColor }}
            >
              Stock-In
            </Button>
          )}
          <Button onClick={() => navigate('/dashboard')} size="small" sx={{ color: primaryColor }}>
            ← Back to Dashboard
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search by product name or category..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 280 }}
          />
          <TextField
            select
            size="small"
            label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.categoryCode} value={c.categoryCode}>
                {c.categoryCode} – {c.name}
              </MenuItem>
            ))}
          </TextField>
          {isStoreManager && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenStockInForm}
              sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: primaryHover } }}
            >
              Create / Stock-In Product
            </Button>
          )}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Category Code</TableCell>
              <TableCell align="right">Purchase Price (Rs.)</TableCell>
              <TableCell align="right">Selling Price (Rs.)</TableCell>
              <TableCell align="right">Stock In</TableCell>
              <TableCell align="right">Stock Out</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="right">Low Stock Threshold</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredGroupedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  {searchQuery || categoryFilter
                    ? 'No products match your filters.'
                    : 'No products found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredGroupedProducts.map((group) => (
                <TableRow
                  key={`${group.categoryCode}\n${group.productName}`}
                  hover
                  sx={group.balance <= group.lowStockThreshold ? { bgcolor: 'warning.50' } : undefined}
                >
                  <TableCell>{group.productName}</TableCell>
                  <TableCell>{group.category}</TableCell>
                  <TableCell>{group.categoryCode}</TableCell>
                  <TableCell align="right">{formatNumber(group.representative.costPrice)}</TableCell>
                  <TableCell align="right">{formatNumber(group.representative.sellingPrice)}</TableCell>
                  <TableCell align="right">{group.totalStockIn}</TableCell>
                  <TableCell align="right">{group.totalStockOut}</TableCell>
                  <TableCell align="right">{group.balance}</TableCell>
                  <TableCell align="right">{group.lowStockThreshold}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialogGroup(group)} title="Edit product" sx={{ color: primaryColor }}>
                      <Edit />
                    </IconButton>
                    {!isStoreManager && (
                      <IconButton size="small" onClick={() => handleAdjustStockGroup(group)} title="Adjust stock" sx={{ color: primaryColor }}>
                        <SwapHoriz />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGroup
            ? 'Edit product (applies to all barcodes in this product)'
            : editingProduct
              ? 'Edit product (e.g. purchase price)'
              : 'Create new product'}
        </DialogTitle>
        <DialogContent>
          {editingGroup && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              This product has {editingGroup.barcodes.length} barcode(s). Changes apply to all.
            </Typography>
          )}
          <TextField
            fullWidth
            label={editingGroup ? 'Barcodes' : 'Barcode'}
            value={editingGroup ? `${editingGroup.barcodes.length} barcode(s)` : formData.barcode}
            onChange={editingGroup ? undefined : (e) => setFormData({ ...formData, barcode: e.target.value })}
            margin="normal"
            required={!editingGroup}
            disabled={!!editingProduct || !!editingGroup}
          />
          <TextField
            fullWidth
            label="Product name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={formData.categoryCode || formData.category}
            onChange={(e) => {
              const code = e.target.value;
              const cat = categories.find(c => c.categoryCode === code);
              setFormData({ ...formData, categoryCode: code, category: cat?.name ?? code });
            }}
            margin="normal"
            required
          >
            {categories.map((c) => (
              <MenuItem key={c.categoryCode} value={c.categoryCode}>{c.categoryCode} – {c.name}</MenuItem>
            ))}
            {categories.length === 0 && <MenuItem value="">No categories – create in Categories</MenuItem>}
          </TextField>
          <TextField
            fullWidth
            label="Purchase Price (Rs.)"
            value={formData.costPrice}
            onChange={(e) => {
              // Remove commas and allow only numbers and one decimal point
              let value = e.target.value.replace(/,/g, '');
              // Allow only numbers and one decimal point
              value = value.replace(/[^0-9.]/g, '');
              // Ensure only one decimal point
              const parts = value.split('.');
              if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
              }
              setFormData({ ...formData, costPrice: value });
            }}
            onBlur={(e) => {
              // Format with commas on blur
              const num = parseNumber(e.target.value);
              if (num > 0) {
                setFormData({ ...formData, costPrice: formatNumber(num) });
              }
            }}
            margin="normal"
            required
            helperText="Enter amount (e.g., 3500.00 will display as 3,500.00)"
          />
          <TextField
            fullWidth
            label="Selling Price (Rs.)"
            type="number"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Low Stock Threshold"
            type="number"
            value={formData.lowStockThreshold}
            margin="normal"
            required
            disabled
            helperText="Default: 3 units (cannot be changed)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: primaryColor }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: primaryHover } }}>
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {isStoreManager && (
        <StoreManagerStockInForm
          open={stockInFormOpen}
          onClose={() => setStockInFormOpen(false)}
          categories={categories}
          onSuccess={loadProducts}
          onEditProduct={handleEditFromStockIn}
        />
      )}

      <Dialog open={adjustOpen} onClose={() => { setAdjustOpen(false); setGroupToAdjust(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogContent>
          {productToAdjust && (
            <>
              <Typography variant="body2" color="text.secondary">
                {groupToAdjust ? groupToAdjust.productName : productToAdjust.name}
                {groupToAdjust && ` (${groupToAdjust.barcodes.length} barcode(s))`}
                {!groupToAdjust && ` (${productToAdjust.barcode})`}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Current balance: <strong>{groupToAdjust ? groupToAdjust.balance : 0}</strong>
              </Typography>
              <TextField
                select
                fullWidth
                label="Type"
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as 'in' | 'out')}
                margin="normal"
              >
                <MenuItem value="in">Stock In (add)</MenuItem>
                <MenuItem value="out">Stock Out (remove)</MenuItem>
              </TextField>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                margin="normal"
                inputProps={{ min: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)} sx={{ color: primaryColor }}>Cancel</Button>
          <Button onClick={handleAdjustSubmit} variant="contained" disabled={!adjustQty || parseInt(adjustQty, 10) <= 0} sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: primaryHover } }}>
            Update stock
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
