export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-neutral-100 aspect-[3/4] rounded-sm" />
      <div className="mt-4 space-y-2">
        <div className="h-2.5 bg-neutral-100 rounded w-1/3" />
        <div className="h-3.5 bg-neutral-100 rounded w-3/4" />
        <div className="h-3 bg-neutral-100 rounded w-1/4" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12 pt-24 pb-16 px-4 max-w-[1440px] mx-auto">
      <div className="bg-neutral-100 aspect-[3/4] rounded-sm" />
      <div className="space-y-6 py-8">
        <div className="h-3 bg-neutral-100 rounded w-1/4" />
        <div className="h-8 bg-neutral-100 rounded w-3/4" />
        <div className="h-5 bg-neutral-100 rounded w-1/3" />
        <div className="h-20 bg-neutral-100 rounded w-full" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-14 bg-neutral-100 rounded" />
          ))}
        </div>
        <div className="h-12 bg-neutral-100 rounded w-full" />
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pt-24 pb-16 px-4 max-w-[1440px] mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-6">
          <div className="w-24 h-32 bg-neutral-100 rounded-sm" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-neutral-100 rounded w-1/2" />
            <div className="h-3 bg-neutral-100 rounded w-1/4" />
            <div className="h-3 bg-neutral-100 rounded w-1/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
