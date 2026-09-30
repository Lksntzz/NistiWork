import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Check, LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ActionState = 'idle' | 'loading' | 'success' | 'error';

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  state?: ActionState;
  idleLabel: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  idleIcon?: ReactNode;
};

export function ActionButton({
  state = 'idle',
  idleLabel,
  loadingLabel = 'Processando...',
  successLabel = 'Concluído',
  errorLabel = 'Tentar novamente',
  idleIcon,
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  const reduceMotion = useReducedMotion();

  const content = {
    idle: { label: idleLabel, icon: idleIcon },
    loading: {
      label: loadingLabel,
      icon: (
        <motion.span
          aria-hidden="true"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 0.85, repeat: Infinity, ease: 'linear' }
          }
        >
          <LoaderCircle className="h-4 w-4" />
        </motion.span>
      ),
    },
    success: {
      label: successLabel,
      icon: <Check className="h-4 w-4" aria-hidden="true" />,
    },
    error: {
      label: errorLabel,
      icon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
    },
  }[state];

  return (
    <motion.button
      {...props}
      disabled={disabled || state === 'loading'}
      whileHover={reduceMotion || disabled ? undefined : { y: -1 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.975 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium',
        'transition-[background-color,border-color,color,opacity] duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          className="inline-flex items-center gap-2"
          initial={reduceMotion ? false : { opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
          transition={{ duration: 0.12 }}
        >
          {content.icon}
          <span>{content.label}</span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
