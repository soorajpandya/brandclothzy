import { classNames } from '../utils/helpers';

const variants = {
  primary: 'bg-luxury-charcoal text-white hover:bg-black',
  outline: 'border border-luxury-charcoal text-luxury-charcoal hover:bg-luxury-charcoal hover:text-white',
  ghost: 'text-luxury-charcoal hover:bg-neutral-100',
  gold: 'bg-luxury-gold text-white hover:bg-luxury-gold-light',
  white: 'bg-white text-luxury-charcoal hover:bg-neutral-50',
};

const sizes = {
  sm: 'px-4 py-2 text-[10px]',
  md: 'px-6 py-3 text-[11px]',
  lg: 'px-8 py-4 text-xs',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}) {
  return (
    <button
      className={classNames(
        'uppercase tracking-[0.2em] font-medium transition-all duration-300 inline-flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
