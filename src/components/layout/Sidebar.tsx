import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
  Briefcase, 
  Paintbrush, 
  Library, 
  Package, 
  Settings 
} from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/fila', icon: ListTodo, label: 'Minha Fila' },
  { to: '/empresas', icon: Briefcase, label: 'Empresas' },
  { to: '/producao', icon: Paintbrush, label: 'Produção' },
  { to: '/colecoes', icon: Library, label: 'Coleções' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
];

export function Sidebar() {
  return (
    <div className="w-64 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs">
            N
          </div>
          Nisti Work
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-zinc-800/80 text-zinc-100" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-zinc-800/80 text-zinc-100" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            )
          }
        >
          <Settings className="w-5 h-5" />
          Configurações
        </NavLink>
      </div>
    </div>
  );
}
