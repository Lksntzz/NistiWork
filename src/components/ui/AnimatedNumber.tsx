import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useEffect } from 'react';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  className?: string;
};

export function AnimatedNumber({
  value,
  duration = 0.55,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString('pt-BR')
  );

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [duration, motionValue, reduceMotion, value]);

  return (
    <motion.span className={className} aria-label={value.toLocaleString('pt-BR')}>
      {rounded}
    </motion.span>
  );
}
