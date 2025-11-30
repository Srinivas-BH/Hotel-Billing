'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { Navigation } from '@/components/Navigation';
import Link from 'next/link';
import { FileText, BarChart3, User, ShoppingCart, Clock, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TableOrder {
  table_number: number;
  order_id: string;
  item_count: number;
  created_at: string;
}

function DashboardContent() {
  const { user } = useAuth();
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Check for pending order updates from sessionStorage
    const checkPendingUpdates = () => {
      try {
        const updateStr = sessionStorage.getItem('orderUpdated');
        if (updateStr) {
          const update = JSON.parse(updateStr);
          // If update is recent (within last 30 seconds), refresh
          if (Date.now() - update.timestamp < 30000) {
            fetchOrders();
          }
          // Clear the flag
          sessionStorage.removeItem('orderUpdated');
        }
      } catch (e) {
        console.error('Error checking pending updates:', e);
      }
    };
    
    checkPendingUpdates();
    
    const interval = setInterval(fetchOrders, 10000); // Refresh every 10 seconds
    
    // Listen for order updates from other pages
    const handleOrderUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      // If event has status BILLED, refresh immediately
      if (customEvent?.detail?.status === 'BILLED') {
        console.log('Order billed, refreshing dashboard immediately');
        fetchOrders();
      } else {
        // For other updates (create/update), refresh normally
        console.log('Order updated, refreshing dashboard');
        fetchOrders();
      }
    };
    
    window.addEventListener('orderUpdated', handleOrderUpdate);
    
    // Also listen for focus event to refresh when returning to this tab
    const handleFocus = () => {
      fetchOrders();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('orderUpdated', handleOrderUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-cache' // Ensure fresh data
      });
      
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        
        console.log('📊 Dashboard: Received orders from API:', orders.length);
        console.log('📊 Dashboard: Raw orders data:', orders);
        
        // Filter only OPEN orders and ensure items are properly parsed
        const openOrders = orders
          .filter((order: any) => {
            // Only show OPEN orders
            const status = order.status || 'OPEN';
            const isOpen = status === 'OPEN';
            console.log(`📊 Dashboard: Table ${order.table_number} - Status: ${status}, IsOpen: ${isOpen}`);
            return isOpen;
          })
          .map((order: any) => {
            // Parse items if they're stored as JSON string
            let items = order.items || [];
            if (typeof items === 'string') {
              try {
                items = JSON.parse(items);
              } catch (e) {
                console.error('Failed to parse order items:', e);
                items = [];
              }
            }
            
            const mapped = {
              table_number: order.table_number,
              order_id: order.order_id,
              item_count: Array.isArray(items) ? items.length : 0,
              created_at: order.created_at
            };
            console.log(`📊 Dashboard: Mapped order for table ${mapped.table_number}:`, mapped);
            return mapped;
          });
        
        setTableOrders(openOrders);
        console.log('✅ Dashboard: Set tableOrders state with', openOrders.length, 'OPEN orders');
        console.log('✅ Dashboard: BUSY tables should be:', openOrders.map((o: TableOrder) => o.table_number).join(', '));
      } else {
        console.error('Failed to fetch orders:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatus = (tableNum: number) => {
    const order = tableOrders.find(order => order.table_number === tableNum);
    if (order) {
      console.log(`🔍 Dashboard: Table ${tableNum} has order:`, order);
    }
    return order;
  };

  const quickActions = [
    {
      title: 'Take Order',
      description: 'Take orders and generate bills',
      href: '/orders',
      icon: ShoppingCart,
      color: 'bg-indigo-500',
    },
    {
      title: 'Manage Menu',
      description: 'Add, edit, or remove menu items',
      href: '/menu',
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'View Reports',
      description: 'Check revenue and invoices',
      href: '/reports',
      icon: BarChart3,
      color: 'bg-purple-500',
    },
    {
      title: 'Update Profile',
      description: 'Manage hotel information',
      href: '/profile',
      icon: User,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Welcome to your dashboard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Hotel Name</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {user?.hotelName}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Email</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {user?.email}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Tables</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {user?.tableCount}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 sm:p-6 min-h-[120px]"
                >
                  <div className={`${action.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="text-white" size={20} />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Billing Section - Shows only BUSY tables for direct billing */}
        {tableOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-600" />
                Billing Section
              </h3>
              <span className="text-sm text-gray-500">
                Click on a BUSY table to generate bill
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading orders...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {tableOrders.map((order) => (
                  <Link
                    key={order.table_number}
                    href={`/orders?table=${order.table_number}&billing=true`}
                    className="p-4 rounded-lg shadow hover:shadow-lg transition-all bg-red-500 text-white hover:bg-red-600"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {order.table_number}
                      </div>
                      <div className="text-xs font-medium mb-2">BUSY</div>
                      <div className="text-xs opacity-90 space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          <span>{order.item_count} items</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-white/20">
                          <Receipt className="w-3 h-3" />
                          <span>Generate Bill</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Table Status Grid - All Tables */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Table Status (All Tables)</h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>FREE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>BUSY</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading tables...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {Array.from({ length: user?.tableCount || 20 }, (_, i) => i + 1).map(tableNum => {
                const order = getTableStatus(tableNum);
                const isBusy = !!order;

                return (
                  <Link
                    key={tableNum}
                    href={`/orders?table=${tableNum}`}
                    className={`p-4 rounded-lg shadow hover:shadow-md transition-all ${
                      isBusy ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {tableNum}
                      </div>
                      <div className="text-xs font-medium mb-2">
                        {isBusy ? 'BUSY' : 'FREE'}
                      </div>
                      {isBusy && order && (
                        <div className="text-xs opacity-90 space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            <span>{order.item_count} items</span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
