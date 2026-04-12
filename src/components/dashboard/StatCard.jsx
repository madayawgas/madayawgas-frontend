import Card from "../ui/Card";

export default function StatCard({ title, value }) {
  return (
    <Card className="flex flex-col justify-center h-40">
      <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-800 mb-4">
        {title}
      </h3>
      <div className="text-3xl md:text-5xl font-bold text-[#0A4B6E]">
        {value}
      </div>
    </Card>
  );
}