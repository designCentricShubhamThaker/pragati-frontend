// import React, { useState } from 'react';
// import { CalendarDays, Package, Clock, Check, Filter, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

// const OrderTimeline = ({ orderData }) => {
//   const [selectedItem, setSelectedItem] = useState('all');
//   const [expandedSections, setExpandedSections] = useState({});

//   // Helper function to format timestamps
//   const formatTimestamp = (timestamp) => {
//     try {
//       if (!timestamp) return 'N/A';
//       // Handle MongoDB timestamp format ($date.$numberLong)
//       const timeMs = typeof timestamp === 'object' && timestamp.$date && timestamp.$date.$numberLong
//         ? parseInt(timestamp.$date.$numberLong)
//         : new Date(timestamp).getTime();

//       if (isNaN(timeMs)) return 'N/A';

//       const date = new Date(timeMs);
//       return `${date.toLocaleDateString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric'
//       })} • ${date.toLocaleTimeString('en-US', {
//         hour: '2-digit',
//         minute: '2-digit'
//       })}`;
//     } catch (error) {
//       return 'N/A';
//     }
//   };

//   // Get relative time (e.g., "2 hours ago")
//   const getRelativeTime = (timestamp) => {
//     try {
//       if (!timestamp) return '';

//       const timeMs = typeof timestamp === 'object' && timestamp.$date && timestamp.$date.$numberLong
//         ? parseInt(timestamp.$date.$numberLong)
//         : new Date(timestamp).getTime();

//       if (isNaN(timeMs)) return '';

//       const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
//       const now = new Date().getTime();
//       const diff = timeMs - now;

//       const seconds = Math.floor(diff / 1000);
//       const minutes = Math.floor(seconds / 60);
//       const hours = Math.floor(minutes / 60);
//       const days = Math.floor(hours / 24);

//       if (days < -1) return rtf.format(days, 'day');
//       if (hours < -1) return rtf.format(hours, 'hour');
//       if (minutes < -1) return rtf.format(minutes, 'minute');
//       if (seconds < -60) return rtf.format(minutes, 'minute');
//       return rtf.format(seconds, 'second');
//     } catch (error) {
//       return '';
//     }
//   };

//   // Toggle section expansion
//   const toggleSection = (id) => {
//     setExpandedSections(prev => ({
//       ...prev,
//       [id]: !prev[id]
//     }));
//   };

//   // Parse integer from MongoDB format
//   const parseIntFromMongo = (value) => {
//     if (!value) return 0;
//     if (typeof value === 'number') return value;
//     if (typeof value === 'object' && value.$numberInt) {
//       return parseInt(value.$numberInt);
//     }
//     return 0;
//   };

//   // Filter items based on selection
//   const getFilteredItems = () => {
//     const { order_details } = orderData;
//     let items = [];

//     if (selectedItem === 'all' || selectedItem === 'glass') {
//       items = [
//         ...items,
//         ...(order_details.glass || []).map(item => ({
//           ...item,
//           type: 'glass',
//           display_name: `${item.glass_name} (${item.weight}, ${item.neck_size})`,
//           quantity: parseIntFromMongo(item.quantity),
//           completed_qty: parseIntFromMongo(item.team_tracking?.total_completed_qty)
//         }))
//       ];
//     }

//     if (selectedItem === 'all' || selectedItem === 'caps') {
//       items = [
//         ...items,
//         ...(order_details.caps || []).map(item => ({
//           ...item,
//           type: 'caps',
//           display_name: `${item.cap_name} (${item.process}, ${item.material})`,
//           quantity: parseIntFromMongo(item.quantity),
//           completed_qty: parseIntFromMongo(item.team_tracking?.total_completed_qty)
//         }))
//       ];
//     }

//     if (selectedItem === 'all' || selectedItem === 'boxes') {
//       items = [
//         ...items,
//         ...(order_details.boxes || []).map(item => ({
//           ...item,
//           type: 'boxes',
//           display_name: `${item.box_name} (Code: ${item.approval_code})`,
//           quantity: parseIntFromMongo(item.quantity),
//           completed_qty: parseIntFromMongo(item.team_tracking?.total_completed_qty)
//         }))
//       ];
//     }

