
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import axios from 'axios'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '../context/auth'
import {
  getOrderItems,
  getItemName
} from '../utils/OrderUtils';
import {
  updateLocalStorageOrders,
  getOrdersFromLocalStorage,
  setupLocalStorageSync,
  generateLocalStorageKey
} from '../utils/LocalStorageUtils'
import { useSocket } from '../context/SocketContext'
import { ShoppingBag } from 'lucide-react';

const createOrderUpdateLog = (order, teamType, updates) => {
  return {
    orderId: order._id,
    orderNumber: order.order_number,
    teamType,
    updates,
    timestamp: new Date().toISOString()
  };
};

const EditTodaysCompletedOrder = ({ onClose, selectedOrder, onOrderUpdated, teamType }) => {
  const { user } = useAuth()
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [todaysQuantities, setTodaysQuantities] = useState({});
  const [previouslyCompleted, setPreviouslyCompleted] = useState({});
  const [errors, setErrors] = useState({});
  const [updateStatus, setUpdateStatus] = useState(null);
  const [completedQuantities, setCompletedQuantities] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { notifyOrderUpdate } = useSocket()

  useEffect(() => {
    if (!selectedOrder) return;

    const localOrders = getOrdersFromLocalStorage(user);
    const localOrder = localOrders.find(o => o._id === selectedOrder._id);

    if (localOrder) {
      console.log("Order data loaded from localStorage:", localOrder);
      setOrder(localOrder);
      const localOrderItems = getOrderItems(localOrder, teamType);
      setOrderItems(localOrderItems);

      const initialPreviouslyCompleted = localOrderItems.reduce((acc, item) => {
        acc[item._id] = item.team_tracking?.total_completed_qty || 0;
        return acc;
      }, {});

      setPreviouslyCompleted(initialPreviouslyCompleted);
    } else {
      console.log("Order not found in localStorage.");
    }

    setIsLoading(false);

    return () => {
      setOrder(null);
      setOrderItems([]);
      setPreviouslyCompleted({});
    };
  }, [selectedOrder, user, teamType]);

  useEffect(() => {

    if (!selectedOrder?._id) return;
    const cleanup = setupLocalStorageSync(user, (updatedOrders) => {

      const updatedOrder = updatedOrders.find(o => o._id === selectedOrder._id);
      if (updatedOrder) {
        setOrder(currentOrder => updatedOrder);
        setOrderItems(currentItems => getOrderItems(updatedOrder, teamType));
      }
    });

    return cleanup;
  }, [user, selectedOrder, teamType]);



  const handleSaveChanges = useCallback(async () => {
    if (!order) {
      setUpdateStatus({
        type: "error",
        message: "No order selected. Please select an order first."
      });
      return;
    }
  
    console.log("Starting to save order changes...");
  
    const hasValidUpdates = orderItems.some(
      item => (todaysQuantities[item._id] || 0) > 0
    );
  
    if (!hasValidUpdates) {
      setUpdateStatus({
        type: "error",
        message: "No valid quantities have been updated. Please enter completion quantities."
      });
      return;
    }
  
    if (Object.keys(errors).length > 0) {
      setUpdateStatus({
        type: "error",
        message: "Please resolve input errors before saving."
      });
      return;
    }
  
    setIsLoading(true);
    setUpdateStatus(null);
  
    try {
      console.log("Preparing update payload...");
  
      const updatePayload = {
        order_number: order.order_number,
        team_type: teamType,
        updates: orderItems
          .filter(item => (todaysQuantities[item._id] || 0) > 0)
          .map(item => ({
            item_id: item._id,
            qty_completed: todaysQuantities[item._id] || 0,
            [teamType + '_name']: item[teamType + '_name']
          }))
      };
      console.log("Update payload:", updatePayload);
  
      const response = await axios.patch(
        "https://pragati-backend-omid.onrender.com/orders/update-progress",
        updatePayload
      );
  
      console.log("Order progress successfully updated on backend:", response.data);
  
      const updatedOrder = response.data.order;
  
      console.log("Updated order from backend:", updatedOrder);
  
      if (updatedOrder && updatedOrder.order_number) {
        console.log("Sending order update via socket:", updatedOrder);
        notifyOrderUpdate(updatedOrder);
      } else {
        console.error("Invalid order update, not sending via socket:", updatedOrder);
      }
  
      const localUpdatedOrders = updateLocalStorageOrders(user, [updatedOrder]);
      console.log("Order progress updated in localStorage:", localUpdatedOrders);
      
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: { key: generateLocalStorageKey(user), orders: localUpdatedOrders }
      }));
  
      if (onOrderUpdated) {
        const updatedOrderInStorage = localUpdatedOrders.find(o => o._id === order._id);
        onOrderUpdated(updatedOrderInStorage);
      }
  
      setUpdateStatus({
        type: "success",
        message: "Order progress updated successfully!"
      });
  
      setTodaysQuantities({});
      setCompletedQuantities({});
      setErrors({});
  
      setTimeout(() => {
        onClose();
      }, 1500);
  
    } catch (error) {
      console.error("Update error:", error);
      setUpdateStatus({
        type: "error",
        message: error.response?.data?.error || "Failed to update order progress. Please try again."
      });
  
    } finally {
      setIsLoading(false);
    }
  }, [
    order,
    teamType,
    todaysQuantities,
    errors,
    onOrderUpdated,
    onClose,
    user,
    orderItems,
    notifyOrderUpdate
  ]);

  const calculateItemStatus = (item, todayQty) => {
    const totalCompletedQty = (item.team_tracking?.total_completed_qty || 0) + todayQty;
    const totalRequiredQty = item.quantity;

    if (totalCompletedQty >= totalRequiredQty) {
      return 'Completed';
    } else if (totalCompletedQty > 0) {
      return 'Partially Completed';
    }

    return 'Pending';
  };

  const handleCompletedChange = (id, value) => {
    let numValue = value === '' ? '' : parseInt(value, 10) || 0;

    const item = orderItems.find(item => item._id === id);
    const prevCompleted = previouslyCompleted[id] || 0;
    const maxAllowed = item.quantity - prevCompleted;

    if (numValue !== '' && numValue > maxAllowed) {
      setErrors(prev => ({
        ...prev,
        [id]: `Cannot exceed maximum of ${maxAllowed}`,
      }));
      return;
    }

    if (numValue === '') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }

    setTodaysQuantities(prev => ({
      ...prev,
      [id]: numValue === '' ? 0 : numValue,
    }));

    setCompletedQuantities(prev => ({
      ...prev,
      [id]: prevCompleted + (numValue === '' ? 0 : numValue),
    }));
  };

  const getProgressPercentage = (completed, total) => {
    return Math.min(100, Math.round((completed / total) * 100));
  };

  if (isLoading) {
    return (
      <Dialog open={true} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300"></div>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full transform transition-all">
              <div className="flex flex-col items-center justify-center space-y-6">

                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  <div className="absolute inset-1 rounded-full border-4 border-t-transparent border-r-amber-400 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-amber-300 border-l-transparent animate-spin animation-delay-300"></div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Processing Your Order</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Just a moment while we prepare your details...
                  </p>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-1 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-10">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[90vw]">
            {updateStatus && (
              <div className={`p-4 ${updateStatus.type === 'success' ? 'bg-green-100 text-green-800' :
                  updateStatus.type === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                } border-l-4 ${updateStatus.type === 'success' ? 'border-green-500' :
                  updateStatus.type === 'error' ? 'border-red-500' :
                    'border-blue-500'
                }`}>
                {updateStatus.message}
              </div>
            )}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-y-auto">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <DialogTitle as="h3" className="text-xl font-semibold text-gray-900">
                    <div className="bg-[#FF6701] p-4 rounded-t-md border-b border-orange-200 shadow-sm text-center">
                      <h3 className="text-white text-xl font-bold flex tracking-wide gap-2">
                        Update Progress for Order #{selectedOrder.order_number} - {teamType.toUpperCase()} Team
                      </h3>
                    </div>
                  </DialogTitle>
                  <div className="mt-10">
                    <div className="rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className='bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D]'>
                          <tr>
                            <th className="py-4 px-4 text-left text-white font-semibold">Item</th>
                            <th className="py-4 px-4 text-left text-white font-semibold">Quantity</th>
                            <th className="py-4 px-4 text-left text-white font-semibold">Progress</th>
                            <th className="py-4 px-4 text-left text-white font-semibold">Today's Input</th>
                            <th className="py-4 px-4 text-left text-white font-semibold">Remaining</th>
                          </tr>
                        </thead>
                        <tbody className="divide-[#FFDFC8]">
                          {orderItems.map((item, index) => {
                            const prevCompleted = previouslyCompleted[item._id] || 0;
                            const todayCompleted = todaysQuantities[item._id] || 0;
                            const totalCompleted = prevCompleted + todayCompleted;
                            const remaining = item.quantity - totalCompleted;
                            const progressPercent = getProgressPercentage(prevCompleted, item.quantity);
                            const newProgressPercent = getProgressPercentage(totalCompleted, item.quantity);

                            return (
                              <tr key={item._id} className={index % 2 === 0 ?
                                'bg-gradient-to-r from-[#FFFFFF] via-[#FFF5EC] to-[#FFEEE0]' :
                                'bg-gradient-to-r from-[#FFF0E6] via-[#FFDAB3] to-[#FFE6CC]'}>
                                <td className="py-5 px-4">
                                  <div className="text-orange-600 rounded text-left font-medium">
                                    {getItemName(item, teamType)}
                                  </div>
                                </td>
                                <td className="py-5 px-4">
                                  <div className="text-left font-medium text-sm">{item.quantity}</div>
                                </td>
                                <td className="py-5 px-4 w-72">
                                  <div className="flex items-center mb-2">
                                    <div className="text-sm text-gray-600 font-medium">
                                      {progressPercent}% complete
                                    </div>
                                  </div>
                                  <div className="relative w-full bg-transparent rounded-full h-8 overflow-hidden border-2 border-gray-300">
                                    {prevCompleted > 0 && (
                                      <div
                                        className="absolute top-0 left-0 h-full bg-green-800 transition-all duration-500 ease-in-out"
                                        style={{ width: `${progressPercent}%` }}
                                      ></div>
                                    )}
                                    {todayCompleted > 0 && (
                                      <div
                                        className="absolute top-0 h-full bg-orange-500 border-l border-white transition-all duration-500 ease-in-out"
                                        style={{
                                          left: `${progressPercent}%`,
                                          width: `${(todayCompleted / item.quantity) * 100}%`
                                        }}
                                      ></div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-sm font-bold text-gray-800 drop-shadow-sm">
                                        {prevCompleted > 0 || todayCompleted > 0
                                          ? `${totalCompleted}/${item.quantity}`
                                          : '0%'
                                        }
                                      </span>
                                    </div>
                                  </div>
                                  {todayCompleted > 0 && (
                                    <div className="mt-2 flex items-center">
                                      <span className="text-sm font-medium text-green-700 mr-2">
                                        +{todayCompleted} today
                                      </span>
                                      <span className="text-sm text-gray-600">
                                        → {newProgressPercent}% total
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-5 px-4">
                                  <div className="flex flex-col">
                                    <input
                                      type="number"
                                      min="0"
                                      max={item.quantity - prevCompleted}
                                      className={`border rounded px-3 py-3 w-full text-center ${errors[item._id] ? "border-red-500 bg-red-50" : "border-gray-300"
                                        }`}
                                      value={todaysQuantities[item._id] || ''}
                                      onChange={(e) => handleCompletedChange(item._id, e.target.value)}
                                      placeholder="0"
                                    />
                                    <div className={`text-xs mt-1 ${errors[item._id] ? "text-red-600 font-medium" : "text-gray-500"}`}>
                                      {errors[item._id] || `Max: ${item.quantity - prevCompleted}`}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-5 px-4">
                                  <div className={`px-4 py-2 rounded-full inline-block font-medium ${remaining === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {remaining === 0 ? 'Completed!' : `${remaining} remaining`}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md mr-6 hover:bg-gray-300 transition-colors shadow-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={`bg-[#A53107] text-white px-6 py-3 rounded hover:bg-[#8A2906] transition-colors font-medium shadow ${Object.keys(errors).length > 0 || isLoading ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        onClick={handleSaveChanges}
                        disabled={Object.keys(errors).length > 0 || isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Progress'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default EditTodaysCompletedOrder;
