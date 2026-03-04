import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  QrCodeScanner,
  Assessment,
  Warning,
  Inventory,
  Category as CategoryIcon,
  NotificationsOutlined,
  Person,
  AddCircleOutline,
  TableChart,
  History
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getGroupedProductsForStoreManager } from '../services/productService';

const drawerWidth = 260;

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/reports': 'Reports',
  '/login-history': 'Login History',
  '/low-stock': 'Low Stock Alert',
  '/products': 'Products',
  '/scan': 'Scan Barcode',
  '/categories': 'Categories',
  '/stock-in': 'Stock-In',
  '/stock-sheet': 'Stock Sheet'
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const loadLowStockCount = async () => {
      try {
        const grouped = await getGroupedProductsForStoreManager();
        const count = grouped.filter((g) => g.balance <= g.lowStockThreshold).length;
        setLowStockCount(count);
      } catch {
        setLowStockCount(0);
      }
    };
    loadLowStockCount();
  }, [location.pathname]);

  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Reports', icon: <Assessment />, path: '/reports' },
    { text: 'Login History', icon: <History />, path: '/login-history' },
    { text: 'Low Stock', icon: <Warning />, path: '/low-stock' },
    { text: 'Products', icon: <Inventory />, path: '/products' }
  ];

  const storeManagerMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Reports', icon: <Assessment />, path: '/reports' },
    { text: 'Low Stock Alert', icon: <Warning />, path: '/low-stock' },
    { text: 'Stock Sheet', icon: <TableChart />, path: '/stock-sheet' },
    { text: 'Scan Barcode', icon: <QrCodeScanner />, path: '/scan' },
    { text: 'Stock-In', icon: <AddCircleOutline />, path: '/stock-in' },
    { text: 'Products', icon: <Inventory />, path: '/products' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/categories' }
  ];

  const getMenuItems = () => {
    if (!user || !user.role) return [];
    return user.role === 'admin' ? adminMenuItems : storeManagerMenuItems;
  };

  const menuItems = getMenuItems();
  const pageTitle = routeTitles[location.pathname] || 'Dashboard';
  const isStoreManager = user?.role === 'store_manager';
  const sidebarColor = isStoreManager ? '#78121c' : '#db342c';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      {/* Left sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: sidebarColor,
            borderRight: 'none',
            boxShadow: '2px 0 12px rgba(0,0,0,0.08)'
          }
        }}
      >
        <List sx={{ px: 1.5, pt: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  color: location.pathname === item.path ? '#fff' : 'rgba(255,255,255,0.85)',
                  bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.18)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                  '&.Mui-selected:hover': { bgcolor: 'rgba(255,255,255,0.22)' }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Right side: header + content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header bar */}
        <Box
          sx={{
            height: 64,
            bgcolor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
            {pageTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="medium"
              sx={{ color: '#5f5f5f' }}
              aria-label={lowStockCount > 0 ? `${lowStockCount} low stock alerts` : 'Notifications'}
              onClick={() => lowStockCount > 0 && navigate('/low-stock')}
            >
              <Badge
                badgeContent={lowStockCount > 0 ? lowStockCount : 0}
                color="error"
                overlap="circular"
              >
                <NotificationsOutlined />
              </Badge>
            </IconButton>
            <Typography
              component="button"
              onClick={handleLogout}
              sx={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#5f5f5f',
                fontWeight: 500,
                '&:hover': { color: sidebarColor }
              }}
            >
              Log out
            </Typography>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: sidebarColor
              }}
            >
              <Person sx={{ fontSize: 22, color: '#fff' }} />
            </Avatar>
          </Box>
        </Box>

        {/* Main content area - light gray background */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f0f2f5' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
