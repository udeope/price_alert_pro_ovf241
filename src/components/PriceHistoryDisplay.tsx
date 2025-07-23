import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PriceHistoryDisplayProps {
  productId: Id<"products">;
  variantId?: Id<"productVariants">;
}

export function PriceHistoryDisplay({ productId, variantId }: PriceHistoryDisplayProps) {
  const priceHistory = useQuery(
    api.priceHistory.getForProduct,
    productId ? { productId, variantId } : "skip"
  );

  const formatPriceForAxis = (price: number) => `€${price}`;
  
  const formatDateForAxis = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
      return (
        <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm font-semibold text-gray-800">{`Precio: €${payload[0].value.toFixed(2)}`}</p>
          <p className="text-xs text-gray-500">{`Fecha: ${date}`}</p>
        </div>
      );
    }
    return null;
  };

  if (priceHistory === undefined) {
    return (
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <h4 className="text-md font-semibold text-gray-700 mb-2">Historial de Precios</h4>
        <div className="animate-pulse h-48 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  if (!priceHistory || priceHistory.length < 2) {
    return (
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <h4 className="text-md font-semibold text-gray-700 mb-2">Historial de Precios</h4>
        <p className="text-sm text-gray-500 text-center py-10">No hay suficientes datos para mostrar un gráfico.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h4 className="text-md font-semibold text-gray-800 mb-4">Evolución del Precio</h4>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <LineChart
            data={priceHistory}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatDateForAxis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={formatPriceForAxis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563eb' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
