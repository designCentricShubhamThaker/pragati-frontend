import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import axios from 'axios';
import { Loader2, Check, RefreshCw, FileText, Plus } from 'lucide-react';
import { FiEdit } from "react-icons/fi";
import { useAuth } from '../context/auth';
import EditTodaysCompletedOrder from '../child-components/EditTodaysCompletedOrder';
import { useSocket } from '../context/SocketContext';

import {
  determineTeamType,
  getOrderItems,
  getItemName,
  getTeamTypeSpecificColumns,
  getCellValue
} from '../utils/OrderUtils';

import {
  getOrdersFromLocalStorage,
  generateLocalStorageKey,
  saveOrdersToLocalStorage,
  setupLocalStorageSync,
  updateLocalStorageOrders,

} from '../utils/LocalStorageUtils';
import { FaDownload } from 'react-icons/fa';


function customGlobalFilter(rows, columnIds, filterValue) {
  if (filterValue === "") return rows;
  const filterLower = String(filterValue).toLowerCase();
  return rows.filter(row => {
    return columnIds.some(columnId => {
      const rowValue = row.values[columnId];
      if (rowValue == null) return false;
      const strValue = String(rowValue).toLowerCase();
      return strValue.includes(filterLower);
    });
  });
}

const OrdersList = ({ orderType }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const teamType = useMemo(() => determineTeamType(user.team), [user.team]);
  const teamColumns = useMemo(() => getTeamTypeSpecificColumns(teamType), [teamType]);

  const handleClose = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const storedOrders = getOrdersFromLocalStorage(user);
    if (storedOrders.length > 0) {
      setOrders(storedOrders);
      setLoading(false);
    }

    fetchOrders();
  }, [orderType, user]);

  useEffect(() => {
    const cleanup = setupLocalStorageSync(user, (updatedOrders) => {
      setOrders(updatedOrders);
    });

    return cleanup;
  }, [user]);


  const isOrderRelevantForTeam = useCallback((order, teamType) => {
    if (!order || !order.order_details) return false;
    if (user.role === 'admin' || user.role === 'dispatcher') return true;
    switch (teamType?.toLowerCase()) {
      case 'glass':
        return order.order_details.glass && order.order_details.glass.length > 0;
      case 'caps':
        return order.order_details.caps && order.order_details.caps.length > 0;
      case 'boxes':
        return order.order_details.boxes && order.order_details.boxes.length > 0;
      case 'pumps':
        return order.order_details.pumps && order.order_details.pumps.length > 0;
      case 'all':

        return (
          (order.order_details.glass && order.order_details.glass.length > 0) ||
          (order.order_details.caps && order.order_details.caps.length > 0) ||
          (order.order_details.boxes && order.order_details.boxes.length > 0) ||
          (order.order_details.pumps && order.order_details.pumps.length > 0)
        );
      default:
        return false;
    }
  }, [user.role]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/orders/${orderType}`, {
        params: { team: user.team }
      });

      const updatedOrders = updateLocalStorageOrders(user, response.data.orders);
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [orderType, user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;

    // Handle new order from socket
    const handleSocketNewOrder = (data) => {
      console.log(`🔌 Socket received new order: Order #${data.order?.order_number}`);
      
      if (isOrderRelevantForTeam(data.order)) {
        setOrders(prevOrders => {
          // Check if order already exists
          const exists = prevOrders.some(o => o._id === data.order._id);
          if (exists) return prevOrders;
          
          // Add new order and save to localStorage
          const newOrders = [...prevOrders, data.order];
          saveOrdersToLocalStorage(user, newOrders);
          
          // Show notification
          setNewOrderAlert({
            id: data.order._id,
            number: data.order.order_number,
            timestamp: new Date().toISOString()
          });
          
          // Clear notification after 5 seconds
          setTimeout(() => setNewOrderAlert(null), 5000);
          
          return newOrders;
        });
      }
    };

    // Handle order update from socket
    const handleSocketOrderUpdated = (data) => {
      console.log(`🔌 Socket received updated order: Order #${data.order?.order_number}`);
      
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(prevOrder =>
          prevOrder._id === data.order._id 
            ? { ...data.order, lastUpdatedTimestamp: new Date().toISOString() } 
            : prevOrder
        );
        
        saveOrdersToLocalStorage(user, updatedOrders);
        return updatedOrders;
      });
    };

    // Handle order edit from socket
    const handleSocketOrderEdited = (order) => {
      console.log(`🔌 Socket received edited order: Order #${order?.order_number}`);
      
      if (!isOrderRelevantForTeam(order ,teamType)) return;
      
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(prevOrder =>
          prevOrder._id === order._id 
            ? { ...order, lastUpdatedTimestamp: new Date().toISOString() } 
            : prevOrder
        );
        
        saveOrdersToLocalStorage(user, updatedOrders);
        return updatedOrders;
      });
    };

    // Handle order deletion from socket
    const handleSocketOrderDeleted = (data) => {
      console.log(`🔌 Socket received deleted order: Order #${data.order?.order_number}`);
      
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.filter(order => order._id !== data.order._id);
        saveOrdersToLocalStorage(user, updatedOrders);
        return updatedOrders;
      });
    };

    // Register socket event listeners
    socket.on('new-order', handleSocketNewOrder);
    socket.on('order-updated', handleSocketOrderUpdated);
    socket.on('order-edited', handleSocketOrderEdited);
    socket.on('order-deleted', handleSocketOrderDeleted);

    // Clean up socket event listeners
    return () => {
      socket.off('new-order', handleSocketNewOrder);
      socket.off('order-updated', handleSocketOrderUpdated);
      socket.off('order-edited', handleSocketOrderEdited);
      socket.off('order-deleted', handleSocketOrderDeleted);
    };
  }, [socket, user, isOrderRelevantForTeam ,teamType]);

  useEffect(() => {

    const handleNewOrder = (event) => {
      const { order } = event.detail;
      
      if (isOrderRelevantForTeam(order ,teamType)) {
        setOrders(prevOrders => {

          const exists = prevOrders.some(o => o._id === order._id);
          if (exists) return prevOrders;
          
          const newOrders = [...prevOrders, order];
          saveOrdersToLocalStorage(user, newOrders);
          setNewOrderAlert({
            id: order._id,
            number: order.order_number,
            timestamp: new Date().toISOString()
          });
          
          setTimeout(() => setNewOrderAlert(null), 5000);
          
          return newOrders;
        });
      }
    };

    const handleOrderUpdate = (event) => {
      const { order } = event.detail;
      
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(prevOrder =>
          prevOrder._id === order._id ? { ...order, lastUpdatedTimestamp: new Date().toISOString() } : prevOrder
        );
        
        saveOrdersToLocalStorage(user, updatedOrders);
        return updatedOrders;
      });
    };

    const handleOrderEdited = (event) => {
      const { order } = event.detail;
      if (!isOrderRelevantForTeam(order ,teamType)) return;
      
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(prevOrder =>
          prevOrder._id === order._id ? { ...order, lastUpdatedTimestamp: new Date().toISOString() } : prevOrder
        );
        
        saveOrdersToLocalStorage(user, updatedOrders);
        
        const syncEvent = new CustomEvent('localStorageUpdated', {
          detail: {
            key: generateLocalStorageKey(user),
            orders: updatedOrders
          }
        });
        window.dispatchEvent(syncEvent);
        
        return updatedOrders;
      });
    };

    const handleOrderDeleted = (event) => {
      const { order } = event.detail;
      
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.filter(prevOrder => prevOrder._id !== order._id);
        saveOrdersToLocalStorage(user, updatedOrders);
        return updatedOrders;
      });
    };

    window.addEventListener('orderCreated', handleNewOrder);
    window.addEventListener('orderUpdated', handleOrderUpdate);
    window.addEventListener('orderEdited', handleOrderEdited);
    window.addEventListener('orderDeleted', handleOrderDeleted);

    return () => {
      window.removeEventListener('orderCreated', handleNewOrder);
      window.removeEventListener('orderUpdated', handleOrderUpdate);
      window.removeEventListener('orderEdited', handleOrderEdited);
      window.removeEventListener('orderDeleted', handleOrderDeleted);
    };
  }, [user, isOrderRelevantForTeam ,teamType]);

  const handleOrderUpdated = useCallback((updatedOrder) => {
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order =>
        order._id === updatedOrder._id ? {
          ...updatedOrder,
          lastUpdatedTimestamp: new Date().toISOString()
        } : order
      );

      saveOrdersToLocalStorage(user, updatedOrders);
      
      const event = new CustomEvent('localStorageUpdated', {
        detail: {
          key: generateLocalStorageKey(user),
          orders: updatedOrders
        }
      });
      window.dispatchEvent(event);

      return updatedOrders;
    });
  }, [user]);

  const handleEditOrder = useCallback((order) => {
    setSelectedOrder(order);
    setShowModal(true);
  }, []);


  const formatItemDate = (dateString) => {
    if (!dateString) return 'Not updated';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const getRemainingQuantity = useCallback((item, order) => {
    // Find the specific team tracking data for this item
    const teamTrackingItem = order.order_details[teamType]?.find(
      orderItem => orderItem._id === item._id
    );

    if (!teamTrackingItem || !teamTrackingItem.team_tracking) {
      return item.quantity;
    }

    const totalCompletedQty = teamTrackingItem.team_tracking.total_completed_qty || 0;
    return Math.max(0, item.quantity - totalCompletedQty);
  }, [teamType]);

  const getLastUpdateTime = useCallback((item, order) => {
    if (!order || !item) return null;

    if (order.lastUpdatedTimestamp) {
      return order.lastUpdatedTimestamp;
    }

    const teamTrackingItem = order.order_details[teamType]?.find(
      orderItem => orderItem._id === item._id
    );

    if (!teamTrackingItem || !teamTrackingItem.team_tracking?.completed_entries?.length) {
      return null;
    }

    const latestEntry = teamTrackingItem.team_tracking.completed_entries[
      teamTrackingItem.team_tracking.completed_entries.length - 1
    ];

    return latestEntry.timestamp;
  }, [teamType]);

  const tableData = useMemo(() => {
    const data = [];
    orders.forEach(order => {
      const items = getOrderItems(order, teamType);
      items.forEach((item, index) => {
        const isFirstItem = index === 0;
        const remainingQty = getRemainingQuantity(item, order);
        const lastUpdated = getLastUpdateTime(item, order);
        const isCompleted = remainingQty === 0;

        const teamSpecificData = {};
        teamColumns.forEach(column => {
          teamSpecificData[column.key] = getCellValue(item, column);
        });

        data.push({
          id: `${order._id}-${item._id}`,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          dispatcherName: order.dispatcher_name,
          itemName: getItemName(item, teamType),
          quantity: item.quantity || 'N/A',
          remaining: remainingQty,
          lastUpdated: lastUpdated,
          status: isCompleted ? 'Done' : 'Pending',
          isFirstItem,
          totalItemsInOrder: items.length,
          order: order,
          item: item,
          ...teamSpecificData
        });
      });
    });

    return data;
  }, [orders, teamType, teamColumns, getRemainingQuantity, getLastUpdateTime]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        Header: 'Order No',
        accessor: 'orderNumber',
        width: 100,
        Cell: ({ row }) => {
          if (row.original.isFirstItem) {
            return (
              <div className="flex flex-col ml-6  justify-center">
                <span className="flex items-center justify-center w-6 h-6 bg-orange-600 text-white text-xs rounded-sm cursor-pointer hover:bg-orange-500 transition-colors duration-200 shadow-md">
                  {row.original.orderNumber}
                </span>
              </div>
            );
          }
          return null;
        }
      },
      {
        Header: 'Item',
        accessor: 'itemName',
        width: 140,
        Cell: ({ value }) => (
          <span className="text-sm font-semibold">{value}</span>
        )
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
        width: 90,
        Cell: ({ value }) => (
          <span className="text-sm font-semibold">{value}</span>
        )
      },
      {
        Header: 'Remaining',
        accessor: 'remaining',
        width: 100,
        Cell: ({ value, row }) => {
          const isPartiallyCompleted = value < row.original.quantity && value > 0;
          const isDone = value === 0;

          return (
            <span className={`text-sm font-semibold ${isDone ? 'text-green-600' :
              isPartiallyCompleted ? 'text-orange-600' :
                'text-red-800'
              }`}>
              {isDone ? <Check size={18} strokeWidth={3} className="text-[#FF6900] font-bold" />
                : value}
            </span>
          );
        }
      },
      {
        Header: ' Last Edited',
        accessor: 'lastUpdated',
        width: 70,
        Cell: ({ value }) => (
          <span className="text-sm">
            {formatItemDate(value)}
          </span>
        )
      },
    ];


    const dynamicColumns = teamColumns.map(col => ({
      Header: col.label,
      accessor: col.key,
      width: 90,
      Cell: ({ value }) => (
        <span className="text-sm text-gray-700">{value}</span>
      )
    }));


    const statusAndActionColumns = [
      {
        Header: 'Status',
        accessor: 'status',
        width: 80,
        Cell: ({ value }) => (
          <div className="flex justify-center">
            {value === 'Done' ? (
              <Check size={18} strokeWidth={3} className="text-[#FF6900] font-bold" />
            ) : (
              <img src="./download.svg" alt="" className="w-5 filter drop-shadow-md" />
            )}
          </div>
        )
      },
      {
        Header: 'Actions',
        id: 'actions',
        width: 60,
        Cell: ({ row }) => {
          if (row.original.isFirstItem) {
            return (
              <div className="flex space-x-2 justify-center">
                <button
                  onClick={() => handleEditOrder(row.original.order)}
                  className="flex items-center cursor-pointer justify-center p-1.5 bg-orange-600 rounded-sm text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm"
                  aria-label="Edit order"
                >
                  <FiEdit size={16} />
                </button>
              </div>
            );
          }
          return null;
        }
      }
    ];

    return [...baseColumns, ...dynamicColumns, ...statusAndActionColumns];
  }, [teamColumns, handleEditOrder,]);

  const filterableColumns = useMemo(() =>
    ['orderNumber'],
    []
  );

  const tableInstance = useTable(
    {
      columns,
      data: tableData,
      initialState: { pageIndex: 0, pageSize: 10 },
      globalFilter: (rows, columnIds, filterValue) =>
        customGlobalFilter(rows, filterableColumns, filterValue),

      getRowProps: row => {
        const order = row.original;
        if (order.isFirstItem) {
          return {
            'data-order-id': order.order._id,
            className: `order-${order.order._id}`
          };
        }
        return {};
      }
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
    setGlobalFilter,
  } = tableInstance;

  const handleFilterChange = e => {
    const value = e.target.value || "";
    setFilterInput(value);
    setGlobalFilter(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-200">
        <div className="py-8">
          <FileText className="w-16 h-16 text-orange-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">No {orderType === 'liveOrders' ? 'live' : 'past'} orders found for your team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <button className="mt-2 sm:mt-0 cursor-pointer bg-orange-700 text-white  flex items-center gap-2 px-3 py-1.5 rounded-sm shadow-md transition-colors duration-200 font-medium  hover:bg-red-900 hover:text-white">
          <Plus size={16} />
        </button>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={filterInput}
              className="px-3 py-1.5 pr-10 border border-[#c57138] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6900] focus:border-[#FF6900] font-inter text-gray-700"
              onChange={handleFilterChange}
            />
            <svg
              className="w-5 h-5 absolute right-3 top-1.5 text-[#FF6900]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>

          <button className="flex items-center cursor-pointer justify-center gap-1 bg-[#6B7499] hover:bg-gray-500 text-white py-2 px-4 rounded-sm shadow-md transition-colors duration-200">
            <FaDownload size={18} />

          </button>
        </div>
      </div>

      {page.length === 0 ? (
        <div className="flex justify-center items-center h-64 bg-[#FFF5EC] rounded-md border border-[#FFD7BC]">
          <p className="text-[#996633] font-medium">No orders found</p>
        </div>
      ) : (
        <>
          <div className="flex-1 mt-2 overflow-auto">
            <div className="overflow-x-auto">
              <table
                {...getTableProps()}
                className="min-w-full divide-y divide-[#FFDFC8] rounded-lg shadow-md overflow-hidden font-inter"
                style={{
                  tableLayout: 'fixed',
                  boxShadow: '0 4px 15px -2px rgba(255, 105, 0, 0.1), 0 2px 8px -1px rgba(255, 105, 0, 0.05)'
                }}
              >
                <thead className="sticky top-0 z-10">
                  {headerGroups.map((headerGroup, idx) => (
                    <tr
                      {...headerGroup.getHeaderGroupProps()}
                      key={idx}
                      className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D]"
                    >
                      {headerGroup.headers.map((column, colIdx) => {
                        const isFirstColumn = colIdx === 0;
                        const isLastColumn = colIdx === headerGroup.headers.length - 1;

                        let headerClass = "px-3 py-3 text-left font-bold text-sm text-white bg-transparent";

                        headerClass += ` ${isFirstColumn ? 'rounded-tl-lg' : ''} ${isLastColumn ? 'rounded-tr-lg' : ''}`;

                        return (
                          <th
                            {...column.getHeaderProps(column.getSortByToggleProps())}
                            className={headerClass}
                            key={colIdx}
                            style={{
                              width: column.width,
                              minWidth: column.width,
                              overflow: 'hidden',
                            }}
                          >
                            {column.render('Header')}
                            <span>
                              {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>

                <tbody {...getTableBodyProps()} className="bg-white divide-y divide-[#FFDFC8]">
                  {page.map((row, idx) => {
                    prepareRow(row);

                    const orderId = row.original.order._id;
                    const isFirstItem = row.original.isFirstItem;
                    const isLastRow = idx === page.length - 1;
                    const orderIndex = orders.findIndex(o => o._id === orderId);
                    const rowBgColor = orderIndex % 2 === 0
                      ? 'bg-gradient-to-r from-[#FFFFFF] via-[#FFF5EC] to-[#FFEEE0]'
                      : 'bg-gradient-to-r from-[#FFF0E6] via-[#FFDAB3] to-[#FFE6CC]';

                    return (
                      <tr
                        {...row.getRowProps()}
                        className={`${rowBgColor} hover:bg-[#FFF0E6] transition-colors duration-150`}
                        key={row.id}
                      >
                        {row.cells.map((cell, cellIdx) => {
                          if (cellIdx === 0 && !isFirstItem) {
                            return null;
                          }
                          const isFirstColumn = cellIdx === 0;
                          const isLastColumn = cellIdx === row.cells.length - 1;
                          const columnHeader = cell.column.Header;

                          const isActionsColumn = columnHeader === 'Actions';
                          if (isActionsColumn && !isFirstItem) {
                            return null;
                          }

                          let cellClass = 'px-4 py-3.5 whitespace-nowrap text-sm ';

                          if (columnHeader === "Status") {
                            cellClass += 'font-medium text-center ';

                            const statusValue = cell.value;
                            if (statusValue === 'Done') {
                              cellClass += 'text-green-600 ';
                            } else {
                              cellClass += 'text-[#FF6900] ';
                            }
                          }
                          else if (columnHeader === "Remaining") {
                            const remaining = row.original.remaining;
                            const quantity = row.original.quantity;

                            if (remaining === 0) {
                              cellClass += 'text-green-600 font-medium ';
                            } else if (remaining < quantity) {
                              cellClass += 'text-[#FF6900] font-medium ';
                            } else {
                              cellClass += 'text-gray-700 ';
                            }
                          }
                          else if (columnHeader === "Order Details") {
                            cellClass += 'text-[#FF6900] font-medium border-r border-[#FFDFC8] ';
                          }
                          else if (columnHeader === "Item" || columnHeader === "Quantity") {
                            cellClass += 'text-[#703800] font-medium ';
                          }
                          else if (columnHeader === "Last Updated") {
                            cellClass += 'text-gray-700 ';
                          }
                          else {
                            cellClass += 'text-gray-700 ';
                          }

                          cellClass += `
                          ${isFirstColumn && isLastRow ? 'rounded-bl-lg' : ''}
                          ${isLastColumn && isLastRow ? 'rounded-br-lg' : ''}`;


                          if (isFirstColumn) {
                            return (
                              <td
                                {...cell.getCellProps()}
                                className={cellClass}
                                key={cellIdx}
                                rowSpan={row.original.totalItemsInOrder}
                                style={{
                                  width: cell.column.width,
                                  minWidth: cell.column.width
                                }}
                              >
                                {cell.render('Cell')}
                              </td>
                            );
                          }

                          if (isActionsColumn) {
                            return (
                              <td
                                {...cell.getCellProps()}
                                className={cellClass}
                                key={cellIdx}
                                rowSpan={row.original.totalItemsInOrder}
                                style={{
                                  width: cell.column.width,
                                  minWidth: cell.column.width
                                }}
                              >
                                {cell.render('Cell')}
                              </td>
                            );
                          }
                          return (
                            <td
                              {...cell.getCellProps()}
                              className={cellClass}
                              key={cellIdx}
                              style={{
                                width: cell.column.width,
                                minWidth: cell.column.width
                              }}
                            >
                              {cell.render('Cell')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#FFDFC8] flex flex-col sm:flex-row items-center justify-between text-sm">
            <div className="flex items-center space-x-2 mb-3 sm:mb-0">
              <span>
                Page{' '}
                <strong>
                  {pageIndex + 1} of {pageOptions.length}
                </strong>
              </span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                }}
                className="border border-[#FFD7BC] rounded px-2 py-1 bg-white text-[#FF6900] focus:outline-none focus:ring-2 focus:ring-[#FF6900]"
              >
                {[5, 10, 20].map(size => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                className={`px-2 py-1 rounded ${!canPreviousPage ? 'text-gray-400 cursor-not-allowed' : 'text-[#FF6900] hover:bg-[#FFF5EC]'
                  }`}
              >
                {'<<'}
              </button>
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className={`px-2 py-1 rounded ${!canPreviousPage ? 'text-gray-400 cursor-not-allowed' : 'text-[#FF6900] hover:bg-[#FFF5EC]'
                  }`}
              >
                {'<'}
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className={`px-2 py-1 rounded ${!canNextPage ? 'text-gray-400 cursor-not-allowed' : 'text-[#FF6900] hover:bg-[#FFF5EC]'
                  }`}
              >
                {'>'}
              </button>
              <button
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                className={`px-2 py-1 rounded ${!canNextPage ? 'text-gray-400 cursor-not-allowed' : 'text-[#FF6900] hover:bg-[#FFF5EC]'
                  }`}
              >
                {'>>'}
              </button>
            </div>
          </div>
        </>
      )}

      {showModal && <EditTodaysCompletedOrder
        onClose={handleClose}
        selectedOrder={selectedOrder}
        onOrderUpdated={handleOrderUpdated}
      />}
    </div>

  )
}


export default OrdersList;