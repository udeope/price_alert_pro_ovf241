import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductForm } from './ProductForm';

// Mock de Convex
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
  useQuery: () => vi.fn(),
}));

// Mock de sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ProductForm', () => {
  it('renders the basic form fields', () => {
    render(<ProductForm onProductAdded={() => {}} onCancel={() => {}} />);

    expect(screen.getByLabelText(/Nombre del producto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio actual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/URL del producto/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar Producto/i })).toBeInTheDocument();
  });

  it('renders the scraper section when enableScraper is true', () => {
    render(<ProductForm onProductAdded={() => {}} onCancel={() => {}} enableScraper={true} />);

    expect(screen.getByText(/Extracción Automática/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extraer \/ Probar/i })).toBeInTheDocument();
  });

  it('does not render the scraper section when enableScraper is false or not provided', () => {
    render(<ProductForm onProductAdded={() => {}} onCancel={() => {}} />);

    expect(screen.queryByText(/Extracción Automática/i)).not.toBeInTheDocument();
  });
});
