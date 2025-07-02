import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ProductSearch } from "./ProductSearch";
import { ProductForm } from "./ProductForm";
import { ProductVariants } from "./ProductVariants";
import { PriceHistoryDisplay } from "./PriceHistoryDisplay"; // Import the new component
import { Id } from "../../convex/_generated/dataModel";

export function PriceAlert() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [contactType, setContactType] = useState<"whatsapp" | "telegram" | "email">("whatsapp");
  const [userContact, setUserContact] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para alertas inteligentes
  const [alertType, setAlertType] = useState<"fixed_price" | "percentage" | "any_drop" | "seasonal">("any_drop");
  const [percentageThreshold, setPercentageThreshold] = useState("");
  const [multipleThresholds, setMultipleThresholds] = useState<{percentage: number, triggered: boolean}[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [seasonalContext, setSeasonalContext] = useState({
    isBlackFridayAlert: false,
    isChristmasAlert: false,
    isSummerSaleAlert: false
  });
  const [maxDailyNotifications, setMaxDailyNotifications] = useState(3);
  const [groupSimilarAlerts, setGroupSimilarAlerts] = useState(true);
  
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [productSearchComponentKey, setProductSearchComponentKey] = useState(0); 

  const createAlert = useMutation(api.priceAlerts.createPriceAlert);
  const userAlerts = useQuery(api.priceAlerts.getUserAlerts); 
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return selectedProduct?.basePrice || 0;
  };

  const getProductDisplayName = () => {
    if (!selectedProduct) return "";
    if (selectedVariant) {
      return `${selectedProduct.name} - ${selectedVariant.name}`;
    }
    return selectedProduct.name;
  };

  const existingAlert = userAlerts?.find(alert =>
    alert.isActive && 
    alert.productId === selectedProduct?._id &&
    (
      (selectedVariant && alert.variantId === selectedVariant._id) ||
      (!selectedVariant && !alert.variantId)
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error("Por favor selecciona un producto");
      return;
    }

    if (existingAlert) {
      toast.info("Ya tienes una alerta activa para esta configuración. Puedes gestionarla en 'Mis Alertas'.");
      return;
    }
    
    if (!userContact.trim()) {
      toast.error("Por favor ingresa tu contacto");
      return;
    }

    if (contactType === "whatsapp" && !userContact.match(/^\+?[\d\s-()]+$/)) {
      toast.error("Por favor ingresa un número de WhatsApp válido");
      return;
    }

    if (contactType === "telegram" && !userContact.startsWith("@")) {
      toast.error("El usuario de Telegram debe comenzar con @");
      return;
    }

    if (contactType === "email" && !userContact.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAlert({
        productId: selectedProduct._id,
        variantId: selectedVariant?._id,
        productName: getProductDisplayName(), 
        variantName: selectedVariant?.name, 
        currentPrice: getCurrentPrice(),
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        userContact: userContact.trim(),
        contactType,
        // Parámetros de alertas inteligentes
        alertType,
        percentageThreshold: percentageThreshold ? parseFloat(percentageThreshold) : undefined,
        multipleThresholds: multipleThresholds.length > 0 ? multipleThresholds.map(t => ({
          percentage: t.percentage,
          triggered: false,
          notifiedAt: undefined
        })) : undefined,
        seasonalContext: (seasonalContext.isBlackFridayAlert || seasonalContext.isChristmasAlert || seasonalContext.isSummerSaleAlert) 
          ? seasonalContext 
          : undefined,
        maxDailyNotifications,
        groupSimilarAlerts,
      });

      toast.success("¡Alerta de precio inteligente activada! Te notificaremos según tu configuración.");
      setSelectedProduct(null);
      setSelectedVariant(null);
      setCurrentSearchTerm("");
      setProductSearchComponentKey(prevKey => prevKey + 1);
      setUserContact("");
      setTargetPrice("");
      setContactType("whatsapp");
      // Reset smart alert settings
      setAlertType("any_drop");
      setPercentageThreshold("");
      setMultipleThresholds([]);
      setShowAdvancedOptions(false);
      setSeasonalContext({
        isBlackFridayAlert: false,
        isChristmasAlert: false,
        isSummerSaleAlert: false
      });
      setMaxDailyNotifications(3);
      setGroupSimilarAlerts(true);

    } catch (error: any) {
      toast.error(error.message || "Error al crear la alerta. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const handleProductAdded = (productId: Id<"products">) => {
    setShowAddForm(false);
    setProductSearchComponentKey(prevKey => prevKey + 1); 
  };

  const handleClearSearchAndSelection = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setCurrentSearchTerm(""); 
    setProductSearchComponentKey(prevKey => prevKey + 1); 
    toast.info("Búsqueda y selección limpiadas.");
  };

  if (showAddForm) {
    return (
      <ProductForm
        onProductAdded={handleProductAdded}
        onCancel={() => setShowAddForm(false)}
        enableScraper={true}
      />
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-blue-900">Configurar Alerta de Precio</h3>
          <p className="text-blue-700 text-sm">Recibe notificaciones cuando el precio baje</p>
        </div>
      </div>

      <div className="space-y-6">
        {loggedInUser === undefined ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Cargando usuario...</p>
          </div>
        ) : loggedInUser === null ? (
          <p className="text-center text-gray-500 py-4">
            Inicia sesión para buscar y seleccionar productos.
          </p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-3">
                🔍 Seleccionar producto
              </label>
              <ProductSearch
                key={productSearchComponentKey} 
                searchTerm={currentSearchTerm}
                onSearchTermChange={setCurrentSearchTerm}
                onProductSelect={(product) => {
                  setSelectedProduct(product);
                  setSelectedVariant(null); 
                  setCurrentSearchTerm(product.name); 
                }}
                onAddNewProduct={() => {
                  setShowAddForm(true);
                  setSelectedProduct(null); 
                  setSelectedVariant(null);
                  setCurrentSearchTerm("");
                  setProductSearchComponentKey(prevKey => prevKey + 1); 
                }}
              />
              {(currentSearchTerm || selectedProduct) && (
                 <div className="mt-2 text-right"> 
                    <button
                        type="button"
                        onClick={handleClearSearchAndSelection}
                        className="text-xs text-gray-500 hover:text-blue-600 hover:underline px-2 py-1 rounded-md transition-colors"
                    >
                        Limpiar Búsqueda / Selección
                    </button>
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm mt-4">
                <div className="flex items-start gap-4 mb-6">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-20 h-20 object-cover rounded-xl shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{getProductDisplayName()}</h4>
                    {selectedProduct.brand && (
                      <p className="text-sm text-gray-600 mb-2">🏷️ {selectedProduct.brand}</p>
                    )}
                    {selectedProduct.category && (
                      <p className="text-sm text-gray-500 mb-2">📂 {selectedProduct.category}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(getCurrentPrice())}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {selectedVariant ? "Precio de variante" : "Precio base"}
                      </span>
                    </div>
                  </div>
                </div>

                <ProductVariants
                  key={`variants-${selectedProduct._id}-${loggedInUser._id}`}
                  productId={selectedProduct._id}
                  onVariantSelect={setSelectedVariant}
                  selectedVariantId={selectedVariant?._id}
                />
                {/* Display Price History */}
                <PriceHistoryDisplay 
                  productId={selectedProduct._id} 
                  variantId={selectedVariant?._id} 
                />
              </div>
            )}

            {selectedProduct && existingAlert && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 my-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-800 font-semibold text-md">Alerta de precio ya activa</span>
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100 text-sm">
                  <p className="text-green-700 mb-1">
                    <strong className="text-green-900">{getProductDisplayName()}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-green-600">
                    <span>📱 {existingAlert.contactType === "whatsapp" ? "WhatsApp" : existingAlert.contactType === "telegram" ? "Telegram" : "Email"}: {existingAlert.userContact}</span>
                    <span>💰 {existingAlert.targetPrice 
                      ? `Objetivo: ${formatPrice(existingAlert.targetPrice)}`
                      : "Cualquier bajada"
                    }</span>
                    <span>📊 Registrado: {formatPrice(existingAlert.currentPrice)}</span>
                  </div>
                </div>
                 <p className="text-xs text-green-600 mt-2">
                  Puedes ver y gestionar todas tus alertas en la pestaña "Mis Alertas".
                </p>
              </div>
            )}

            {selectedProduct && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm space-y-6 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-3">
                    📱 Método de notificación
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      contactType === "whatsapp" 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        value="whatsapp"
                        checked={contactType === "whatsapp"}
                        onChange={(e) => setContactType(e.target.value as "whatsapp")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">💬</div>
                        <div>
                          <div className="font-medium text-gray-900">WhatsApp</div>
                          <div className="text-xs text-gray-500">Notificación instantánea</div>
                        </div>
                      </div>
                    </label>
                    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      contactType === "telegram" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        value="telegram"
                        checked={contactType === "telegram"}
                        onChange={(e) => setContactType(e.target.value as "telegram")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">✈️</div>
                        <div>
                          <div className="font-medium text-gray-900">Telegram</div>
                          <div className="text-xs text-gray-500">Notificación rápida</div>
                        </div>
                      </div>
                    </label>
                    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      contactType === "email" 
                        ? "border-purple-500 bg-purple-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        value="email"
                        checked={contactType === "email"}
                        onChange={(e) => setContactType(e.target.value as "email")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">✉️</div>
                        <div>
                          <div className="font-medium text-gray-900">Email</div>
                          <div className="text-xs text-gray-500">Notificación por correo</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    {contactType === "whatsapp" ? "📞 Número de WhatsApp" : contactType === "telegram" ? "👤 Usuario de Telegram" : "📧 Correo Electrónico"}
                  </label>
                  <input
                    type={contactType === "email" ? "email" : "text"}
                    value={userContact}
                    onChange={(e) => setUserContact(e.target.value)}
                    placeholder={contactType === "whatsapp" ? "+34 600 000 000" : contactType === "telegram" ? "@usuario" : "tu@correo.com"}
                    className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    🎯 Precio objetivo (opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder={`Ej: ${(getCurrentPrice() * 0.9).toFixed(2)} (Actual: ${formatPrice(getCurrentPrice())})`}
                      className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Si no especificas un precio, te avisaremos con cualquier bajada
                  </p>
                </div>

                {/* Sección de Alertas Inteligentes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-blue-900">
                      🤖 Tipo de Alerta Inteligente
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {showAdvancedOptions ? 'Ocultar' : 'Mostrar'} opciones avanzadas
                      <svg className={`w-3 h-3 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      alertType === "any_drop" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        value="any_drop"
                        checked={alertType === "any_drop"}
                        onChange={(e) => setAlertType(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2">
                        <div className="text-lg">📉</div>
                        <div>
                          <div className="font-medium text-sm">Cualquier bajada</div>
                          <div className="text-xs text-gray-500">Te aviso con cualquier descuento</div>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      alertType === "percentage" 
                        ? "border-orange-500 bg-orange-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        value="percentage"
                        checked={alertType === "percentage"}
                        onChange={(e) => setAlertType(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2">
                        <div className="text-lg">📊</div>
                        <div>
                          <div className="font-medium text-sm">Por porcentaje</div>
                          <div className="text-xs text-gray-500">Descuento específico (%)</div>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {alertType === "percentage" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-orange-900 mb-2">
                          🎯 Porcentaje de descuento mínimo
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={percentageThreshold}
                            onChange={(e) => setPercentageThreshold(e.target.value)}
                            placeholder="20"
                            min="1"
                            max="90"
                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          />
                          <span className="absolute right-3 top-2 text-orange-600">%</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                          Te avisaremos cuando el precio baje al menos este porcentaje
                        </p>
                      </div>
                      
                      <div className="border-t border-orange-200 pt-3">
                        <label className="block text-sm font-medium text-orange-900 mb-2">
                          🎚️ Múltiples umbrales (opcional)
                        </label>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setMultipleThresholds([...multipleThresholds, {percentage: 15, triggered: false}])}
                            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                          >
                            + Agregar umbral
                          </button>
                          {multipleThresholds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setMultipleThresholds([])}
                              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                            >
                              Limpiar todos
                            </button>
                          )}
                        </div>
                        {multipleThresholds.map((threshold, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <input
                              type="number"
                              value={threshold.percentage}
                              onChange={(e) => {
                                const updated = [...multipleThresholds];
                                updated[index].percentage = parseInt(e.target.value) || 0;
                                setMultipleThresholds(updated);
                              }}
                              min="1"
                              max="90"
                              className="w-20 px-2 py-1 border border-orange-300 rounded text-sm"
                            />
                            <span className="text-orange-600">%</span>
                            <button
                              type="button"
                              onClick={() => setMultipleThresholds(multipleThresholds.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <p className="text-xs text-orange-600">
                          Recibirás una notificación separada para cada umbral alcanzado
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {showAdvancedOptions && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📅 Alertas estacionales
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={seasonalContext.isBlackFridayAlert}
                              onChange={(e) => setSeasonalContext({...seasonalContext, isBlackFridayAlert: e.target.checked})}
                              className="mr-2"
                            />
                            <span className="text-sm">🛍️ Black Friday (Nov 24-30)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={seasonalContext.isChristmasAlert}
                              onChange={(e) => setSeasonalContext({...seasonalContext, isChristmasAlert: e.target.checked})}
                              className="mr-2"
                            />
                            <span className="text-sm">🎄 Navidad (Dic 20-31)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={seasonalContext.isSummerSaleAlert}
                              onChange={(e) => setSeasonalContext({...seasonalContext, isSummerSaleAlert: e.target.checked})}
                              className="mr-2"
                            />
                            <span className="text-sm">☀️ Rebajas de verano (Jun-Ago)</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🔔 Configuración de notificaciones
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-600">Máximo notificaciones por día</label>
                            <select
                              value={maxDailyNotifications}
                              onChange={(e) => setMaxDailyNotifications(parseInt(e.target.value))}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value={1}>1 por día</option>
                              <option value={3}>3 por día</option>
                              <option value={5}>5 por día</option>
                              <option value={10}>Sin límite</option>
                            </select>
                          </div>
                          <div>
                            <label className="flex items-center mt-4">
                              <input
                                type="checkbox"
                                checked={groupSimilarAlerts}
                                onChange={(e) => setGroupSimilarAlerts(e.target.checked)}
                                className="mr-2"
                              />
                              <span className="text-xs text-gray-600">Agrupar alertas similares</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedProduct || !!existingAlert}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Activando alerta...
                    </>
                  ) : existingAlert ? (
                     <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Alerta ya configurada
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      🚀 Activar Alerta de Precio
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
