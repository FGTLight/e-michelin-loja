import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

/** Campo acessível: label associado, aria-invalid e mensagem de erro anunciada. */
export const Field = forwardRef<HTMLInputElement, Props>(function Field({ label, error, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">
        {label}
        {rest.required && <span className="text-red-700" aria-hidden> *</span>}
      </label>
      <input
        ref={ref}
        id={fid}
        className="input"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
        {...rest}
      />
      {hint && !error && <p id={`${fid}-hint`} className="mt-1 text-xs text-cimento-600">{hint}</p>}
      {error && (
        <p id={`${fid}-err`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
});

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-grid grid-flow-col gap-1 rounded-xl bg-cimento-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded-lg px-4 py-2 text-sm font-bold transition', value === o.value ? 'bg-white text-petroleo-950 shadow-sm' : 'text-cimento-700 hover:text-petroleo-900')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
