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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (!user || !user.role) {
      console.log('No user role available for socket connection');
      return;
    }

    const SOCKET_URL = 'https://pragati-backend-omid.onrender.com';

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      // Try polling first, then fallback to websocket
      transports: ['polling', 'websocket'], // Changed order to try polling first
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 40000,
      autoConnect: true,
      query: {
        userId: user.id || 'anonymous',
        role: user.role,
        team: user.team || 'unknown',
        teamType: user.teamType || user.team || 'unknown'
      }
    });
    const handleConnect = () => {
      console.log('🔌 Socket connected with ID:', socketInstance.id);
      setIsConnected(true);
      setReconnectAttempts(0);
      registerUser(socketInstance);
    };

    const handleDisconnect = (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    };

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setReconnectAttempts(prev => prev + 1);
    };

    const handleReconnect = (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setReconnectAttempts(0);
      registerUser(socketInstance);
    };

    const handleRegistered = (response) => {
      console.log('✅ User registered with socket server:', response);
    };

    const handleConnectedUsers = (userLists) => {
      // console.log('👥 Connected users updated:', userLists);
      setConnectedUsers(userLists);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('reconnect', handleReconnect);
    socketInstance.on('registered', handleRegistered);
    socketInstance.on('connected-users', handleConnectedUsers);

    setSocket(socketInstance);

    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('reconnect', handleReconnect);
      socketInstance.off('registered', handleRegistered);
      socketInstance.off('connected-users', handleConnectedUsers);
      socketInstance.disconnect();
    };
  }, [user]);

  const registerUser = useCallback((socketInstance) => {
    if (!user || !socketInstance) return;

    const teamName = user.team ? user.team.toLowerCase().trim() : null;
    const teamType = user.teamType || teamName;

    let persistentId = sessionStorage.getItem('socketUserId');
    if (!persistentId) {
      persistentId = user.id || socketInstance.id;
      sessionStorage.setItem('socketUserId', persistentId);
    }

    socketInstance.emit('register', {
      userId: persistentId,
      role: user.role,
      team: teamName,
      teamType: teamType
    });
  }, [user]);

  const extractTeamType = (details, fallbackTeam) => {
    if (details?.glass?.length) return 'glass';
    if (details?.cap?.length) return 'cap';
    if (details?.box?.length) return 'box';
    if (details?.pump?.length) return 'pump';
    return fallbackTeam && fallbackTeam !== 'all' ? fallbackTeam : 'glass';
  };

  const notifyOrderUpdate = useCallback((updatedOrder) => {
    if (socket && isConnected && user) {
      const teamType = extractTeamType(updatedOrder.order_details, user.team);

      socket.emit('order-update', {
        order: updatedOrder,
        teamType,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️ Cannot send order update: Socket not connected');
    }
  }, [socket, isConnected, user]);



  const notifyOrderCreation = useCallback((newOrder) => {
    if (!socket || !isConnected || !user) {
      console.warn('⚠️ Cannot send order creation: Socket not connected or no user');
      return;
    }

    if (!newOrder?.order_number) {
      console.error("❌ order_number is missing in newOrder:", newOrder);
      return;
    }

    const teamType = extractTeamType(newOrder.order_details, user.team);

    socket.emit('create-order', {
      order: newOrder,
      teamType,
      timestamp: new Date().toISOString()
    });
  }, [socket, isConnected, user]);

  const notifyEditOrder = useCallback((updatedOrder) => {
    if (!socket || !isConnected || !user) {
      console.warn("⚠️ Cannot send update: No socket/user");
      return;
    }

    const teamType = extractTeamType(updatedOrder.order_details, user.team);

    socket.emit("edit-order", {
      order: updatedOrder,
      teamType
    });
  }, [socket, isConnected, user]);

  const notifyOrderDeletion = useCallback((orderToDelete) => {
    if (!socket || !isConnected || !user) {
      console.warn('⚠️ Cannot send order deletion: Socket not connected or no user');
      return;
    }

    if (!orderToDelete?._id || !orderToDelete?.order_number) {
      console.error("❌ _id or order_number is missing in orderToDelete:", orderToDelete);
      return;
    }

    const teamType = extractTeamType(orderToDelete.order_details, user.team);

    socket.emit('delete-order', {
      order: orderToDelete,
      teamType,
      timestamp: new Date().toISOString()
    });
  }, [socket, isConnected, user]);

  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdated = (data) => {
      const orderUpdateEvent = new CustomEvent('orderUpdated', {
        detail: {
          order: data.order,
          sourceTeam: data._meta?.teamType,
          timestamp: data._meta?.timestamp
        }
      });
      window.dispatchEvent(orderUpdateEvent);
    };

    const handleNewOrder = (data) => {
      if (user) {
        const existingOrders = getOrdersFromLocalStorage(user);
        const updatedOrders = [...existingOrders, data.order];
        saveOrdersToLocalStorage(user, updatedOrders);

        const orderCreateEvent = new CustomEvent('orderCreated', {
          detail: {
            order: data.order,
            createdBy: data._meta?.createdBy,
            timestamp: data._meta?.timestamp,
            targetTeam: data._meta?.teamType
          }
        });
        window.dispatchEvent(orderCreateEvent);
      }
    };

    const handleOrderCreateConfirmed = (response) => {
      const createConfirmEvent = new CustomEvent('orderCreateConfirmed', {
        detail: response
      });
      window.dispatchEvent(createConfirmEvent);
    };

    const handleOrderUpdateConfirmed = (response) => {
      console.log(`✅ Order update confirmed:`, response);
    };

    const handleOrderEdited = (order) => {
      const orderEditEvent = new CustomEvent('orderEdited', {
        detail: { order }
      });
      window.dispatchEvent(orderEditEvent);
    };

    const handleOrderDeleted = (data) => {
      if (user) {
        const existingOrders = getOrdersFromLocalStorage(user);
        const updatedOrders = existingOrders.filter(order => order._id !== data.order._id);
        saveOrdersToLocalStorage(user, updatedOrders);

        const orderDeleteEvent = new CustomEvent('orderDeleted', {
          detail: {
            order: data.order,
            deletedBy: data._meta?.deletedBy,
            timestamp: data._meta?.timestamp,
            targetTeam: data._meta?.teamType
          }
        });
        window.dispatchEvent(orderDeleteEvent);
      }
    };

    const handleOrderDeleteConfirmed = (response) => {
      const deleteConfirmEvent = new CustomEvent('orderDeleteConfirmed', {
        detail: response
      });
      window.dispatchEvent(deleteConfirmEvent);
    };

    socket.on('order-updated', handleOrderUpdated);
    socket.on('new-order', handleNewOrder);
    socket.on('order-create-confirmed', handleOrderCreateConfirmed);
    socket.on('order-update-confirmed', handleOrderUpdateConfirmed);
    socket.on('order-edited', handleOrderEdited);
    socket.on('order-deleted', handleOrderDeleted);
    socket.on('order-delete-confirmed', handleOrderDeleteConfirmed);

    return () => {
      socket.off('order-updated', handleOrderUpdated);
      socket.off('new-order', handleNewOrder);
      socket.off('order-create-confirmed', handleOrderCreateConfirmed);
      socket.off('order-update-confirmed', handleOrderUpdateConfirmed);
      socket.off('order-edited', handleOrderEdited);
      socket.off('order-deleted', handleOrderDeleted);
      socket.off('order-delete-confirmed', handleOrderDeleteConfirmed);
    };
  }, [socket, user]);

  const contextValue = {
    socket,
    isConnected,
    connectedUsers,
    reconnectAttempts,
    notifyOrderUpdate,
    notifyOrderCreation,
    notifyEditOrder,
    notifyOrderDeletion
  };

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};
