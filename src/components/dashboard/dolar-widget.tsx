"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { formatNumber, formatDateTimeAR } from "@/lib/format";

interface Rate {
  buy: number;
  sell: number;
  rate: number;
  date: string;
  fetchedAt: string;
  source: string;
}

export function DolarWidget() {
  const [data, setData] = useState<Rate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async (force?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const url = force ? "/api/dolar?refresh=1" : "/api/dolar";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Error");
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        setError(json.error || "Error desconocido");
      }
    } catch {
      setError("No se pudo obtener la cotización");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    // Auto-refresh cada 30 minutos (en ms)
    const id = setInterval(() => fetchRate(), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchRate]);

  return (
    <div className="rounded-2xl bg-white border border-[#dde3f5] shadow-sm overflow-hidden">
      <div className="ima-gradient px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-white">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
            Cotización BNA
          </div>
          <div className="text-xs opacity-90">
            {data ? `Actualizada: ${formatDateTimeAR(data.fetchedAt)}` : "Consultando..."}
          </div>
        </div>
        <button
          onClick={() => fetchRate(true)}
          disabled={loading}
          className="bg-white/15 hover:bg-white/25 transition-colors border border-white/30 rounded-lg p-2 text-white disabled:opacity-50"
          title="Actualizar cotización"
          aria-label="Actualizar cotización"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "ima-spin-anim" : ""}`} />
        </button>
      </div>
      <div className="p-4">
        <div className="rounded-lg bg-[#eff6ff] border border-[#bfdbfe] px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1d4ed8]">
              Precio de venta BNA
            </div>
            <div className="text-[10px] text-[#475569]">
              (usado para facturación)
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1e3a8a]">
            {data ? `$${formatNumber(data.sell)}` : "—"}
          </div>
        </div>
      </div>
      {error && (
        <div className="px-4 pb-3 text-xs text-red-600">⚠ {error}</div>
      )}
    </div>
  );
}
