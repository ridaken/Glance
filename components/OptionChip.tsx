import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OptionChipProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  title: string;
  disabled?: boolean;
  children: ReactNode;
}

export function OptionChip({
  active,
  onToggle,
  label,
  title,
  disabled,
  children,
}: OptionChipProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md text-[0.8125em] font-medium transition-colors',
        'text-[var(--g-muted)] hover:bg-[var(--g-row-hover)]',
        active &&
          'bg-[var(--g-accent)] text-[var(--g-accent-fg)] hover:bg-[var(--g-accent)]',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
      )}
    >
      {children}
    </button>
  );
}
