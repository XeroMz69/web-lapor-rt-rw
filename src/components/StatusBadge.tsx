const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  DIPROSES: { label: "Diproses", color: "bg-blue-100 text-blue-800" },
  SELESAI: { label: "Selesai", color: "bg-emerald-100 text-emerald-800" },
  DITOLAK: { label: "Ditolak", color: "bg-red-100 text-red-800" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
