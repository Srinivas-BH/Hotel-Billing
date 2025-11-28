'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { MenuItem } from '@/types';
import { MenuAutocomplete } from '@/components/MenuAutocomplete';

// Lazy load InvoicePreview component
const InvoicePreview = lazy(() => import('@/components/InvoicePreview').then(module => ({ default: module.InvoicePreview })));

interface OrderItem {
  menuItemId: string;
  dishName: string;
  price: number;
  quantity: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  tableNumber: number;
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  discountAmount: number;
  grandTotal: number;
  items: {
    dishName: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  createdAt: string;
}

function BillingContent() {
  const { user, token } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [gstPercentage, setGstPercentage] = useState<number>(0);
  const [serviceChargePercentage, setServiceChargePercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.items);
      } else {
        setError('Failed to load menu items');
      }
    } catch (err) {
      setError('Failed to load menu items');
      console.error(err);
    }
  };

  // Handle menu item selection from autocomplete
  const handleMenuItemSelect = (item: MenuItem) => {
    const existingItem = orderItems.find(oi => oi.menuItemId === item.id);
    
    if (existingItem) {
      // Increment quantity if item already exists
      setOrderItems(orderItems.map(oi =>
        oi.menuItemId === item.id
          ? { ...oi, quantity: oi.quantity + 1 }
          : oi
      ));
    } else {
      // Add new item with quantity 1
      setOrderItems([...orderItems, {
        menuItemId: item.id,
        dishName: item.dishName,
        price: item.price,
        quantity: 1,
      }]);
    }
  };

  // Update item quantity
  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
    } else {
      setOrderItems(orderItems.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  // Remove item from order
  const removeItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter(item => item.menuItemId !== menuItemId));
  };

  // Calculate bill totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountedSubtotal = subtotal - discountAmount;
    const gstAmount = discountedSubtotal * (gstPercentage / 100);
    const serviceChargeAmount = discountedSubtotal * (serviceChargePercentage / 100);
    const grandTotal = subtotal + gstAmount + serviceChargeAmount - discountAmount;

    return {
      subtotal,
      gstAmount,
      serviceChargeAmount,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  // Generate invoice
  const handleGenerateInvoice = async () => {
    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableNumber: selectedTable,
          items: orderItems.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
          gstPercentage,
          serviceChargePercentage,
          discountAmount,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setGeneratedInvoice(data.invoice);
        setPdfUrl(data.pdfUrl);
        setShowInvoiceModal(true);
        
        // Clear the order after successful generation
        setOrderItems([]);
        setGstPercentage(0);
        setServiceChargePercentage(0);
        setDiscountAmount(0);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to generate invoice';
        setError(errorMessage);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. The invoice may have been created. Please check reports.');
      } else {
        setError('Failed to generate invoice. Please try again.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isDatabaseConfigured = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Billing</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column: Order Entry */}
          <div className="space-y-6">
            {/* Table Selector */}
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Select Table</h2>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] transition-all duration-100 cursor-pointer hover:border-blue-400"
              >
                {Array.from({ length: user?.tableCount || 10 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Table {num}</option>
                ))}
              </select>
            </div>

            {/* Order Entry */}
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Add Items</h2>
              <MenuAutocomplete
                items={menuItems}
                onSelect={handleMenuItemSelect}
                placeholder="Search and add menu items..."
              />

              {/* Order Items List */}
              <div className="mt-4 sm:mt-6 space-y-3">
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No items added yet</p>
                ) : (
                  orderItems.map(item => (
                    <div key={item.menuItemId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.dishName}</p>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="min-w-[44px] min-h-[44px] rounded-md bg-gray-200 hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition-all duration-100 flex items-center justify-center text-lg font-semibold"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.menuItemId, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-2 text-center border border-gray-300 rounded-md min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-100"
                          />
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="min-w-[44px] min-h-[44px] rounded-md bg-gray-200 hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition-all duration-100 flex items-center justify-center text-lg font-semibold"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <p className="w-20 text-right font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(item.menuItemId)}
                          className="text-red-600 hover:text-red-800 active:text-red-900 active:scale-90 transition-all duration-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Bill Calculator */}
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bill Calculator</h2>

              {/* Additional Charges */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] transition-all duration-100 hover:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Charge (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={serviceChargePercentage}
                    onChange={(e) => setServiceChargePercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] transition-all duration-100 hover:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] transition-all duration-100 hover:border-blue-400"
                  />
                </div>
              </div>

              {/* Bill Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm sm:text-base text-gray-700">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-gray-700">
                    <span>Discount:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {gstPercentage > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-gray-700">
                    <span>GST ({gstPercentage}%):</span>
                    <span>${totals.gstAmount.toFixed(2)}</span>
                  </div>
                )}
                {serviceChargePercentage > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-gray-700">
                    <span>Service Charge ({serviceChargePercentage}%):</span>
                    <span>${totals.serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                  <span>Grand Total:</span>
                  <span>${totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Generate Invoice Button */}
              <button
                onClick={handleGenerateInvoice}
                disabled={isLoading || orderItems.length === 0}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-98 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px] text-base flex items-center justify-center gap-2 transition-all duration-100 shadow-md hover:shadow-lg"
              >
                {isLoading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? 'Generating Invoice...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Invoice Preview Modal */}
      {showInvoiceModal && generatedInvoice && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invoice...</p>
            </div>
          </div>
        }>
          <InvoicePreview
            invoice={generatedInvoice}
            pdfUrl={pdfUrl}
            hotelName={user?.hotelName || ''}
            onClose={() => setShowInvoiceModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <AuthGuard>
      <BillingContent />
    </AuthGuard>
  );
}
