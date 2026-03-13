import React, { forwardRef, useImperativeHandle } from 'react';
import { TextField, Box } from '@mui/material';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

export interface BarcodeInputHandle {
  focus: () => void;
}

interface BarcodeInputProps {
  onScan: (barcode: string) => void;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
  /** Minimum barcode length to trigger scan (default 3). Use 1 for dialogs. */
  minLength?: number;
}

export const BarcodeInput = forwardRef<BarcodeInputHandle, BarcodeInputProps>(function BarcodeInput({
  onScan,
  label = 'Barcode',
  placeholder = 'Scan or type barcode, then press Enter',
  fullWidth = true,
  minLength = 3
}, ref) {
  const { handleKeyDown, inputRef, focus } = useBarcodeScanner({
    onScan,
    minLength
  });

  useImperativeHandle(ref, () => ({ focus }), [focus]);

  return (
    <Box data-barcode-input>
      <TextField
        inputRef={inputRef}
        fullWidth={fullWidth}
        label={label}
        placeholder={placeholder}
        defaultValue=""
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
});
