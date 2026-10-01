"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Settings {
  companyName: string | null;
  companyCuit: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  defaultTaxRate: number;
  sheetsWebAppUrl: string | null;
  invoicePrefix: string | null;
  nextInvoiceNumber: number;
}

export function SettingsPanel() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setS(j.settings);
        } else {
          // Si falla, igual mostramos el form con defaults (la app creará las tablas sola en producción)
          setS({
            companyName: "", companyCuit: "", companyAddress: "",
            companyPhone: "", companyEmail: "", defaultTaxRate: 21,
            sheetsWebAppUrl: "", invoicePrefix: "001", nextInvoiceNumber: 1,
          } as Settings);
        }
      })
      .catch(() => {
        setS({
          companyName: "", companyCuit: "", companyAddress: "",
          companyPhone: "", companyEmail: "", defaultTaxRate: 21,
          sheetsWebAppUrl: "", invoicePrefix: "001", nextInvoiceNumber: 1,
        } as Settings);
      });
    fetch("/api/sheets/script")
      .then((r) => r.json())
      .then((j) => j.ok && setScript(j.script))
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const json = await res.json();
      if (json.ok) {
        setS(json.settings);
        toast.success("✓ Configuración guardada correctamente", { duration: 4000 });
      } else {
        toast.error(json.error || "No se pudo guardar", { duration: 6000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de red. Reintentá.", { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  const copyScript = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Código copiado al portapapeles");
  };

  if (!s) {
    return (
      <div className="flex items-center justify-center py-12 text-[#475569]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando configuración...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Datos empresa */}
      <Card className="border-[#dde3f5] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#1e40af] text-base font-bold uppercase tracking-wide">
            Datos del emisor (tu empresa)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">Razón social</Label>
            <Input
              value={s.companyName || ""}
              onChange={(e) => setS({ ...s, companyName: e.target.value })}
              placeholder="IMA Soluciones Industriales"
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">CUIT</Label>
            <Input
              value={s.companyCuit || ""}
              onChange={(e) => setS({ ...s, companyCuit: e.target.value })}
              placeholder="30-XXXXXXXX-N"
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">Teléfono</Label>
            <Input
              value={s.companyPhone || ""}
              onChange={(e) => setS({ ...s, companyPhone: e.target.value })}
              placeholder="+54 ..."
              className="bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">Email</Label>
            <Input
              type="email"
              value={s.companyEmail || ""}
              onChange={(e) => setS({ ...s, companyEmail: e.target.value })}
              placeholder="contacto@ima-soluciones.com.ar"
              className="bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">Dirección</Label>
            <Input
              value={s.companyAddress || ""}
              onChange={(e) => setS({ ...s, companyAddress: e.target.value })}
              placeholder="Calle, número, ciudad, provincia"
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">IVA por defecto (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={s.defaultTaxRate}
              onChange={(e) => setS({ ...s, defaultTaxRate: Number(e.target.value) })}
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">Prefijo facturas</Label>
            <Input
              value={s.invoicePrefix || ""}
              onChange={(e) => setS({ ...s, invoicePrefix: e.target.value })}
              placeholder="001"
              className="bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Sheets */}
      <Card className="border-[#4f46e5] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#4f46e5] text-base font-bold uppercase tracking-wide">
            Integración con Google Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-[#475569]">
            Cuando se configura, cada factura emitida puede sincronizarse con tu Google Sheet
            para llevar un control de pagos compartido. Seguí estos pasos:
          </p>
          <ol className="text-xs text-[#475569] space-y-1 list-decimal list-inside pl-1">
            <li>Abrí tu Google Sheet donde querés almacenar las facturas.</li>
            <li>Menú <b>Extensiones → Apps Script</b>.</li>
            <li>Borrá el código existente y pegá el script que está abajo.</li>
            <li><b>Implementar → Nueva implementación</b> → tipo: <b>Aplicación web</b>.</li>
            <li>Quién puede acceder: <b>Cualquiera</b>.</li>
            <li>Autorizá los permisos y copiá la URL del Web App.</li>
            <li>Pegá esa URL en el campo de abajo y guardá.</li>
          </ol>
          <div>
            <Label className="text-[10px] uppercase text-[#475569] font-semibold">
              URL del Web App de Google Sheets
            </Label>
            <Input
              value={s.sheetsWebAppUrl || ""}
              onChange={(e) => setS({ ...s, sheetsWebAppUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="bg-white font-mono text-xs"
            />
          </div>
          <details className="rounded-lg border border-[#dde3f5] bg-[#fafbff]">
            <summary className="px-3 py-2 text-xs font-semibold text-[#4f46e5] cursor-pointer flex items-center justify-between">
              <span>Ver / copiar código de Apps Script</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => { e.preventDefault(); copyScript(); }}
                className="h-7 text-[11px] border-[#4f46e5] text-[#4f46e5] hover:bg-[#eef2ff]"
              >
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </summary>
            <Textarea
              readOnly
              value={script}
              className="mt-2 mx-3 mb-3 font-mono text-[10px] bg-white border-[#dde3f5] h-64"
            />
          </details>
          <a
            href="https://script.google.com/home"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2563eb] hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Abrir Apps Script
          </a>
        </CardContent>
      </Card>

      <Button
        onClick={save}
        disabled={saving}
        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {saving ? "Guardando..." : "Guardar configuración"}
      </Button>
    </div>
  );
}
