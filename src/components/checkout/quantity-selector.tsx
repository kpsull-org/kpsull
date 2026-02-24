'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly disabled?: boolean;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value < max) onChange(value + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center border border-black font-sans">
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center border-r border-black hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        aria-label="Diminuer la quantite"
      >
        <Minus className="h-3 w-3" />
      </button>

      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className="w-10 h-8 text-center text-sm font-medium bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-30"
        aria-label="Quantite"
      />

      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center border-l border-black hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        aria-label="Augmenter la quantite"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
