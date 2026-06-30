import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Pedidos from './pages/Pedidos'
import NovoPedido from './pages/NovoPedido'
import Faturamento from './pages/Faturamento'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const pageTitles: Record<string, string> = {
    '/': 'Pedidos',
    '/novo-pedido': 'Novo Pedido',
    '/faturamento': 'Faturamento',
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-4 bg-sidebar px-4 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Abrir menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">
            {pageTitles[location.pathname] ?? 'Agilean'}
          </span>
        </header>

        <Routes>
          <Route path="/" element={<Pedidos />} />
          <Route path="/novo-pedido" element={<NovoPedido />} />
          <Route path="/faturamento" element={<Faturamento />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
