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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../services/categoryService';
import { Category } from '../types';

const BTN_COLOR = '#78121c';
const BTN_HOVER = '#5c0e15';
const EDIT_BTN_COLOR = '#00897b';
const DELETE_BTN_COLOR = '#c62828';

export const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [toDelete, setToDelete] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setCategoryName('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditing(cat);
    setCategoryName(cat.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const name = categoryName.trim();
    if (!name) return;
    try {
      if (editing) {
        await updateCategory(editing.categoryCode, name);
      } else {
        await createCategory(name);
      }
      setDialogOpen(false);
      loadCategories();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const handleDeleteClick = (cat: Category) => {
    setToDelete(cat);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    try {
      await deleteCategory(toDelete.categoryCode);
      setDeleteOpen(false);
      setToDelete(null);
      loadCategories();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Category Management</Typography>
        <Box>
          <Button onClick={() => navigate('/dashboard')} size="small" sx={{ mr: 1, color: BTN_COLOR }}>
            ← Dashboard
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} sx={{ bgcolor: BTN_COLOR, '&:hover': { bgcolor: BTN_HOVER } }}>
            Create category
          </Button>
        </Box>
      </Box>
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} align="center">Loading...</TableCell></TableRow>
              ) : categories.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center">No categories. Create one to get started.</TableCell></TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.categoryCode}>
                    <TableCell><strong>{cat.categoryCode}</strong></TableCell>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(cat)} sx={{ color: EDIT_BTN_COLOR, '&:hover': { bgcolor: 'rgba(0, 137, 123, 0.08)' } }}><Edit /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(cat)} sx={{ color: DELETE_BTN_COLOR, '&:hover': { bgcolor: 'rgba(198, 40, 40, 0.08)' } }}><Delete /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit category' : 'Create category'}</DialogTitle>
        <DialogContent>
          {editing && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Code: {editing.categoryCode}
            </Typography>
          )}
          {!editing && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Category code will be auto-generated (e.g. CAT0001).
            </Typography>
          )}
          <TextField
            fullWidth
            label="Category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: BTN_COLOR }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!categoryName.trim()} sx={{ bgcolor: BTN_COLOR, '&:hover': { bgcolor: BTN_HOVER } }}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete category?</DialogTitle>
        <DialogContent>
          {toDelete && (
            <Typography>Delete &quot;{toDelete.name}&quot; ({toDelete.categoryCode})? Products in this category will keep their category code.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: BTN_COLOR }}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" sx={{ bgcolor: BTN_COLOR, '&:hover': { bgcolor: BTN_HOVER } }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
