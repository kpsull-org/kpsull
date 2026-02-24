'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  commissions: number;
  subscriptions: number;
}

interface RevenueChartProps {
  data: MonthlyRevenue[];
  year: number;
}

function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const commissions = payload.find((p) => p.name === 'commissions')?.value ?? 0;
  const subscriptions = payload.find((p) => p.name === 'subscriptions')?.value ?? 0;
  const total = commissions + subscriptions;

  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{formatEur(total)}</p>
      <div className="border-t pt-1 space-y-0.5">
        <p className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5" />
          Commissions&nbsp;: {formatEur(commissions)}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
          Abonnements&nbsp;: {formatEur(subscriptions)}
        </p>
      </div>
    </div>
  );
}

export function RevenueChart({ data, year }: RevenueChartProps) {
  const totalCommissions = data.reduce((sum, d) => sum + d.commissions, 0);
  const totalSubscriptions = data.reduce((sum, d) => sum + d.subscriptions, 0);
  const total = totalCommissions + totalSubscriptions;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Chiffre d&apos;affaires {year}
          </CardTitle>
          <p className="text-2xl font-bold mt-1">{formatEur(total)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Commissions&nbsp;: {formatEur(totalCommissions)}
            &nbsp;&middot;&nbsp;
            Abonnements&nbsp;: {formatEur(totalSubscriptions)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Cumul annuel</p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="commissionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="subscriptionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}€`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="commissions"
                stackId="1"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#commissionsGradient)"
              />
              <Area
                type="monotone"
                dataKey="subscriptions"
                stackId="1"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#subscriptionsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
