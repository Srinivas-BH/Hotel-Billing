'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Plus, Minus, Trash2, Save, X, CheckCircle, Receipt, Printer } from 'lucide-react';

// Lazy load InvoicePreview component - fixed syntax for named export
const InvoicePreview = lazy(() => 
  import('@/components/InvoicePreview').then(module => ({ default: module.InvoicePreview }))
);

interface MenuItem {
  id: string;
  dishName: string;
  price: number;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
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

function OrderTakingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const [tableNumber, setTableNumber] = useState<number>(
    parseInt(searchParams.get('table') || '1')
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tableCount, setTableCount] = useState(user?.tableCount || 20);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
  const [orderVersion, setOrderVersion] = useState<number>(1);
  const [isBillingMode, setIsBillingMode] = useState(searchParams.get('billing') === 'true');
  
  // Billing states
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [gstPercentage, setGstPercentage] = useState<number>(0);
  const [serviceChargePercentage, setServiceChargePercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Check if billing mode is enabled from URL
    const billingParam = searchParams.get('billing');
    setIsBillingMode(billingParam === 'true');
    
    if (user?.tableCount) {
      setTableCount(user.tableCount);
    }
    // Clear menu items first to prevent stale data
    setMenuItems([]);
    fetchMenuItems();
    if (tableNumber && token) {
      // Load existing order for the table
      loadExistingOrder(tableNumber);
    }
  }, [tableNumber, user?.tableCount, token, searchParams]);
  
  // Separate effect to reload order when navigating back to this page or tab gets focus
  useEffect(() => {
    const handleFocus = () => {
      if (tableNumber && token) {
        // Reload order when user returns to this tab
        loadExistingOrder(tableNumber);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [tableNumber, token]);

  // Effect to auto-open billing modal when in billing mode and order is loaded
  useEffect(() => {
    const billingParam = searchParams.get('billing');
    if (billingParam === 'true' && existingOrderId && cart.length > 0 && !showBillingModal) {
      // Auto-open billing modal when order is loaded in billing mode
      setTimeout(() => {
        setShowBillingModal(true);
      }, 300);
    }
  }, [existingOrderId, cart.length, searchParams, showBillingModal]);

  const loadExistingOrder = async (table: number) => {
    try {
      if (!token) {
        console.warn('No token available for loading order');
        setCart([]);
        setNotes('');
        setExistingOrderId(null);
        setOrderVersion(1);
        return;
      }

      const response = await fetch(`/api/orders?table=${table}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-cache' // Ensure we get fresh data
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if order exists
        if (data.order && data.order.order_id) {
          // Parse items if they're stored as JSON string
          let orderItems = data.order.items;
          
          // Handle JSONB field from PostgreSQL (might be object or string)
          if (typeof orderItems === 'string') {
            try {
              orderItems = JSON.parse(orderItems);
            } catch (e) {
              console.error('Failed to parse order items:', e);
              orderItems = [];
            }
          }
          
          // Ensure items is an array
          if (!Array.isArray(orderItems)) {
            console.warn('Order items is not an array:', orderItems);
            orderItems = [];
          }
          
          // Ensure items have the correct structure
          const validItems = orderItems.map((item: any) => ({
            menu_item_id: item.menu_item_id || item.menuItemId || item.id || '',
            name: item.name || item.dishName || '',
            unit_price: typeof item.unit_price === 'number' 
              ? item.unit_price 
              : (typeof item.price === 'number' 
                  ? item.price 
                  : parseFloat(String(item.price || item.unit_price || '0'))),
            quantity: typeof item.quantity === 'number' 
              ? item.quantity 
              : parseInt(String(item.quantity || '1'), 10)
          })).filter((item: any) => item.menu_item_id && item.name && item.quantity > 0);
          
          if (validItems.length > 0) {
            setCart(validItems);
            setNotes(data.order.notes || '');
            setExistingOrderId(data.order.order_id);
            setOrderVersion(data.order.version || 1);
            setHasUnsavedChanges(false); // Reset unsaved changes when loading
            console.log('Loaded existing order for table', table, 'with', validItems.length, 'items');
          } else {
            // Order exists but has no valid items - still set the order ID but clear cart
            console.warn('Order exists but has no valid items');
            setCart([]);
            setNotes(data.order.notes || '');
            setExistingOrderId(data.order.order_id);
            setOrderVersion(data.order.version || 1);
            setHasUnsavedChanges(false);
          }
        } else {
          // No existing order, clear cart
          console.log('No existing order found for table', table);
          setCart([]);
          setNotes('');
          setExistingOrderId(null);
          setOrderVersion(1);
          setHasUnsavedChanges(false);
        }
      } else {
        // If API fails, clear cart
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch order:', response.status, errorData);
        setCart([]);
        setNotes('');
        setExistingOrderId(null);
        setOrderVersion(1);
      }
    } catch (err) {
      console.error('Failed to load order:', err);
      // On error, clear cart
      setCart([]);
      setNotes('');
      setExistingOrderId(null);
      setOrderVersion(1);
    }
  };

  const fetchMenuItems = async () => {
    // If no token, clear menu items immediately
    if (!token) {
      setMenuItems([]);
      return;
    }
    
    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`/api/menu${cacheBuster}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.menuItems || data.items || [];
        
        // Strict validation: ensure items array exists and is actually an array
        if (!Array.isArray(items)) {
          console.warn('Menu API returned non-array data:', items);
          setMenuItems([]);
          return;
        }
        
        // If items array is empty, set empty array immediately
        if (items.length === 0) {
          setMenuItems([]);
          return;
        }
        
        // Filter and normalize menu items - ensure they have required properties
        const validItems = items
          .filter((item: any) => {
            // Strict validation: item must exist, have id, have name, and have valid price
            if (!item || typeof item !== 'object') return false;
            if (!item.id || typeof item.id !== 'string') return false;
            if (!item.dishName && !item.dish_name) return false;
            if (item.price === undefined || item.price === null) return false;
            return true;
          })
          .map((item: any) => ({
            id: String(item.id),
            dishName: String(item.dishName || item.dish_name || ''),
            price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price || '0'))
          }))
          .filter((item: any) => {
            // Final validation: ensure price is a valid positive number
            return item.id && item.dishName && !isNaN(item.price) && item.price > 0;
          });
        
        // Only set items if we have valid items, otherwise set empty array
        setMenuItems(validItems.length > 0 ? validItems : []);
      } else {
        // If API fails, set empty array
        console.warn('Menu API returned error status:', response.status);
        setMenuItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      // Set empty array on error
      setMenuItems([]);
    }
  };

  const filteredMenu = menuItems.filter(item =>
    item?.dishName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  const addToCart = (menuItem: MenuItem) => {
    const existing = cart.find(item => item.menu_item_id === menuItem.id);
    
    if (existing) {
      setCart(cart.map(item =>
        item.menu_item_id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        menu_item_id: menuItem.id,
        name: menuItem.dishName,
        unit_price: menuItem.price,
        quantity: 1
      }]);
    }
    
    // Mark as having unsaved changes if order exists
    if (existingOrderId) {
      setHasUnsavedChanges(true);
    }
  };

  const updateQuantity = (menu_item_id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.menu_item_id === menu_item_id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
    
    // Mark as having unsaved changes if order exists
    if (existingOrderId) {
      setHasUnsavedChanges(true);
    }
  };

  const removeFromCart = (menu_item_id: string) => {
    setCart(cart.filter(item => item.menu_item_id !== menu_item_id));
    
    // Mark as having unsaved changes if order exists
    if (existingOrderId) {
      setHasUnsavedChanges(true);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  };

  const calculateBillTotals = () => {
    const subtotal = calculateTotal();
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

  const saveOrder = async () => {
    if (cart.length === 0) {
      setError('Please add items to the order');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response: Response;
      let currentOrderId = existingOrderId;
      let currentVersion = orderVersion;
      
      if (currentOrderId) {
        // Before updating, verify the order still exists and get latest version
        try {
          const verifyResponse = await fetch(`/api/orders?table=${tableNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-cache'
          });
          
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.order && verifyData.order.order_id === currentOrderId) {
              // Order exists, update version if it changed
              if (verifyData.order.version !== currentVersion) {
                console.log('Order version changed from', currentVersion, 'to', verifyData.order.version);
                currentVersion = verifyData.order.version;
                setOrderVersion(currentVersion);
              }
            } else if (verifyData.order && verifyData.order.order_id !== currentOrderId) {
              // Different order exists for this table, update our state
              console.warn('Different order found for table, updating state');
              currentOrderId = verifyData.order.order_id;
              currentVersion = verifyData.order.version || 1;
              setExistingOrderId(currentOrderId);
              setOrderVersion(currentVersion);
            } else {
              // Order no longer exists, will create new
              console.warn('Order no longer exists, will create new order');
              currentOrderId = null;
              currentVersion = 1;
              setExistingOrderId(null);
              setOrderVersion(1);
            }
          } else {
            // Verification failed, but continue with update attempt
            console.warn('Failed to verify order, proceeding with update');
          }
        } catch (verifyErr) {
          console.warn('Failed to verify order before update:', verifyErr);
          // Continue with update attempt anyway
        }
        
        // Update existing order if it still exists
        if (currentOrderId) {
          response = await fetch(`/api/orders/${currentOrderId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              items: cart,
              notes,
              version: currentVersion
            })
          });
        } else {
          // Order doesn't exist, create new one
          response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              table_number: tableNumber,
              items: cart,
              notes
            })
          });
        }
      } else {
        // Create new order
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            table_number: tableNumber,
            items: cart,
            notes
          })
        });
      }

      const data = await response.json();

      if (response.ok) {
        const orderId = data.order_id || existingOrderId;
        setSuccess(`Order ${existingOrderId ? 'updated' : 'saved'} successfully for Table ${tableNumber}!`);
        setExistingOrderId(orderId);
        setOrderVersion(data.version || orderVersion);
        setHasUnsavedChanges(false); // Clear unsaved changes flag
        
        // Update URL to reflect table number
        router.replace(`/orders?table=${tableNumber}`, { scroll: false });
        
        // Trigger a dashboard refresh by dispatching a custom event
        // This will help update table status on the dashboard
        if (typeof window !== 'undefined') {
          // Dispatch event immediately
          window.dispatchEvent(new CustomEvent('orderUpdated', { 
            detail: { tableNumber, orderId }
          }));
          
          // Also store a flag in sessionStorage that dashboard can check
          sessionStorage.setItem('orderUpdated', JSON.stringify({
            tableNumber,
            orderId,
            timestamp: Date.now()
          }));
        }
        
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        // Handle 409 Conflict (version mismatch)
        if (response.status === 409) {
          const errorMsg = data.error || 'Order has been modified. Reloading latest version...';
          setError(errorMsg);
          
          // Reload the order to get the latest version
          try {
            await loadExistingOrder(tableNumber);
            setError('Order was modified. Please review the changes and save again.');
            setTimeout(() => {
              setError('');
            }, 5000);
          } catch (reloadErr) {
            console.error('Failed to reload order after conflict:', reloadErr);
            setError('Order was modified by another user. Please refresh the page and try again.');
          }
        } else {
          const errorMsg = data.error || 'Failed to save order';
          const details = data.details ? `\n\nDetails: ${data.details}` : '';
          let fullError = errorMsg + details;
          
          // Add migration instruction if tables are missing
          if (errorMsg.includes('does not exist') || errorMsg.includes('migrations') || errorMsg.includes('Database tables not found')) {
            fullError += '\n\nTo fix: Run "npm run migrate" in your terminal to create the required database tables.';
          }
          
          setError(fullError);
        }
      }
    } catch (err: any) {
      setError('Failed to save order: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!existingOrderId || cart.length === 0) {
      setError('Please save the order first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const totals = calculateBillTotals();

      // Generate invoice via billing API
      const response = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableNumber: tableNumber,
          items: cart.map(item => ({
            menuItemId: item.menu_item_id,
            quantity: item.quantity,
          })),
          gstPercentage,
          serviceChargePercentage,
          discountAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedInvoice(data.invoice);
        setPdfUrl(data.pdfUrl);
        setShowBillingModal(false);
        setShowInvoiceModal(true);
        
        // Mark order as billed
        try {
          const markBilledResponse = await fetch(`/api/orders/${existingOrderId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              status: 'BILLED',
              invoice_id: data.invoice.id,
              version: orderVersion
            })
          });
          
          if (markBilledResponse.ok) {
            // Order successfully marked as BILLED
            console.log('Order marked as BILLED, table is now FREE');
            
            // Trigger dashboard refresh to update table status
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('orderUpdated', { 
                detail: { tableNumber, orderId: existingOrderId, status: 'BILLED' }
              }));
              
              // Store in sessionStorage for dashboard to check
              sessionStorage.setItem('orderUpdated', JSON.stringify({
                tableNumber,
                orderId: existingOrderId,
                status: 'BILLED',
                timestamp: Date.now()
              }));
            }
          } else {
            console.error('Failed to mark order as billed:', await markBilledResponse.json());
          }
        } catch (err) {
          console.error('Failed to mark order as billed:', err);
        }

        // Clear order after billing (order is now BILLED, not deleted)
        setCart([]);
        setNotes('');
        setExistingOrderId(null);
        setOrderVersion(1);
        setGstPercentage(0);
        setServiceChargePercentage(0);
        setDiscountAmount(0);
        setSuccess('Bill generated successfully! Table is now FREE.');
        
        // Remove billing parameter from URL after billing is complete
        if (searchParams.get('billing') === 'true') {
          router.replace(`/orders?table=${tableNumber}`, { scroll: false });
        }
        
        // Reload to ensure clean state (should return no order since it's BILLED)
        setTimeout(() => {
          setSuccess('');
          loadExistingOrder(tableNumber); // This should return null since order is BILLED
        }, 3000);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to generate invoice';
        setError(errorMessage);
      }
    } catch (err: any) {
      setError('Failed to generate bill. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearOrder = () => {
    setCart([]);
    setNotes('');
    setError('');
    setSuccess('');
    setExistingOrderId(null);
    setOrderVersion(1);
    setHasUnsavedChanges(false);
  };

  const handleTableChange = async (newTable: number) => {
    // Clear current state first
    setCart([]);
    setNotes('');
    setError('');
    setSuccess('');
    setExistingOrderId(null);
    setOrderVersion(1);
    setShowBillingModal(false);
    setIsBillingMode(false);
    setTableNumber(newTable);
    router.replace(`/orders?table=${newTable}`, { scroll: false });
    
    // Small delay to ensure state is updated before loading order
    setTimeout(() => {
      loadExistingOrder(newTable);
    }, 100);
  };

  const billTotals = calculateBillTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8" />
              Order Taking
            </h1>
            <p className="text-gray-600 mt-1">Take orders by selecting table and menu items</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="whitespace-pre-line">{error}</div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        {hasUnsavedChanges && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <span className="font-semibold">⚠️ Unsaved Changes:</span>
            <span>You have modified the order. Click "Update Order" to save your changes.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Table Selection & Menu */}
          <div className="lg:col-span-2 space-y-6">
            {/* Table Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Select Table</h2>
              <div className="flex items-center gap-4">
                <label className="text-gray-700 font-medium">Table Number:</label>
                <select
                  value={tableNumber}
                  onChange={(e) => handleTableChange(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                >
                  {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Table {num}</option>
                  ))}
                </select>
                {existingOrderId && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Order Active</span>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Menu Items (From Your Menu Page)</h2>
              
              {menuItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-2">No menu items found.</p>
                  <p className="text-sm text-gray-400">Please add menu items in the Menu page first.</p>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {/* Menu Items Grid */}
                  {filteredMenu.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {filteredMenu.map(item => (
                        <div
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-800">{item.dishName}</h3>
                              <p className="text-lg font-semibold text-blue-600 mt-1">
                                ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <Plus className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No menu items match your search.</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Cart
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.menu_item_id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800 flex-1">{item.name}</h3>
                      <button
                        onClick={() => removeFromCart(item.menu_item_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.menu_item_id, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menu_item_id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-semibold text-gray-800">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length === 0 && (
                <p className="text-center text-gray-500 py-8">Cart is empty</p>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Subtotal:</span>
                  <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{cart.length} items</p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={saveOrder}
                  disabled={loading || cart.length === 0}
                  className={`w-full py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium ${
                    hasUnsavedChanges 
                      ? 'bg-orange-600 text-white hover:bg-orange-700 animate-pulse' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : existingOrderId ? (hasUnsavedChanges ? 'Save Changes' : 'Update Order') : 'Save Order'}
                </button>
                
                {existingOrderId && cart.length > 0 && (
                  <button
                    onClick={() => setShowBillingModal(true)}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    <Receipt className="w-5 h-5" />
                    Generate Bill
                  </button>
                )}
                
                <button
                  onClick={clearOrder}
                  disabled={loading}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <X className="w-5 h-5" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Modal */}
      {showBillingModal && existingOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Receipt className="w-6 h-6" />
                  Generate Bill - Table {tableNumber}
                </h2>
                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    // Remove billing parameter from URL when closing modal
                    if (searchParams.get('billing') === 'true') {
                      router.replace(`/orders?table=${tableNumber}`, { scroll: false });
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Order Items Summary */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} (×{item.quantity})</span>
                      <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Calculator */}
              <div className="space-y-4 mb-6">
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg mb-4">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${billTotals.subtotal.toFixed(2)}</span>
                  </div>
                </div>

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
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
                  />
                  {gstPercentage > 0 && (
                    <div className="text-right text-sm text-gray-600 mt-1">
                      Amount: ${billTotals.gstAmount.toFixed(2)}
                    </div>
                  )}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
                  />
                  {serviceChargePercentage > 0 && (
                    <div className="text-right text-sm text-gray-600 mt-1">
                      Amount: ${billTotals.serviceChargeAmount.toFixed(2)}
                    </div>
                  )}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
                  />
                </div>

                {/* Grand Total */}
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Grand Total:</span>
                    <span className="text-green-600">
                      ${billTotals.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Generate Bill Button */}
              <button
                onClick={handleGenerateBill}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px] text-base flex items-center justify-center gap-2 transition-all duration-100 shadow-md hover:shadow-lg"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <Printer className="w-5 h-5" />
                {loading ? 'Generating...' : 'Generate & Print Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            onClose={() => {
              setShowInvoiceModal(false);
              setGeneratedInvoice(null);
              setPdfUrl(null);
              // Remove billing parameter from URL when closing invoice
              if (searchParams.get('billing') === 'true') {
                router.replace(`/orders?table=${tableNumber}`, { scroll: false });
              }
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function OrderTakingPage() {
  return (
    <AuthGuard>
      <OrderTakingContent />
    </AuthGuard>
  );
}
