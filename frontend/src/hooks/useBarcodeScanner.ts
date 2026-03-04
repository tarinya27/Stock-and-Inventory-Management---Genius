import { useEffect, useRef, useState } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
}

export const useBarcodeScanner = ({
  onScan,
  minLength = 8
}: UseBarcodeScannerOptions) => {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const handleBarcodeInput = (value: string) => {
    setBarcode(value);
    // No debounce auto-submit: only submit on Enter key.
    // This allows typing full barcode (e.g. 111222333) without triggering too early.
    // Barcode scanners send Enter after the code, so they still work.
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedBarcode = barcode.trim();
      if (trimmedBarcode.length >= minLength) {
        onScan(trimmedBarcode);
        setBarcode('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  };

  return {
    barcode,
    setBarcode: handleBarcodeInput,
    handleKeyDown,
    inputRef,
    focus: () => inputRef.current?.focus()
  };
};
