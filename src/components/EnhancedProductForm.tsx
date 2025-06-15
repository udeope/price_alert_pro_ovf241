import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface EnhancedProductFormProps {
  onProductAdded: (productId: Id<"products">) => void;
  onCancel: () => void;
}

// Define a type for the scraped data result from the new scraper
type ScrapedProductInfo = {
  success: boolean;
  title?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  brand?: string;
  error?: string;
  // No screenshot property
};


export function EnhancedProductForm({ onProductAdded, onCancel }: EnhancedProductFormProps) {
  const [url, setUrl] = useState("");
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProductInfo | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    basePrice: "",
    imageUrl: "",
    description: "",
    brand: "",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrapeProductInfo = useAction(api.webScraper.scrapeProductInfo);
  const createProduct = useMutation(api.products.createProduct);

  const handleUrlScrape = async () => {
    if (!url.trim()) {
      toast.error("Por favor ingresa una URL");
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error("Por favor ingresa una URL válida");
      return;
    }

    setIsScrapingUrl(true);
    setScrapedData(null);
    setScrapeError(null);
    try {
      const result: ScrapedProductInfo = await scrapeProductInfo({ url: url.trim() });
      setScrapedData(result); 
      
      if (result.success) {
        const newBasePriceString = typeof result.price === 'number' ? result.price.toFixed(2) : "";
        // console.log("[EnhancedProductForm] Setting formData.basePrice to:", newBasePriceString, "(from scraped price:", result.price, ")"); // Removed console.log
        setFormData({
          name: result.title || "",
          url: url.trim(),
          basePrice: newBasePriceString,
          imageUrl: result.imageUrl || "",
          description: result.description || "",
          brand: result.brand || "",
          category: "", 
        });
        if (result.title && result.price && result.price > 0) {
          toast.success("¡Información del producto extraída correctamente!");
        } else {
          toast.info("Extracción parcial. Revisa los datos y completa manualmente.");
        }
      } else {
        const errorMsg = result.error || "No se pudo extraer la información del producto. Completa los datos manualmente.";
        setScrapeError(errorMsg);
        toast.error(errorMsg);
        setFormData(prev => ({ ...prev, url: url.trim(), name: "", basePrice: "", imageUrl: "", description: "", brand: "" }));
      }
    } catch (error: any) {
      const errorMessage = error.message || "Error al procesar la extracción del producto";
      setScrapeError(errorMessage);
      toast.error(errorMessage);
      setFormData(prev => ({ ...prev, url: url.trim(), name: "", basePrice: "", imageUrl: "", description: "", brand: "" }));
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim() || !formData.basePrice) {
      toast.error("Por favor completa los campos obligatorios: Nombre, URL y Precio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const productId = await createProduct({
        name: formData.name.trim(),
        url: formData.url.trim(),
        basePrice: parseFloat(formData.basePrice),
        imageUrl: formData.imageUrl.trim() || undefined,
        description: formData.description.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        category: formData.category.trim() || undefined,
      });

      toast.success("Producto agregado correctamente");
      onProductAdded(productId);
    } catch (error: any) {
      toast.error(error.data?.message || error.message || "Error al agregar el producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Agregar Nuevo Producto</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* URL Scraping Section */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-lg font-medium text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Extracción Automática (HTML Básico)
        </h4>
        <p className="text-blue-700 text-sm mb-3">
          Pega la URL del producto. Intentaremos extraer información del HTML básico. No funcionará para sitios con mucho JavaScript.
        </p>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ejemplo.com/producto"
            className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleUrlScrape}
            disabled={isScrapingUrl}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors flex items-center gap-2"
          >
            {isScrapingUrl ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Extrayendo...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Extraer / Probar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview of scraped data or error */}
      {scrapedData && scrapedData.success && (scrapedData.title || scrapedData.price || scrapedData.imageUrl) && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-green-900 font-medium mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Información Extraída (HTML Básico)
          </h4>
          <div>
            <p className="font-medium text-green-800 break-all"><strong>Título:</strong> {scrapedData.title || "N/A"}</p>
            <p className="text-green-700"><strong>Precio:</strong> {scrapedData.price ? `€${scrapedData.price.toFixed(2)}` : "N/A"}</p> {/* Display formatted price here too */}
            {scrapedData.brand && <p className="text-green-600 text-sm"><strong>Marca:</strong> {scrapedData.brand}</p>}
            {scrapedData.description && <p className="text-green-600 text-sm mt-1"><strong>Descripción (parcial):</strong> {scrapedData.description.substring(0,150)}...</p>}
            {scrapedData.imageUrl && (
              <div className="mt-2">
                <p className="text-green-600 text-sm font-medium">Imagen del producto:</p>
                <img
                  src={scrapedData.imageUrl}
                  alt="Producto Scraped"
                  className="w-24 h-24 object-cover rounded-lg mt-1 border border-green-300"
                />
              </div>
            )}
          </div>
        </div>
      )}
      {scrapeError && (
         <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-red-900 font-medium mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Error en la Extracción (HTML Básico)
          </h4>
          <p className="text-red-700 text-sm break-all">{scrapeError}</p>
        </div>
      )}
      {scrapedData && !scrapedData.success && scrapedData.error && ( 
         <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-red-900 font-medium mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Error en la Extracción (HTML Básico)
          </h4>
          <p className="text-red-700 text-sm break-all">{scrapedData.error}</p>
        </div>
      )}


      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del producto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: iPhone 15 Pro Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio actual *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              <input
                type="number"
                step="0.01"
                name="basePrice"
                value={formData.basePrice} // This should be the string "XX.YY"
                onChange={handleChange}
                placeholder="999.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL del producto *
          </label>
          <input
            type="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://www.tienda.com/producto"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marca
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Apple, Samsung, Nike..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar categoría</option>
              <option value="Electrónicos">Electrónicos</option>
              <option value="Ropa y Moda">Ropa y Moda</option>
              <option value="Hogar y Jardín">Hogar y Jardín</option>
              <option value="Deportes">Deportes</option>
              <option value="Salud y Belleza">Salud y Belleza</option>
              <option value="Libros">Libros</option>
              <option value="Juguetes">Juguetes</option>
              <option value="Automóvil">Automóvil</option>
              <option value="Alimentación">Alimentación</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL de imagen
          </label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción del producto..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Agregando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Agregar Producto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
