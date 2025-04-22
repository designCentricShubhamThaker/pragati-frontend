import { determineTeamType } from "./OrderUtils";



export const generateLocalStorageKey = (user) => {
  if (!user) {
    console.warn('No user provided for localStorage key generation');
    return null;
  }

  if (user.role === 'admin') {
    return 'dispatcher_all_orders';
  }

  const teamType = determineTeamType(user.team);
  return `team_${teamType}_orders`;
};

export const saveOrdersToLocalStorage = (user, orders) => {
  try {
    const key = generateLocalStorageKey(user);
    if (!key) {
      console.warn('No valid localStorage key generated. Orders not saved.');
      return;
    }

    localStorage.setItem(key, JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving orders to local storage:', error);
  }
};

export const getOrdersFromLocalStorage = (user) => {
  try {
    const key = generateLocalStorageKey(user);
    if (!key) {
      console.warn('No valid localStorage key found. Returning empty orders.');
      return [];
    }

    const storedOrders = localStorage.getItem(key);
    return storedOrders ? JSON.parse(storedOrders) : [];
  } catch (error) {
    console.error('Error retrieving orders from local storage:', error);
    return [];
  }
};

export const updateLocalStorageOrders = (user, newOrders) => {
  try {
    const key = generateLocalStorageKey(user);
    if (!key) {
      console.warn("No valid localStorage key for updating orders.");
      return newOrders;
    }

    const existingOrders = getOrdersFromLocalStorage(user);
    const mergedOrders = mergeOrders(existingOrders, newOrders);

    saveOrdersToLocalStorage(user, mergedOrders);
    return mergedOrders;
  } catch (error) {
    console.error("Error updating orders in local storage:", error);
    return newOrders;
  }
};

export const mergeOrders = (existingOrders, newOrders) => {
  const mergedOrderMap = new Map();

  existingOrders.forEach(order => {
    mergedOrderMap.set(order._id, order);
  });

  newOrders.forEach(newOrder => {
    const existingOrder = mergedOrderMap.get(newOrder._id);

    if (!existingOrder) {
      mergedOrderMap.set(newOrder._id, newOrder);
    } else {
      const mergedOrder = {
        ...existingOrder,
        ...newOrder,
        order_details: {
          ...existingOrder.order_details,
          ...newOrder.order_details
        },
        team_tracking: {
          ...existingOrder.team_tracking,
          ...newOrder.team_tracking
        }
      };
      mergedOrderMap.set(newOrder._id, mergedOrder);
    }
  });

  return Array.from(mergedOrderMap.values());
};

export const updateOrderItemForTeam = (order, teamType, itemId, updateData) => {
  console.log('Updating order item', {
    orderId: order._id,
    teamType,
    itemId,
    updateData
  });

  const itemArrayKey = determineTeamType(teamType);

  if (!order.order_details || !order.order_details[itemArrayKey]) {
    console.warn(`No ${itemArrayKey} found in order details`);
    return order;
  }

  const updatedItems = order.order_details[itemArrayKey].map(item => {
    if (item._id === itemId) {
      console.log(`Updating item with ID: ${itemId}`);

      const newTotalQty = (item.team_tracking?.total_completed_qty || 0) + (updateData.qty_completed || 0);

      const newItem = {
        ...item,
        team_tracking: {
          ...item.team_tracking,
          total_completed_qty: newTotalQty,
          completed_entries: [
            ...(item.team_tracking?.completed_entries || []),
            { qty_completed: updateData.qty_completed, timestamp: new Date().toISOString() }
          ],
          status: newTotalQty >= item.quantity ? 'Completed' : 'In Progress'
        }
      };

      console.log('Updated item:', newItem);
      return newItem;
    }
    return item;
  });

  const updatedOrder = {
    ...order,
    order_details: {
      ...order.order_details,
      [itemArrayKey]: updatedItems
    }
  };
  console.log('Final updated order:', updatedOrder);
  return updatedOrder;
};

export const setupLocalStorageSync = (user, updateOrdersCallback, notifyDispatcher) => {
  const key = generateLocalStorageKey(user);

  const handleStorageChange = (event) => {
    if (event.key === key) {
      try {
        console.log("🔄 Storage Change Detected for:", key);

        const oldOrders = JSON.parse(event.oldValue || '[]');
        const newOrders = JSON.parse(event.newValue || '[]');

        console.log("📜 Old Orders:", oldOrders);
        console.log("🆕 New Orders:", newOrders);

        updateOrdersCallback(newOrders);
        console.log("✅ UI Updated with new orders.");

        // Detect and send changes to dispatcher
        const changedOrders = detectOrderChanges(oldOrders, newOrders);
        if (changedOrders.length > 0) {
          console.log("🚨 Changes Detected! Sending to Dispatcher:", changedOrders);
          notifyDispatcher(changedOrders);
        } else {
          console.log("✅ No significant changes detected.");
        }
      } catch (error) {
        console.error("❌ Error parsing storage event:", error);
      }
    }
  };

  const handleLocalUpdate = (event) => {
    if (event.detail.key === key) {
      updateOrdersCallback(event.detail.orders);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('localStorageUpdated', handleLocalUpdate);
  console.log("👂 LocalStorage Listener Attached for:", key);

  return () => {
    console.log("🧹 Cleaning up LocalStorage listener...");
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('localStorageUpdated', handleLocalUpdate);
  };
};


const detectOrderChanges = (oldOrders, newOrders) => {
  const oldOrderMap = new Map(oldOrders.map(order => [order._id, order]));

  const changes = [];
  newOrders.forEach(newOrder => {
    const oldOrder = oldOrderMap.get(newOrder._id);
    if (!oldOrder || JSON.stringify(oldOrder) !== JSON.stringify(newOrder)) {
      console.log(`🔍 Order Changed or Added: ${newOrder._id}`);
      changes.push(newOrder);
    }
  });

  return changes;
};





