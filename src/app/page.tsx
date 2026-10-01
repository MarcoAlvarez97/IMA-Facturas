"use client";

import { useState, useCallback } from "react";
import { FileText, ListChecks, Settings as SettingsIcon, Plus } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { DolarWidget } from "@/components/dashboard/dolar-widget";
import { CreateInvoice } from "@/components/invoices/create-invoice";
import { InvoicesList, type Invoice } from "@/components/invoices/invoices-list";
import { InvoiceViewer } from "@/components/invoices/invoice-viewer";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [tab, setTab] = useState("crear");

  const onCreated = useCallback(() => {
    setRefreshSignal((n) => n + 1);
    setTab("lista");
  }, []);

  const onView = useCallback((inv: Invoice) => {
    setViewing(inv);
    setViewerOpen(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4ff]">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Cotización BNA visible arriba en todas las pestañas */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <DolarWidget />
          <div className="rounded-2xl border border-[#dde3f5] bg-white p-4 flex flex-col justify-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb]">
              Cómo funciona
            </div>
            <ol className="mt-1 text-xs text-[#475569] space-y-0.5 list-decimal list-inside">
              <li>Cargás el monto en <b>USD</b> al crear la factura.</li>
              <li>El sistema multiplica automáticamente por la cotización <b>venta BNA</b>.</li>
              <li>Al imprimir como PDF, el total se muestra en <b>ARS</b>.</li>
              <li>La cotización se actualiza sola durante el día.</li>
              <li>Podés sincronizar con Google Sheets desde la lista.</li>
            </ol>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full bg-white border border-[#dde3f5] h-11">
            <TabsTrigger
              value="crear"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Plus className="h-4 w-4 mr-1" /> Emitir factura
            </TabsTrigger>
            <TabsTrigger
              value="lista"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <ListChecks className="h-4 w-4 mr-1" /> Mis facturas
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <SettingsIcon className="h-4 w-4 mr-1" /> Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crear" className="mt-4">
            <CreateInvoice onCreated={onCreated} />
          </TabsContent>

          <TabsContent value="lista" className="mt-4">
            <InvoicesList refreshSignal={refreshSignal} onView={onView} />
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-auto border-t border-[#dde3f5] bg-white py-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 text-[10px] text-[#475569]">
          <div>
            <span className="font-bold text-[#1e40af]">IMA Soluciones Industriales</span>
            {" · "}Sistema de facturación con cotización BNA automática
          </div>
          <div className="hidden sm:block">
            Argentina · {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      <InvoiceViewer
        invoice={viewing}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
