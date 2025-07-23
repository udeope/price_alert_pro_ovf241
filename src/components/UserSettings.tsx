import { Button } from "@/components/ui/button";

export function UserSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Mis Datos</h3>
        <div className="p-6 bg-white rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <p className="text-gray-800">Usuario de PriceAlert</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <p className="text-gray-800">tu-email@ejemplo.com</p>
          </div>
          <Button variant="outline" size="sm" disabled>Editar Perfil (Próximamente)</Button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Preferencias de Notificación</h3>
        <div className="p-6 bg-white rounded-lg border border-gray-200 space-y-4">
          <p className="text-sm text-gray-600">
            Configura aquí cómo quieres recibir tus alertas. Las integraciones con WhatsApp y Telegram estarán disponibles pronto.
          </p>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <span className="font-medium">📧 Email</span>
            <Button size="sm" disabled>Conectado</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md opacity-50">
            <span className="font-medium">💬 WhatsApp</span>
            <Button variant="secondary" size="sm" disabled>Conectar (Próximamente)</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md opacity-50">
            <span className="font-medium">✈️ Telegram</span>
            <Button variant="secondary" size="sm" disabled>Conectar (Próximamente)</Button>
          </div>
        </div>
      </div>
    </div>
  );
}