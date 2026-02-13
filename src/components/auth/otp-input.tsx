'use client';

import { useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled = false }: Readonly<OtpInputProps>) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setInputRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[index] = el;
    },
    []
  );

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputRefs.current[index]?.focus();
    }
  }, []);

  const handleChange = useCallback(
    (index: number, inputValue: string) => {
      const digit = inputValue.replaceAll(/\D/g, '').slice(-1);
      const newValue = [...value];
      newValue[index] = digit;
      onChange(newValue);

      if (digit && index < OTP_LENGTH - 1) {
        focusInput(index + 1);
      }
    },
    [value, onChange, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!value[index] && index > 0) {
          const newValue = [...value];
          newValue[index - 1] = '';
          onChange(newValue);
          focusInput(index - 1);
        } else {
          const newValue = [...value];
          newValue[index] = '';
          onChange(newValue);
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        focusInput(index + 1);
      }
    },
    [value, onChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replaceAll(/\D/g, '').slice(0, OTP_LENGTH);
      if (pastedData.length === 0) return;

      const newValue = [...value];
      for (let i = 0; i < OTP_LENGTH; i++) {
        newValue[i] = pastedData[i] ?? '';
      }
      onChange(newValue);
      focusInput(Math.min(pastedData.length, OTP_LENGTH) - 1);
    },
    [value, onChange, focusInput]
  );

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <Input
          key={index}
          ref={setInputRef(index)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={index === 0}
          aria-label={`Chiffre ${index + 1}`}
          className={cn('w-12 h-12 text-center text-lg font-semibold', 'focus-visible:ring-primary')}
        />
      ))}
    </div>
  );
}
