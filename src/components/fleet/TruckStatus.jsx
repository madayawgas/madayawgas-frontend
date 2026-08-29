import Badge from "../ui/Badge";

export default function TruckStatus({ status }) {
  const normalized = status?.toUpperCase() || "";

  const variants = {
    "IN USE": "info",
    "AVAILABLE": "success",
    "UNDER MAINTENANCE": "maintenance",
    "IN SHOP": "neutral",
  };

  return (
    <Badge variant={variants[normalized] || "neutral"}>
      {status || "Unknown"}
    </Badge>
  );
}