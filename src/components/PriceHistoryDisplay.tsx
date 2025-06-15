import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface PriceHistoryDisplayProps {
  productId: Id<"products">;
  variantId?: Id<"productVariants">;
}

export function PriceHistoryDisplay({ productId, variantId }: PriceHistoryDisplayProps) {
  const priceHistory = useQuery(
    api.products.getPriceHistory,
    productId ? { productId, variantId } : "skip"
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (priceHistory === undefined) {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <h4 className="text-md font-semibold text-gray-700 mb-2">Historial de Precios</h4>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <h4 className="text-md font-semibold text-gray-700 mb-2">Historial de Precios</h4>
        <p className="text-sm text-gray-500">No hay historial de precios disponible para esta selección.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h4 className="text-md font-semibold text-gray-800 mb-3">Historial de Precios</h4>
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {priceHistory.map((entry) => (
          <li key={entry._id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <span className="text-gray-600">{formatDate(entry.timestamp)}</span>
            <span className="font-medium text-gray-800">{formatPrice(entry.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