//     if (selectedItem === 'all' || selectedItem === 'pumps') {
//       items = [
//         ...items,
//         ...(order_details.pumps || []).map(item => ({
//           ...item,
//           type: 'pumps',
//           display_name: `${item.pump_name} (${item.neck_type})`,
//           quantity: parseIntFromMongo(item.quantity),
//           completed_qty: parseIntFromMongo(item.team_tracking?.total_completed_qty)
//         }))
//       ];
//     }

//     return items;
//   };

//   const calculateProgress = (item) => {
//     if (!item.quantity || !item.completed_qty) return 0;
//     return Math.min(100, Math.floor((item.completed_qty / item.quantity) * 100));
//   };

//   const parseCompletedEntry = (entry) => {
//     if (!entry) return { qty: 0, time: null };
//     return {
//       qty: parseIntFromMongo(entry.qty_completed),
//       time: entry.timestamp
//     };
//   };

//   // Get an item's icon based on type
//   const getItemIcon = (type) => {
//     switch (type) {
//       case 'glass':
//         return <Package size={20} />;
//       case 'caps':
//         return <Package size={20} />;
//       case 'boxes':
//         return <Package size={20} />;
//       case 'pumps':
//         return <Package size={20} />;
//       default:
//         return <Package size={20} />;
//     }
//   };

//   // Get status badge color
//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'Completed':
//         return 'bg-green-100 text-green-800 border-green-200';
//       case 'In Progress':
//         return 'bg-blue-100 text-blue-800 border-blue-200';
//       case 'Pending':
//         return 'bg-orange-100 text-orange-800 border-orange-200';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   // Get background color for timeline entry
//   const getTimelineEntryColor = (isCompleted, isFirst) => {
//     if (isCompleted) return 'bg-green-50 border-green-100';
//     if (isFirst) return 'bg-blue-50 border-blue-100';
//     return 'bg-orange-50 border-orange-100';
//   };

//   const filteredItems = getFilteredItems();

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
//       {/* Header Section with Order Info */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
//         <div>
//           <div className="flex items-center gap-2">
//             <h2 className="text-2xl font-bold text-gray-800">Order #{orderData.order_number}</h2>
//             <div className={`px-3 py-1 rounded-full text-sm font-medium ${orderData.order_status === 'Completed' ? 'bg-green-100 text-green-800' :
//                 orderData.order_status === 'Pending' ? 'bg-orange-100 text-orange-800' :
//                   'bg-blue-100 text-blue-800'
//               }`}>
//               {orderData.order_status}
//             </div>
//           </div>
//           <p className="text-gray-600 mt-1">
//             <span className="font-medium">Customer:</span> {orderData.customer_name} •
//             <span className="font-medium ml-2">Dispatcher:</span> {orderData.dispatcher_name}
//           </p>
//           <div className="flex items-center mt-2">
//             <span className="text-gray-500 text-sm flex items-center">
//               <Clock size={14} className="inline mr-1" />
//               Created: {formatTimestamp(orderData.created_at)}
//             </span>
//             <span className="text-gray-500 ml-3 text-sm flex items-center">
//               <CalendarDays size={14} className="inline mr-1" />
//               Last Updated: {formatTimestamp(orderData.updatedAt)}
//             </span>
//           </div>
//         </div>

//         <div className="flex items-center bg-gray-100 rounded-md p-1">
//           <Filter size={16} className="ml-2 text-gray-500" />
//           <select
//             className="bg-transparent py-2 pl-2 pr-8 rounded-md border-0 text-gray-500 focus:ring-0 text-sm"
//             value={selectedItem}
//             onChange={(e) => setSelectedItem(e.target.value)}
//           >
//             <option value="all">All Items</option>
//             <option value="glass">Glass</option>
//             <option value="caps">Caps</option>
//             <option value="boxes">Boxes</option>
//             <option value="pumps">Pumps</option>
//           </select>
//         </div>
//       </div>

