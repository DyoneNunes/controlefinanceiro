import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { formatCurrency } from '../utils/finance';
import { useMemo } from 'react';

interface MonthlyStats {
  incomeTotal: number;
  paidTotal: number;
  randomTotal: number;
  investedTotal: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
}

interface ChartsSectionProps {
  monthlyStats?: MonthlyStats;
}

export const ChartsSection = ({ monthlyStats }: ChartsSectionProps) => {
  // Data for Bar Chart: Financial Overview (uses monthly stats if available)
  const overviewData = useMemo(() => [
    { name: 'Recebido', value: monthlyStats?.incomeTotal ?? 0, color: '#10b981' },
    { name: 'Contas Pagas', value: monthlyStats?.paidTotal ?? 0, color: '#f43f5e' },
    { name: 'Gastos Variáveis', value: monthlyStats?.randomTotal ?? 0, color: '#f59e0b' },
    { name: 'Investido', value: monthlyStats?.investedTotal ?? 0, color: '#8b5cf6' },
  ], [monthlyStats]);

  // Data for Pie Chart: Bill Status Distribution
  const billStatusData = useMemo(() => [
     { name: 'Pagas', value: monthlyStats?.paidCount ?? 0, color: '#3b82f6' },
     { name: 'Pendentes', value: monthlyStats?.pendingCount ?? 0, color: '#f59e0b' },
     { name: 'Atrasadas', value: monthlyStats?.overdueCount ?? 0, color: '#e11d48' },
  ].filter(item => item.value > 0), [monthlyStats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Financial Flow Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fluxo Financeiro (Mês)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overviewData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                width={110}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number | undefined) => [value !== undefined ? formatCurrency(value) : '', 'Valor']}
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                {overviewData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bill Status Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
         <h3 className="text-lg font-bold text-gray-900 mb-4">Status das Contas (Mês)</h3>
         {billStatusData.length > 0 ? (
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                         <Pie
                            data={billStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {billStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
         ) : (
             <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                 Nenhuma conta cadastrada para exibir gráfico.
             </div>
         )}
      </div>
    </div>
  );
};
