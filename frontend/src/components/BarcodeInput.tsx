import React from 'react';
import { TextField, Box } from '@mui/material';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

interface BarcodeInputProps {
  onScan: (barcode: string) => void;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
}

export const BarcodeInput: React.FC<BarcodeInputProps> = ({
  onScan,
  label = 'Barcode',
  placeholder = 'Scan or type barcode, then press Enter',
  fullWidth = true
}) => {
  const { barcode, setBarcode, handleKeyDown, inputRef } = useBarcodeScanner({
    onScan,
    minLength: 8
  });

  return (
    <Box>
      <TextField
        inputRef={inputRef}
        fullWidth={fullWidth}
        label={label}
        placeholder={placeholder}
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-input': {
            fontSize: '18px',
            padding: '14px'
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#78121c' },
            '&:hover fieldset': { borderColor: '#78121c', borderWidth: '2px' },
            '&.Mui-focused fieldset': { borderColor: '#78121c', borderWidth: '2px' }
          },
          '& .MuiInputLabel-root': { color: '#78121c' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#78121c' }
        }}
      />
    </Box>
  );
};