//       {/* Order progress summary */}
//       <div className="mb-8 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
//         <h3 className="text-lg font-medium text-gray-700 mb-2">Order Progress Summary</h3>
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           {['glass', 'caps', 'boxes', 'pumps'].map(type => {
//             const items = orderData.order_details[type] || [];
//             const totalQuantity = items.reduce((sum, item) => sum + parseIntFromMongo(item.quantity), 0);
//             const completedQuantity = items.reduce((sum, item) => sum + parseIntFromMongo(item.team_tracking?.total_completed_qty || 0), 0);
//             const progress = totalQuantity ? Math.floor((completedQuantity / totalQuantity) * 100) : 0;

//             return (
//               <div key={type} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-sm font-medium capitalize">{type}</span>
//                   <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{items.length} items</span>
//                 </div>
//                 <div className="flex items-center gap-2 mb-1">
//                   <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
//                     <div
//                       className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
//                         }`}
//                       style={{ width: `${progress}%` }}
//                     ></div>
//                   </div>
//                   <span className="text-sm font-medium whitespace-nowrap">
//                     {progress}%
//                   </span>
//                 </div>
//                 <div className="text-xs text-gray-500">
//                   {completedQuantity.toLocaleString()} / {totalQuantity.toLocaleString()} units
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Items list with detailed tracking */}
//       <div className="space-y-4">
//         {filteredItems.length > 0 ? filteredItems.map((item, index) => {
//           const itemId = `${item.type}-${index}`;
//           const isExpanded = expandedSections[itemId] || false;
//           const progress = calculateProgress(item);
//           const entries = item.team_tracking?.completed_entries || [];
//           const isCompleted = item.team_tracking?.status === 'Completed';

//           // Process and sort entries - ensuring chronological order (oldest first)
//           const processedEntries = entries.map(parseCompletedEntry)
//             .filter(entry => entry.qty > 0)
//             .sort((a, b) => {
//               // Handle MongoDB timestamp format for sorting
//               const getTimeValue = (timestamp) => {
//                 if (!timestamp) return 0;
//                 if (typeof timestamp === 'object' && timestamp.$date && timestamp.$date.$numberLong) {
//                   return parseInt(timestamp.$date.$numberLong);
//                 }
//                 return new Date(timestamp).getTime();
//               };

//               // Sort by time ascending (oldest first)
//               return getTimeValue(a.time) - getTimeValue(b.time);
//             });

//           // Calculate cumulative quantities and progress for each entry
//           let cumulativeEntries = [];
//           let runningTotal = 0;
          
//           processedEntries.forEach((entry, idx) => {
//             runningTotal += entry.qty;
//             const entryProgress = Math.min(100, Math.floor((runningTotal / item.quantity) * 100));
            
//             cumulativeEntries.push({
//               ...entry,
//               cumulativeQty: runningTotal,
//               progress: entryProgress,
//               isCompleted: runningTotal >= item.quantity,
//               remainingUnits: Math.max(0, item.quantity - runningTotal)
//             });
//           });

//           // Simple production rate calculation
//           let productionRate = null;
//           if (processedEntries.length >= 2) {
//             const latest = processedEntries[processedEntries.length - 1];
//             const previous = processedEntries[processedEntries.length - 2];

//             const getTimeValue = (timestamp) => {
//               if (!timestamp) return 0;
//               if (typeof timestamp === 'object' && timestamp.$date && timestamp.$date.$numberLong) {
//                 return parseInt(timestamp.$date.$numberLong);
//               }
//               return new Date(timestamp).getTime();
//             };

//             const timeDiff = (getTimeValue(latest.time) - getTimeValue(previous.time)) / (1000 * 60 * 60); // hours
//             if (timeDiff > 0) {
//               productionRate = Math.round(latest.qty / timeDiff);
//             }
//           }

//           // Get production state text
//           const getProductionStateText = () => {
//             if (isCompleted) return "Production complete";
//             if (processedEntries.length === 0) return "Production not started";
//             return "Production in progress";
//           };

//           return (
//             <div
//               key={itemId}
//               className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
//             >
//               <div
//                 className={`px-4 py-4 flex items-center justify-between cursor-pointer transition-colors duration-200 ${isExpanded ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'
//                   }`}
//                 onClick={() => toggleSection(itemId)}
//               >
//                 <div className="flex items-start">
//                   <div className={`p-2 rounded-md mr-3 ${item.type === 'glass' ? 'bg-orange-100 text-orange-600' :
//                       item.type === 'caps' ? 'bg-blue-100 text-blue-600' :
//                         item.type === 'boxes' ? 'bg-green-100 text-green-600' :
//                           'bg-purple-100 text-purple-600'
//                     }`}>
//                     {getItemIcon(item.type)}
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-gray-800">{item.display_name}</h3>
//                     <div className="flex flex-wrap gap-2 mt-1">
//                       <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
//                         Qty: {item.quantity.toLocaleString()}
//                       </span>
//                       {item.decoration && (
//                         <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
//                           {item.decoration} ({item.decoration_no})
//                         </span>
//                       )}
//                       {item.team && (
//                         <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
//                           Team: {item.team}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-4">
//                   <div className="hidden sm:block">
//                     <div className="flex items-center gap-2">
//                       <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
//                         <div
//                           className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 
//                               progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
//                             }`}
//                           style={{ width: `${progress}%` }}
//                         ></div>
//                       </div>
//                       <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 
//                           progress > 0 ? 'text-blue-600' : 'text-gray-600'
//                         }`}>
//                         {progress}%
//                       </span>
//                     </div>
//                     <div className="flex items-center mt-1">
//                       <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(item.team_tracking?.status)
//                         }`}>
//                         {getProductionStateText()}
//                       </span>
//                       {isCompleted && (
//                         <span className="text-xs text-green-600 flex items-center ml-2">
//                           <Check size={12} className="mr-1" /> Done
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className={`p-1 rounded-full ${isExpanded ? 'bg-gray-200' : 'bg-gray-100'}`}>
//                     {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
//                   </div>
//                 </div>
//               </div>

//               {isExpanded && (
//                 <div className="p-4 bg-white border-t border-gray-200">
//                   <div className="sm:hidden mb-4">
//                     <div className="flex items-center gap-2 mb-1">
//                       <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
//                         <div
//                           className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 
//                               progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
//                             }`}
//                           style={{ width: `${progress}%` }}
//                         ></div>
//                       </div>
//                       <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 
//                           progress > 0 ? 'text-blue-600' : 'text-gray-600'
//                         }`}>
//                         {progress}%
//                       </span>
//                     </div>
//                     <div className="flex items-center mt-1">
//                       <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(item.team_tracking?.status)
//                         }`}>
//                         {getProductionStateText()}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Simple production info - only if there's data */}
//                   {processedEntries.length > 0 && (
//                     <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
//                       <h4 className="text-sm font-medium text-blue-700 mb-1">Production Info</h4>
//                       <div className="flex items-center gap-4">
//                         {productionRate && (
//                           <div>
//                             <div className="text-xs text-gray-500">Production Rate</div>
//                             <div className="text-lg font-semibold text-blue-800">{productionRate} units/hr</div>
//                           </div>
//                         )}
//                         <div>
//                           <div className="text-xs text-gray-500">Completed</div>
//                           <div className="text-lg font-semibold text-blue-800">
//                             {item.completed_qty.toLocaleString()} / {item.quantity.toLocaleString()}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Timeline visualization */}
//                   <div className="border-l-2 border-blue-500 pl-6 ml-4 relative">
//                     {cumulativeEntries.length > 0 ? (
//                       cumulativeEntries.map((entry, entryIndex) => {
//                         const isFirst = entryIndex === 0;
//                         const isLast = entryIndex === cumulativeEntries.length - 1;
//                         const isComplete = entry.cumulativeQty >= item.quantity;
//                         const hasMoreEntries = entryIndex < cumulativeEntries.length - 1;
                        
//                         // Background color based on entry status
//                         const cardBgColor = isComplete ? 'bg-green-50 border-green-100' : 
//                                            isLast ? 'bg-blue-50 border-blue-100' : 
//                                            'bg-orange-50 border-orange-100';
                        
//                         // Status badge color and text
//                         const statusBadgeColor = isComplete ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
//                         const statusText = isComplete ? 'completed' : (isFirst ? 'started' : 'added');

//                         return (
//                           <div key={entryIndex} className="mb-6 relative">
//                             <div className={`absolute -left-8 mt-1 w-4 h-4 rounded-full ${
//                                 isComplete ? 'bg-green-500' : 
//                                 isLast ? 'bg-blue-500' : 'bg-orange-500'
//                               } border-4 border-white`}></div>

//                             <div className={`rounded-lg p-4 border ${cardBgColor}`}>
//                               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
//                                 <span className="text-sm text-gray-700 flex items-center font-medium">
//                                   <CalendarDays size={14} className="mr-1" />
//                                   {formatTimestamp(entry.time)}
//                                   <span className="text-xs text-gray-500 ml-2">
//                                     {getRelativeTime(entry.time)}
//                                   </span>
//                                 </span>
//                                 <span className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center ${statusBadgeColor}`}>
//                                   {isComplete && <Check size={12} className="mr-1" />}
//                                   {entry.qty.toLocaleString()} units {statusText}
//                                 </span>
//                               </div>

//                               <div className="mb-3">
//                                 <p className="text-sm text-gray-700">
//                                   {isFirst ? (
//                                     <span>Started production with initial batch.</span>
//                                   ) : isComplete ? (
//                                     <span className="text-green-700 font-medium">
//                                       Completed full production run. All units finished.
//                                     </span>
//                                   ) : (
//                                     <span>
//                                       Production batch completed. {entry.remainingUnits > 0 ? 
//                                         `${entry.remainingUnits.toLocaleString()} units remaining.` : 
//                                         ''}
//                                     </span>
//                                   )}
//                                 </p>
//                               </div>

//                               <div className="flex justify-between items-center">
//                                 <div>
//                                   <div className="text-xs text-gray-500 mb-1">Progress at this point</div>
//                                   <div className="flex items-center gap-2">
//                                     <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
//                                       <div
//                                         className={`h-full rounded-full ${
//                                           entry.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
//                                         }`}
//                                         style={{ width: `${entry.progress}%` }}
//                                       ></div>
//                                     </div>
//                                     <span className="text-xs font-medium">
//                                       {entry.progress}% ({entry.cumulativeQty.toLocaleString()} of {item.quantity.toLocaleString()})
//                                     </span>
//                                   </div>
//                                 </div>

//                                 {isComplete && (
//                                   <span className="flex items-center text-green-600 text-sm font-medium">
//                                     <Check size={16} className="mr-1" /> Production Complete
//                                   </span>
//                                 )}
//                               </div>
                              
//                               {hasMoreEntries && (
//                                 <div className="mt-2 text-right text-xs text-gray-500">
//                                   Time to next entry: {(() => {
//                                     const current = new Date(typeof entry.time === 'object' && entry.time.$date ?
//                                       parseInt(entry.time.$date.$numberLong) : entry.time).getTime();
//                                     const next = new Date(typeof cumulativeEntries[entryIndex + 1].time === 'object' &&
//                                       cumulativeEntries[entryIndex + 1].time.$date ?
//                                       parseInt(cumulativeEntries[entryIndex + 1].time.$date.$numberLong) :
//                                       cumulativeEntries[entryIndex + 1].time).getTime();

//                                     const diffMs = next - current; // Use next - current for positive time
//                                     const diffMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
//                                     const diffHours = Math.floor(diffMins / 60);
//                                     const remainingMins = diffMins % 60;

//                                     if (diffHours > 0) {
//                                       return `${diffHours}h ${remainingMins}m`;
//                                     }
//                                     return `${diffMins}m`;
//                                   })()}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <div className="mb-6 relative">
//                         <div className="absolute -left-8 mt-1 w-4 h-4 rounded-full bg-gray-300 border-4 border-white"></div>
//                         <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//                           <div className="flex items-center justify-between mb-2">
//                             <span className="text-sm text-gray-500 flex items-center">
//                               <Clock size={14} className="mr-1" />
//                               Pending
//                             </span>
//                             <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
//                               Not started
//                             </span>
//                           </div>
//                           <p className="text-sm text-gray-700 flex items-center">
//                             <AlertTriangle size={14} className="mr-1 text-orange-500" />
//                             Production has not been started. {item.quantity.toLocaleString()} units pending.
//                           </p>
//                         </div>
//                       </div>
//                     )}

//                     {cumulativeEntries.length > 0 && !isCompleted && (
//                       <div className="mb-6 relative">
//                         <div className="absolute -left-8 mt-1 w-4 h-4 rounded-full bg-gray-300 border-4 border-white"></div>
//                         <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
//                           <div className="flex items-center justify-between mb-2">
//                             <span className="text-sm text-gray-600 font-medium">Upcoming</span>
//                             <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
//                               {(item.quantity - item.completed_qty).toLocaleString()} more units
//                             </span>
//                           </div>
//                           <p className="text-sm text-gray-700">
//                             {item.quantity > item.completed_qty ?
//                               `${((item.quantity - item.completed_qty) / item.quantity * 100).toFixed(1)}% of production remaining.` :
//                               'All units have been produced. Awaiting final verification.'}
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Notes section */}
//                   {item.notes && (
//                     <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
//                       <h4 className="text-sm font-medium text-gray-700 mb-1">Production Notes</h4>
//                       <p className="text-sm text-gray-600">{item.notes}</p>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           );
//         }) : (
//           <div className="text-center py-8 px-4 bg-gray-50 rounded--lg border border-gray-200">
//             <p className="text-gray-600">No items found matching the selected filter.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };





// const OrderTimelineModal = () => {
//   // Parse the JSON string to get the order data
//   const orderData = {
//     "_id": { "$oid": "67e658e07f158dd7f852dfa5" },
//     "order_number": "1",
//     "dispatcher_name": "Rajesh Kumar",
//     "customer_name": "Priya Patel",
//     "order_status": "Pending",
//     "order_details": {
//       "glass": [
//         {
//           "glass_name": "Bottle A",
//           "quantity": { "$numberInt": "2000" },
//           "weight": "200ml",
//           "neck_size": "round",
//           "decoration": "Printing",
//           "decoration_no": "1200",
//           "decoration_details": { "type": "Printing", "decoration_number": "1200" },
//           "team": "",
//           "status": "Pending",
//           "team_tracking": {
//             "total_completed_qty": { "$numberInt": "2000" },
//             "status": "Completed",
//             "completed_entries": [
//               { "qty_completed": { "$numberInt": "180" }, "timestamp": { "$date": { "$numberLong": "1743149338783" } }, "_id": { "$oid": "67e6591a7f158dd7f852dfb8" } },
//               { "qty_completed": { "$numberInt": "50" }, "timestamp": { "$date": { "$numberLong": "1743149379758" } }, "_id": { "$oid": "67e659437f158dd7f852dfc1" } },
//               { "qty_completed": { "$numberInt": "770" }, "timestamp": { "$date": { "$numberLong": "1743149420150" } }, "_id": { "$oid": "67e6596c7f158dd7f852dfcb" } },
//               { "qty_completed": { "$numberInt": "501" }, "timestamp": { "$date": { "$numberLong": "1743152386319" } }, "_id": { "$oid": "67e665027f158dd7f852dfe2" } },
//               { "qty_completed": { "$numberInt": "400" }, "timestamp": { "$date": { "$numberLong": "1743153490992" } }, "_id": { "$oid": "67e669527f158dd7f852e0ed" } },
//               { "qty_completed": { "$numberInt": "88" }, "timestamp": { "$date": { "$numberLong": "1743153645735" } }, "_id": { "$oid": "67e669ed7f158dd7f852e119" } },
//               { "qty_completed": { "$numberInt": "11" }, "timestamp": { "$date": { "$numberLong": "1743154716136" } }, "_id": { "$oid": "67e66e1c7f158dd7f852e1d4" } }
//             ]
//           },
//           "_id": { "$oid": "67e658e07f158dd7f852dfa6" }
//         },
//         {
//           "glass_name": "Bottle A",
//           "quantity": { "$numberInt": "38000" },
//           "weight": "200ml",
//           "neck_size": "square",
//           "decoration": "Printing",
//           "decoration_no": "1455",
//           "decoration_details": { "type": "Printing", "decoration_number": "1455" },
//           "team": "Glass Manufacturing - Mumbai",
//           "status": "Pending",
//           "team_tracking": {
//             "total_completed_qty": { "$numberInt": "38000" },
//             "status": "Completed",
//             "completed_entries": [
//               { "qty_completed": { "$numberInt": "3700" }, "timestamp": { "$date": { "$numberLong": "1743152650105" } }, "_id": { "$oid": "67e6660a7f158dd7f852e018" } },
//               { "qty_completed": { "$numberInt": "3700" }, "timestamp": { "$date": { "$numberLong": "1743152691935" } }, "_id": { "$oid": "67e666337f158dd7f852e035" } },
//               { "qty_completed": { "$numberInt": "600" }, "timestamp": { "$date": { "$numberLong": "1743152713323" } }, "_id": { "$oid": "67e666497f158dd7f852e055" } },
//               { "qty_completed": { "$numberInt": "3000" }, "timestamp": { "$date": { "$numberLong": "1743152888462" } }, "_id": { "$oid": "67e666f87f158dd7f852e0a0" } },
//               { "qty_completed": { "$numberInt": "1700" }, "timestamp": { "$date": { "$numberLong": "1743153474516" } }, "_id": { "$oid": "67e669427f158dd7f852e0dc" } },
//               { "qty_completed": { "$numberInt": "25000" }, "timestamp": { "$date": { "$numberLong": "1743160962788" } }, "_id": { "$oid": "67e686827f158dd7f852e29c" } },
//               { "qty_completed": { "$numberInt": "200" }, "timestamp": { "$date": { "$numberLong": "1743160981655" } }, "_id": { "$oid": "67e686957f158dd7f852e2b1" } },
//               { "qty_completed": { "$numberInt": "100" }, "timestamp": { "$date": { "$numberLong": "1743160990585" } }, "_id": { "$oid": "67e6869e7f158dd7f852e2c7" } }
//             ]
//           },
//           "_id": { "$oid": "67e658e07f158dd7f852dfa7" }
//         }
//       ],
//       "caps": [
//         {
//           "cap_name": "Cap A",
//           "neck_size": "round",
//           "quantity": { "$numberInt": "2500" },
//           "process": "Metalised",
//           "material": "Plastic",
//           "team": "",
//           "status": "Pending",
//           "team_tracking": {
//             "total_completed_qty": { "$numberInt": "0" },
//             "status": "Pending",
//             "completed_entries": []
//           },
//           "_id": { "$oid": "67e658e07f158dd7f852dfa8" }
//         }
//       ],
//       "boxes": [
//         {
//           "box_name": "Box A",
//           "quantity": { "$numberInt": "1200" },
//           "approval_code": "4562",
//           "team": "",
//           "status": "Pending",
//           "team_tracking": {
//             "total_completed_qty": { "$numberInt": "0" },
//             "status": "Pending",
//             "completed_entries": []
//           },
//           "_id": { "$oid": "67e658e07f158dd7f852dfa9" }
//         }
//       ],
//       "pumps": [
//         {
//           "pump_name": "Pump A",
//           "neck_type": "sqaure",
//           "quantity": { "$numberInt": "4000" },
//           "team": "",
//           "status": "Pending",
//           "team_tracking": {
//             "total_completed_qty": { "$numberInt": "0" },
//             "status": "Pending",
//             "completed_entries": []
//           },
//           "_id": { "$oid": "67e658e07f158dd7f852dfaa" }
//         }
//       ]
//     },
//     "created_at": { "$date": { "$numberLong": "1743149280453" } },
//     "createdAt": { "$date": { "$numberLong": "1743149280457" } },
//     "updatedAt": { "$date": { "$numberLong": "1743160990588" } },
//     "__v": { "$numberInt": "15" }
//   };

//   return (
//     <div className="bg-gray-100 p-4 min-h-screen">
//       <OrderTimeline orderData={orderData} />
//     </div>
//   );
// };

// export default OrderTimelineModal;