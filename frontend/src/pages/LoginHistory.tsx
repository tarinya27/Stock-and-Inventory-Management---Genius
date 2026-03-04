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
  TableRow
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { getLoginHistory } from '../services/loginLogService';
import type { LoginLog } from '../services/loginLogService';

const ADMIN_RED = '#db342c';

const formatDateTime = (timestamp: any) => {
  if (!timestamp) return '—';
  const d = timestamp.toDate?.() ?? new Date(timestamp);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export const LoginHistory: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const loadLogs = async (applyDateFilter?: boolean) => {
    setLoading(true);
    try {
      let result: LoginLog[];
      if (applyDateFilter && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        result = await getLoginHistory(start, end);
      } else {
        result = await getLoginHistory();
      }
      setLogs(result);
    } catch (error) {
      console.error('Error loading login history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(false);
  }, []);

  const handleApplyFilter = () => {
    loadLogs(true);
  };

  const handleClearFilter = () => {
    setStartDate(() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    });
    setEndDate(new Date());
    loadLogs(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" component="h1">
            Login History
          </Typography>
          <Button onClick={() => navigate('/dashboard')} size="small" sx={{ color: ADMIN_RED }}>
            ← Back to Dashboard
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
            Date Filter
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(d) => setStartDate(d)}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 160 } } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(d) => setEndDate(d)}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 160 } } }}
            />
            <Button variant="contained" size="small" onClick={handleApplyFilter} sx={{ bgcolor: ADMIN_RED, '&:hover': { bgcolor: '#c02e27' } }}>
              Apply Filter
            </Button>
            <Button variant="outlined" size="small" onClick={handleClearFilter} sx={{ borderColor: ADMIN_RED, color: ADMIN_RED }}>
              Clear Filter
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Login Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Logout Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    Loading…
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No login records found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{log.userName}</TableCell>
                    <TableCell>{log.role === 'admin' ? 'Admin' : 'Store Manager'}</TableCell>
                    <TableCell>{formatDateTime(log.loginTime)}</TableCell>
                    <TableCell>{formatDateTime(log.logoutTime)}</TableCell>
                    <TableCell>{log.ipAddress || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </LocalizationProvider>
  );
};
