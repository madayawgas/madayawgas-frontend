// src/components/dashboard/StatCard.jsx

export default function StatCard({ value, title, isLoading = false }) {
  return (
    <div className="flex flex-col justify-between bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-white/35 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[96px] sm:min-h-[108px]">
      {isLoading ? (
        <div className="h-8 w-28 rounded-md bg-white/15 animate-pulse" />
      ) : (
        <div className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {value}
        </div>
      )}
      <h3 className="w-full text-left text-xs font-semibold uppercase tracking-wider text-white/90 mt-2 truncate">
        {title}
      </h3>
    </div>
  );
}
