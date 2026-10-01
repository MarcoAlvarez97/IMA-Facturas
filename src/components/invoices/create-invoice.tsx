"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatARS, formatUSD, formatNumber } from "@/lib/format";
import { toast } from "sonner";

interface Rate {
  buy: number;
  sell: number;
  rate: number;
  date: string;
  fetchedAt: string;
}

interface Item {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Settings {
  companyName: string | null;
  companyCuit: string | null;
  companyAddress: string | null;
  defaultTaxRate: number;
}

interface Props {
  onCreated?: () => void;
}

export function CreateInvoice({ onCreated }: Props) {
  const [rate, setRate] = useState<Rate | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientCuit, setClientCuit] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch("/api/dolar", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setRate(json);
    } catch {
      toast.error("No se pudo obtener la cotización del BNA");
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setSettings(json.settings);
        setTaxRate(json.settings?.defaultTaxRate ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchRate();
    fetchSettings();
  }, [fetchRate, fetchSettings]);

  const totals = useMemo(() => {
    const usdSubtotal = items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
    const usdTaxAmount = (usdSubtotal * taxRate) / 100;
    const usdTotal = usdSubtotal + usdTaxAmount;
    const arsRate = rate?.rate || 0;
    return {
      usdSubtotal,
      usdTaxAmount,
      usdTotal,
      arsRate,
      arsSubtotal: usdSubtotal * arsRate,
      arsTaxAmount: usdTaxAmount * arsRate,
      arsTotal: usdTotal * arsRate,
    };
  }, [items, taxRate, rate]);

  const updateItem = (i: number, patch: Partial<Item>) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((arr) => [...arr, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) =>
    setItems((arr) => (arr.length === 1 ? arr : arr.filter((_, idx) => idx !== i)));

  const handleSave = async () => {
    if (!rate) {
      toast.error("Esperando cotización del BNA...");
      return;
    }
    if (!clientName.trim()) {
      toast.error("Falta el nombre del cliente");
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      toast.error("Todos los ítems deben tener descripción");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName, clientCuit, clientAddress, clientEmail,
          description,
          dueAt: dueAt || null,
          usdRate: rate.rate,
          usdRateDate: rate.date,
          taxRate,
          items: items.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Factura ${json.invoice.number} creada correctamente`, { duration: 5000 });
        // Reset
        setClientName(""); setClientCuit(""); setClientAddress(""); setClientEmail("");
        setDescription(""); setDueAt("");
        setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
        onCreated?.();
      } else {
        console.error("API error:", json);
        toast.error(json.error || "Error al crear factura", { duration: 6000 });
      }
    } catch (err) {
      console.error("Network error:", err);
      toast.error("Error de red. Revisá tu conexión.", { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tarjeta datos cliente */}
      <Card className="border-[#dde3f5] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#1e40af] text-base font-bold uppercase tracking-wide">
            Datos del cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="clientName" className="text-[10px] uppercase tracking-wider text-[#475569] font-semibold">
              Nombre / Empresa *
            </Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej: ACME S.A."
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="clientCuit" className="text-[10px] uppercase tracking-wider text-[#475569] font-semibold">
              CUIT / DNI
            </Label>
            <Input
              id="clientCuit"
              value={clientCuit}
              onChange={(e) => setClientCuit(e.target.value)}
              placeholder="Ej: 30-12345678-9"
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="clientEmail" className="text-[10px] uppercase tracking-wider text-[#475569] font-semibold">
              Email
            </Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="clientAddress" className="text-[10px] uppercase tracking-wider text-[#475569] font-semibold">
              Dirección
            </Label>
            <Input
              id="clientAddress"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Calle, número, ciudad"
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-[10px] uppercase tracking-wider text-[#475569] font-semibold">
              Descripción general
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Servicios industriales — Octubre 2026"
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="dueAt" className="text-[10px] uppercase tracking-wider text-[#475569] font-semibold">
              Vencimiento
            </Label>
            <Input
              id="dueAt"
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-[#dde3f5] shadow-sm">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[#1e40af] text-base font-bold uppercase tracking-wide">
            Detalle de la factura
          </CardTitle>
          <Button
            onClick={addItem}
            size="sm"
            variant="outline"
            className="border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff]"
          >
            <Plus className="h-4 w-4 mr-1" /> Ítem
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      {/* Impuestos */}
      <Card className="border-[#dde3f5] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#1e40af] text-base font-bold uppercase tracking-wide">
            Impuestos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">
              Tipo de impuesto
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
        </CardContent>
      </Card>

      {/* Totales */}
      <Card className="border-[#2563eb] shadow-md overflow-hidden">
        <CardHeader className="p-4 ima-gradient rounded-none border-b-0">
          <CardTitle className="text-white text-base font-bold uppercase tracking-wide m-0">
            Resumen — Totales
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-[#475569] font-semibold">Subtotal (USD):</div>
            <div className="text-right font-semibold text-[#1e3a8a]">{formatUSD(totals.usdSubtotal)}</div>
            <div className="text-[#475569] font-semibold">Impuesto ({taxRate}%):</div>
            <div className="text-right font-semibold text-[#1e3a8a]">{formatUSD(totals.usdTaxAmount)}</div>
            <div className="text-[#1e40af] font-bold border-t border-[#dde3f5] pt-1">Total USD:</div>
            <div className="text-right font-bold text-[#1e40af] border-t border-[#dde3f5] pt-1">
              {formatUSD(totals.usdTotal)}
            </div>
          </div>

          <div className="my-2 h-px bg-[#dde3f5]" />

          <div className="text-[10px] uppercase tracking-wider text-[#475569] font-bold">
            Cotización BNA usada (precio venta):
          </div>
          <div className="text-sm text-[#1e3a8a] mb-2">
            1 USD = <span className="font-bold">${rate ? formatNumber(rate.rate) : "—"}</span> ARS
            {rate && (
              <span className="ml-2 text-[10px] text-[#475569]">
                ({new Date(rate.date).toLocaleString("es-AR")})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-[#475569] font-semibold">Subtotal (ARS):</div>
            <div className="text-right font-semibold text-[#14532d]">{formatARS(totals.arsSubtotal)}</div>
            <div className="text-[#475569] font-semibold">Impuesto (ARS):</div>
            <div className="text-right font-semibold text-[#14532d]">{formatARS(totals.arsTaxAmount)}</div>
            <div className="text-[#15803d] font-bold border-t border-[#dde3f5] pt-1">Total ARS:</div>
            <div className="text-right font-bold text-[#15803d] border-t border-[#dde3f5] pt-1 text-base">
              {formatARS(totals.arsTotal)}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading || !rate}
            className="w-full mt-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? "Guardando..." : "Emitir factura"}
          </Button>
          <p className="text-[10px] text-center text-[#475569] mt-1">
            La factura se guardará con la cotización actual y se podrá imprimir en PDF con el monto en ARS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
