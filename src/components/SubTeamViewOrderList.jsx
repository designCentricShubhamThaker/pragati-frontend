// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import axios from 'axios';
// import { Loader2, CheckCircle, Search, RefreshCw, FileText } from 'lucide-react';
// import { FaPencil } from "react-icons/fa6";
// import { useAuth } from '../context/auth';
// import { BsFiletypeCsv } from "react-icons/bs";
// import { TbTimelineEvent } from "react-icons/tb";
// import EditTodaysCompletedOrder from '../child-components/EditTodaysCompletedOrder';

// import {
//   determineTeamType,
//   getOrderItems,
//   getItemName,
//   getTeamTypeSpecificColumns,
//   getCellValue
// } from '../utils/OrderUtils';
// import {
//   getOrdersFromLocalStorage,
//   setupLocalStorageSync,
//   saveOrdersToLocalStorage,
//   updateLocalStorageOrders
// } from '../utils/LocalStorageUtils';
// import OrderActivity from '../child-components/OrderActivity';
// import ConnectionStatus from '../components/ConnectionStatus';

// const SubTeamViewOrderList = ({ orderType }) => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const { user } = useAuth();
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [showTimeLineModal, setShowTimeLineModal] = useState(false);
//   const [showModal, setShowModal] = useState(false);



//   const handleClose = () => {
//     setShowModal(false);
//   };

//   const teamType = useMemo(() => determineTeamType(user.team), [user.team]);
//   const teamColumns = useMemo(() => getTeamTypeSpecificColumns(teamType), [teamType]);

//   useEffect(() => {
//     // First, try to get orders from local storage
//     const storedOrders = getOrdersFromLocalStorage(user);

//     if (storedOrders.length > 0) {
//       setOrders(storedOrders);
//       setLoading(false);
//     }

//     // Fetch fresh orders from the server
//     fetchOrders();
//   }, [orderType, user]);

//   // Setup cross-tab sync using local storage updates
//   useEffect(() => {
//     const cleanup = setupLocalStorageSync(user, (updatedOrders) => {
//       setOrders(updatedOrders);
//     });

//     return cleanup;
//   }, [user]);

//   const fetchOrders = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`http://localhost:5000/orders/${orderType}`, {
//         params: { team: user.team }
//       });

//       // Update local storage and component state
//       const updatedOrders = updateLocalStorageOrders(user, response.data.orders);
//       setOrders(updatedOrders);
//     } catch (error) {
//       console.error("Error fetching orders:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [orderType, user]);

//   const handleOrderUpdated = useCallback((updatedOrder) => {
//     const updatedOrders = orders.map(order =>
//       order._id === updatedOrder._id ? {
//         ...updatedOrder,
//         // Optionally, add a manual timestamp update here
//         lastUpdatedTimestamp: new Date().toISOString()
//       } : order
//     );

//     // Save to local storage and update state
//     saveOrdersToLocalStorage(user, updatedOrders);
//     setOrders(updatedOrders);
//   }, [orders, user]);

//   useEffect(() => {
//     fetchOrders();
//   }, [fetchOrders]);

//   const handleEditOrder = useCallback((order) => {
//     setSelectedOrder(order);
//     setShowModal(true);
//   }, []);


//   const handleTimeLineOrder = (order) => {
//     setSelectedOrder(order);
//     setShowTimeLineModal(true)
//   }


//   const filteredOrders = useMemo(() => {
//     if (!searchTerm) return orders;
//     return orders.filter(order =>
//       order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.dispatcher_name.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [orders, searchTerm]);

//   const getStatusIcon = useCallback((status) => {
//     switch (status) {
//       case 'Completed': return <CheckCircle className="w-4 h-4" />;
//       case 'Pending': return <img src="./download.svg" alt="" className='w-5 filter drop-shadow-md' />;
//       default: return null;
//     }
//   }, []);

  

//   const getRemainingQuantity = useCallback((order, item) => {
//     // Use team_tracking from the order details to get the remaining quantity
//     const teamTrackingItem = order.order_details[teamType]?.find(
//       orderItem => orderItem._id === item._id
//     );

