import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { CalendarDays, Package, Clock, Check, Filter, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { PiBeerBottleThin } from "react-icons/pi";
import { GiBottleCap } from "react-icons/gi";
import { FaBox } from "react-icons/fa";
import { FaPumpSoap } from "react-icons/fa";

const OrderActivity = ({ onClose, orderData }) => {
  const [selectedItem, setSelectedItem] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});

  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return 'N/A';
      const timeMs = typeof timestamp === 'object' && timestamp.$date && timestamp.$date.$numberLong
        ? parseInt(timestamp.$date.$numberLong)
        : new Date(timestamp).getTime();

      if (isNaN(timeMs)) return 'N/A';

      const date = new Date(timeMs);
      return `${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })} • ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } catch (error) {
      return 'N/A';
    }
  };

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const parseIntFromMongo = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value.$numberInt) {
      return parseInt(value.$numberInt);
    }
    return 0;
  };

  const getFilteredItems = () => {
    const { order_details } = orderData;
    let items = [];

    if (selectedItem === 'all' || selectedItem === 'glass') {
      items = [
        ...items,
        ...(order_details.glass || []).map(item => ({
          ...item,
          type: 'glass',
          display_name: `${item.glass_name} (${item.weight}, ${item.neck_size})`,
          quantity: parseIntFromMongo(item.quantity),
          completed_qty: parseIntFromMongo(item.team_tracking?.total_completed_qty)
        }))
      ];
    }

    if (selectedItem === 'all' || selectedItem === 'caps') {
      items = [
        ...items,
        ...(order_details.caps || []).map(item => ({
          ...item,
          type: 'caps',
          display_name: `${item.cap_name} (${item.process}, ${item.material})`,
          quantity: parseIntFromMongo(item.quantity),
          completed_qty: parseIntFromMongo(item.team_tracking?.total_completed_qty)
        }))
      ];
    }

    if (selectedItem === 'all' || selectedItem === 'boxes') {
      items = [
        ...items,
        ...(order_details.boxes || []).map(item => ({
          ...item,
          type: 'boxes',
          display_name: `${item.box_name} (Code: ${item.approval_code})`,
          quantity: parseIntFromMongo(item.quantity),
          completed_qty: parseIntFromMongo(item.team_tracking?.total_completed_qty)
        }))
      ];
    }

    if (selectedItem === 'all' || selectedItem === 'pumps') {
      items = [
        ...items,
        ...(order_details.pumps || []).map(item => ({
          ...item,
          type: 'pumps',
          display_name: `${item.pump_name} (${item.neck_type})`,
          quantity: parseIntFromMongo(item.quantity),
          completed_qty: parseIntFromMongo(item.team_tracking?.total_completed_qty)
        }))
      ];
    }

    return items;
  };

  const calculateProgress = (item) => {
    if (!item.quantity || !item.completed_qty) return 0;
    return Math.min(100, Math.floor((item.completed_qty / item.quantity) * 100));
  };

  const parseCompletedEntry = (entry) => {
    if (!entry) return { qty: 0, time: null };
    return {
      qty: parseIntFromMongo(entry.qty_completed),
      time: entry.timestamp
    };
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'glass':
        return <PiBeerBottleThin size={20} />;
      case 'caps':
        return <GiBottleCap size={20} />;
      case 'boxes':
        return <FaBox size={20} />;
      case 'pumps':
        return <FaPumpSoap size={20} />;
      default:
        return <FaPumpSoap size={20} />;
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'text-green-900 bg-tranparent font-semibold px-3 py-1';
      case 'Pending':
        return 'bg-transparent text-red-700 font-semibold px-3 py-1 ';
      default:
        return 'bg-orange-900 text-white font-semibold px-3 py-1';
    }
  };

  // Get summary cards based on filter
  const getSummaryCards = () => {
    const { order_details } = orderData;
    let itemTypes = [];

    if (selectedItem === 'all') {
      itemTypes = ['glass', 'caps', 'boxes', 'pumps'];
    } else {
      itemTypes = [selectedItem];
    }

    return itemTypes.map(type => {
      const items = order_details[type] || [];
      const totalQuantity = items.reduce((sum, item) => sum + parseIntFromMongo(item.quantity), 0);
      const completedQuantity = items.reduce((sum, item) => sum + parseIntFromMongo(item.team_tracking?.total_completed_qty || 0), 0);
      const progress = totalQuantity ? Math.floor((completedQuantity / totalQuantity) * 100) : 0;

      return (
        <div key={type} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium capitalize flex items-center">
              {type === 'glass' && <PiBeerBottleThin size={16} className="mr-1" />}
              {type === 'caps' && <GiBottleCap size={16} className="mr-1" />}
              {type === 'boxes' && <FaBox size={16} className="mr-1" />}
              {type === 'pumps' && <FaPumpSoap size={16} className="mr-1" />}
              {type}
            </span>
            <span className="text-xs font-semibold px-3 py-1  rounded-full  text-gray-800">{items.length} items</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${progress === 100 ? 'bg-green-900' : progress > 0 ? 'bg-orange-600' : 'bg-gray-300'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium whitespace-nowrap">
              {progress}%
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {completedQuantity.toLocaleString()} / {totalQuantity.toLocaleString()} units
          </div>
        </div>
      );
    });
  };

  const filteredItems = getFilteredItems();

  return (
    <Dialog open={true} onClose={onClose} className="relative z-20">
      <DialogBackdrop
        className="fixed inset-0 bg-gray-500/75 transition-opacity"
      />

      <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className="relative transform rounded-lg p-4 bg-white text-left shadow-xl transition-all w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col"
          >

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">Order #{orderData.order_number}</h2>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${orderData.order_status === 'Completed' ? 'bg-green-100 text-green-800' :
                    orderData.order_status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                    {orderData.order_status}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="relative group">
                  <div className="flex items-center px-3 py-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer">
                    <Filter size={16} className="mr-2 text-orange-600" />
                    <select
                      className="bg-transparent appearance-none pr-8 pl-1 text-gray-700 font-medium focus:outline-none focus:ring-0 text-sm"
                      value={selectedItem}
                      onChange={(e) => setSelectedItem(e.target.value)}
                    >
                      <option value="all">All Items</option>
                      <option value="glass">Glass</option>
                      <option value="caps">Caps</option>
                      <option value="boxes">Boxes</option>
                      <option value="pumps">Pumps</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                {selectedItem === 'all' ? 'Order Progress Summary' : `${selectedItem.charAt(0).toUpperCase() + selectedItem.slice(1)} Progress Summary`}
              </h3>
              <div className={`grid grid-cols-1 ${selectedItem === 'all' ? 'md:grid-cols-4' : 'md:grid-cols-1'} gap-4`}>
                {getSummaryCards()}
              </div>
            </div>

            <div className="space-y-4">
              {filteredItems.length > 0 ? filteredItems.map((item, index) => {
                const itemId = `${item.type}-${index}`;
                const isExpanded = expandedSections[itemId] || false;
                const progress = calculateProgress(item);
                const entries = item.team_tracking?.completed_entries || [];
                const isCompleted = item.team_tracking?.status === 'Completed';

                const processedEntries = entries.map(parseCompletedEntry)
                  .filter(entry => entry.qty > 0)
                  .sort((a, b) => {

                    const getTimeValue = (timestamp) => {
                      if (!timestamp) return 0;
                      if (typeof timestamp === 'object' && timestamp.$date && timestamp.$date.$numberLong) {
                        return parseInt(timestamp.$date.$numberLong);
                      }
                      return new Date(timestamp).getTime();
                    };

                    return getTimeValue(a.time) - getTimeValue(b.time);
                  });

                let cumulativeEntries = [];
                let runningTotal = 0;

                processedEntries.forEach((entry, idx) => {
                  runningTotal += entry.qty;
                  const entryProgress = Math.min(100, Math.floor((runningTotal / item.quantity) * 100));

                  cumulativeEntries.push({
                    ...entry,
                    cumulativeQty: runningTotal,
                    progress: entryProgress,
                    isCompleted: runningTotal >= item.quantity,
                    remainingUnits: Math.max(0, item.quantity - runningTotal)
                  });
                });

                let productionRate = null;
                if (processedEntries.length >= 2) {
                  const latest = processedEntries[processedEntries.length - 1];
                  const previous = processedEntries[processedEntries.length - 2];

                  const getTimeValue = (timestamp) => {
                    if (!timestamp) return 0;
                    if (typeof timestamp === 'object' && timestamp.$date && timestamp.$date.$numberLong) {
                      return parseInt(timestamp.$date.$numberLong);
                    }
                    return new Date(timestamp).getTime();
                  };

                  const timeDiff = (getTimeValue(latest.time) - getTimeValue(previous.time)) / (1000 * 60 * 60); // hours
                  if (timeDiff > 0) {
                    productionRate = Math.round(latest.qty / timeDiff);
                  }
                }

                const getProductionStateText = () => {
                  if (isCompleted) return "Production completed";
                  if (processedEntries.length === 0) return "Production not started";
                  return "Production in progress";
                };

                return (
                  <div
                    key={itemId}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div
                      className={`px-4 py-4 flex items-center justify-between cursor-pointer transition-colors duration-200 ${isExpanded ? 'bg-gray-100' : 'bg-gray-50'
                        }`}
                      onClick={() => toggleSection(itemId)}
                    >
                      <div className="flex items-start">
                        <div className="p-2 rounded-md mr-3 text-white bg-orange-500">
                          {getItemIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-orange-600">{item.display_name}</h3>
                          <div className="mt-2">
                            <span className="inline-block w-full text-red-700 text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                              Total Quantity : {item.quantity.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>


                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1">

                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden sm:block w-48">

                            <div className="flex items-center gap-2">
                              <div className="w-36 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                                <div className="bg-white rounded-full h-4 px-1 flex items-center overflow-hidden">
                                  <div
                                    className="bg-[#FF6900] h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-red-800 w-8 text-right">
                                {progress.toFixed(0)}%
                              </span>
                            </div>

                            <div className="flex items-center mt-3 justify-between">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(item.team_tracking?.status)}`}>
                                {getProductionStateText()}
                              </span>
                            </div>
                          </div>

                          <div className={`p-1 rounded-full ${isExpanded ? 'bg-gray-200' : 'bg-gray-100'}`}>
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="sm:hidden mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isCompleted ? 'bg-green-500' :
                                  progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                                  }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' :
                              progress > 0 ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(item.team_tracking?.status)
                              }`}>
                              {getProductionStateText()}
                            </span>
                          </div>
                        </div>
                        {processedEntries.length > 0 && (
                          <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <h4 className="text-md font-semibold text-black mb-1">Production Info</h4>
                            <div className="flex items-center gap-4">
                              {productionRate && (
                                <div>
                                  <div className="text-sm font-semibold text-[#9c3900]">Production Rate</div>
                                  <div className="text-lg font-semibold text-[#6A7283]">{productionRate} units/hr</div>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-[#9c3900]">Completed</div>
                                <div className="text-lg font-semibold text-[#6A7283]">
                                  {item.completed_qty.toLocaleString()} / {item.quantity.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-l-2 border-[#F54A00] pl-6 ml-4 relative">
                          {cumulativeEntries.length > 0 ? (
                            cumulativeEntries.map((entry, entryIndex) => {
                              const isFirst = entryIndex === 0;
                              const isComplete = entry.cumulativeQty >= item.quantity;
                              const hasMoreEntries = entryIndex < cumulativeEntries.length - 1;

                              const cardBgColor = isComplete ? 'bg-[#F3F9EF] border-[#639E3C]' :
                                isFirst ? 'bg-[#FFF1E7] border-[#F54A00]' :
                                  'bg-[#FFF1E7] border-[#F54A00]';

                              const dotColor = isComplete ? 'bg-[#639E3C]' : 'bg-[#F54A00]';

                              const statusBadgeColor = isComplete ?
                                'bg-[#E8F5E2] text-[#639E3C] border border-[#639E3C]' :
                                'bg-[#FFF1E7] text-[#F54A00] border border-[#F54A00]';

                              const statusText = isComplete ? 'completed' : (isFirst ? 'started' : 'added');
                              const messageTextStyle = isComplete ? 'text-[#639E3C] font-medium' :
                                'text-[#F54A00] font-medium';

                              const progressBarColor = isComplete ? 'bg-green-800' : 'bg-[#F54A00]';

                              return (
                                <div key={entryIndex} className="mb-6 relative">
                                  <div className={`absolute -left-8 mt-1 w-4 h-4 rounded-full ${dotColor} border-1 border-white shadow-sm`}></div>

                                  <div className={`rounded-lg p-4 border ${cardBgColor} shadow-sm`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                      <span className="text-sm text-[#9F0F12] flex items-center font-medium">
                                        <CalendarDays size={16} className="mr-2 text-[#9F0F12]" />
                                        {formatTimestamp(entry.time)}

                                      </span>
                                      <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center ${statusBadgeColor}`}>
                                        {isComplete && <Check size={12} className="mr-1 text-[#639E3C]" />}
                                        {entry.qty.toLocaleString()} units {statusText}
                                      </span>
                                    </div>

                                    <div className="mb-3">
                                      <p className={`text-sm ${messageTextStyle}`}>
                                        {isFirst ? (
                                          <span>Started production with initial batch.</span>
                                        ) : isComplete ? (
                                          <span className="text-green-800 font-semibold">
                                            Completed full production run. All units finished.
                                          </span>
                                        ) : (
                                          <span>
                                            Production batch completed. {entry.remainingUnits > 0 ?
                                              `${entry.remainingUnits.toLocaleString()} units remaining.` :
                                              ''}
                                          </span>
                                        )}
                                      </p>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="text-xs text-[#666666] font-medium mb-1">Progress at this point</div>
                                        <div className="flex items-center gap-2">
                                          <div className="w-28 h-3 bg-[#FFCCA5] rounded-full overflow-hidden shadow-inner">
                                            <div
                                              className={`h-full rounded-full ${progressBarColor}`}
                                              style={{ width: `${entry.progress}%` }}
                                            ></div>
                                          </div>
                                          <span className="text-sm font-semibold text-[#9F0F12]">
                                            {entry.progress}% ({entry.cumulativeQty.toLocaleString()} of {item.quantity.toLocaleString()})
                                          </span>
                                        </div>
                                      </div>

                                      {isComplete && (
                                        <span className="flex items-center text-green-800 text-sm font-bold">
                                          Production Complete
                                        </span>
                                      )}
                                    </div>

                                    {hasMoreEntries && (
                                      <div className="mt-3 text-right text-sm font-medium text-red-800">
                                        Time to next entry: {(() => {
                                          const current = new Date(typeof entry.time === 'object' && entry.time.$date ?
                                            parseInt(entry.time.$date.$numberLong) : entry.time).getTime();
                                          const next = new Date(typeof cumulativeEntries[entryIndex + 1].time === 'object' &&
                                            cumulativeEntries[entryIndex + 1].time.$date ?
                                            parseInt(cumulativeEntries[entryIndex + 1].time.$date.$numberLong) :
                                            cumulativeEntries[entryIndex + 1].time).getTime();

                                          const diffMs = next - current;
                                          const diffMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
                                          const diffHours = Math.floor(diffMins / 60);
                                          const remainingMins = diffMins % 60;

                                          if (diffHours > 0) {
                                            return `${diffHours}h ${remainingMins}m`;
                                          }
                                          return `${diffMins}m`;
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="mb-6 relative">
                              <div className="absolute -left-8 mt-1 w-4 h-4 rounded-full bg-[#999999] border-2 border-white shadow-sm"></div>
                              <div className="bg-[#FFF8F3] rounded-lg p-4 border-2 border-[#FFCCA5] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-[#666666] flex items-center font-medium">
                                    <Clock size={16} className="mr-2 text-[#F54A00]" />
                                    Pending
                                  </span>
                                  <span className="px-3 py-1 bg-[#FFF1E7] text-[#F54A00] text-xs font-semibold rounded-full border border-[#F54A00]">
                                    Not started
                                  </span>
                                </div>
                                <p className="text-sm text-[#666666] flex items-center">
                                  <AlertTriangle size={16} className="mr-2 text-[#F54A00]" />
                                  Production has not been started. {item.quantity.toLocaleString()} units pending.
                                </p>
                              </div>
                            </div>
                          )}

                          {cumulativeEntries.length > 0 && !isCompleted && (
                            <div className="mb-6 relative">
                              <div className="absolute -left-8 mt-1 w-4 h-4 rounded-full bg-[#999999] border-4 border-white shadow-sm"></div>
                              <div className="bg-[#FFF8F3] rounded-lg p-4 border-2 border-dashed border-[#FFCCA5] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-[#333333] font-medium">Upcoming</span>
                                  <span className="px-3 py-1 bg-[#FFF1E7] text-[#F54A00] text-xs font-semibold rounded-full border border-[#F54A00]">
                                    {(item.quantity - item.completed_qty).toLocaleString()} more units
                                  </span>
                                </div>
                                <p className="text-sm text-[#333333] font-medium">
                                  {item.quantity > item.completed_qty ?
                                    `${((item.quantity - item.completed_qty) / item.quantity * 100).toFixed(1)}% of production remaining.` :
                                    'All units have been produced. Awaiting final verification.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {item.notes && (
                          <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Production Notes</h4>
                            <p className="text-sm text-gray-600">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600">No items found matching the selected filter.</p>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

export default OrderActivity;


