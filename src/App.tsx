import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { PriceAlert } from "./components/PriceAlert";
import { UserAlerts } from "./components/UserAlerts";
import { useState } from "react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="sticky top-0 z-10 bg-white/90 h-16 flex justify-between items-center border-b border-gray-200 shadow-sm px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PriceAlert Pro
          </h2>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-6 pt-10">
        <div className="max-w-6xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [activeTab, setActiveTab] = useState<"alerts" | "manage">("alerts");

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-0">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-0">
          Sistema de Alertas de Precio
        </h1>
        <Authenticated>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ¡Bienvenido, {loggedInUser?.email ?? "usuario"}! 🎉 
            <br />
            Gestiona alertas inteligentes para cualquier producto y recibe notificaciones instantáneas cuando bajen los precios.
          </p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Inicia sesión para configurar alertas de precio inteligentes y nunca te pierdas una oferta
          </p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="relative z-20 -mt-8 bg-white rounded-2xl border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("alerts")}
                className={`flex-1 px-8 py-4 text-sm font-semibold border-b-3 transition-all duration-200 ${
                  activeTab === "alerts"
                    ? "border-blue-500 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Crear Alerta
                </div>
              </button>
              <button
                onClick={() => setActiveTab("manage")}
                className={`flex-1 px-8 py-4 text-sm font-semibold border-b-3 transition-all duration-200 ${
                  activeTab === "manage"
                    ? "border-blue-500 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                  Mis Alertas
                </div>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === "alerts" ? (
              <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">¿Cómo funciona?</h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Busca un producto existente o agrega uno nuevo</li>
                    <li>• Selecciona la variante específica (tamaño, sabor, color, etc.)</li>
                    <li>• Elige recibir notificaciones por WhatsApp o Telegram</li>
                    <li>• Opcionalmente, establece un precio objetivo</li>
                    <li>• Te avisaremos instantáneamente cuando el precio baje</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">💡 Ejemplo</h3>
                  <p className="text-orange-800 text-sm">
                    Prueba con "EvoWhey Protein 2.0" y variantes como "2kg - Chocolate".
                  </p>
                </div>
                <PriceAlert />
              </div>
            ) : (
              <UserAlerts />
            )}
          </div>
        </div>
      </Authenticated>
    </div>
  );
}
