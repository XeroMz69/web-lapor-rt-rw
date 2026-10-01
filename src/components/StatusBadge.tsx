const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Menunggu", color: "bg-amber-100 text-amber-950 border-amber-300" },
  DIPROSES: { label: "Diproses", color: "bg-blue-100 text-blue-950 border-blue-300" },
  SELESAI: { label: "Selesai", color: "bg-emerald-100 text-emerald-950 border-emerald-300" },
  DITOLAK: { label: "Ditolak", color: "bg-rose-100 text-rose-950 border-rose-300" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-slate-100 text-slate-800 border-slate-300" };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border tracking-wide shadow-2xs ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
