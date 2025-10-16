import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import React from 'react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
