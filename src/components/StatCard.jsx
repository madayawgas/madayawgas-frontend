export default function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center h-40">
      <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-800 mb-4">
        {title}
      </h3>
      <div className="text-3xl md:text-5xl font-bold text-[#0A4B6E]">
        {value}
      </div>
    </div>
  );
}