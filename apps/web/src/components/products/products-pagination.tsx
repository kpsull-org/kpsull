'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function ProductsPagination({
  currentPage,
  totalPages,
  baseUrl,
}: ProductsPaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const pages = [];
  const showEllipsisStart = currentPage > 3;
  const showEllipsisEnd = currentPage < totalPages - 2;

  // Always show first page
  pages.push(1);

  // Show ellipsis or pages after first
  if (showEllipsisStart) {
    pages.push(-1); // ellipsis
  }

  // Show current page and neighbors
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Show ellipsis or pages before last
  if (showEllipsisEnd) {
    pages.push(-2); // ellipsis
  }

  // Always show last page
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8">
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
      >
        <Link href={createPageUrl(currentPage - 1)} aria-disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      {pages.map((page, index) => {
        if (page < 0) {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          );
        }

        return (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="icon"
            asChild
          >
            <Link href={createPageUrl(page)}>{page}</Link>
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
      >
        <Link href={createPageUrl(currentPage + 1)} aria-disabled={currentPage === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  );
}
