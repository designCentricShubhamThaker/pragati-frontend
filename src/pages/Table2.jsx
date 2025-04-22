import React, { useEffect, useState } from 'react';
import { Eye, Plus, Check } from 'lucide-react';
import { FiEdit } from "react-icons/fi";
import { BsFiletypeCsv } from "react-icons/bs";
import { TbTimelineEvent } from "react-icons/tb";

import axios from 'axios';
import CreateOrder from '../child-components/CreateOrder';
import OrderActivity from '../child-components/OrderActivity';
import ViewDispatcherOrderDetails from '../child-components/ViewDispatcherOrderDetails.jsx';
import { useAuth } from '../context/auth';

import {
  setupLocalStorageSync,
  updateLocalStorageOrders,
  getOrdersFromLocalStorage,
} from '../utils/LocalStorageUtils.jsx';

import { useSocket } from '../context/SocketContext.jsx';

const Table2 = () => {
  const [showModal, setShowModal] = useState(false);
  const [createOrder, setCreateOrder] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterInput, setFilterInput] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const { socket, isConnected } = useSocket();


  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);


  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });
  const { user } = useAuth();

  useEffect(() => {
    const storedOrders = getOrdersFromLocalStorage(user);
    if (storedOrders.length > 0) {
      setOrders(storedOrders);
      setIsLoading(false);
    } else {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    const cleanup = setupLocalStorageSync(user, (updatedOrders) => {
      setOrders(updatedOrders);
    });

    return cleanup;
  }, [user]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/orders');

      const updatedOrders = updateLocalStorageOrders(user, response.data || []);
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderUpdate = (updatedOrder) => {
      console.log('📦 Received order update via socket:', updatedOrder);
      const updatedOrders = updateLocalStorageOrders(user, [updatedOrder]);
      setOrders(updatedOrders);
    };

    socket.on('order-updated', handleOrderUpdate);

    return () => {
      socket.off('order-updated', handleOrderUpdate);
    };
  }, [socket, isConnected, user]);

  const handleCreateOrder = async (newOrderData) => {
    try {
      const orderToAdd = newOrderData.order ? newOrderData.order : newOrderData;

      const updatedOrders = updateLocalStorageOrders(user, [orderToAdd]);
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCreateOrder(false);
    setShowTimeline(false);
  };

  const formatSimpleDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getTeamStatus = (items, teamType) => {
    if (!items || !Array.isArray(items) || items.length === 0) return "Pending";

    return items.every(item =>
      item.status === "Done" ||
      (item.team_tracking?.total_completed_qty >= item.quantity)
    ) ? "Done" : "Pending";
  };

  const transformData = () => {
    return orders.map(order => {
      const orderDetails = order.order_details || {};

      const glassStatus = orderDetails.glass ?
        getTeamStatus(orderDetails.glass) : "Pending";

      const capStatus = orderDetails.caps ?
        getTeamStatus(orderDetails.caps) : "Pending";

      const boxStatus = orderDetails.boxes ?
        getTeamStatus(orderDetails.boxes) : "Pending";

      const pumpStatus = orderDetails.pumps ?
        getTeamStatus(orderDetails.pumps) : "Pending";

      const decorationStatus = orderDetails.glass &&
        orderDetails.glass.length > 0 &&
        orderDetails.glass.every(glass =>
          glass.decoration_details?.type &&
          glass.decoration_details?.decoration_number &&
          glass.status === "Done"
        )
        ? "Done"
        : "Pending";

      return {
        orderNo: order.order_number,
        dispatcherName: order.dispatcher_name,
        customerName: order.customer_name,
        createdAt: order.created_at || order.createdAt,
        glass: glassStatus,
        cap: capStatus,
        box: boxStatus,
        pump: pumpStatus,
        decoration: decorationStatus,
        orderDetails: order,
        orderStatus: order.order_status,
        completionPercentage: calculateCompletionPercentage({
          glass: glassStatus,
          cap: capStatus,
          box: boxStatus,
          pump: pumpStatus,
          decoration: decorationStatus
        })
      };
    });
  };

  const calculateCompletionPercentage = (row) => {
    const teamsToCheck = ['glass', 'cap', 'box', 'pump', 'decoration'];
    const doneCount = teamsToCheck.filter(team => row[team] === 'Done').length;
    return (doneCount / teamsToCheck.length) * 100;
  };

  const StatusBadge = ({ value }) => (
    <div className="flex justify-center">
      {value === "Done" ? (
        <Check size={16} strokeWidth={3} className="text-[#FF6900] font-bold" />
      ) : (
        <img src="./download.svg" alt="" className='w-4 filter drop-shadow-md' />
      )}
    </div>
  );

  const handleView = (orderData) => {
    setSelectedOrder(orderData.orderDetails);
    setShowModal(true);
  };

  const handleViewHistory = (orderData) => {
    setSelectedOrder(orderData.orderDetails);
    setShowTimeline(true);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'none';
      key = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) return '';
    return sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽';
  };

  const sortedData = () => {
    const transformedData = transformData();
    if (sortConfig.key === null) return transformedData;

    return [...transformedData].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };


  const filteredData = () => {
    const data = sortedData();
    if (!filterInput) return data;

    const filterLower = filterInput.toLowerCase();
    return data.filter(row => {
      return (
        String(row.orderNo).toLowerCase().includes(filterLower) ||
        (row.dispatcherName && row.dispatcherName.toLowerCase().includes(filterLower)) ||
        (row.customerName && row.customerName.toLowerCase().includes(filterLower))
      );
    });
  };

  // Pagination logic
  const paginatedData = () => {
    const data = filteredData();
    const startIndex = currentPage * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  };

  const pageCount = Math.ceil(filteredData().length / pageSize);
  const canPreviousPage = currentPage > 0;
  const canNextPage = currentPage < pageCount - 1;

  const goToPage = (page) => {
    setCurrentPage(Math.max(0, Math.min(page, pageCount - 1)));
  };

  const previousPage = () => {
    if (canPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (canNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleFilterChange = e => {
    const value = e.target.value || "";
    setFilterInput(value);
  };

  const handleChangePageSize = (e) => {
    const newPageSize = Number(e.target.value);
    setPageSize(newPageSize);
    setCurrentPage(0);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading orders...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setCreateOrder(true)} className="mt-2 sm:mt-0 bg-[#FF3333] text-white flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-md transition-colors duration-200 font-medium hover:bg-orange-600 hover:text-white">
            <Plus size={16} /> Create Order
          </button>
        </div>

        <div className='flex items-center gap-8'>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={filterInput}
              className="px-4 py-2 pr-10 border border-[#FFD7BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6900] focus:border-[#FF6900] font-inter text-gray-700"
              onChange={handleFilterChange}
            />
            <svg
              className="w-5 h-5 absolute right-3 top-3 text-[#FF6900]"
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
          <button className="flex items-center justify-center gap-2 bg-[#6B7499] hover:bg-gray-500 text-white py-2 px-4 rounded-lg shadow-md transition-colors duration-200">
            <BsFiletypeCsv size={20} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {filteredData().length === 0 ? (
        <div className="flex justify-center items-center h-64 bg-[#FFF5EC] rounded-md border border-[#FFD7BC]">
          <p className="text-[#996633] font-medium">No orders found</p>
        </div>
      ) : (
        <>
          <div className="flex-1 mt-4 overflow-auto">
            <div className="overflow-x-auto">
              <table
                className="w-full divide-y rounded-lg overflow-hidden font-inter border-collapse"
                style={{
                  tableLayout: 'fixed',
                  boxShadow: '0 8px 20px rgba(255, 102, 0, 0.15)',
                  borderRadius: '0.5rem'
                }}
              >
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-orange-600 to-orange-500">
                    {[
                      { key: 'orderNo', label: 'Ord No', width: '8%' },
                      { key: 'dispatcherName', label: 'Dispatcher', width: '10%' },
                      { key: 'customerName', label: 'Customer', width: '10%' },
                      { key: 'createdAt', label: 'Created', width: '10%' },
                      { key: 'completionPercentage', label: 'Status', width: '14%' },
                      { key: 'glass', label: 'Glass', width: '7%' },
                      { key: 'cap', label: 'Cap', width: '7%' },
                      { key: 'box', label: 'Box', width: '7%' },
                      { key: 'pump', label: 'Pump', width: '7%' },
                      { key: 'decoration', label: 'Deco', width: '7%' },
                    ].map(col => (
                      <th
                        key={col.key}
                        className="px-2 py-1.5 text-center font-bold text-sm text-white cursor-pointer transition-colors hover:bg-orange-400"
                        onClick={() => requestSort(col.key)}
                        style={{ width: col.width }}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {col.label} {getSortIcon(col.key)}
                        </div>
                      </th>
                    ))}
                    <th className="px-2 py-1.5 text-center font-bold text-sm text-white w-8">
                      <span className="sr-only">History</span>
                    </th>
                    <th className="px-2 py-1.5 text-center font-bold text-sm text-white w-8">
                      <span className="sr-only">View</span>
                    </th>
                    <th className="px-2 py-1.5 text-center font-bold text-sm text-white w-8">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-gradient-to-b from-white to-orange-50 divide-y divide-orange-100">
                  {paginatedData().map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowBgClass = isEven ? 'bg-white/80' : 'bg-orange-50/90';

                    return (
                      <tr
                        className={`${rowBgClass} hover:bg-orange-100/70 transition-all duration-150`}
                        key={idx}
                      >
                        <td className="px-2 py-2.5 text-center text-sm font-medium text-gray-800">{row.orderNo}</td>
                        <td className="px-2 py-2.5 text-center text-sm text-gray-700 truncate">{row.dispatcherName}</td>
                        <td className="px-2 py-2.5 text-center text-sm text-gray-700 truncate">{row.customerName}</td>
                        <td className="px-2 py-2.5 text-center text-sm text-gray-700">{formatSimpleDate(row.createdAt)}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1.5 h-6">
                            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${row.completionPercentage}%`,
                                  background: `linear-gradient(90deg, #FF8A00 0%, #FF6600 100%)`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-orange-600 whitespace-nowrap min-w-8 text-right">
                              {row.completionPercentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <StatusBadge value={row.glass} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <StatusBadge value={row.cap} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <StatusBadge value={row.box} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <StatusBadge value={row.pump} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <StatusBadge value={row.decoration} />
                        </td>
                        <td className="p-0.5 text-center">
                          <button
                            className="flex items-center justify-center p-1.5 bg-gradient-to-r from-amber-600 to-amber-700 rounded text-white hover:from-amber-500 hover:to-amber-600 transition-all shadow-sm"
                            onClick={() => handleViewHistory(row)}
                          >
                            <TbTimelineEvent size={16} />
                          </button>
                        </td>
                        <td className="p-0.5 text-center">
                          <button
                            className="flex items-center justify-center p-1.5 bg-gradient-to-r from-orange-400 to-orange-500 rounded text-white hover:from-orange-300 hover:to-orange-400 transition-all shadow-sm"
                            onClick={() => handleView(row)}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                        <td className="p-0.5 text-center">
                          <button
                            className="flex items-center justify-center p-1.5 bg-gradient-to-r from-orange-600 to-orange-700 rounded text-white hover:from-orange-500 hover:to-orange-600 transition-all shadow-sm"
                            onClick={() => console.log('Edit clicked')}
                          >
                            <FiEdit size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>


          <div className="mt-4 pt-3 border-t border-[#FFDFC8]">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-[#703800]">
                  Page{' '}
                  <span className="font-medium">{currentPage + 1}</span> of{' '}
                  <span className="font-medium">{pageCount}</span>
                </span>
                <select
                  value={pageSize}
                  onChange={handleChangePageSize}
                  className="ml-2 border-[#FFD7BC] rounded-lg focus:outline-none focus:ring-[#FF6900] focus:border-[#FF6900] text-sm text-[#703800]"
                >
                  {[5, 10, 20].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(0)}
                  disabled={!canPreviousPage}
                  className="px-3 py-1.5 border border-[#FFD7BC] rounded-md text-sm font-medium text-[#FF6900] disabled:opacity-50 hover:bg-[#FFF5EC] transition-colors duration-200"
                >
                  {'<<'}
                </button>
                <button
                  onClick={previousPage}
                  disabled={!canPreviousPage}
                  className="px-3 py-1.5 border border-[#FFD7BC] rounded-md text-sm font-medium text-[#FF6900] disabled:opacity-50 hover:bg-[#FFF5EC] transition-colors duration-200"
                >
                  {'<'}
                </button>
                <button
                  onClick={nextPage}
                  disabled={!canNextPage}
                  className="px-3 py-1.5 border border-[#FFD7BC] rounded-md text-sm font-medium text-[#FF6900] disabled:opacity-50 hover:bg-[#FFF5EC] transition-colors duration-200"
                >
                  {'>'}
                </button>
                <button
                  onClick={() => goToPage(pageCount - 1)}
                  disabled={!canNextPage}
                  className="px-3 py-1.5 border border-[#FFD7BC] rounded-md text-sm font-medium text-[#FF6900] disabled:opacity-50 hover:bg-[#FFF5EC] transition-colors duration-200"
                >
                  {'>>'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && <ViewDispatcherOrderDetails orders={selectedOrder} onClose={handleClose} />}
      {createOrder && <CreateOrder onClose={handleClose} onCreateOrder={handleCreateOrder} />}
      {showTimeline && <OrderActivity onClose={handleClose} orderData={selectedOrder} />}
    </div>
  );
};

export default Table2;