import Card from "../ui/Card";

export default function StatCard({ value, title }) {
  return (
    <Card className="flex flex-col bg-white/60 justify-center min-h-[100px] md:min-h-[130px] hover:-translate-y-1 transition-transform duration-200">
      <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#0A4B6E] whitespace-nowrap overflow-hidden text-ellipsis">
        {value}
      </div>
      <h3 className="w-full text-center text-[14px] md:text-[15px] lg:text-[16px] font-semibold text-[#AA6300] mb-1 mt-3 truncate">
        {title}
      </h3>
    </Card>
  );
}