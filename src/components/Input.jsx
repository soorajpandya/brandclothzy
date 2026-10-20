import { classNames } from '../utils/helpers';

export default function Input({
  label,
  error,
  className = '',
  type = 'text',
  id,
  ...props
}) {
  return (
    <div className={classNames('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={classNames(
          'w-full px-4 py-3 text-sm border transition-colors duration-200 outline-none',
          props.readOnly ? 'bg-neutral-50 text-neutral-500 cursor-default focus:border-neutral-200' : 'bg-white focus:border-luxury-charcoal',
          'placeholder:text-neutral-300',
          error ? 'border-red-400' : 'border-neutral-200'
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