//     if (!teamTrackingItem || !teamTrackingItem.team_tracking) {
//       return item.quantity;
//     }

//     const totalCompletedQty = teamTrackingItem.team_tracking.total_completed_qty || 0;
//     return Math.max(0, item.quantity - totalCompletedQty);
//   }, [teamType]);

//   const getLastUpdateTime = useCallback((order, item) => {
//     if (!order || !item) return null;

//     if (order.lastUpdatedTimestamp) {
//       return new Date(order.lastUpdatedTimestamp).toLocaleString();
//     }

//     const teamTrackingItem = order.order_details[teamType]?.find(
//       orderItem => orderItem._id === item._id
//     );

//     if (!teamTrackingItem || !teamTrackingItem.team_tracking?.completed_entries?.length) {
//       return null;
//     }

//     const latestEntry = teamTrackingItem.team_tracking.completed_entries[
//       teamTrackingItem.team_tracking.completed_entries.length - 1
//     ];

//     return new Date(latestEntry.timestamp).toLocaleString();
//   }, [teamType]);


 
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="text-center">
//           <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
//           <p className="mt-4 text-gray-600 font-medium">Loading orders...</p>
//         </div>
//       </div>
//     );
//   }

//   if (orders.length === 0) {
//     return (
//       <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-200">
//         <div className="py-8">
//           <FileText className="w-16 h-16 text-orange-300 mx-auto mb-4" />
//           <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
//           <p className="text-gray-600">No {orderType === 'liveOrders' ? 'live' : 'past'} orders found for your team.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 h-full flex flex-col">
//       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
//         <h2 className="text-md font-bold text-gray-800 flex items-center">
//           {orderType === 'liveOrders' ? 'Active Orders' : 'Past Orders'}
//           <span className="ml-3 text-sm font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
//             {orders.length}
//           </span>
//           <div className='ml-3'>
//           <ConnectionStatus />
//           </div>
         
//         </h2>

//         <div className="flex flex-col sm:flex-row gap-3">
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="h-4 w-4 text-gray-400" />
//             </div>
//             <input
//               type="text"
//               className="pl-10 pr-4 py-1 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm"
//               placeholder="Search orders..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           {/* <button
//             onClick={fetchOrders}
//             className="flex items-center gap-1 text-orange-600 hover:text-orange-800"
//           >
//             <RefreshCw className="h-4 w-4" />
//             <span>Refresh</span>
//           </button> */}
//           <BsFiletypeCsv size={28} className='text-[#FF6900] hover:text-[#FF6900]' />
//         </div>
//       </div>

//       <div className="flex-1 min-h-0 relative bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
//         <div className="absolute inset-0 overflow-auto">
//           <table className="min-w-full divide-y divide-gray-200 table-fixed">
//             <thead className="bg-gray-100 font-semibold sticky top-0 z-10">
//               <tr>
//                 {[
//                   "Order Details",
//                   "Item",
//                   "Quantity",
//                   "Remaining",
//                   "Last Updated",
//                   ...teamColumns.map(col => col.label),
//                   "Status",
//                   "Actions",
//                   "history"
//                 ].map((header, index) => (
//                   <th
//                     key={index}
//                     scope="col"
//                     className="px-3 py-2 text-left text-sm font-bold uppercase tracking-wider text-[#A53107]"
//                   >
//                     {header}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredOrders.map((order, orderIndex) => {
//                 const orderItems = getOrderItems(order, teamType);
//                 const rowBgColor = orderIndex % 2 === 0 ? 'bg-white' : 'bg-amber-50';

//                 return (
//                   <React.Fragment key={order._id}>
//                     {orderItems.map((item, itemIndex) => {
//                       const isFirstItemInOrder = itemIndex === 0;
//                       const remainingQuantity = getRemainingQuantity(order, item);
//                       const lastUpdated = getLastUpdateTime(order, item);
//                       const isPartiallyCompleted = remainingQuantity < item.quantity;

