"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Eye, Check, X, Loader2, RefreshCw, Send, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatARS, formatUSD, formatDateAR, STATUS_LABELS, STATUS_COLORS,
} from "@/lib/format";
import { toast } from "sonner";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  usdAmount: number;
  arsAmount: number;
}

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientCuit: string | null;
  clientEmail: string | null;
  description: string | null;
  issuedAt: string;
  dueAt: string | null;
  usdRate: number;
  usdTotal: number;
  arsTotal: number;
  status: string;
  paidAt: string | null;
  sheetsSynced: boolean;
  items: InvoiceItem[];
}

interface Props {
  refreshSignal?: number;
  onView?: (invoice: Invoice) => void;
}

export function InvoicesList({ refreshSignal, onView }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todas");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setInvoices(json.invoices);
    } catch {
      toast.error("No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, refreshSignal]);

  const changeStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.ok) {
        setInvoices((arr) => arr.map((i) => (i.id === id ? json.invoice : i)));
        toast.success(`Estado actualizado: ${STATUS_LABELS[status]}`);
      } else {
        toast.error("No se pudo actualizar");
      }
    } catch {
      toast.error("Error de red");
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("¿Eliminar esta factura? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setInvoices((arr) => arr.filter((i) => i.id !== id));
        toast.success("Factura eliminada");
      } else {
        toast.error("No se pudo eliminar");
      }
    } catch {
      toast.error("Error de red");
    }
  };

  const syncSheets = async (id: string) => {
    try {
      const res = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      });
      const json = await res.json();
      if (json.ok) {
        setInvoices((arr) =>
          arr.map((i) => (i.id === id ? { ...i, sheetsSynced: true } : i))
        );
        toast.success("Sincronizado con Google Sheets");
      } else {
        toast.error(json.error || "Error al sincronizar");
      }
    } catch {
      toast.error("Error de red");
    }
  };

  const filtered = filter === "todas" ? invoices : invoices.filter((i) => i.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[#475569] font-bold">
          Filtrar:
        </span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 bg-white h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas ({invoices.length})</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="pagada">Pagadas</SelectItem>
            <SelectItem value="vencida">Vencidas</SelectItem>
            <SelectItem value="anulada">Anuladas</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={fetchInvoices}
          variant="outline"
          size="sm"
          className="border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff] h-8"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "ima-spin-anim" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#475569]">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando facturas...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-[#dde3f5] p-8 text-center bg-white">
          <p className="text-[#475569] font-medium">No hay facturas para mostrar</p>
          <p className="text-xs text-[#94a3b8] mt-1">Creá tu primera factura desde la pestaña &quot;Emitir factura&quot;</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => (
            <Card
              key={inv.id}
              className="border-[#dde3f5] shadow-sm hover:shadow-md transition-shadow p-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#1e40af] text-sm">{inv.number}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold uppercase ${STATUS_COLORS[inv.status] || ""}`}
                    >
                      {STATUS_LABELS[inv.status] || inv.status}
                    </Badge>
                    {inv.sheetsSynced && (
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                        Sheets ✓
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#0f172a]">
                    {inv.clientName}
                  </div>
                  <div className="text-xs text-[#475569]">
                    {formatDateAR(inv.issuedAt)}
                    {inv.dueAt && ` · Vence: ${formatDateAR(inv.dueAt)}`}
                    {inv.clientCuit && ` · CUIT: ${inv.clientCuit}`}
                  </div>
                  {inv.description && (
                    <div className="text-xs text-[#94a3b8] mt-0.5 truncate">{inv.description}</div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">Total USD</div>
                  <div className="font-bold text-[#1e3a8a] text-sm">{formatUSD(inv.usdTotal)}</div>
                  <div className="text-[10px] text-[#15803d] uppercase tracking-wider font-semibold mt-0.5">Total ARS</div>
                  <div className="font-bold text-[#15803d]">{formatARS(inv.arsTotal)}</div>
                  <div className="text-[10px] text-[#94a3b8] mt-0.5">
                    Cotización: {inv.usdRate.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1 flex-wrap no-print">
                <Button
                  onClick={() => onView?.(inv)}
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff]"
                >
                  <Eye className="h-3 w-3 mr-1" /> Ver / PDF
                </Button>
                {inv.status !== "pagada" && (
                  <Button
                    onClick={() => changeStatus(inv.id, "pagada")}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-green-500 text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-3 w-3 mr-1" /> Marcar pagada
                  </Button>
                )}
                {inv.status === "pagada" && (
                  <Button
                    onClick={() => changeStatus(inv.id, "pendiente")}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-amber-500 text-amber-700 hover:bg-amber-50"
                  >
                    <X className="h-3 w-3 mr-1" /> Reabrir
                  </Button>
                )}
                <Button
                  onClick={() => syncSheets(inv.id)}
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] border-[#4f46e5] text-[#4f46e5] hover:bg-[#eef2ff]"
                  title="Sincronizar con Google Sheets"
                >
                  <Send className="h-3 w-3 mr-1" /> Sheets
                </Button>
                <Button
                  onClick={() => deleteInvoice(inv.id)}
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] border-red-300 text-red-600 hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export type { Invoice, InvoiceItem };
