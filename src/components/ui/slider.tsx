"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PriceRangeInputProps {
  min: number;
  max: number;
  value: [number, number];
  onValueChange: (val: [number, number]) => void;
  className?: string;
}

export function PriceRangeInput({
  min,
  max,
  value,
  onValueChange,
  className,
}: Readonly<PriceRangeInputProps>) {
  const [minVal, maxVal] = value;

  const minPercent = Math.round(((minVal - min) / (max - min)) * 100);
  const maxPercent = Math.round(((maxVal - min) / (max - min)) * 100);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), maxVal - 1);
    onValueChange([newMin, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), minVal + 1);
    onValueChange([minVal, newMax]);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Track container */}
      <div className="relative h-[2px] w-full bg-black/10 rounded-full my-3">
        {/* Active range highlight */}
        <div
          className="absolute h-full bg-black rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
      </div>

      {/* Min range input */}
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={handleMinChange}
        className="absolute top-0 w-full h-[2px] appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-solid"
        style={{ zIndex: minVal > max - 10 ? 5 : 3 }}
      />

      {/* Max range input */}
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={handleMaxChange}
        className="absolute top-0 w-full h-[2px] appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-solid"
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
