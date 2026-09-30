import React from 'react';
import { cn } from '@/utils/cn';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('nisti-skeleton rounded-lg', className)}
      {...props}
    />
  );
}
