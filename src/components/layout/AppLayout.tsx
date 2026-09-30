import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? false : { opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -5 }}
              transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