//                       return (
//                         <tr
//                           key={`${order._id}-${itemIndex}`}
//                           className={`hover:bg-orange-50 transition-colors duration-150 ${rowBgColor}`}
//                         >
//                           {isFirstItemInOrder && (
//                             <td
//                               className={`px-3 py-2 border-r border-gray-200 ${rowBgColor}`}
//                               rowSpan={orderItems.length}
//                             >
//                               <div className="flex flex-col">
//                                 <div className="text-sm font-bold text-[#FF6900] mb-1">
//                                   <span>Order No: </span>
//                                   <span className="text-black font-semibold">{order.order_number}</span>
//                                 </div>
//                                 <div className="text-sm font-bold text-[#FF6900] mb-1">
//                                   <span>Customer: </span>
//                                   <span className="text-black font-semibold">{order.customer_name}</span>
//                                 </div>
//                                 <div className="text-sm font-bold text-[#FF6900] mb-1">
//                                   <span>Created: </span>
//                                   <span className="text-black font-semibold">{new Date(order.createdAt).toLocaleDateString()}</span>
//                                 </div>
//                                 <div className="text-sm font-bold text-[#FF6900]">
//                                   <span>Dispatcher: </span>
//                                   <span className="text-black font-semibold">{order.dispatcher_name}</span>
//                                 </div>
//                               </div>
//                             </td>
//                           )}
//                           <td className="px-3 py-2 whitespace-nowrap text-sm text-black font-semibold">
//                             {getItemName(item, teamType)}
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap text-sm text-black font-semibold">
//                             {item.quantity || 'N/A'}
//                           </td>
//                           <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${isPartiallyCompleted ? 'text-orange-600' : 'text-black'}`}>
//                             {remainingQuantity === 0 ? 'done' : remainingQuantity}
//                           </td>
//                           <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
//                             {lastUpdated ? lastUpdated : 'Not updated'}
//                           </td>
//                           {teamColumns.map((column) => (
//                             <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
//                               {getCellValue(item, column)}
//                             </td>
//                           ))}
//                           <td className="px-3 py-2 whitespace-nowrap border-r-2 border-gray-100">
//                             <span className="inline-flex items-center ml-4">
//                               {remainingQuantity === 0 ?
//                                 <CheckCircle className="h-7 w-5 text-green-500" /> :
//                                 getStatusIcon(item.status)}
//                             </span>
//                           </td>

//                           {isFirstItemInOrder ? (
//                             <td className="px-3 py-2 justify-center items-center whitespace-nowrap" rowSpan={orderItems.length}>
//                               <button
//                                 onClick={() => handleEditOrder(order)}
//                                 className="p-1 ml-5 text-gray-500 hover:text-[#FF6900]"
//                                 aria-label="Edit order"
//                               >
//                                 <FaPencil size={16} />
//                               </button>
//                             </td>
//                           ) : null}

//                           {isFirstItemInOrder ? (
//                             <td className="px-3 py-2 justify-center items-center whitespace-nowrap" rowSpan={orderItems.length}>
//                               <button
//                                 onClick={() => handleTimeLineOrder(order)}
//                                 className="p-1 ml-5 text-gray-500 hover:text-[#FF6900]"
//                                 aria-label="Edit order"
//                               >
//                                 <TbTimelineEvent size={16} />
//                               </button>
//                             </td>
//                           ) : null}
//                         </tr>
//                       );
//                     })}
//                     {orderIndex < filteredOrders.length - 1 && (
//                       <tr className="border-b-2 border-amber-50">
//                         <td colSpan={8 + teamColumns.length} className="p-0"></td>
//                       </tr>
//                     )}
//                   </React.Fragment>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {showModal && <EditTodaysCompletedOrder
//         onClose={handleClose}
//         selectedOrder={selectedOrder}
//         onOrderUpdated={handleOrderUpdated}
//       />}
//       {
//         showTimeLineModal && <OrderActivity onClose={handleClose} orderData={selectedOrder} />
//       }
//     </div>
//   );
// };

// export default SubTeamViewOrderList;
