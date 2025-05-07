import { determineTeamType } from "./OrderUtils";

export const generateLocalStorageKey = (user, orderType) => {
  if (!user) {
    console.warn('No user provided for localStorage key generation');
    return null;
  }

  const validOrderType = orderType || 'liveOrders';
  // console.log(`Generating key for user ${user.name || 'unknown'}, role: ${user.role}, orderType: ${validOrderType}`);
  if (user.role === 'admin' || user.role === 'dispatcher') {
    return `dispatcher_${validOrderType}`;
  }
  const teamType = determineTeamType(user.team);
  if (!teamType) {
    console.warn(`Could not determine team type for user ${user.name || 'unknown'}`);
    return null;
  }
  return `team_${teamType}_orders_${validOrderType}`;
};

export const saveOrdersToLocalStorage = (user, orders, orderType = 'liveOrders') => {
  try {
    const key = generateLocalStorageKey(user, orderType);
    if (!key) {
      console.warn('No valid localStorage key generated. Orders not saved.');
      return;
    }
    const filteredOrders = filterOrdersByType(user, orders, orderType);
    console.log(`Saving ${filteredOrders.length} filtered orders to localStorage with key: ${key}`);
    localStorage.setItem(key, JSON.stringify(filteredOrders));

    const event = new CustomEvent('localStorageUpdated', {
      detail: {
        key: key,
        orders: filteredOrders
      }
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error saving orders to local storage:', error);
  }
};

export const getOrdersFromLocalStorage = (user, orderType = 'liveOrders') => {
  try {
    const key = generateLocalStorageKey(user, orderType);
    if (!key) {
      console.warn('No valid localStorage key found. Returning empty orders.');
      return [];
    }
    const storedOrders = localStorage.getItem(key);
    const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];
    console.log(`Retrieved ${parsedOrders.length} orders from localStorage with key: ${key}`);
    return parsedOrders;
  } catch (error) {
    console.error('Error retrieving orders from local storage:', error);
    return [];
  }
};

export const updateLocalStorageOrders = (user, newOrders, orderType = 'liveOrders') => {
  try {
    const key = generateLocalStorageKey(user, orderType);
    if (!key) {
      console.warn("No valid localStorage key for updating orders.");
      return newOrders;
    }

    const filteredNewOrders = filterOrdersByType(user, newOrders, orderType);
    console.log(`Updating localStorage for key: ${key} with ${filteredNewOrders.length} filtered new orders`);
    const existingOrders = getOrdersFromLocalStorage(user, orderType);
    const mergedOrders = mergeOrders(existingOrders, filteredNewOrders);
    saveOrdersToLocalStorage(user, mergedOrders, orderType);
    return mergedOrders;
  } catch (error) {
    console.error("Error updating orders in local storage:", error);
    return filterOrdersByType(user, newOrders, orderType);
  }
};

export const filterOrdersByType = (user, orders, orderType) => {
  if (!orders || orders.length === 0) return [];

  if (user.role === 'admin' || user.role === 'dispatcher') {
    console.log(`Filtering ${orders.length} orders for admin/dispatcher by ${orderType}`);
    return orders.filter(order => {
      const isCompleted = order.order_status?.toLowerCase() === 'completed';
      return (orderType === 'pastOrders' && isCompleted) ||
        (orderType === 'liveOrders' && !isCompleted);
    });
  }

  else {
    const teamType = determineTeamType(user.team);
    if (!teamType) return orders;
    console.log(`Filtering ${orders.length} orders for team ${teamType} by ${orderType}`);
    return orders.filter(order => {
      if (!order.order_details || !order.order_details[teamType]) {
        return false;
      }
      const teamItems = order.order_details[teamType];
      const allItemsComplete = teamItems.every(item =>
        item.team_tracking?.status === 'Completed' ||
        (item.team_tracking?.total_completed_qty >= item.quantity)
      );
      return (orderType === 'pastOrders' && allItemsComplete) ||
        (orderType === 'liveOrders' && !allItemsComplete);
    });
  }
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

  const allTeamItemsComplete = updatedOrder.order_details[itemArrayKey].every(
    item => item.team_tracking?.status === 'Completed' ||
      (item.team_tracking?.total_completed_qty >= item.quantity)
  );
  console.log('Final updated order:', updatedOrder);
  return updatedOrder;
};

export const setupLocalStorageSync = (user, updateOrdersCallback, notifyDispatcher, orderType = 'liveOrders') => {
  const key = generateLocalStorageKey(user, orderType);
  if (!key) {
    console.warn('No valid localStorage key for sync setup. Sync will not work.');
    return () => { };
  }
  console.log(`Setting up localStorage sync for key: ${key}`);
  const handleStorageChange = (event) => {
    if (event.key === key) {
      try {
        console.log(`🔄 Storage Change Detected for: ${key} (${orderType})`);
        const oldOrders = JSON.parse(event.oldValue || '[]');
        const newOrders = JSON.parse(event.newValue || '[]');
        console.log(`📜 Old Orders: ${oldOrders.length}, 🆕 New Orders: ${newOrders.length}`);

        updateOrdersCallback(newOrders);
        console.log("✅ UI Updated with new orders.");
        if (notifyDispatcher) {
          const changedOrders = detectOrderChanges(oldOrders, newOrders);
          if (changedOrders.length > 0) {
            console.log(`🚨 ${changedOrders.length} Changes Detected! Sending to Dispatcher`);
            notifyDispatcher(changedOrders);
          } else {
            console.log("✅ No significant changes detected.");
          }
        }
      } catch (error) {
        console.error("❌ Error parsing storage event:", error);
      }
    }
  };

  const handleLocalUpdate = (event) => {
    if (event.detail.key === key) {
      console.log(`Local update event received for key: ${key}`);
      updateOrdersCallback(event.detail.orders);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('localStorageUpdated', handleLocalUpdate);
  console.log(`👂 LocalStorage Listener Attached for: ${key} (${orderType})`);

  return () => {
    console.log(`🧹 Cleaning up LocalStorage listener for key: ${key}`);
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('localStorageUpdated', handleLocalUpdate);
  };
};

export const moveOrderBetweenStorages = (user, order, fromOrderType, toOrderType) => {
  try {
    console.log(`Moving order ${order.order_number} from ${fromOrderType} to ${toOrderType}`);
    const shouldMove = checkOrderTypeMatch(user, order, toOrderType);

    if (!shouldMove) {
      console.log(`Order ${order.order_number} cannot be moved - doesn't match target type criteria`);
      return false;
    }
    const sourceOrders = getOrdersFromLocalStorage(user, fromOrderType);
    const filteredSourceOrders = sourceOrders.filter(o => o._id !== order._id);
    saveOrdersToLocalStorage(user, filteredSourceOrders, fromOrderType);

    const destOrders = getOrdersFromLocalStorage(user, toOrderType);
    if (!destOrders.some(o => o._id === order._id)) {
      const updatedDestOrders = [...destOrders, order];
      saveOrdersToLocalStorage(user, updatedDestOrders, toOrderType);
    }

    console.log(`Successfully moved order ${order.order_number} to ${toOrderType}`);
    return true;
  } catch (error) {
    console.error(`Error moving order ${order?.order_number} between storages:`, error);
    return false;
  }
};

export const checkOrderTypeMatch = (user, order, orderType) => {
  if (user.role === 'admin' || user.role === 'dispatcher') {
    const isCompleted = order.order_status?.toLowerCase() === 'completed';
    return (orderType === 'pastOrders' && isCompleted) ||
      (orderType === 'liveOrders' && !isCompleted);
  }
  else {
    const teamType = determineTeamType(user.team);
    if (!teamType || !order.order_details || !order.order_details[teamType]) {
      return false;
    }
    const teamItems = order.order_details[teamType];
    const allItemsComplete = teamItems.every(item =>
      item.team_tracking?.status === 'Completed' ||
      (item.team_tracking?.total_completed_qty >= item.quantity)
    );

    return (orderType === 'pastOrders' && allItemsComplete) ||
      (orderType === 'liveOrders' && !allItemsComplete);
  }
};

const detectOrderChanges = (oldOrders, newOrders) => {
  const oldOrderMap = new Map(oldOrders.map(order => [order._id, order]));
  const changes = [];
  newOrders.forEach(newOrder => {
    const oldOrder = oldOrderMap.get(newOrder._id);
    if (!oldOrder || JSON.stringify(oldOrder) !== JSON.stringify(newOrder)) {
      console.log(`🔍 Order Changed or Added: ${newOrder._id || newOrder.order_number}`);
      changes.push(newOrder);
    }
  });
  return changes;
};

export const calculateItemStatus = (completedQty, totalQty) => {
  return completedQty >= totalQty ? 'Completed' : 'Pending';
};

export const mergeOrders = (existingOrders, newOrders) => {
  const orderMap = new Map();
  const getOrderKey = (order) => {
    if (!order) return null;
    return order._id || (order.order_number ? `num-${order.order_number}` : null);
  };

  existingOrders.forEach(order => {
    const key = getOrderKey(order);
    if (key) {
      orderMap.set(key, order);
    }
  });

  newOrders.forEach(newOrder => {
    const key = getOrderKey(newOrder);
    if (!key) return;
    orderMap.set(key, newOrder);
  });
  return Array.from(orderMap.values());
};

export const deleteOrderFromAllStorages = (user, order) => {
  try {
    const orderTypes = ['liveOrders', 'pastOrders'];
    console.log(`Deleting order ${order.order_number} from all storages`);

    orderTypes.forEach(orderType => {
      const orders = getOrdersFromLocalStorage(user, orderType);
      const filteredOrders = orders.filter(o => o._id !== order._id);
      if (orders.length !== filteredOrders.length) {
        console.log(`Deleted order ${order._id} from ${orderType}`);
        saveOrdersToLocalStorage(user, filteredOrders, orderType);
      }
    });

    return true;
  } catch (error) {
    console.error(`Error deleting order ${order?.order_number} from storages:`, error);
    return false;
  }
};

export const deleteOrderFromLocalStorage = (orderId) => {
  try {
    console.log(`Manually deleting order ${orderId} from localStorage`);
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    const orderKeys = keys.filter(key =>
      key.includes('_liveOrders') ||
      key.includes('_pastOrders')
    );
    console.log(`Found ${orderKeys.length} order storage keys to check`);

    orderKeys.forEach(key => {
      try {
        const orders = JSON.parse(localStorage.getItem(key) || '[]');
        const filteredOrders = orders.filter(o =>
          o.order_number !== orderId &&
          o._id !== orderId
        );

        if (orders.length !== filteredOrders.length) {
          console.log(`Removing order ${orderId} from key: ${key}`);
          localStorage.setItem(key, JSON.stringify(filteredOrders));
        }
      } catch (e) {
        console.error(`Error processing key ${key}:`, e);
      }
    });

    return true;
  } catch (error) {
    console.error(`Error deleting order ${orderId} from localStorage:`, error);
    return false;
  }
};

export const syncOrdersBasedOnStatus = (user, order) => {
  try {
    console.log(`Syncing order ${order.order_number} based on status`);

    if (user.role === 'admin' || user.role === 'dispatcher') {
      const isCompleted = order.order_status?.toLowerCase() === 'completed';
      const targetOrderType = isCompleted ? 'pastOrders' : 'liveOrders';
      const otherOrderType = isCompleted ? 'liveOrders' : 'pastOrders';
      const otherOrders = getOrdersFromLocalStorage(user, otherOrderType);
      const filteredOtherOrders = otherOrders.filter(o => o._id !== order._id);
      if (otherOrders.length !== filteredOtherOrders.length) {
        console.log(`Removed order ${order._id} from ${otherOrderType}`);
        saveOrdersToLocalStorage(user, filteredOtherOrders, otherOrderType);
      }
      const targetOrders = getOrdersFromLocalStorage(user, targetOrderType);
      if (!targetOrders.some(o => o._id === order._id)) {
        const updatedTargetOrders = [...targetOrders, order];
        saveOrdersToLocalStorage(user, updatedTargetOrders, targetOrderType);
        console.log(`Added order ${order._id} to ${targetOrderType}`);
      }
    }
    else {
      const teamType = determineTeamType(user.team);
      if (!teamType || !order.order_details || !order.order_details[teamType]) {
        return false;
      }
      const teamItems = order.order_details[teamType];
      const allItemsComplete = teamItems.every(item =>
        item.team_tracking?.status === 'Completed' ||
        (item.team_tracking?.total_completed_qty >= item.quantity)
      );
      if (allItemsComplete) {
        moveOrderBetweenStorages(user, order, 'liveOrders', 'pastOrders');
      } else {
        moveOrderBetweenStorages(user, order, 'pastOrders', 'liveOrders');
      }
    }
    return true;
  } catch (error) {
    console.error(`Error syncing order ${order?.order_number} between storages:`, error);
    return false;
  }
};