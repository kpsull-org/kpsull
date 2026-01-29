'use client';

import { FolderOpen, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Project breakdown data for analytics
 */
export interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  totalSales: number;
  totalRevenue: number;
}

export interface CategoryBreakdownProps {
  /** List of projects with their sales breakdown */
  projects: ProjectBreakdown[];
  /** Optional className for styling */
  className?: string;
}

/**
 * Format currency in EUR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount / 100);
}

/**
 * Color palette for project bars
 */
const PROJECT_COLORS = [
  'from-purple-400 to-purple-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
  'from-rose-400 to-rose-600',
];

/**
 * Get color class for a project based on its index
 */
function getProjectColor(index: number): string {
  const colorIndex = index % PROJECT_COLORS.length;
  return PROJECT_COLORS[colorIndex] ?? 'from-purple-400 to-purple-600';
}

/**
 * CategoryBreakdown
 *
 * Displays a horizontal bar chart showing sales breakdown by project/category.
 * Used in the PRO analytics section of the creator dashboard.
 *
 * @example
 * ```tsx
 * <CategoryBreakdown
 *   projects={[
 *     { projectId: '1', projectName: 'Collection Ete', totalSales: 45, totalRevenue: 225000 },
 *     { projectId: '2', projectName: 'Accessoires', totalSales: 30, totalRevenue: 90000 },
 *   ]}
 * />
 * ```
 */
export function CategoryBreakdown({
  projects,
  className,
}: CategoryBreakdownProps) {
  if (projects.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <PieChart className="h-4 w-4 text-purple-600" />
            Repartition par projet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <FolderOpen className="mb-2 h-10 w-10 opacity-50" />
            <p className="text-sm">Aucun projet avec des ventes</p>
            <p className="text-xs">
              Creez des projets et vendez pour voir les statistiques
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total revenue for percentage calculation
  const totalRevenue = projects.reduce((sum, p) => sum + p.totalRevenue, 0);

  // Sort by revenue descending
  const sortedProjects = [...projects].sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <PieChart className="h-4 w-4 text-purple-600" />
          Repartition par projet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedProjects.map((project, index) => {
            const percentage =
              totalRevenue > 0 ? (project.totalRevenue / totalRevenue) * 100 : 0;
            const colorClass = getProjectColor(index);

            return (
              <div key={project.projectId} className="space-y-2">
                {/* Project info row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Color indicator */}
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full bg-gradient-to-r',
                        colorClass
                      )}
                    />
                    {/* Project name */}
                    <span className="text-sm font-medium line-clamp-1">
                      {project.projectName}
                    </span>
                  </div>
                  {/* Percentage and revenue */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(project.totalRevenue)}
                    </span>
                  </div>
                </div>

                {/* Horizontal bar */}
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn(
                      'h-full bg-gradient-to-r transition-all duration-500',
                      colorClass
                    )}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>

                {/* Sales count */}
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {project.totalSales} vente{project.totalSales > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Total summary */}
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="text-sm font-medium text-muted-foreground">
              Total
            </span>
            <span className="text-base font-bold">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
