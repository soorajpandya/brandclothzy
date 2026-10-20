export function BCMonogram({ size = 40, className = '', light = false }) {
  return (
    <img
      src="/BC_Logo.svg"
      alt=""
      width={size}
      height={size}
      className={`inline-block select-none object-contain ${light ? 'brightness-0 invert' : ''} ${className}`}
      aria-hidden="true"
      draggable={false}
    />
  );
}

export function BCWordmark({ className = '', light = false, size = 'md' }) {
  const color = light ? 'text-white' : 'text-luxury-charcoal';
  const sizes = {
    sm: 'text-[10px] tracking-[0.25em]',
    md: 'text-xs tracking-[0.3em]',
    lg: 'text-sm tracking-[0.35em]',
    xl: 'text-lg tracking-[0.35em]',
  };
  return (
    <span
      className={`font-serif font-semibold uppercase ${sizes[size] || sizes.md} ${color} ${className}`}
      role="img"
      aria-label="BrandClothzy"
    >
      BRANDCLOTHZY
    </span>
  );
}
