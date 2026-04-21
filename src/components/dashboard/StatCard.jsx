import Card from "../ui/Card";

export default function StatCard({ title, value }) {
  return (
    <Card className="flex flex-col justify-center min-h-[130px] md:min-h-[160px] hover:-translate-y-1 transition-transform duration-200">
      <h3 className="text-[14px] md:text-[15px] lg:text-[16px] font-semibold text-gray-500 mb-2 truncate">
        {title}
      </h3>
      <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#0A4B6E] whitespace-nowrap overflow-hidden text-ellipsis">
        {value}
      </div>
    </Card>
  );
}