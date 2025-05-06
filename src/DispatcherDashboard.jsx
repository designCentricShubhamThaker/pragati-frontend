import React, { useState, useEffect,useCallback } from 'react';
import { ChevronLeft, X, Menu } from 'lucide-react';
import Table from './pages/Table';
import { useAuth } from './context/auth';
import { LuCalendarClock } from "react-icons/lu";
import { FaCheck } from "react-icons/fa";
import ConnectionStatus from './components/ConnectionStatus';
import { FaPowerOff } from "react-icons/fa";
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSocket } from './context/SocketContext';

const DispatcherDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('liveOrders');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    pendingOrdersCount: 0,
    completedOrderCount: 0
  });
  const { logout } = useAuth();
  const { socket, isConnected } = useSocket();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  /////////////////////
  // Improved updateStatusCounts function
  const updateStatusCounts = useCallback(() => {
    try {
      const liveOrders = JSON.parse(localStorage.getItem("dispatcher_liveOrders") || '[]');
      const pastOrders = JSON.parse(localStorage.getItem("dispatcher_pastOrders") || '[]');
      
      setStatusCounts({
        pendingOrdersCount: liveOrders.length,
        completedOrderCount: pastOrders.length
      });
    } catch (error) {
      console.error("Error updating status counts:", error);
    }
  }, []);
  
  // Initial load of status counts
  useEffect(() => {
    updateStatusCounts();
    // Set up interval to periodically check for changes
    const intervalId = setInterval(updateStatusCounts, 3000);
    return () => clearInterval(intervalId);
  }, [updateStatusCounts]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleOrderChange = () => {
      setTimeout(updateStatusCounts, 100); // Add slight delay to ensure localStorage is updated
    };
    
    socket.on('order-created', handleOrderChange);
    socket.on('order-updated', handleOrderChange);
    socket.on('orderDeleted', handleOrderChange);
    
    return () => {
      socket.off('order-created', handleOrderChange);
      socket.off('order-updated', handleOrderChange);
      socket.off('orderDeleted', handleOrderChange);
    };
  }, [socket, isConnected, updateStatusCounts]);

  // Listen for custom events from Table component
  useEffect(() => {
    const handleLocalUpdate = () => {
      setTimeout(updateStatusCounts, 100); // Add slight delay to ensure localStorage is updated first
    };
    
    window.addEventListener('orderDataChanged', handleLocalUpdate);
    
    return () => {
      window.removeEventListener('orderDataChanged', handleLocalUpdate);
    };
  }, [updateStatusCounts]);

  // Add event listener for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && (e.key === "dispatcher_liveOrders" || e.key === "dispatcher_pastOrders")) {
        updateStatusCounts();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [updateStatusCounts]);
  ////////////////////////////////
  

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const menuItems = [
    { id: 'liveOrders', label: 'LIVE ORDERS' },
    { id: 'pastOrders', label: 'PAST ORDERS' },
  ];

  const MobileSidebar = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex md:hidden">
      <div className="bg-gradient-to-b from-orange-500 to-orange-600 text-white w-64 h-full flex flex-col shadow-lg">
        <div className="flex items-center p-4 border-b border-orange-400">
          <img src="./logo.png" alt="logo" className="w-32" />
          <button onClick={toggleSidebar} className="ml-auto p-1 rounded-full bg-[#F36821] hover:bg-orange-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 py-6">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  style={{ color: "black !important", fontWeight: "500" }}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center py-3 px-4 w-full rounded-lg transition-all ${activeTab === item.id
                    ? 'bg-white text-orange-600 font-bold shadow-sm'
                    : 'text-black !important hover:bg-orange-400 hover:text-white'
                    }`}
                >
                  <span className="text-black !important">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} className="mt-6" />
      <ToastContainer />
      {!isMobile && (
        <div
          className={`bg-[url('./bg2.jpg')] bg-cover bg-center text-white flex flex-col transition-all duration-300 
          ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-64'}`}
        >
          <div className="flex items-center p-4 border-b border-orange-400">
            <img src="./logo.png" alt="logo" className="w-[170px] mx-auto" />
            <button
              onClick={toggleSidebar}
              className="ml-auto p-1 rounded-full bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="flex-1 py-6">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center py-3 px-4 w-full rounded-lg transition-all ${activeTab === item.id
                      ? 'bg-white text-orange-600 font-bold shadow-sm'
                      : 'text-black font-bold hover:bg-orange-400'
                      }`}
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isMobile && mobileMenuOpen && <MobileSidebar />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">

          <div className="flex items-center">
            {isMobile || collapsed ? (
              <button onClick={toggleSidebar} className="p-2 mr-2 rounded-lg hover:bg-gray-100">
                <Menu size={24} className="text-orange-500" />
              </button>
            ) : null}
            <div className="text-xl font-bold">
              <span className="text-black">Welcome</span> <span className="text-orange-500">Dispatcher !</span>
            </div>
          </div>

          <div className='flex gap-3'>
            <div className="px-2">
              <div className="flex gap-3">
                {/* Pending Orders Indicator */}
                <div className="bg-orange-50 rounded-lg border border-orange-200 shadow-sm overflow-hidden flex items-center">
                  <div className="flex items-center gap-2 py-2 px-3">
                    <div className="text-orange-500">
                      <LuCalendarClock size={18} />
                    </div>
                    <div className="flex items-center">
                    <span className="text-2xl font-bold text-orange-500 mr-2">{statusCounts.pendingOrdersCount}</span>
                      <div className="flex flex-col">
                        <span className="text-gray-700 text-sm font-medium">Pending Orders</span>
                        <span className="text-xs text-gray-500">orders awaiting processing</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed Orders Indicator */}
                <div className="bg-green-50 rounded-lg border border-green-200 shadow-sm overflow-hidden flex items-center">
                  <div className="flex items-center gap-2 py-2 px-3">
                    <div className="text-green-600">
                      <FaCheck size={16} />
                    </div>
                    <div className="flex items-center">
                    <span className="text-2xl font-bold text-green-600 mr-2">{statusCounts.completedOrderCount}</span>
                      <div className="flex flex-col">
                        <span className="text-gray-700 text-sm font-medium">Completed Orders</span>
                        <span className="text-xs text-gray-500">orders successfully fulfilled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-center space-x-4">
            <ConnectionStatus />
            <div className="flex items-center bg-red-700 text-white rounded-sm px-4 py-3 gap-2 hover:bg-red-800 hover:text-white shadow-md">
              <button onClick={handleLogout} className="font-medium cursor-pointer"><FaPowerOff /></button>
            </div>

          </div>
        </header>
        <main className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
            {activeTab === 'liveOrders' ? (
              <Table orderType="liveOrders" />
            ) : (
              <Table orderType="pastOrders"  />
            )}
          </div>
        </main>
      </div>
    </div>

  );
};

export default DispatcherDashboard;