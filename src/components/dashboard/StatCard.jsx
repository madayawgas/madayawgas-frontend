// src/components/dashboard/StatCard.jsx

export default function StatCard({ value, title }) {
  return (
    <div className="flex flex-col justify-between bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-white/30 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 min-h-[110px] md:min-h-[125px]">
      <div className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-white font-mono tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
        {value}
      </div>
      <h3 className="w-full text-left text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#FFFFFF] mt-2 truncate">
        {title}
      </h3>
    </div>
  );
}