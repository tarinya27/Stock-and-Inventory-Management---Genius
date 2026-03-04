# Barcode Scanner Setup Guide

## USB Barcode Scanner Integration

USB barcode scanners work as keyboard input devices (HID - Human Interface Device). When you scan a barcode, the scanner sends keyboard events as if someone typed the barcode number and pressed Enter.

## How It Works

1. **Physical Setup**: Plug the USB barcode scanner into your computer
2. **Scanner Configuration**: Most scanners work out-of-the-box without configuration
3. **Application Integration**: The scanner sends keyboard input, which our React app captures

## Implementation in React

### Basic Implementation

```typescript
// BarcodeInput.tsx
import { useEffect, useRef, useState } from 'react';

const BarcodeInput = ({ onScan }: { onScan: (barcode: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcode(value);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If scanner sends data quickly, wait for completion
    // Most scanners send barcode + Enter key within 100-200ms
    timeoutRef.current = setTimeout(() => {
      if (value.length >= 8) { // Minimum barcode length
        onScan(value.trim());
        setBarcode('');
        inputRef.current?.focus(); // Refocus for next scan
      }
    }, 150);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed (scanner sends Enter after barcode)
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcode.trim().length >= 8) {
        onScan(barcode.trim());
        setBarcode('');
        inputRef.current?.focus();
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={barcode}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      placeholder="Scan or enter barcode..."
      autoFocus
      style={{ fontSize: '18px', padding: '12px', width: '100%' }}
    />
  );
};
```

### Advanced Implementation with Debouncing

```typescript
// hooks/useBarcodeScanner.ts
import { useEffect, useRef, useState } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  debounceMs?: number;
}

export const useBarcodeScanner = ({
  onScan,
  minLength = 8,
  debounceMs = 150
}: UseBarcodeScannerOptions) => {
  const [barcode, setBarcode] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const handleBarcodeInput = (value: string) => {
    setBarcode(value);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce to handle rapid scanner input
    timeoutRef.current = setTimeout(() => {
      const trimmedBarcode = value.trim();
      if (trimmedBarcode.length >= minLength) {
        onScan(trimmedBarcode);
        setBarcode('');
        // Refocus for next scan
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, debounceMs);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
    handleKeyPress,
    inputRef,
    focus: () => inputRef.current?.focus()
  };
};
```

## Scanner Configuration (If Needed)

Some scanners may require configuration. Common settings:

### Scanner Settings (via manual or configuration card)

1. **Suffix**: Set to "Enter" (CR/LF) - sends Enter key after scan
2. **Prefix**: Usually none
3. **Beep**: Enable for audio feedback
4. **Scan Mode**: Continuous (auto-scan) or trigger mode

### Configuration Methods

1. **Configuration Card**: Scan special barcodes to change settings
2. **Software**: Use manufacturer's configuration software
3. **Manual**: Some scanners have DIP switches or buttons

## Testing Without Scanner

You can test the system by manually typing barcodes:

1. Click on the barcode input field
2. Type a barcode (e.g., "1234567890123")
3. Press Enter
4. The system should process it as if scanned

## Common Issues and Solutions

### Issue: Scanner not working
**Solution**: 
- Check USB connection
- Try different USB port
- Check if scanner is in "keyboard mode" (not serial mode)

### Issue: Double scanning
**Solution**: 
- Increase debounce timeout
- Check scanner settings for duplicate scan prevention

### Issue: Extra characters
**Solution**: 
- Configure scanner suffix/prefix settings
- Trim input in code

### Issue: Not auto-focusing
**Solution**: 
- Ensure input field is visible
- Check browser autofocus settings
- Manually focus after operations

## Best Practices

1. **Auto-focus**: Always keep barcode input focused
2. **Visual Feedback**: Show loading state while fetching product
3. **Error Handling**: Display error if product not found
4. **Success Feedback**: Show confirmation after successful scan
5. **Clear Input**: Clear input after successful scan
6. **Debouncing**: Use debouncing to handle rapid scans
7. **Validation**: Validate barcode format before processing

## Example Usage in Component

```typescript
import { useBarcodeScanner } from './hooks/useBarcodeScanner';

const ProductScanner = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (barcode: string) => {
    setLoading(true);
    try {
      const productData = await fetchProduct(barcode);
      setProduct(productData);
    } catch (error) {
      alert('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const { barcode, setBarcode, handleKeyPress, inputRef } = useBarcodeScanner({
    onScan: handleScan,
    minLength: 8
  });

  return (
    <div>
      <input
        ref={inputRef}
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Scan barcode..."
      />
      {loading && <p>Loading...</p>}
      {product && <ProductDetails product={product} />}
    </div>
  );
};
```

## Scanner Recommendations

- **Budget**: Symbol LS2208, Honeywell Voyager 1200g
- **Mid-range**: Zebra DS2208, Datalogic QuickScan QD2400
- **Enterprise**: Honeywell CT60, Zebra DS8178

Most USB barcode scanners work with this implementation without additional drivers.
