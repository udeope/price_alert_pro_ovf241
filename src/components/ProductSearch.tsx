import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ProductSearchProps {
  searchTerm: string; 
  onSearchTermChange: (term: string) => void;
  onProductSelect: (product: any) => void;
  onAddNewProduct: () => void;
}

export function ProductSearch({ 
  searchTerm, 
  onSearchTermChange, 
  onProductSelect, 
  onAddNewProduct 
}: ProductSearchProps) {
  const [showResults, setShowResults] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allProducts = useQuery(api.products.getAllProducts);
  
  const searchResults = useQuery(
    api.products.searchProducts,
    searchTerm.length >= 1 ? { searchTerm } : "skip"
  );

  useEffect(() => {
    // This effect runs on mount and re-mount (due to key change in parent)
    if (searchTerm === "" && inputRef.current) {
      // If the component mounts/re-mounts with an empty search term (e.g., after parent's "Clear" button),
      // explicitly blur the input. This prevents any potential browser auto-focus
      // from immediately triggering handleInputFocus and showing the dropdown.
      // The internal states `isInputFocused` and `showResults` are already false from re-mount.
      inputRef.current.blur();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Empty dependency array ensures this runs only on mount/re-mount from key change

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && inputRef.current !== event.target) {
        setShowResults(false);
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProductSelectInternal = (product: any) => {
    onProductSelect(product); 
    setShowResults(false);    
    setIsInputFocused(false); 
    inputRef.current?.blur(); 
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    // Show results when input is focused. If searchTerm is empty, allProducts will be shown.
    setShowResults(true); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchTermChange(value); 
    if (value) {
      setShowResults(true);
    } else {
      // If user types to clear the input, and it's focused, show all products.
      // This relies on isInputFocused being true from handleInputFocus.
      setShowResults(true); 
    }
  };

  const handleClearSearchInputIcon = () => {
    onSearchTermChange(""); 
    if (inputRef.current) {
      inputRef.current.focus(); // This will call handleInputFocus, which sets showResults(true)
    }
    // Ensure showResults is true if not already set by focus handler, for consistency
    setShowResults(true); 
    setIsInputFocused(true);
  };

  const productsToShow = searchTerm.length >= 1 ? searchResults : allProducts;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
              {searchTerm ? ( 
                <button type="button" onClick={handleClearSearchInputIcon} className="p-1 hover:bg-gray-100 rounded-full">
                  <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : (
                <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 pointer-events-none ${showResults && isInputFocused ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm} 
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Buscar o seleccionar producto existente..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm cursor-pointer"
            />
          </div>
          
          {showResults && isInputFocused && ( 
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
              {!productsToShow ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-sm">Cargando productos...</p>
                </div>
              ) : productsToShow.length > 0 ? (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-2">
                    {searchTerm ? `Resultados para "${searchTerm}"` : 'Todos los productos'}
                  </div>
                  {productsToShow.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleProductSelectInternal(product)}
                      className="p-3 hover:bg-blue-50 cursor-pointer rounded-lg border border-transparent hover:border-blue-200 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate group-hover:text-blue-900">{product.name}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            {product.brand && <span className="bg-gray-100 px-2 py-0.5 rounded-full">🏷️ {product.brand}</span>}
                            {product.category && <span className="bg-gray-100 px-2 py-0.5 rounded-full">📂 {product.category}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-blue-600 group-hover:text-blue-700">
                            {formatPrice(product.basePrice)}
                          </div>
                          <div className="text-xs text-gray-400">Precio actual</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? "No se encontraron productos" : "No hay productos disponibles"}
                  </p>
                  {searchTerm && (
                    <p className="text-gray-400 text-xs mt-1">Prueba con otros términos de búsqueda</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onAddNewProduct();
                      setShowResults(false);
                    }}
                    className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Agregar nuevo producto
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => {
            onAddNewProduct();
            setShowResults(false); 
          }}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nuevo Producto
        </button>
      </div>
    </div>
  );
}
