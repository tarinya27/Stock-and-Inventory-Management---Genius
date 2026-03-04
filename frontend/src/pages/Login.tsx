import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { login, resetPassword } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: '28px',
  border: '1px solid rgba(255, 255, 255, 0.75)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
  p: 4,
  width: '100%',
  maxWidth: 420,
  animation: 'cardEnter 0.5s ease-out',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.15) inset'
  }
};

const fieldStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)', transition: 'border-color 0.2s ease' },
    '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.18)' },
    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(196, 30, 58, 0.12)' },
    '&.Mui-focused fieldset': { borderWidth: '1.5px', borderColor: 'rgba(196, 30, 58, 0.6)' }
  },
  '& .MuiInputLabel-root': { fontFamily: "'Poppins', sans-serif" },
  '& .MuiInputBase-input': { fontFamily: "'Inter', sans-serif" }
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'store_manager' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const logoUrl = `${process.env.PUBLIC_URL || ''}/logo.png`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const user = await login(email, password);
      await refreshUser();
      if (!user.role) {
        setError('User role not found in database. Please contact administrator.');
        setLoading(false);
        return;
      }
      if (!selectedRole) {
        setError('Please select your role.');
        setLoading(false);
        return;
      }
      const normalizedStoredRole = user.role.toLowerCase().trim();
      const normalizedSelectedRole = selectedRole.toLowerCase().trim();
      let storedRoleValue = normalizedStoredRole;
      if (normalizedStoredRole === 'store manager' || normalizedStoredRole === 'storemanager') {
        storedRoleValue = 'store_manager';
      }
      if (storedRoleValue !== normalizedSelectedRole) {
        const storedRoleDisplay = storedRoleValue === 'admin' ? 'Admin' : (storedRoleValue === 'store_manager' ? 'Store Manager' : user.role);
        const selectedRoleDisplay = selectedRole === 'admin' ? 'Admin' : (selectedRole === 'store_manager' ? 'Store Manager' : '');
        setError(`Role mismatch. Your account is registered as "${storedRoleDisplay}" but you selected "${selectedRoleDisplay}". Please select the correct role.`);
        setLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess('Password reset email sent! Check your inbox (and spam folder).');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Check that this email is registered.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Poppins', 'Inter', sans-serif",
        /* Mesh gradient matching Genius logo: crimson, rose, cream, soft eclipse */
        background: '#f8f4f4',
        backgroundImage: `
          radial-gradient(ellipse 90% 70% at 50% 45%, rgba(239, 222, 221, 0.85) 0%, transparent 55%),
          radial-gradient(ellipse 75% 60% at 30% 55%, rgba(202, 156, 164, 0.35) 0%, transparent 50%),
          radial-gradient(ellipse 70% 65% at 70% 50%, rgba(183, 67, 67, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse 85% 75% at 50% 50%, rgba(255, 255, 255, 0.6) 0%, transparent 45%),
          radial-gradient(ellipse 100% 80% at 80% 25%, rgba(183, 67, 67, 0.15) 0%, transparent 45%),
          radial-gradient(ellipse 100% 100% at 15% 70%, rgba(50, 25, 25, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 110% 90% at 50% 100%, rgba(248, 244, 244, 0.95) 0%, transparent 45%),
          radial-gradient(ellipse 100% 110% at 50% 0%, rgba(245, 240, 240, 0.98) 0%, transparent 45%)
        `,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Subtle professional pattern overlay: dot grid + fine grid */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.35,
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(160, 100, 110, 0.14) 1px, transparent 0)`,
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.12,
          backgroundImage: `
            linear-gradient(rgba(140, 90, 100, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(140, 90, 100, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px'
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, px: 2 }}>
        <Box sx={cardStyle}>
          <Box sx={{ textAlign: 'center', mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {!logoError ? (
              <Box
                component="img"
                src={logoUrl}
                alt="Genius logo"
                onError={() => setLogoError(true)}
                sx={{
                  maxHeight: 72,
                  maxWidth: 200,
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))',
                  mb: 2
                }}
              />
            ) : (
              <Typography
                component="span"
                sx={{
                  display: 'block',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  color: '#c41e3a',
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  textShadow: '0 0 24px rgba(196, 30, 58, 0.7), 0 0 48px rgba(255, 255, 255, 0.15)',
                  mb: 2,
                  fontFamily: "'Poppins', sans-serif",
                  lineHeight: 1.1
                }}
              >
                GENIUS
              </Typography>
            )}
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}
            >
              Stock Management System
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: '#6b6b6b',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500
              }}
            >
              Sign in to your account
            </Typography>
            <Box
              sx={{
                width: 48,
                height: 3,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #c41e3a, #b74343)',
                mt: 1.5,
                mb: 0.5
              }}
            />
          </Box>

          {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            {forgotPassword ? (
              <>
                <Typography variant="body2" sx={{ color: '#5f5f5f', mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Enter the email you used to sign up. We&apos;ll send a link to reset your password.
                </Typography>
                <form onSubmit={handleForgotPassword}>
                  <TextField
                    fullWidth
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ ...fieldStyle, mb: 2 }}
                    required
                    autoFocus
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={resetLoading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontFamily: "'Poppins', sans-serif",
                      background: 'linear-gradient(135deg, #c41e3a 0%, #a01830 100%)',
                      boxShadow: '0 4px 20px rgba(196, 30, 58, 0.4)',
                      '&:hover': { background: 'linear-gradient(135deg, #d42440 0%, #b01c38 100%)', boxShadow: '0 6px 24px rgba(196, 30, 58, 0.5)' }
                    }}
                  >
                    {resetLoading ? 'Sending...' : 'Send reset link'}
                  </Button>
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => { setForgotPassword(false); setError(''); setSuccess(''); }}
                    sx={{ mt: 1, color: '#555', fontFamily: "'Inter', sans-serif" }}
                  >
                    Back to login
                  </Button>
                </form>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <FormControl fullWidth required sx={{ ...fieldStyle, mb: 2 }}>
                  <Select
                    value={selectedRole}
                    displayEmpty
                    renderValue={(v: string) => (v === '' ? 'Select the role' : v === 'admin' ? 'Admin' : 'Store Manager')}
                    onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'store_manager' | '')}
                    autoFocus
                    sx={{ '& .MuiSelect-select': { color: selectedRole ? 'inherit' : 'rgba(0, 0, 0, 0.5)' } }}
                  >
                    <MenuItem value="" disabled>
                      Select the role
                    </MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="store_manager">Store Manager</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ ...fieldStyle, mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={fieldStyle}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Box sx={{ mt: 1.5, textAlign: 'right' }}>
                  <Typography
                    component="button"
                    type="button"
                    onClick={() => setForgotPassword(true)}
                    sx={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.875rem',
                    color: '#555',
                    transition: 'color 0.2s ease',
                    '&:hover': { color: '#c41e3a' }
                  }}
                  >
                    Forgot Password?
                  </Typography>
                </Box>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 2.5,
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontFamily: "'Poppins', sans-serif",
                    color: '#fff',
                    background: '#db342c',
                    boxShadow: '0 4px 24px rgba(219, 52, 44, 0.4)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                    '&:hover': {
                      background: '#c42d26',
                      boxShadow: '0 8px 32px rgba(219, 52, 44, 0.5)',
                      transform: 'translateY(-1px)'
                    },
                    '&:active': { transform: 'translateY(0)' }
                  }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            )}
        </Box>
      </Box>
      <style>{`@keyframes cardEnter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </Box>
  );
};
