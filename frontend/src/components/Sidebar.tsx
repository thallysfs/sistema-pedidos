import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import logo from '../assets/logo.svg'

const navItems = [
  { to: '/', label: 'Pedidos', icon: '📦' },
  { to: '/novo-pedido', label: 'Novo Pedido', icon: '➕' },
  { to: '/faturamento', label: 'Faturamento', icon: '📊' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  // close drawer on route change
  useEffect(() => {
    onClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col w-60 bg-[#0d1117] text-white shrink-0
          transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
        `}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <img src={logo} alt="Agilean" className="h-7" />
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-white p-1"
            aria-label="Fechar menu"
          >
            ✕
          </button>
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
    </>
  )
}
