"use client";

import { useEffect, useState, useMemo } from "react";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatARS, formatUSD } from "@/lib/format";
import { toast } from "sonner";

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  usdAmount?: number;
  arsAmount?: number;
}

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientCuit: string | null;
  clientAddress: string | null;
  clientEmail: string | null;
  description: string | null;
  issuedAt: string;
  dueAt: string | null;
  usdRate: number;
  usdTotal: number;
  arsTotal: number;
  usdTaxRate: number;
  status: string;
  items: InvoiceItem[];
}

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function EditInvoiceDialog({ invoice, open, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [number, setNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCuit, setClientCuit] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [usdRate, setUsdRate] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    if (invoice && open) {
      setNumber(invoice.number);
      setClientName(invoice.clientName);
      setClientCuit(invoice.clientCuit || "");
      setClientAddress(invoice.clientAddress || "");
      setClientEmail(invoice.clientEmail || "");
      setDescription(invoice.description || "");
      // issuedAt y dueAt vienen como ISO, los convertimos a YYYY-MM-DD para el input date
      const issued = new Date(invoice.issuedAt);
      setIssuedAt(toDateInput(invoice.issuedAt));
      setDueAt(invoice.dueAt ? toDateInput(invoice.dueAt) : "");
      setTaxRate(invoice.usdTaxRate || 0);
      setUsdRate(invoice.usdRate);
      setItems(
        invoice.items.length > 0
          ? invoice.items.map((it) => ({
              id: it.id,
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            }))
          : [{ description: "", quantity: 1, unitPrice: 0 }]
      );
    }
  }, [invoice, open]);

  function toDateInput(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const totals = useMemo(() => {
    const usdSubtotal = items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
    const usdTaxAmount = (usdSubtotal * taxRate) / 100;
    const usdTotal = usdSubtotal + usdTaxAmount;
    return {
      usdSubtotal,
      usdTaxAmount,
      usdTotal,
      arsSubtotal: usdSubtotal * usdRate,
      arsTaxAmount: usdTaxAmount * usdRate,
      arsTotal: usdTotal * usdRate,
    };
  }, [items, taxRate, usdRate]);

  const updateItem = (i: number, patch: Partial<InvoiceItem>) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const addItem = () =>
    setItems((arr) => [...arr, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) =>
    setItems((arr) => (arr.length === 1 ? arr : arr.filter((_, idx) => idx !== i)));

  const handleSave = async () => {
    if (!invoice) return;
    if (!number.trim()) {
      toast.error("El número de factura no puede estar vacío");
      return;
    }
    if (!clientName.trim()) {
      toast.error("El nombre del cliente no puede estar vacío");
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      toast.error("Todos los ítems deben tener descripción");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: number.trim(),
          clientName: clientName.trim(),
          clientCuit: clientCuit.trim() || null,
          clientAddress: clientAddress.trim() || null,
          clientEmail: clientEmail.trim() || null,
          description: description.trim() || null,
          issuedAt: issuedAt || undefined,
          dueAt: dueAt || null,
          taxRate,
          usdRate,
          items: items.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`✓ Factura ${json.invoice.number} actualizada`, { duration: 4000 });
        onSaved?.();
        onClose();
      } else {
        toast.error(json.error || "Error al guardar", { duration: 6000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de red", { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Editar factura {invoice.number}</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-[#dde3f5]">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#475569] font-semibold">
              Editar factura
            </div>
            <div className="text-sm font-bold text-[#1e40af]">{invoice.number}</div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold h-9"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Número y fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px] uppercase text-[#475569] font-semibold">
                N° Factura *
              </Label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="001-000123"
                className="bg-white font-mono font-bold text-[#1e40af]"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#475569] font-semibold">
                Fecha de emisión
              </Label>
              <Input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#475569] font-semibold">
                Vencimiento
              </Label>
              <Input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="rounded-lg border border-[#dde3f5] p-3 bg-[#fafbff]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] mb-2">
              Cliente
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre / Empresa *"
                  className="bg-white"
                />
              </div>
              <Input
                value={clientCuit}
                onChange={(e) => setClientCuit(e.target.value)}
                placeholder="CUIT / DNI"
                className="bg-white"
              />
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email"
                className="bg-white"
              />
              <div className="sm:col-span-2">
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Dirección"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">
              Descripción general
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Servicios industriales — Octubre 2026"
              className="bg-white"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[10px] uppercase text-[#475569] font-semibold">
                Detalle de la factura
              </Label>
              <Button
                onClick={addItem}
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff]"
              >
                <Plus className="h-3 w-3 mr-1" /> Ítem
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="rounded-xl border border-[#dde3f5] bg-[#fafbff] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                      Ítem #{i + 1}
                    </span>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-30"
                      disabled={items.length === 1}
                      title="Eliminar ítem"
                      aria-label="Eliminar ítem"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    value={it.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    placeholder="Descripción del servicio / producto"
                    className="bg-white"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase text-[#475569] font-semibold">Cantidad</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={it.quantity}
                        onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-[#475569] font-semibold">P. Unit USD</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.unitPrice}
                        onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-[#475569] font-semibold">Total USD</Label>
                      <div className="h-9 flex items-center px-3 rounded-md bg-[#eff6ff] border border-[#bfdbfe] font-semibold text-[#1e3a8a] text-sm">
                        {formatUSD((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impuestos y cotización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase text-[#475569] font-semibold">
                Impuesto
              </Label>
              <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(Number(v))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Sin impuesto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin impuesto (0%)</SelectItem>
                  <SelectItem value="10.5">IVA 10,5%</SelectItem>
                  <SelectItem value="21">IVA 21%</SelectItem>
                  <SelectItem value="27">IVA 27%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#475569] font-semibold">
                Cotización USD (BNA venta)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={usdRate}
                onChange={(e) => setUsdRate(Number(e.target.value))}
                className="bg-white"
              />
            </div>
          </div>

          {/* Totales */}
          <div className="rounded-lg border border-[#2563eb] p-3 bg-white">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#1e40af] mb-2">
              Totales
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-[#475569] font-semibold">Subtotal USD:</div>
              <div className="text-right font-semibold text-[#1e3a8a]">{formatUSD(totals.usdSubtotal)}</div>
              <div className="text-[#475569] font-semibold">Impuesto ({taxRate}%):</div>
              <div className="text-right font-semibold text-[#1e3a8a]">{formatUSD(totals.usdTaxAmount)}</div>
              <div className="text-[#1e40af] font-bold border-t border-[#dde3f5] pt-1">Total USD:</div>
              <div className="text-right font-bold text-[#1e40af] border-t border-[#dde3f5] pt-1">
                {formatUSD(totals.usdTotal)}
              </div>
              <div className="text-[#15803d] font-bold border-t-2 border-[#1e40af] pt-1 mt-1">Total ARS:</div>
              <div className="text-right font-bold text-[#15803d] border-t-2 border-[#1e40af] pt-1 mt-1 text-base">
                {formatARS(totals.arsTotal)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
