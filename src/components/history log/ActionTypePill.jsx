import Badge from "../ui/Badge";

export default function ActionTypePill({ action }) {
  const normalized = action?.toUpperCase() || "";

  const variants = {
    "CREATED": "success",
    "UPDATED": "info",
    "DEACTIVATED": "danger", 
  };

  return (
    <Badge variant={variants[normalized] || "neutral"}>
      {action || "Unknown"}
    </Badge>
  );
}