const B = ({ className = "" }: { className?: string }) => <div className={`animate-pulse rounded-lg bg-[#F1EBE1] ${className}`} />;

export function HeroSkeleton() {
  return (
    <section className="border-b border-line bg-cream">
      <div className="container-site py-10 md:py-14">
        <B className="h-3 w-32" />
        <B className="mt-5 h-3 w-24" />
        <B className="mt-3 h-12 w-2/3 max-w-lg" />
        <B className="mt-4 h-4 w-full max-w-md" />
      </div>
    </section>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-2">
      <B className="aspect-square w-full !rounded-xl" />
      <B className="mt-3 h-4 w-11/12" />
      <B className="mt-2 h-4 w-2/3" />
      <B className="mt-3 h-5 w-1/3" />
      <B className="mt-3 h-8 w-full" />
    </div>
  );
}

export function GridSkeleton({ n = 8, sidebar = true }: { n?: number; sidebar?: boolean }) {
  return (
    <div className={`container-site grid gap-8 py-8 ${sidebar ? "lg:grid-cols-[260px_1fr]" : ""}`}>
      {sidebar && <div className="card hidden h-[560px] p-5 lg:block"><B className="h-6 w-24" /><B className="mt-6 h-4 w-full" /><B className="mt-3 h-4 w-5/6" /><B className="mt-3 h-4 w-4/6" /></div>}
      <div>
        <B className="h-5 w-32" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {Array.from({ length: n }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="container-site pt-6 pb-16">
      <B className="h-3 w-56" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <B className="aspect-square w-full !rounded-2xl" />
        <div className="card p-6">
          <B className="h-5 w-20" />
          <B className="mt-4 h-9 w-5/6" />
          <B className="mt-2 h-9 w-3/5" />
          <B className="mt-6 h-28 w-full !rounded-xl" />
          <B className="mt-6 h-9 w-48" />
          <B className="mt-6 h-11 w-full" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="container-site grid gap-5 py-10 md:grid-cols-2">
        <div className="card p-6"><B className="h-6 w-1/2" /><B className="mt-5 h-10 w-full" /><B className="mt-3 h-10 w-full" /><B className="mt-3 h-10 w-2/3" /></div>
        <div className="card p-6"><B className="h-6 w-1/3" /><B className="mt-5 h-24 w-full" /><B className="mt-3 h-10 w-1/2" /></div>
      </div>
    </>
  );
}
