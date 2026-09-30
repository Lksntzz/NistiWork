import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';

export type MetricBarDatum = {
  label: string;
  value: number;
  accentClass: string;
};

type MetricBarChartProps = {
  data: MetricBarDatum[];
};

export function MetricBarChart({ data }: MetricBarChartProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const maxValue = useMemo(
    () => Math.max(...data.map((item) => item.value), 1),
    [data]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">Comparativo dos indicadores atuais</p>
        <p className="hidden text-xs text-zinc-600 sm:block">
          Passe o mouse ou use Tab para ver o valor
        </p>
      </div>

      <div className="relative grid h-52 grid-cols-4 items-end gap-3">
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[46px] h-px origin-left bg-zinc-800"
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        {data.map((item, index) => {
          const height = Math.max((item.value / maxValue) * 100, 8);
          const isActive = activeIndex === index;

          return (
            <div
              key={item.label}
              className="relative z-10 flex h-full min-w-0 flex-col justify-end"
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: 3, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs shadow-xl shadow-black/20"
                  >
                    <span className="font-medium text-zinc-200">{item.label}</span>
                    <span className="ml-2 font-semibold text-zinc-50 tabular-nums">
                      {item.value.toLocaleString('pt-BR')}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                aria-label={`${item.label}: ${item.value.toLocaleString('pt-BR')}`}
                className="group relative flex h-[156px] w-full items-end rounded-xl bg-zinc-950/60 p-1.5 outline-none ring-indigo-500/40 transition-shadow focus-visible:ring-2"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
              >
                <motion.div
                  className={`w-full rounded-lg ${item.accentClass}`}
                  style={{ height: `${height}%`, transformOrigin: 'bottom' }}
                  initial={reduceMotion ? false : { scaleY: 0, opacity: 0.45 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.52,
                    delay: reduceMotion ? 0 : index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={reduceMotion ? undefined : { scaleX: 1.04 }}
                />
              </button>

              <div className="mt-2 min-w-0 text-center">
                <p className="truncate text-[11px] font-medium text-zinc-400">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-zinc-300 tabular-nums">
                  {item.value.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
