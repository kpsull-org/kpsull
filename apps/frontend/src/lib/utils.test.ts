import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('merges multiple class names', () => {
    const result = cn('text-base', 'font-bold')
    expect(result).toBe('text-base font-bold')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class active-class')
  })

  it('filters out falsy values', () => {
    const result = cn('text-base', false, null, undefined, 'font-bold')
    expect(result).toBe('text-base font-bold')
  })

  it('merges Tailwind conflicting classes correctly', () => {
    // twMerge should keep the last conflicting class
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('handles array of classes', () => {
    const result = cn(['text-base', 'font-bold'])
    expect(result).toBe('text-base font-bold')
  })

  it('handles object with boolean values', () => {
    const result = cn({
      'text-base': true,
      'font-bold': true,
      'text-red-500': false,
    })
    expect(result).toBe('text-base font-bold')
  })

  it('combines different input types', () => {
    const result = cn(
      'base-class',
      ['array-class-1', 'array-class-2'],
      { 'object-class': true, 'hidden-class': false },
      'final-class'
    )
    expect(result).toBe('base-class array-class-1 array-class-2 object-class final-class')
  })

  it('returns empty string when no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles Tailwind color conflicts', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })

  it('handles spacing conflicts', () => {
    const result = cn('p-4', 'p-2', 'm-8')
    expect(result).toBe('p-2 m-8')
  })
})
