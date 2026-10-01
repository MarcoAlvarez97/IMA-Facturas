"use client";

import { useRef, useState } from "react";
import { Printer, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  formatARS, formatUSD, formatNumber, formatDateAR,
} from "@/lib/format";
import type { Invoice } from "./invoices-list";

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceViewer({ invoice, open, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    setPrinting(true);
    // Browser print dialog — el CSS @media print oculta todo excepto .print-area
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Factura {invoice.number}</DialogTitle>
        </DialogHeader>

        {/* Toolbar no-printable */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-[#dde3f5] no-print">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#475569] font-semibold">
              Vista previa de factura
            </div>
            <div className="text-sm font-bold text-[#1e40af]">{invoice.number}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              disabled={printing}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold h-9"
            >
              {printing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              {printing ? "Preparando..." : "Imprimir / Guardar PDF"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="h-9 w-9 border-[#dde3f5]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* FACTURA — impresión */}
        <div className="print-area p-6 sm:p-8 bg-white" ref={printRef}>
          {/* Header */}
          <div className="ima-gradient rounded-xl p-5 flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 border border-white/40 rounded-lg p-1.5">
                <img
                  src="/logo.png"
                  alt="IMA"
                  className="rounded object-contain"
                  style={{ width: "48px", height: "48px" }}
                />
              </div>
              <div className="text-white">
                <div className="text-lg font-extrabold leading-tight">IMA Soluciones Industriales</div>
                <div className="text-xs opacity-90">Factura electrónica · Argentina</div>
              </div>
            </div>
            <div className="text-right text-white">
              <div className="text-2xl font-extrabold tracking-tight">{invoice.number}</div>
              <div className="text-xs opacity-90">
                {formatDateAR(invoice.issuedAt)}
              </div>
            </div>
          </div>

          {/* Datos cliente y cotización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-[#dde3f5] p-3 bg-[#fafbff]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] mb-1">
                Facturar a
              </div>
              <div className="font-bold text-[#0f172a]">{invoice.clientName}</div>
              {invoice.clientCuit && (
                <div className="text-xs text-[#475569]">CUIT: {invoice.clientCuit}</div>
              )}
              {invoice.clientEmail && (
                <div className="text-xs text-[#475569]">{invoice.clientEmail}</div>
              )}
              {invoice.clientAddress && (
                <div className="text-xs text-[#475569]">{invoice.clientAddress}</div>
              )}
            </div>
            <div className="rounded-lg border border-[#dde3f5] p-3 bg-[#fafbff]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] mb-1">
                Datos de la factura
              </div>
              <div className="text-xs text-[#475569]">
                Fecha de emisión: <span className="font-semibold text-[#0f172a]">{formatDateAR(invoice.issuedAt)}</span>
              </div>
              {invoice.dueAt && (
                <div className="text-xs text-[#475569]">
                  Vencimiento: <span className="font-semibold text-[#0f172a]">{formatDateAR(invoice.dueAt)}</span>
                </div>
              )}
              <div className="text-xs text-[#475569] mt-1">
                Cotización USD BNA (venta):{" "}
                <span className="font-bold text-[#1e40af]">
                  1 USD = ${formatNumber(invoice.usdRate)} ARS
                </span>
              </div>
              <div className="text-[10px] text-[#94a3b8]">
                Al tipo de cambio del BNA al momento de emisión.
              </div>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="bg-[#1e40af] text-white text-[10px] uppercase tracking-wider">
                <th className="text-left p-2 rounded-l-md">Descripción</th>
                <th className="text-right p-2 w-16">Cant.</th>
                <th className="text-right p-2 w-24">P.Unit USD</th>
                <th className="text-right p-2 w-28">Subtotal USD</th>
                <th className="text-right p-2 w-32 rounded-r-md">Subtotal ARS</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it) => (
                <tr key={it.id} className="border-b border-[#dde3f5]">
                  <td className="p-2">{it.description}</td>
                  <td className="p-2 text-right">{formatNumber(it.quantity, 0)}</td>
                  <td className="p-2 text-right">{formatUSD(it.unitPrice)}</td>
                  <td className="p-2 text-right font-medium">{formatUSD(it.usdAmount)}</td>
                  <td className="p-2 text-right font-medium text-[#15803d]">{formatARS(it.arsAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-full sm:w-96">
              <div className="border-t-2 border-[#1e40af] pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-[#1e40af] uppercase tracking-wider">
                    Total a pagar
                  </span>
                  <div className="text-3xl font-extrabold text-[#15803d]">
                    {formatARS(invoice.arsTotal)}
                  </div>
                </div>
                <div className="text-[10px] text-[#94a3b8] text-right mt-1">
                  Equivale a {formatUSD(invoice.usdTotal)} al tipo de cambio BNA venta ({formatNumber(invoice.usdRate)} ARS/USD)
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-[#dde3f5] text-center text-[10px] text-[#475569]">
            <p className="font-semibold text-[#1e40af]">IMA Soluciones Industriales</p>
            <p>Documento generado automáticamente · La cotización USD→ARS corresponde al precio de venta del BNA al momento de emisión.</p>
            <p>Esta factura no constituye un comprobante fiscal válido AFIP. Para facturación formal, consultar a tu contador.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
