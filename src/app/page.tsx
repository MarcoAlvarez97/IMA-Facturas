"use client";

import { useState, useCallback } from "react";
import { ListChecks, Settings as SettingsIcon, Plus } from "lucide-react";
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

      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-6">
        {/* Cotización BNA visible arriba */}
        <div className="mb-4">
          <DolarWidget />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          {/* Tabs — en desktop arriba, en móvil barra inferior fija */}
          <TabsList className="hidden sm:grid grid-cols-3 w-full bg-white border border-[#dde3f5] h-11">
            <TabsTrigger
              value="crear"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Emitir factura
            </TabsTrigger>
            <TabsTrigger
              value="lista"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-sm"
            >
              <ListChecks className="h-4 w-4 mr-1" /> Mis facturas
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-sm"
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

      <footer className="hidden sm:block mt-auto border-t border-[#dde3f5] bg-white py-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 text-[10px] text-[#475569]">
          <div>
            <span className="font-bold text-[#1e40af]">IMA Soluciones Industriales</span>
            {" · "}Sistema de facturación con cotización BNA automática
          </div>
          <div>Argentina · {new Date().getFullYear()}</div>
        </div>
      </footer>

      {/* Navegación móvil inferior fija */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#dde3f5] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3 h-16">
          <button
            onClick={() => setTab("crear")}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              tab === "crear" ? "text-[#2563eb]" : "text-[#94a3b8]"
            }`}
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Emitir</span>
          </button>
          <button
            onClick={() => setTab("lista")}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              tab === "lista" ? "text-[#2563eb]" : "text-[#94a3b8]"
            }`}
          >
            <ListChecks className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Facturas</span>
          </button>
          <button
            onClick={() => setTab("config")}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              tab === "config" ? "text-[#2563eb]" : "text-[#94a3b8]"
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Config</span>
          </button>
        </div>
      </nav>

      <InvoiceViewer
        invoice={viewing}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
