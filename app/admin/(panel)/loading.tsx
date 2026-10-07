export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-9 w-48 rounded-lg bg-[#ECE4D8]" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-white" />)}</div>
      <div className="mt-6 h-80 rounded-2xl bg-white" />
    </div>
  );
}
