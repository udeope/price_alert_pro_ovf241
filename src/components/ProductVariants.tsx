import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ProductVariantsProps {
  productId: Id<"products">;
  onVariantSelect: (variant: any) => void;
  selectedVariantId?: Id<"productVariants">;
}

export function ProductVariants({ productId, onVariantSelect, selectedVariantId }: ProductVariantsProps) {
  const variants = useQuery(api.products.getProductVariants, { productId });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariant, setNewVariant] = useState({
    name: "",
    price: "",
    size: "",
    flavor: "",
    color: "",
    sku: "",
  });

  const createVariant = useMutation(api.products.createVariant);

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVariant.name.trim() || !newVariant.price) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    try {
      await createVariant({
        productId,
        name: newVariant.name.trim(),
        price: parseFloat(newVariant.price),
        attributes: {
          size: newVariant.size.trim() || undefined,
          flavor: newVariant.flavor.trim() || undefined,
          color: newVariant.color.trim() || undefined,
        },
        sku: newVariant.sku.trim() || undefined,
      });

      toast.success("Variante agregada correctamente");
      setShowAddForm(false);
      setNewVariant({
        name: "",
        price: "",
        size: "",
        flavor: "",
        color: "",
        sku: "",
      });
    } catch (error) {
      toast.error("Error al agregar la variante");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (!variants) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Variantes del producto</h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showAddForm ? "Cancelar" : "+ Agregar variante"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <form onSubmit={handleAddVariant} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre de la variante *
                </label>
                <input
                  type="text"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: 2kg - Chocolate"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Precio *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="29.90"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tamaño
                </label>
                <input
                  type="text"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="2kg"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sabor
                </label>
                <input
                  type="text"
                  value={newVariant.flavor}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, flavor: e.target.value }))}
                  placeholder="Chocolate"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={newVariant.color}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="Azul"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
          </form>
        </div>
      )}

      {variants.length > 0 && (
        <div className="space-y-2">
          <div
            onClick={() => onVariantSelect(null)}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              !selectedVariantId
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Producto base</span>
              <span className="text-sm text-gray-600">Sin variantes específicas</span>
            </div>
          </div>

          {variants.map((variant) => (
            <div
              key={variant._id}
              onClick={() => onVariantSelect(variant)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedVariantId === variant._id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{variant.name}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {variant.attributes.size && <span>Tamaño: {variant.attributes.size} </span>}
                    {variant.attributes.flavor && <span>Sabor: {variant.attributes.flavor} </span>}
                    {variant.attributes.color && <span>Color: {variant.attributes.color}</span>}
                  </div>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {formatPrice(variant.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
