import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.svg'

const navItems = [
  { to: '/', label: 'Pedidos', icon: '📦' },
  { to: '/novo-pedido', label: 'Novo Pedido', icon: '➕' },
  { to: '/faturamento', label: 'Faturamento', icon: '📊' },
]

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#0d1117] text-white shrink-0">
      <div className="px-6 py-6">
        <img src={logo} alt="Agilean" className="h-7" />
      </div>

      <nav className="flex-1 px-3">
        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase px-3 mb-3">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1a2240] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a2035]'
                  }`
                }
              >
                <span className="text-base">{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-6 py-4 text-xs text-gray-600">
        v1.0 · Junho 2026
      </div>
    </aside>
  )
}
