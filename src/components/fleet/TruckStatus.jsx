import Badge from "../ui/Badge";

export default function TruckStatus({ status }) {
  const normalized = status?.toUpperCase() || "";

  const variants = {
    "ACTIVE": "success",
    "UNDER MAINTENANCE": "danger",
    "INACTIVE": "neutral",
    "RETIRED": "deactivated",
  };

  return (
    <Badge variant={variants[normalized] || "neutral"}>
      {status || "Unknown"}
    </Badge>
  );
}