import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder, type CreateOrderItemRequest } from '../api/orders'

const PRODUCTS = [
  'Notebook Pro',
  'Monitor 4K',
  'Teclado Mecânico',
  'Mouse Gamer',
  'Headset',
  'Webcam HD',
  'SSD 1TB',
  'Placa de Vídeo',
  'Processador i9',
  'Memória RAM 32GB',
]

interface ItemDraft extends CreateOrderItemRequest {
  id: number
}

let nextId = 1

export default function NovoPedido() {
  const navigate = useNavigate()
  const [customerName, setCustomerName] = useState('')
  const [product, setProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [items, setItems] = useState<ItemDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    if (!product || quantity < 1 || unitPrice <= 0) return
    setItems((prev) => [
      ...prev,
      { id: nextId++, productName: product, quantity, unitPrice },
    ])
    setProduct('')
    setQuantity(1)
    setUnitPrice(0)
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleSubmit() {
    if (!customerName.trim()) {
      setError('Informe o nome do cliente.')
      return
    }
    if (items.length === 0) {
      setError('Adicione ao menos um produto.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await createOrder({ customerName, items })
      navigate('/')
    } catch {
      setError('Erro ao criar pedido. Verifique se o backend está rodando.')
    } finally {
      setSubmitting(false)
    }
  }

  const orderTotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)

  return (
    <div className="flex-1 bg-[#eef0f4] min-h-screen p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Novo Pedido ➕</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Preencha os dados e adicione os produtos</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Customer */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-500 text-lg">👤</span>
            <h2 className="font-semibold text-gray-900">Dados do Cliente</h2>
          </div>
          <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
            Nome do Cliente *
          </label>
          <input
            type="text"
            placeholder="Ex: TechVision Ltda"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          />
        </div>

        {/* Add product */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-500 text-lg">🛒</span>
            <h2 className="font-semibold text-gray-900">Adicionar Produto</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_120px] gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
                Produto
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white"
              >
                <option value="">Selecione um produto...</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
                QTD
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
                Preço Unit. (R$)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={unitPrice === 0 ? '' : unitPrice}
                placeholder="0,00"
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>
          </div>

          <button
            onClick={addItem}
            disabled={!product || quantity < 1 || unitPrice <= 0}
            className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            + Adicionar ao Pedido
          </button>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold tracking-widest text-gray-400 uppercase pb-2">Produto</th>
                  <th className="text-center text-xs font-semibold tracking-widest text-gray-400 uppercase pb-2">QTD</th>
                  <th className="text-right text-xs font-semibold tracking-widest text-gray-400 uppercase pb-2">Unit.</th>
                  <th className="text-right text-xs font-semibold tracking-widest text-gray-400 uppercase pb-2">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-50">
                    <td className="py-3 text-gray-900 font-medium">{item.productName}</td>
                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">
                      {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 pl-4">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-gray-600">
                    Total do Pedido:
                  </td>
                  <td className="pt-3 text-right text-base font-bold text-gray-900">
                    {orderTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/')}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-3.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-slate-500 hover:bg-slate-600 disabled:opacity-60 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {submitting ? 'Criando...' : '✅ Criar Pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
