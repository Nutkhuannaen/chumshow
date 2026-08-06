export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-stone-200" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-stone-200 bg-stone-100" />
        ))}
      </div>
    </div>
  );
}
