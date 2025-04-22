import { useEffect } from 'react';

import { generateLocalStorageKey, getOrdersFromLocalStorage } from '../utils/LocalStorageUtils';
import { useSocket } from '../context/SocketContext';
;

// Centralized order synchronization hook
export const useOrderSync = (user, updateOrdersCallback) => {
  const { notifyOrderUpdate, isConnected } = useSocket();
  
  useEffect(() => {
    if (!user || !isConnected) return;
    
    const key = generateLocalStorageKey(user);
    if (!key) return;

    // Handle order update events from socket
    const handleOrderUpdated = (event) => {
      const { order } = event.detail;
      console.log('Received order update from socket:', order);
      
      // Update local state through callback
      updateOrdersCallback(prevOrders => {
        const ordersArray = Array.isArray(prevOrders) ? prevOrders : [];
        return [order, ...ordersArray.filter(o => o._id !== order._id)];
      });
    };

    // Handle localStorage changes within the same window
    const handleLocalStorageUpdated = (event) => {
      if (event.detail && event.detail.key === key) {
        console.log('🔄 Detected localStorageUpdated event:', event.detail);
        updateOrdersCallback(event.detail.orders);
        
        // Only notify dispatcher for non-admin/dispatcher roles
        if (user.role !== 'admin' && user.role !== 'dispatcher' && event.detail.orders) {
          const orders = event.detail.orders;
          
          // Compare with previously stored orders to find changes
          const prevOrders = getOrdersFromLocalStorage(user);
          const changedOrders = findChangedOrders(prevOrders, orders);
          
          if (changedOrders.length > 0) {
            console.log('Notifying dispatchers about order updates:', changedOrders);
            changedOrders.forEach(order => {
              notifyOrderUpdate(order);
            });
          }
        }
      }
    };

    // Handle storage events from other tabs/windows
    const handleStorageChange = (event) => {
      if (event.key === key) {
        try {
          console.log("🔄 Storage Change Detected for:", key);
          const newOrders = JSON.parse(event.newValue || '[]');
          updateOrdersCallback(newOrders);
        } catch (error) {
          console.error("❌ Error parsing storage event:", error);
        }
      }
    };

    window.addEventListener('orderUpdated', handleOrderUpdated);
    window.addEventListener('localStorageUpdated', handleLocalStorageUpdated);
    window.addEventListener('storage', handleStorageChange);
    
    console.log("👂 Order sync listeners attached");
    
    return () => {
      window.removeEventListener('orderUpdated', handleOrderUpdated);
      window.removeEventListener('localStorageUpdated', handleLocalStorageUpdated);
      window.removeEventListener('storage', handleStorageChange);
      console.log("🧹 Order sync listeners removed");
    };
  }, [user, isConnected, notifyOrderUpdate, updateOrdersCallback]);
};

// Helper function to find changed orders
const findChangedOrders = (oldOrders, newOrders) => {
  const oldOrderMap = new Map(oldOrders.map(order => [order._id, order]));
  
  return newOrders.filter(newOrder => {
    const oldOrder = oldOrderMap.get(newOrder._id);
    return !oldOrder || JSON.stringify(oldOrder) !== JSON.stringify(newOrder);
  });
};