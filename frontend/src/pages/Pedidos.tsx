import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrders, type OrderResponse, type PagedResponse } from '../api/orders'

const PAGE_SIZE = 25
const FIRST_PAGE_GROUP = 25

function getPaginationItems(total: number): (number | 'ellipsis')[] {
  if (total <= FIRST_PAGE_GROUP) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const items: (number | 'ellipsis')[] = []
  for (let i = 1; i <= FIRST_PAGE_GROUP; i++) items.push(i)
  items.push('ellipsis', total)
  return items
}

function PageButton({
  page,
  active,
  onClick,
}: {
  page: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`min-w-8 h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {page}
    </button>
  )
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function StatusBadge({ total }: { total: number }) {
  const isLarge = total >= 5000
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isLarge ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
      }`}
    >
      {isLarge ? 'Alto valor' : 'Normal'}
    </span>
  )
}

export default function Pedidos() {
  const navigate = useNavigate()
  const [data, setData] = useState<PagedResponse<OrderResponse> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getOrders(page, PAGE_SIZE)
      .then(setData)
      .finally(() => setLoading(false))
  }, [page])

  const totalFaturamento = data?.data.reduce((acc, o) => acc + o.total, 0) ?? 0
  const totalPages = data?.totalPages ?? 1
  const paginationItems = getPaginationItems(totalPages)

  return (
    <div className="flex-1 bg-[#eef0f4] min-h-screen p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Pedidos 📦</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Gerencie e acompanhe todos os pedidos</p>
        </div>
        <button
          onClick={() => navigate('/novo-pedido')}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-sm font-semibold transition-colors"
        >
          + <span className="hidden sm:inline">Novo Pedido</span><span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-3xl font-bold text-gray-900">{data?.totalCount ?? '—'}</div>
          <div className="text-xs font-semibold tracking-widest text-gray-400 uppercase mt-1">
            Pedidos
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold text-gray-900">
            {data ? formatCurrency(totalFaturamento) : '—'}
          </div>
          <div className="text-xs font-semibold tracking-widest text-gray-400 uppercase mt-1">
            Faturamento
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-gray-900">Todos os Pedidos</h2>
          {data && (
            <span className="text-sm text-gray-400">
              Página {page} / {totalPages}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="text-left py-3 px-4 lg:px-6 text-xs font-semibold tracking-wide text-gray-400 uppercase whitespace-nowrap">
                  Pedido
                </th>
                <th className="text-left py-3 pr-4 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Cliente
                </th>
                <th className="hidden md:table-cell text-left py-3 pr-4 text-xs font-semibold tracking-wide text-gray-400 uppercase whitespace-nowrap">
                  Itens
                </th>
                <th className="hidden sm:table-cell text-left py-3 pr-4 text-xs font-semibold tracking-wide text-gray-400 uppercase whitespace-nowrap">
                  Data
                </th>
                <th className="hidden lg:table-cell text-left py-3 pr-4 text-xs font-semibold tracking-wide text-gray-400 uppercase whitespace-nowrap">
                  Status
                </th>
                <th className="text-right py-3 px-4 lg:px-6 text-xs font-semibold tracking-wide text-gray-400 uppercase whitespace-nowrap">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                data?.data.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 lg:px-6 font-mono text-xs text-gray-500 whitespace-nowrap">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="py-3 pr-4 font-medium text-gray-900 max-w-[120px] sm:max-w-none truncate">
                      {order.customerName}
                    </td>
                    <td className="hidden md:table-cell py-3 pr-4 text-gray-600">{order.items.length}</td>
                    <td className="hidden sm:table-cell py-3 pr-4 text-gray-600 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="hidden lg:table-cell py-3 pr-4">
                      <StatusBadge total={order.total} />
                    </td>
                    <td className="py-3 px-4 lg:px-6 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
            {paginationItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="w-8 text-center text-gray-400 select-none text-sm">
                  …
                </span>
              ) : (
                <PageButton
                  key={item}
                  page={item}
                  active={item === page}
                  onClick={() => setPage(item)}
                />
              ),
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Próxima página"
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
