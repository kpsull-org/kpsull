import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies default variant styles', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary')
  })

  it('applies outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-input')
  })

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent')
  })

  it('applies small size styles', () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-8', 'px-3')
  })

  it('applies large size styles', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'px-8')
  })

  it('applies icon size styles', () => {
    render(<Button size="icon">I</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'w-9')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button')

    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('does not trigger click when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    )
    const button = screen.getByRole('button')

    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})
