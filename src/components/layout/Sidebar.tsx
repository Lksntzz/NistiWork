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
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/fila', icon: ListTodo, label: 'Minha Fila' },
  { to: '/empresas', icon: Briefcase, label: 'Empresas' },
  { to: '/producao', icon: Paintbrush, label: 'Produção' },
  { to: '/colecoes', icon: Library, label: 'Coleções' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
];

function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium overflow-hidden',
          'transition-colors duration-200',
          isActive
            ? 'text-zinc-100'
            : 'text-zinc-400 hover:text-zinc-200'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId="nisti-sidebar-active"
              className="absolute inset-0 rounded-lg bg-zinc-800/80"
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 480, damping: 38 }
              }
            />
          ) : (
            <span className="absolute inset-0 rounded-lg bg-transparent transition-colors duration-200 group-hover:bg-zinc-800/40" />
          )}

          <motion.span
            className="relative z-10 flex items-center gap-3"
            whileHover={reduceMotion ? undefined : { x: 2 }}
            transition={{ duration: 0.14 }}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </motion.span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      className="w-64 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col"
      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="p-6">
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <motion.div
            className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs"
            whileHover={reduceMotion ? undefined : { scale: 1.06, rotate: -2 }}
            transition={{ duration: 0.16 }}
          >
            N
          </motion.div>
          Nisti Work
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <NavItem to="/configuracoes" icon={Settings} label="Configurações" />
      </div>
    </motion.aside>
  );
}
