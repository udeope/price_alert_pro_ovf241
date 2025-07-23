import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { PriceAlertType, PriceAlertWithProduct, ProductType } from "../types"; // Import the new type

// Helper component for the scraping status
function ScrapingStatusIndicator({ product }: { product: ProductType | null }) {
  if (!product?.scrapingStatus || !product.lastScraped) {
    return null;
  }

  const statusStyles = {
    success: {
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
      color: "text-green-500",
      tooltip: "Scraping successful",
    },
    failure: {
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
      color: "text-red-500",
      tooltip: "Scraping failed",
    },
    pending: {
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z",
      color: "text-yellow-500",
      tooltip: "Scraping pending",
    },
  };

  const status = statusStyles[product.scrapingStatus];

  return (
    <div className="relative group">
      <svg className={`w-4 h-4 ${status.color}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d={status.icon} clipRule="evenodd" />
      </svg>
      <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {status.tooltip} on {new Date(product.lastScraped).toLocaleString()}
      </div>
    </div>
  );
}


function EditAlertForm({
  alert,
  onClose,
  onAlertUpdated,
}: {
  alert: PriceAlertWithProduct;
  onClose: () => void;
  onAlertUpdated: () => void;
}) {
  const [targetPrice, setTargetPrice] = useState(alert.targetPrice?.toString() || "");
  const [userContact, setUserContact] = useState(alert.userContact);
  const [contactType, setContactType] = useState<"whatsapp" | "telegram" | "email">(alert.contactType);
  const [isActive, setIsActive] = useState(alert.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateAlertMutation = useMutation(api.priceAlerts.updatePriceAlert);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!userContact.trim()) {
      toast.error("El contacto no puede estar vacío.");
      setIsSubmitting(false);
      return;
    }
    if (contactType === "whatsapp" && !userContact.match(/^\+?[\d\s-()]+$/)) {
      toast.error("Número de WhatsApp inválido.");
      setIsSubmitting(false);
      return;
    }
    if (contactType === "telegram" && !userContact.startsWith("@")) {
      toast.error("Usuario de Telegram debe comenzar con @.");
      setIsSubmitting(false);
      return;
    }
    if (contactType === "email" && !userContact.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Correo electrónico inválido.");
      setIsSubmitting(false);
      return;
    }

    try {
      await updateAlertMutation({
        alertId: alert._id,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        userContact: userContact.trim(),
        contactType,
        isActive: isActive, 
      });
      toast.success("Alerta actualizada correctamente.");
      onAlertUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la alerta.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-lg transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Editar Alerta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Producto: <strong className="font-medium text-gray-700">{alert.productName}{alert.variantName ? ` - ${alert.variantName}` : ''}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio Objetivo (opcional)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={`Actual: ${formatPrice(alert.currentPrice)}`}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Método de Notificación</label>
            <select
              value={contactType}
              onChange={(e) => {
                setContactType(e.target.value as "whatsapp" | "telegram" | "email");
                setUserContact(""); // Clear userContact when contactType changes
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {contactType === "whatsapp" ? "Número de WhatsApp" : contactType === "telegram" ? "Usuario de Telegram" : "Correo Electrónico"}
            </label>
            <input
              type={contactType === "email" ? "email" : "text"}
              value={userContact}
              onChange={(e) => setUserContact(e.target.value)}
              placeholder={contactType === "whatsapp" ? "+34..." : contactType === "telegram" ? "@usuario" : "tu@correo.com"}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
           <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Alerta Activa</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-colors flex items-center justify-center">
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export function UserAlerts() {
  const userAlerts = useQuery(api.priceAlerts.getUserAlerts);
  const updateAlertStatusMutation = useMutation(api.priceAlerts.updateAlertStatus);
  const deleteAlertMutation = useMutation(api.priceAlerts.deleteAlert);

  const [editingAlert, setEditingAlert] = useState<PriceAlertWithProduct | null>(null);

  const handleToggleAlertStatus = async (alertId: Id<"priceAlerts">, currentStatus: boolean) => {
    try {
      await updateAlertStatusMutation({ alertId, isActive: !currentStatus });
      toast.success(`Alerta ${!currentStatus ? "activada" : "desactivada"}.`);
    } catch (error) {
      toast.error("Error al cambiar estado de la alerta.");
    }
  };

  const handleDeleteAlert = async (alertId: Id<"priceAlerts">) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta alerta?")) {
      try {
        await deleteAlertMutation({ alertId });
        toast.success("Alerta eliminada.");
      } catch (error) {
        toast.error("Error al eliminar la alerta.");
      }
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getContactTypeDisplay = (contactType: "whatsapp" | "telegram" | "email") => {
    if (contactType === "whatsapp") return "WhatsApp";
    if (contactType === "telegram") return "Telegram";
    if (contactType === "email") return "Email";
    return "Desconocido";
  };


  if (userAlerts === undefined) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (userAlerts.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3z" />
        </svg>
        <p className="text-gray-500">No tienes alertas activas en este momento.</p>
        <p className="text-sm text-gray-400 mt-1">Crea una nueva alerta para empezar a seguir precios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Mis Alertas de Precio</h2>
      {userAlerts.map((alert) => (
        <div key={alert._id} className={`p-5 rounded-xl shadow-lg transition-all duration-300 ${alert.isActive ? 'bg-white border border-blue-200' : 'bg-gray-100 border border-gray-200 opacity-75'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
            <div className="flex items-center gap-2">
              <ScrapingStatusIndicator product={alert.product} />
              <div>
                <h3 className={`text-lg font-semibold ${alert.isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                  {alert.productName}
                  {alert.variantName && <span className="text-sm text-gray-500"> - {alert.variantName}</span>}
                </h3>
                <p className="text-xs text-gray-500">
                  Creada: {new Date(alert._creationTime).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 text-xs font-medium rounded-full mt-2 sm:mt-0 ${alert.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {alert.isActive ? "Activa" : "Inactiva"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500 font-medium">Precio Registrado:</p>
              <p className="text-gray-800 font-semibold">{formatPrice(alert.currentPrice)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500 font-medium">Precio Objetivo:</p>
              <p className="text-gray-800 font-semibold">
                {alert.targetPrice ? formatPrice(alert.targetPrice) : "Cualquier bajada"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg col-span-1 md:col-span-2">
              <p className="text-gray-500 font-medium">Notificar por {getContactTypeDisplay(alert.contactType)}:</p>
              <p className="text-gray-800 font-semibold">{alert.userContact}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => setEditingAlert(alert)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
              Editar
            </button>
            <button
              onClick={() => handleToggleAlertStatus(alert._id, alert.isActive)}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                alert.isActive 
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}>
              {alert.isActive ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
              )}
              {alert.isActive ? "Desactivar" : "Activar"}
            </button>
            <button
              onClick={() => handleDeleteAlert(alert._id)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              Eliminar
            </button>
          </div>
        </div>
      ))}
      {editingAlert && (
        <EditAlertForm
          alert={editingAlert}
          onClose={() => setEditingAlert(null)}
          onAlertUpdated={() => {
            // userAlerts will refetch automatically due to Convex reactivity
            // No explicit action needed here to refresh the list
          }}
        />
      )}
    </div>
  );
}
