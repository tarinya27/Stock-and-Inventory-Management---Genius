import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
}

export const useBarcodeScanner = ({
  onScan,
  minLength = 1
}: UseBarcodeScannerOptions) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Read from DOM - scanners send keys so fast that React state may not have updated yet.
      // Uncontrolled input or direct DOM read ensures we get the full barcode (e.g. 5-digit).
      const el = (e.target as HTMLInputElement) ?? inputRef.current;
      const raw = el?.value ?? '';
      const trimmedBarcode = String(raw).trim();
      if (trimmedBarcode.length >= minLength) {
        onScan(trimmedBarcode);
        if (el) el.value = '';
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  };

  return {
    handleKeyDown,
    inputRef,
    focus: () => inputRef.current?.focus()
  };
};
