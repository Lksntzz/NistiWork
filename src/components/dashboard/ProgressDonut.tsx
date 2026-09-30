import { motion, useReducedMotion } from 'motion/react';

type ProgressDonutProps = {
  value: number;
  total: number;
  label: string;
};

export function ProgressDonut({ value, total, label }: ProgressDonutProps) {
  const reduceMotion = useReducedMotion();
  const safeTotal = Math.max(total, 1);
  const progress = Math.min(Math.max(value / safeTotal, 0), 1);
  const percentage = Math.round(progress * 100);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28 shrink-0">
        <svg className="-rotate-90 h-28 w-28" viewBox="0 0 112 112" aria-hidden="true">
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-zinc-800"
          />
          <motion.circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className="text-indigo-500"
            strokeDasharray={circumference}
            initial={reduceMotion ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{
              duration: reduceMotion ? 0 : 0.65,
              delay: reduceMotion ? 0 : 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-zinc-100 tabular-nums">
            {percentage}%
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {value.toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')} itens sinalizados
        </p>
      </div>
    </div>
  );
}
