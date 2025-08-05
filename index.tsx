import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- Mock Lucide Icons (as SVGs for standalone use) ---
const Loader2 = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const AlertTriangle = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

// --- Simplified UI Components (mimicking shadcn/ui with Tailwind) ---
const Label = ({ children, ...props }: { children: React.ReactNode; [key: string]: any; }) => (
    <label className="block text-sm font-medium text-gray-700" {...props}>
        {children}
    </label>
);

const Input = ({ className, type, ...props }) => (
    <input
        type={type}
        className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md text-sm shadow-sm placeholder-gray-400 ${className}`}
        {...props}
    />
);

const Card = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: any; }) => (
    <div
        className={`bg-white shadow-lg rounded-xl overflow-hidden ${className}`}
        {...props}
    >
        {children}
    </div>
);

const CardContent = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: any; }) => (
    <div className={`p-6 ${className}`} {...props}>
        {children}
    </div>
);

// --- Application Components ---

const Field = ({ label, value, onChange, onFocus, onBlur, isSaving, hasError }) => {
  const inputId = `field-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`${hasError 
            ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'} 
            pr-10 transition-colors duration-200`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {isSaving && <Loader2 className="animate-spin h-5 w-5 text-gray-500" aria-label="Saving..." />}
          {hasError && (
            <div role="alert" id={`${inputId}-error`}>
              <AlertTriangle className="h-5 w-5 text-red-500" aria-label="Error" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DealStructure = () => {
  const [fields, setFields] = useState({
    salesPrice: { value: '27537.00', isSaving: false, hasError: false },
    downPayment: { value: '2500.00', isSaving: false, hasError: false },
    warranty: { value: '0.00', isSaving: false, hasError: false },
    cpi: { value: '0.00', isSaving: false, hasError: false },
    gap: { value: '0.00', isSaving: false, hasError: false },
  });

  const originalValueRef = useRef(null);
  
  const formatInputValue = (valueStr) => {
    if (typeof valueStr !== 'string' || valueStr === '') {
        return valueStr;
    }
    const [integer, decimal] = valueStr.split('.');
    // Add commas to the integer part
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Re-join with decimal part if it exists
    if (decimal !== undefined) {
        return `${formattedInteger}.${decimal}`;
    }
    return formattedInteger;
  };

  const parseCurrencyInput = (input) => {
    if (typeof input !== 'string') return '';
    // Remove anything that isn't a digit or a decimal point.
    const numericString = input.replace(/[^0-9.]/g, '');
    const parts = numericString.split('.');
    // Ensure only one decimal point exists.
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to two decimal places
    if (parts[1] && parts[1].length > 2) {
      return `${parts[0]}.${parts[1].substring(0, 2)}`;
    }
    return numericString;
  };

  const calculateTotal = (currentFields) => {
    const safeParseFloat = (str) => {
        const num = parseFloat(String(str).replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    const total =
      safeParseFloat(currentFields.salesPrice.value) -
      safeParseFloat(currentFields.downPayment.value) +
      safeParseFloat(currentFields.warranty.value) +
      safeParseFloat(currentFields.cpi.value) +
      safeParseFloat(currentFields.gap.value);
      
    return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };
  
  const [amountFinanced, setAmountFinanced] = useState(() => calculateTotal(fields));

  const handleFocus = (key) => () => {
    originalValueRef.current = fields[key].value;
  };

  const handleFieldChange = (key) => (e) => {
    const newValue = parseCurrencyInput(e.target.value);
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: newValue, hasError: false }, // Clear error on edit
    }));
  };

  const handleBlur = (key) => async () => {
    const currentValue = fields[key].value;
    const formattedValue = (parseFloat(currentValue) || 0).toFixed(2);

    // If value hasn't numerically changed, just ensure it's formatted and exit.
    if (formattedValue === originalValueRef.current) {
        if (currentValue !== formattedValue) {
             setFields(prev => ({...prev, [key]: {...prev[key], value: formattedValue}}));
        }
        return;
    }

    // Value has changed, proceed with saving.
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: formattedValue, isSaving: true, hasError: false },
    }));

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const numericValue = parseFloat(formattedValue);
      if (isNaN(numericValue)) {
          throw new Error('Invalid number');
      }

      // Simulate error condition
      if (key === 'salesPrice' && numericValue < 10000) {
        throw new Error('Sales price must be at least $10,000');
      }
      
      setFields((currentFields) => {
        const updatedFields = {
          ...currentFields,
          [key]: { ...currentFields[key], isSaving: false, hasError: false },
        };
        setAmountFinanced(calculateTotal(updatedFields));
        return updatedFields;
      });
      
    } catch (err) {
      setFields((prev) => ({
        ...prev,
        [key]: { ...prev[key], value: formattedValue, isSaving: false, hasError: true },
      }));
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4" aria-labelledby="form-title">
        <Card className="max-w-2xl w-full mx-auto">
            <div className="p-6 border-b bg-gray-50 rounded-t-xl">
                <h1 id="form-title" className="text-2xl font-bold text-gray-900">Deal Structure</h1>
                <p className="mt-2 text-xl font-semibold text-gray-700">
                    Amount Financed: <span className="text-indigo-600 font-bold">{amountFinanced}</span>
                </p>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <Field label="Sales Price" value={`$${formatInputValue(fields.salesPrice.value)}`} onChange={handleFieldChange('salesPrice')} onFocus={handleFocus('salesPrice')} onBlur={handleBlur('salesPrice')} isSaving={fields.salesPrice.isSaving} hasError={fields.salesPrice.hasError} />
                    <Field label="Down Payment" value={`$${formatInputValue(fields.downPayment.value)}`} onChange={handleFieldChange('downPayment')} onFocus={handleFocus('downPayment')} onBlur={handleBlur('downPayment')} isSaving={fields.downPayment.isSaving} hasError={fields.downPayment.hasError} />
                    <Field label="+ Warranty" value={`$${formatInputValue(fields.warranty.value)}`} onChange={handleFieldChange('warranty')} onFocus={handleFocus('warranty')} onBlur={handleBlur('warranty')} isSaving={fields.warranty.isSaving} hasError={fields.warranty.hasError} />
                    <Field label="+ CPI" value={`$${formatInputValue(fields.cpi.value)}`} onChange={handleFieldChange('cpi')} onFocus={handleFocus('cpi')} onBlur={handleBlur('cpi')} isSaving={fields.cpi.isSaving} hasError={fields.cpi.hasError} />
                    <Field label="+ Gap on Contract" value={`$${formatInputValue(fields.gap.value)}`} onChange={handleFieldChange('gap')} onFocus={handleFocus('gap')} onBlur={handleBlur('gap')} isSaving={fields.gap.isSaving} hasError={fields.gap.hasError} />
                </CardContent>
            </form>
        </Card>
    </main>
  );
};

const App = () => (
    <React.StrictMode>
        <DealStructure />
    </React.StrictMode>
);

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
