import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Pedidos from './pages/Pedidos'
import NovoPedido from './pages/NovoPedido'
import Faturamento from './pages/Faturamento'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Pedidos />} />
          <Route path="/novo-pedido" element={<NovoPedido />} />
          <Route path="/faturamento" element={<Faturamento />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
