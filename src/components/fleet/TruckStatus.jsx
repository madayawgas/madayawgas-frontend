import Badge from "../ui/Badge";

export default function TruckStatus({ status }) {
  const normalized = status?.toUpperCase() || "";

  const variants = {
    "ACTIVE": "success",
    "IN USE": "info",
    "AVAILABLE": "info",
    "STANDBY": "warning",
    "UNDER REPAIR": "danger",
    "UNDER MAINTENANCE": "maintenance",
    "IN SHOP": "neutral",
  };

  return (
    <Badge variant={variants[normalized] || "neutral"}>
      {status || "Unknown"}
    </Badge>
  );
}