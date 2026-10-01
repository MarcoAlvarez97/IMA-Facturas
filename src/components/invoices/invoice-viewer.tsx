"use client";

import { useState } from "react";
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

// Genera el HTML completo de la factura para imprimir en una ventana nueva.
// Esto evita todos los problemas de CSS del modal (transform, position: fixed, etc.)
function buildInvoiceHTML(invoice: Invoice): string {
  const itemsRows = invoice.items.map((it) => `
    <tr>
      <td class="desc">${escapeHtml(it.description)}</td>
      <td class="num">${formatNumber(it.quantity, 0)}</td>
      <td class="num">${formatUSD(it.unitPrice)}</td>
      <td class="num">${formatUSD(it.usdAmount)}</td>
      <td class="num ars">${formatARS(it.arsAmount)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura ${invoice.number}</title>
<style>
  @page { margin: 12mm; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: white;
    color: #0f172a;
    padding: 20px;
    font-size: 14px;
  }
  .header {
    background: linear-gradient(130deg, #1e40af 0%, #2563eb 55%, #0ea5e9 100%);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    color: white;
  }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .header-logo {
    width: 48px; height: 48px; border-radius: 8px;
    background: rgba(255,255,255,0.2);
    border: 2px solid rgba(255,255,255,0.4);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; color: white; font-size: 14px;
  }
  .header-title { font-size: 18px; font-weight: 800; line-height: 1.1; }
  .header-subtitle { font-size: 12px; opacity: 0.9; }
  .header-right { text-align: right; }
  .header-number { font-size: 24px; font-weight: 800; line-height: 1; }
  .header-date { font-size: 12px; opacity: 0.9; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .box { border: 1px solid #dde3f5; border-radius: 8px; padding: 12px; background: #fafbff; }
  .box-label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #2563eb; margin-bottom: 4px; }
  .box-text { font-size: 12px; color: #475569; }
  .box-text strong { color: #0f172a; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th {
    background: #1e40af; color: white;
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
    padding: 8px; text-align: left;
  }
  thead th.num { text-align: right; }
  thead th:first-child { border-top-left-radius: 6px; }
  thead th:last-child { border-top-right-radius: 6px; }
  tbody td { padding: 8px; border-bottom: 1px solid #dde3f5; }
  tbody td.num { text-align: right; font-weight: 500; }
  tbody td.ars { color: #15803d; font-weight: 600; }

  .totals { display: flex; justify-content: flex-end; margin-top: 16px; }
  .totals-box { width: 100%; max-width: 360px; }
  .totals-divider { border-top: 2px solid #1e40af; padding-top: 12px; }
  .totals-row { display: flex; justify-content: space-between; align-items: center; }
  .totals-label { font-size: 14px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em; }
  .totals-value { font-size: 28px; font-weight: 800; color: #15803d; }
  .totals-equivalent { font-size: 10px; color: #94a3b8; text-align: right; margin-top: 4px; }

  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #dde3f5; text-align: center; font-size: 10px; color: #475569; }
  .footer strong { color: #1e40af; }

  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="header-logo">IMA</div>
      <div>
        <div class="header-title">IMA Soluciones Industriales</div>
        <div class="header-subtitle">Factura electrónica · Argentina</div>
      </div>
    </div>
    <div class="header-right">
      <div class="header-number">${invoice.number}</div>
      <div class="header-date">${formatDateAR(invoice.issuedAt)}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="box">
      <div class="box-label">Facturar a</div>
      <div style="font-weight:bold;">${escapeHtml(invoice.clientName)}</div>
      ${invoice.clientCuit ? `<div class="box-text">CUIT: ${escapeHtml(invoice.clientCuit)}</div>` : ""}
      ${invoice.clientEmail ? `<div class="box-text">${escapeHtml(invoice.clientEmail)}</div>` : ""}
      ${invoice.clientAddress ? `<div class="box-text">${escapeHtml(invoice.clientAddress)}</div>` : ""}
    </div>
    <div class="box">
      <div class="box-label">Datos de la factura</div>
      <div class="box-text">Fecha de emisión: <strong>${formatDateAR(invoice.issuedAt)}</strong></div>
      ${invoice.dueAt ? `<div class="box-text">Vencimiento: <strong>${formatDateAR(invoice.dueAt)}</strong></div>` : ""}
      <div class="box-text" style="margin-top:4px;">Cotización USD BNA (venta): <strong style="color:#1e40af;">1 USD = $${formatNumber(invoice.usdRate)} ARS</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th class="num">Cant.</th>
        <th class="num">P.Unit USD</th>
        <th class="num">Subtotal USD</th>
        <th class="num">Subtotal ARS</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-divider">
        <div class="totals-row">
          <span class="totals-label">Total a pagar</span>
          <span class="totals-value">${formatARS(invoice.arsTotal)}</span>
        </div>
        <div class="totals-equivalent">
          Equivale a ${formatUSD(invoice.usdTotal)} al tipo de cambio BNA venta (${formatNumber(invoice.usdRate)} ARS/USD)
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>IMA Soluciones Industriales</strong></p>
    <p>Documento generado automáticamente · La cotización USD→ARS corresponde al precio de venta del BNA al momento de emisión.</p>
  </div>

  <script>
    // Auto-print después de cargar
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function InvoiceViewer({ invoice, open, onClose }: Props) {
  const [printing, setPrinting] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    setPrinting(true);
    try {
      const html = buildInvoiceHTML(invoice);
      // Abrir en ventana nueva — evita todos los problemas de CSS del modal
      const printWindow = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
      if (!printWindow) {
        alert("Por favor permití las ventanas emergentes para poder imprimir la factura.");
        setPrinting(false);
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error("Print error:", err);
      alert("Hubo un error al generar el PDF. Cerrá y volvé a intentar.");
    } finally {
      // No set printing=false acá porque la ventana nueva se abre aparte
      setTimeout(() => setPrinting(false), 1000);
    }
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
              {printing ? "Abriendo..." : "Imprimir / Guardar PDF"}
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

        {/* FACTURA — vista previa en pantalla (no se imprime desde acá, se abre en ventana nueva) */}
        <div className="p-6 sm:p-8 bg-white">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
