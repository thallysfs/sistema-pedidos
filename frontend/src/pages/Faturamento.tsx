import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getBilling, type BillingByDayResponse } from '../api/orders'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toApiDate(input: string) {
  return input // already YYYY-MM-DD
}

function formatAxisDate(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

const BAR_COLORS = ['#818cf8', '#c084fc', '#f472b6', '#818cf8', '#a78bfa']

export default function Faturamento() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [from, setFrom] = useState(toInputDate(firstOfMonth))
  const [to, setTo] = useState(toInputDate(today))
  const [data, setData] = useState<BillingByDayResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (from > to) {
      setError('A data inicial deve ser anterior à data final.')
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    getBilling(toApiDate(from), toApiDate(to))
      .then(setData)
      .catch(() => setError('Erro ao carregar dados de faturamento.'))
      .finally(() => setLoading(false))
  }, [from, to])

  const totalRevenue = data.reduce((acc, d) => acc + d.totalRevenue, 0)
  const orderCount = data.reduce((acc, d) => acc + d.orderCount, 0)
  const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0

  const chartData = data.map((d) => ({
    date: d.date,
    receita: d.totalRevenue,
  }))

  return (
    <div className="flex-1 bg-[#eef0f4] min-h-screen p-4 lg:p-8">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Faturamento 📊</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
            Receita por período · pedidos cancelados excluídos
          </p>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl shadow-sm px-4 py-2.5 self-start">
          <span className="text-sm text-gray-500">De</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm text-gray-900 focus:outline-none min-w-0"
          />
          <span className="text-sm text-gray-500">até</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm text-gray-900 focus:outline-none min-w-0"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <div className="rounded-2xl p-5 lg:p-6 text-white bg-gradient-to-br from-indigo-500 to-violet-500">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs font-semibold tracking-widest uppercase mt-1 opacity-80">
            Receita no Período
          </div>
        </div>

        <div className="rounded-2xl p-5 lg:p-6 text-white bg-gradient-to-br from-violet-500 to-purple-600">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-2xl font-bold">{orderCount}</div>
          <div className="text-xs font-semibold tracking-widest uppercase mt-1 opacity-80">
            Pedidos no Período
          </div>
        </div>

        <div className="rounded-2xl p-5 lg:p-6 text-white bg-gradient-to-br from-pink-500 to-rose-500">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
          <div className="text-xs font-semibold tracking-widest uppercase mt-1 opacity-80">
            Ticket Médio
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-6">📈 Receita Diária</h2>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-center text-gray-400 py-16">Nenhum dado no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barSize={24}>
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                labelFormatter={(label) => formatAxisDate(label)}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                  fontSize: 13,
                }}
              />
              <Bar dataKey="receita" radius={[6, 6, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-gray-900">📋 Detalhamento por Dia</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Data
              </th>
              <th className="text-center px-6 py-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Pedidos
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Receita
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-gray-400">
                  Nenhum dado no período.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.date} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-700">
                    {formatAxisDate(row.date)}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-600">{row.orderCount}</td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(row.totalRevenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
