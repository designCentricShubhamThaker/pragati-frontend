import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/auth';


const NotificationBadge = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Listen for browser notifications permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  // Handle socket notifications
  useEffect(() => {
    if (!socket || !isConnected || !user) return;
    
    const handleNewOrderNotification = (data) => {
      const { order, targetTeam, targetRole, timestamp } = data;
      
      // Check if this notification is meant for current user based on team or role
      const isForThisUser = 
        (targetTeam && user.team === targetTeam) || 
        (targetRole && user.role === targetRole);
      
      if (isForThisUser) {
        console.log('📬 Adding notification for new order:', order.order_number);
        
        // Add to notifications
        setNotifications(prev => [
          {
            id: `${order._id}-${Date.now()}`,
            type: 'new-order',
            title: 'New Order',
            message: `Order #${order.order_number} for ${order.customer_name}`,
            orderId: order._id,
            order,
            timestamp,
            read: false
          },
          ...prev
        ]);
        
        // Browser notification if supported
        if (Notification.permission === 'granted') {
          new Notification('New Order Received', {
            body: `Order #${order.order_number} for ${order.customer_name}`,
          });
        }
      }
    };
    
    // Listen for socket events
    socket.on('new-order-notification', handleNewOrderNotification);
    
    return () => {
      socket.off('new-order-notification', handleNewOrderNotification);
    };
  }, [socket, isConnected, user]);
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    
    // Mark all as read when opening
    if (!showNotifications) {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    }
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Navigate to order details if needed
    // You can use useNavigate from react-router-dom or custom event
    // For now, we'll dispatch a custom event
    window.dispatchEvent(new CustomEvent('viewOrderFromNotification', { 
      detail: { orderId: notification.orderId }
    }));
    
    setShowNotifications(false);
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="notification-container">
      <button 
        className="notification-button" 
        onClick={toggleNotifications}
        aria-label="Notifications"
      >
        📋 
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all-btn" 
                onClick={clearAllNotifications}
              >
                Clear All
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <p className="no-notifications">No notifications</p>
          ) : (
            <ul className="notification-list">
              {notifications.map(notification => (
                <li 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>{formatDate(notification.timestamp)}</small>
                  </div>
                  {!notification.read && <span className="unread-marker">●</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;