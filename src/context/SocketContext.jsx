
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './auth';
import { getOrdersFromLocalStorage, saveOrdersToLocalStorage } from '../utils/LocalStorageUtils';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState({ dispatchers: [], teamMembers: [] });
  const [lastPing, setLastPing] = useState(null);

  useEffect(() => {
    if (!user || !user.role) {
      console.log('No user role available for socket connection');
      return;
    }
    console.log('Initializing socket connection with role:', user.role);
    const socketUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-production-url'
      : 'http://localhost:5000';

    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });


    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected with ID:', socketInstance.id);
      setIsConnected(true);

      const teamName = user.team ? user.team.toLowerCase().trim() : null;
      const teamType = user.teamType || teamName;

      socketInstance.emit('register', {
        userId: socketInstance.id,
        role: user.role,
        team: teamName,
        teamType: teamType
      });

      console.log(`🔌 Registering as ${user.role} for team: ${teamName}, teamType: ${teamType}`);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);

      const teamName = user.team ? user.team.toLowerCase().trim() : null;
      const teamType = user.teamType || teamName;

      socketInstance.emit('register', {
        userId: socketInstance.id,
        role: user.role,
        team: teamName,
        teamType: teamType
      });
    });

    socketInstance.on('registered', (response) => {
      console.log('✅ User registered with socket server:', response);
    });

    socketInstance.on('connected-users', (userLists) => {
      console.log('👥 Connected users updated:', userLists);
      setConnectedUsers(userLists);
    });

    socketInstance.on('order-updated', (data) => {
      const { order, _meta } = data;
      console.log(`📦 Received order update from ${_meta?.teamType || 'unknown'} team:`, order);
      console.log('Update timestamp:', _meta?.timestamp);

      const orderUpdateEvent = new CustomEvent('orderUpdated', {
        detail: {
          order,
          sourceTeam: _meta?.teamType,
          timestamp: _meta?.timestamp
        }
      });
      window.dispatchEvent(orderUpdateEvent);
    });

    socketInstance.on('new-order', (data) => {
      console.log('📦 New order received:', data.order.order_number);
      console.log('🔍 Order details:', data.order);
      console.log('ℹ️ Meta:', data._meta);

      // Save the new order to localStorage if appropriate
      if (user) {
        const existingOrders = getOrdersFromLocalStorage(user);
        const updatedOrders = [...existingOrders, data.order];
        saveOrdersToLocalStorage(user, updatedOrders);

        // Dispatch custom event to notify components
        const orderCreateEvent = new CustomEvent('orderCreated', {
          detail: {
            order: data.order,
            createdBy: data._meta.createdBy,
            timestamp: data._meta.timestamp,
            targetTeams: data._meta.targetTeams
          }
        });
        window.dispatchEvent(orderCreateEvent);
      }
    });

    socketInstance.on('order-create-confirmed', (response) => {
      console.log(`✅ Order creation confirmed:`, response);

      // Dispatch event to notify components about successful creation
      const createConfirmEvent = new CustomEvent('orderCreateConfirmed', {
        detail: response
      });
      window.dispatchEvent(createConfirmEvent);
    });

    socketInstance.on('order-update-confirmed', (response) => {
      console.log(`✅ Order update confirmed:`, response);
    });

    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const pingServer = useCallback(() => {
    if (socket && isConnected) {
      const startTime = Date.now();
      socket.emit('ping', (response) => {
        const latency = Date.now() - startTime;
        setLastPing({ time: response.time, latency });
      });
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    pingServer();
    const pingInterval = setInterval(pingServer, 30000);
    return () => clearInterval(pingInterval);
  }, [socket, isConnected, pingServer]);

  const notifyOrderUpdate = useCallback((updatedOrder) => {
    if (socket && isConnected && user) {
      const teamType = user.teamType || user.team || 'unknown';


      socket.emit('order-update', {
        order: updatedOrder,
        teamType: teamType,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️ Cannot send order update: Socket not connected');
    }
  }, [socket, isConnected, user]);

  const notifyOrderCreation = useCallback((newOrder) => {
    if (socket && isConnected && user) {
      console.log(`📤 Preparing to send order: `, newOrder);

      if (!newOrder?.order_number) {
        console.error("❌ order_number is missing in newOrder:", newOrder);
      }

      const targetTeams = [];

      if (!newOrder.order_details || typeof newOrder.order_details !== 'object') {
        console.error("❌ order_details is missing or malformed:", newOrder.order_details);
        return;
      }

      console.log("🧩 Order details keys:", Object.keys(newOrder.order_details));

      if (Array.isArray(newOrder.order_details.glass) && newOrder.order_details.glass.length > 0) {
        targetTeams.push('glass');
      }
      if (Array.isArray(newOrder.order_details.caps) && newOrder.order_details.caps.length > 0) {
        targetTeams.push('caps');
      }
      if (Array.isArray(newOrder.order_details.boxes) && newOrder.order_details.boxes.length > 0) {
        targetTeams.push('boxes');
      }
      if (Array.isArray(newOrder.order_details.pumps) && newOrder.order_details.pumps.length > 0) {
        targetTeams.push('pumps');
      }

      if (targetTeams.length === 0 && user.team && user.team !== 'all') {
        targetTeams.push(user.team);
      }

      if (targetTeams.length === 0) {
        console.warn("⚠️ No valid teams found, defaulting to 'glass'");
        targetTeams.push('glass');
      }

      console.log('✅ Emitting order to teams:', targetTeams);

      socket.emit('create-order', {
        order: newOrder,
        teamTypes: targetTeams,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️ Cannot send order creation: Socket not connected or no user');
    }
  }, [socket, isConnected, user]);

  const notifyEditOrder = useCallback((updatedOrder) => {
    if (socket && isConnected && user) {
      const targetTeams = [];

      const details = updatedOrder.order_details || {};

      if (details.glass?.length) targetTeams.push("glass");
      if (details.caps?.length) targetTeams.push("caps");
      if (details.boxes?.length) targetTeams.push("boxes");
      if (details.pumps?.length) targetTeams.push("pumps");

      if (targetTeams.length === 0 && user.team && user.team !== 'all') {
        targetTeams.push(user.team);
      }

      console.log("📤 Sending updated order to:", targetTeams);

      socket.emit("edit-order", {
        order: updatedOrder,
        teamTypes: targetTeams,
      });
    } else {
      console.warn("⚠️ Cannot send update: No socket/user");
    }


  }, [socket, isConnected, user]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order-deleted', (data) => {
      console.log('🗑️ Order deletion notification received:', data.order.order_number);
      console.log('🔍 Deleted order details:', data.order);
      console.log('ℹ️ Meta:', data._meta);
      if (user) {
        const existingOrders = getOrdersFromLocalStorage(user);
        const updatedOrders = existingOrders.filter(order => order._id !== data.order._id);
        saveOrdersToLocalStorage(user, updatedOrders);

        const orderDeleteEvent = new CustomEvent('orderDeleted', {
          detail: {
            order: data.order,
            deletedBy: data._meta.deletedBy,
            timestamp: data._meta.timestamp,
            targetTeams: data._meta.targetTeams
          }
        });
        window.dispatchEvent(orderDeleteEvent);
      }
    });

    socket.on('order-delete-confirmed', (response) => {
      console.log(`✅ Order deletion confirmed:`, response);


      const deleteConfirmEvent = new CustomEvent('orderDeleteConfirmed', {
        detail: response
      });
      window.dispatchEvent(deleteConfirmEvent);
    });

    return () => {
      socket.off('order-deleted');
      socket.off('order-delete-confirmed');
    };
  }, [socket, user]);


  const notifyOrderDeletion = useCallback((orderToDelete) => {
    if (socket && isConnected && user) {
      console.log(`🗑️ Preparing to delete order: `, orderToDelete);

      if (!orderToDelete?._id || !orderToDelete?.order_number) {
        console.error("❌ _id or order_number is missing in orderToDelete:", orderToDelete);
        return;
      }

      const targetTeams = [];

      if (!orderToDelete.order_details || typeof orderToDelete.order_details !== 'object') {
        console.error("❌ order_details is missing or malformed:", orderToDelete.order_details);
        return;
      }


      if (Array.isArray(orderToDelete.order_details.glass) && orderToDelete.order_details.glass.length > 0) {
        targetTeams.push('glass');
      }
      if (Array.isArray(orderToDelete.order_details.caps) && orderToDelete.order_details.caps.length > 0) {
        targetTeams.push('caps');
      }
      if (Array.isArray(orderToDelete.order_details.boxes) && orderToDelete.order_details.boxes.length > 0) {
        targetTeams.push('boxes');
      }
      if (Array.isArray(orderToDelete.order_details.pumps) && orderToDelete.order_details.pumps.length > 0) {
        targetTeams.push('pumps');
      }

      if (targetTeams.length === 0 && user.team && user.team !== 'all') {
        targetTeams.push(user.team);
      }

      console.log('📤 Emitting order deletion to teams:', targetTeams);

      socket.emit('delete-order', {
        order: orderToDelete,
        teamTypes: targetTeams,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️ Cannot send order deletion: Socket not connected or no user');
    }
  }, [socket, isConnected, user]);



  useEffect(() => {
    if (!socket || !isConnected || !user) return;
    const handleLocalStorageUpdate = (event) => {
      console.log('🔄 Detected localStorageUpdated event:', event.detail);

      if (event.detail && event.detail.orders) {
        if (user.role !== 'admin' && user.role !== 'dispatcher') {
          const updatedOrders = event.detail.orders;
          const teamType = user.teamType || user.team || 'unknown';
          console.log(`📤 Sending orders update to dispatchers from ${teamType} team:`, updatedOrders);

          updatedOrders.forEach(order => {
            notifyOrderUpdate(order);
          });
        }
      }
    };

    window.addEventListener('localStorageUpdated', handleLocalStorageUpdate);

    return () => {
      window.removeEventListener('localStorageUpdated', handleLocalStorageUpdate);
    };
  }, [socket, isConnected, user, notifyOrderUpdate,]);

  const contextValue = {
    socket,
    isConnected,
    connectedUsers,
    lastPing,
    notifyOrderUpdate,
    notifyOrderCreation,
    notifyEditOrder,
    notifyOrderDeletion

  };

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

