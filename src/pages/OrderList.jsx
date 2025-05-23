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
  moveOrderBetweenStorages,
  deleteOrderFromAllStorages,

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
  const { socket } = useSocket();
  const teamType = useMemo(() => determineTeamType(user.team), [user.team]);
  const teamColumns = useMemo(() => getTeamTypeSpecificColumns(teamType), [teamType]);

  const handleClose = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const storedOrders = getOrdersFromLocalStorage(user, orderType);
    if (storedOrders && storedOrders.length > 0) {
      setOrders(storedOrders);
      setLoading(false);
    } else {
      fetchOrders();
    }
  }, [orderType, user]);

  useEffect(() => {
    const cleanup = setupLocalStorageSync(user, (updatedOrders) => {
      setOrders(updatedOrders);
    });

    return cleanup;
  }, [user, orderType]);

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
      const response = await axios.get(`https://pragati-backend-omid.onrender.com/orders/${orderType}`, {
        params: { team: user.team }
      });
      
      // Check the structure of the response
      console.log("API Response:", response.data);
      
      // Extract orders data properly
      const ordersData = response.data.orders || response.data;
      
      if (!Array.isArray(ordersData)) {
        console.error("Expected orders array but got:", ordersData);
        setLoading(false);
        return;
      }
      
      // Save to localStorage directly
      saveOrdersToLocalStorage(user, ordersData, orderType);
      
      // Set state with fetched orders
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [orderType, user]);

  useEffect(() => {
    if (!socket) return;

    const handleSocketNewOrder = (data) => {
      console.log(`🔌 Socket received new order: Order #${data.order?.order_number}`);

      if (isOrderRelevantForTeam(data.order, teamType)) {
        setOrders(prevOrders => {
          const exists = prevOrders.some(o => o._id === data.order._id);
          if (exists) return prevOrders;
          const newOrders = [...prevOrders, data.order];
          saveOrdersToLocalStorage(user, newOrders, orderType);

          setNewOrderAlert({
            id: data.order._id,
            number: data.order.order_number,
            timestamp: new Date().toISOString()
          });

          setTimeout(() => setNewOrderAlert(null), 5000);

          return newOrders;
        });
      }
    };

    const handleSocketOrderUpdated = (data) => {
      console.log(`🔌 Socket received updated order: Order #${data.order?.order_number}`);

      if (!isOrderRelevantForTeam(data.order, teamType)) return;

      const teamItems = data.order.order_details[teamType] || [];
      const allItemsComplete = teamItems.every(item =>
        item.team_tracking?.status === 'Completed' ||
        (item.team_tracking?.total_completed_qty >= item.quantity)
      );
      if (orderType === 'liveOrders' && allItemsComplete) {
        setOrders(prevOrders => {
          const filteredOrders = prevOrders.filter(order => order._id !== data.order._id);
          saveOrdersToLocalStorage(user, filteredOrders, orderType);
          moveOrderBetweenStorages(user, data.order, 'liveOrders', 'pastOrders');

          return filteredOrders;
        });
      }

      else if (orderType === 'pastOrders' && !allItemsComplete) {
        setOrders(prevOrders => {
          const filteredOrders = prevOrders.filter(order => order._id !== data.order._id);
          saveOrdersToLocalStorage(user, filteredOrders, orderType);
          moveOrderBetweenStorages(user, data.order, 'pastOrders', 'liveOrders');

          return filteredOrders;
        });
      }
      else if ((orderType === 'liveOrders' && !allItemsComplete) ||
        (orderType === 'pastOrders' && allItemsComplete)) {
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(prevOrder =>
            prevOrder._id === data.order._id
              ? { ...data.order, lastUpdatedTimestamp: new Date().toISOString() }
              : prevOrder
          );

          saveOrdersToLocalStorage(user, updatedOrders, orderType);
          return updatedOrders;
        });
      }
    };

    const handleSocketOrderEdited = (order) => {
      console.log(`🔌 Socket received edited order: Order #${order?.order_number}`);

      if (!isOrderRelevantForTeam(order, teamType)) return;

      setOrders(prevOrders => {
        const exists = prevOrders.some(o => o._id === order._id);
        let updatedOrders;

        if (exists) {
          updatedOrders = prevOrders.map(prevOrder =>
            prevOrder._id === order._id
              ? { ...order, lastUpdatedTimestamp: new Date().toISOString() }
              : prevOrder
          );
        } else {
          updatedOrders = [...prevOrders, { ...order, lastUpdatedTimestamp: new Date().toISOString() }];
        }

        saveOrdersToLocalStorage(user, updatedOrders, orderType);
        return updatedOrders;
      });
    };

    const handleSocketOrderDeleted = (data) => {
      console.log(`🔌 Socket received deleted order: Order #${data.order?.order_number}`);

      // Use the new utility function to delete from all storages
      deleteOrderFromAllStorages(user, data.order);

      // Update the UI state to reflect the deletion
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.filter(order => order._id !== data.order._id);
        return updatedOrders;
      });
    };

    socket.on('new-order', handleSocketNewOrder);
    socket.on('order-updated', handleSocketOrderUpdated);
    socket.on('order-edited', handleSocketOrderEdited);
    socket.on('order-deleted', handleSocketOrderDeleted);

    return () => {
      socket.off('new-order', handleSocketNewOrder);
      socket.off('order-updated', handleSocketOrderUpdated);
      socket.off('order-edited', handleSocketOrderEdited);
      socket.off('order-deleted', handleSocketOrderDeleted);
    };
  }, [socket, user, isOrderRelevantForTeam, teamType, orderType]);

  useEffect(() => {
    const handleNewOrder = (event) => {
      const { order } = event.detail;

      if (isOrderRelevantForTeam(order, teamType)) {
        setOrders(prevOrders => {
          const exists = prevOrders.some(o => o._id === order._id);
          if (exists) return prevOrders;

          const newOrders = [...prevOrders, order];
          saveOrdersToLocalStorage(user, newOrders, orderType);
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

        saveOrdersToLocalStorage(user, updatedOrders, orderType);
        return updatedOrders;
      });
    };

    const handleOrderEdited = (event) => {
      const { order } = event.detail;
      if (!isOrderRelevantForTeam(order, teamType)) return;

      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(prevOrder =>
          prevOrder._id === order._id ? { ...order, lastUpdatedTimestamp: new Date().toISOString() } : prevOrder
        );
        saveOrdersToLocalStorage(user, updatedOrders, orderType);
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
      deleteOrderFromAllStorages(user, order);
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.filter(prevOrder => prevOrder._id !== order._id);
        return updatedOrders;
      });
    }

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
  }, [user, isOrderRelevantForTeam, teamType, orderType]);

  const handleOrderUpdated = useCallback((updatedOrder) => {
    const teamType = determineTeamType(user.team);

    // Skip if we can't determine team type
    if (!teamType || !updatedOrder.order_details || !updatedOrder.order_details[teamType]) {
      console.warn('Unable to update order: missing team type or team details');
      return;
    }

    // Check if all items for this team are completed
    const teamItems = updatedOrder.order_details[teamType];
    const allItemsComplete = teamItems.every(item =>
      item.team_tracking?.status === 'Completed' ||
      (item.team_tracking?.total_completed_qty >= item.quantity)
    );

    // Current list is liveOrders and team completed all items - move to past orders
    if (orderType === 'liveOrders' && allItemsComplete) {
      setOrders(prevOrders => {
        const filteredOrders = prevOrders.filter(order => order._id !== updatedOrder._id);
        saveOrdersToLocalStorage(user, filteredOrders, orderType);

        // Move to past orders
        moveOrderBetweenStorages(user, updatedOrder, 'liveOrders', 'pastOrders');

        return filteredOrders;
      });
    }
    // Current list is pastOrders and team has incomplete items - move to live orders
    else if (orderType === 'pastOrders' && !allItemsComplete) {
      setOrders(prevOrders => {
        const filteredOrders = prevOrders.filter(order => order._id !== updatedOrder._id);
        saveOrdersToLocalStorage(user, filteredOrders, orderType);
        moveOrderBetweenStorages(user, updatedOrder, 'pastOrders', 'liveOrders');

        return filteredOrders;
      });
    }
    else {
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order =>
          order._id === updatedOrder._id ? {
            ...updatedOrder,
            lastUpdatedTimestamp: new Date().toISOString()
          } : order
        );

        saveOrdersToLocalStorage(user, updatedOrders, orderType);
        return updatedOrders;
      });
    }
  }, [user, orderType]);

 
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left-aligned search input */}
        <div className="relative w-full md:max-w-sm">
          <input
            type="text"
            placeholder="Search..."
            value={filterInput}
            onChange={handleFilterChange}
            className="w-full px-3 py-1.5 pr-10 border border-[#c57138] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6900] focus:border-[#FF6900] font-inter text-gray-700"
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

        {/* Right-aligned download button */}
        <div className="flex justify-end">
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
        teamType={teamType}
      />}
    </div>

  )
}
export default OrdersList;