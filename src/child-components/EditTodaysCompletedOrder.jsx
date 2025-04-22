
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import axios from 'axios'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '../context/auth'
import {
  determineTeamType,
  getOrderItems,
  getItemName
} from '../utils/OrderUtils';
import { 
  updateLocalStorageOrders, 
  getOrdersFromLocalStorage, 
  setupLocalStorageSync,
  generateLocalStorageKey
} from '../utils/LocalStorageUtils'

// New utility function to create order update log
const createOrderUpdateLog = (order, teamType, updates) => {
  return {
    orderId: order._id,
    orderNumber: order.order_number,
    teamType,
    updates,
    timestamp: new Date().toISOString()
  };
};

const EditTodaysCompletedOrder = ({ onClose, selectedOrder, onOrderUpdated }) => {
  const { user } = useAuth()
  const [order, setOrder] = useState(null);
  const teamType = useMemo(() => determineTeamType(selectedOrder), [selectedOrder]);
  const [orderItems, setOrderItems] = useState([]);
  const [todaysQuantities, setTodaysQuantities] = useState({});
  const [previouslyCompleted, setPreviouslyCompleted] = useState({});
  const [errors, setErrors] = useState({});
  const [updateStatus, setUpdateStatus] = useState(null);
  const [completedQuantities, setCompletedQuantities] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load order details from local storage
  useEffect(() => {
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
    const cleanup = setupLocalStorageSync(user, (updatedOrders) => {
      const updatedOrder = updatedOrders.find(o => o._id === selectedOrder?._id);
      if (updatedOrder) {
        setOrder(updatedOrder);
        setOrderItems(getOrderItems(updatedOrder, teamType));
      }
      // notifyDispatcher(updatedOrders);  // Notify dispatcher of changes
    });
  
    return () => cleanup(); 
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
        "http://localhost:5000/orders/update-progress",
        updatePayload
      );
  
      console.log("Order progress successfully updated on backend:", response.data);
  
      const updatedOrder = {
        ...order,
        team_tracking: {
          ...order.team_tracking,
          [`${teamType}_total_completed_qty`]: Object.entries(previouslyCompleted || {}).reduce(
            (total, [itemId, prevQty]) => {
              const todayQty = todaysQuantities[itemId] || 0;
              return total + prevQty + todayQty;
            },
            0
          )
        },
        order_details: {
          ...order.order_details,
          [teamType]: order.order_details[teamType].map(item => {
            const todayQty = todaysQuantities[item._id] || 0;
            
            if (todayQty <= 0) return item;
            
            return {
              ...item,
              team_tracking: {
                ...item.team_tracking,
                total_completed_qty: (item.team_tracking?.total_completed_qty || 0) + todayQty,
                // Add the new completed entry
                completed_entries: [
                  ...(item.team_tracking?.completed_entries || []),
                  { 
                    qty_completed: todayQty, 
                    timestamp: new Date().toISOString() 
                  }
                ],
                status: calculateItemStatus(item, todayQty)
              }
            };
          })
        }
      };
  
      console.log("Updated order before saving to localStorage:", updatedOrder);
  
      const updateLog = createOrderUpdateLog(order, teamType, updatePayload.updates);
      
      // Update localStorage only after API succeeds
      const localUpdatedOrders = updateLocalStorageOrders(user, [updatedOrder], teamType, updateLog);
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
    previouslyCompleted,
    orderItems
  ]);
  
  // Helper function to calculate item status
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

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={true} onClose={onClose} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin mb-4 mx-auto h-12 w-12 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-amber-600 font-medium">Loading order details...</p>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        className="fixed inset-0 bg-gray-500/75 transition-opacity"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[90vw]"
          >
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
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <DialogTitle as="h3" className="text-xl font-semibold text-gray-900">
                    Update Progress for Order #{selectedOrder.order_number} - {teamType.toUpperCase()} Team
                  </DialogTitle>
                  <div className="mt-4">
                    <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-amber-200 bg-amber-100/50">
                            <th className="py-3 px-4 text-left font-medium text-[#8A2906]">Order</th>
                            <th className="py-3 px-4 text-left font-medium text-[#8A2906]">Item</th>
                            <th className="py-3 px-4 text-center font-medium text-[#8A2906]">Quantity</th>
                            <th className="py-3 px-4 text-left font-medium text-[#8A2906]">Progress</th>
                            <th className="py-3 px-4 text-center font-medium text-[#8A2906]">Today's Input</th>
                            <th className="py-3 px-4 text-center font-medium text-[#8A2906]">Remaining</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-200">
                          {orderItems.map((item, index) => {
                            const prevCompleted = previouslyCompleted[item._id] || 0;
                            const todayCompleted = todaysQuantities[item._id] || 0;
                            const totalCompleted = prevCompleted + todayCompleted;
                            const remaining = item.quantity - totalCompleted;
                            const progressPercent = getProgressPercentage(prevCompleted, item.quantity);
                            const newProgressPercent = getProgressPercentage(totalCompleted, item.quantity);

                            return (
                              <tr key={item._id} className={index % 2 === 0 ? "bg-amber-50" : "bg-amber-100/20"}>
                                {index === 0 && (
                                  <td className="py-4 px-4" rowSpan={orderItems.length}>
                                    <div className="font-medium text-lg">{selectedOrder.order_number}</div>
                                    <div className="text-sm text-gray-600 mt-1">{selectedOrder.customer_name}</div>
                                  </td>
                                )}
                                <td className="py-4 px-4">
                                  <div className="bg-[#F05C1C] text-white px-3 py-2 rounded text-center font-medium">
                                    {getItemName(item, teamType)}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-center font-medium text-lg">{item.quantity}</div>
                                </td>
                                <td className="py-4 px-4 w-72">
                                  {/* Progress header */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium">
                                      {prevCompleted}/{item.quantity}
                                    </div>
                                    <div className="text-sm text-gray-600 font-medium">
                                      {progressPercent}% complete
                                    </div>
                                  </div>

                                  <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                                    {prevCompleted > 0 && (
                                      <div
                                        className="absolute top-0 left-0 h-full bg-green-600 transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                      ></div>
                                    )}
                                    {todayCompleted > 0 && (
                                      <div
                                        className="absolute top-0 h-full bg-orange-500 border-l border-white transition-all"
                                        style={{
                                          left: `${progressPercent}%`,
                                          width: `${(todayCompleted / item.quantity) * 100}%`
                                        }}
                                      ></div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-sm font-bold text-white drop-shadow-sm">
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
                                <td className="py-4 px-4">
                                  <div className="flex flex-col space-y-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max={item.quantity - prevCompleted}
                                      className={`border rounded px-3 py-3 w-full text-center ${
                                        errors[item._id] ? "border-red-500 bg-red-50" : "border-gray-300"
                                      }`}
                                      value={todaysQuantities[item._id] || ''}
                                      onChange={(e) => handleCompletedChange(item._id, e.target.value)}
                                      placeholder="0"
                                    />
                                    {errors[item._id] && (
                                      <div className="text-xs text-red-600 font-medium">
                                        {errors[item._id]}
                                      </div>
                                    )}
                                    {!errors[item._id] && (
                                      <div className="text-xs text-gray-500">
                                        Max: {item.quantity - prevCompleted}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <div className={`px-4 py-2 rounded-full inline-block font-medium ${remaining === 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {remaining === 0
                                      ? 'Completed!'
                                      : `${remaining} remaining`
                                    }
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
                        className={`bg-[#A53107] text-white px-6 py-3 rounded hover:bg-[#8A2906] transition-colors font-medium shadow ${
                          Object.keys(errors).length > 0 || isLoading ? 'opacity-60 cursor-not-allowed' : ''
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
