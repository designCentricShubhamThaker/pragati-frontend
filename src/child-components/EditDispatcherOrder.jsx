import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { glassData } from '../data/glassData';
import {
  updateLocalStorageOrders,
  generateLocalStorageKey,
} from '../utils/LocalStorageUtils.jsx';
import { Plus } from 'lucide-react';
import { GoTrash } from "react-icons/go";
import { CapData } from '../data/CapData';
import axios from 'axios';
import { useSocket } from '../context/SocketContext.jsx';

const EditDispatcherOrder = ({ onClose, orders, onSave, user }) => {
  const dispatchers = ["Rajesh Kumar", "Anita Sharma"];
  const customers = [
    "Amit Verma",
    "Priya Patel",
    "Rohan Singh",
    "Neha Gupta",
    "Vikram Iyer",
    "Sunita Nair",
    "Arjun Malhotra",
    "Deepa Joshi"
  ];

  const [isDropdownVisible, setIsDropdownVisible] = useState(null);
  const [isCapDropdownVisible, setIsCapDropdownVisible] = useState(null);
  const decorationOptions = ["Printing", "Coating", "Frosting", "None"];
  const [glassSearches, setGlassSearches] = useState({});
  const [filteredGlassData, setFilteredGlassData] = useState(glassData);
  const [capSearches, setCapSearches] = useState({});
  const [filteredCapData, setFilteredCapData] = useState(CapData);
  const [orderNumber, setOrderNumber] = useState(orders.order_number || "");
  const [dispatcherName, setDispatcherName] = useState(orders.dispatcher_name || "");
  const [customerName, setCustomerName] = useState(orders.customer_name || "");
  const boxNames = ["Box A", "Box B", "Box C", "Box D"];
  const pumpNames = ["Pump A", "Pump B", "Pump C", "Pump D"];
  const capProcessOptions = ["Metalised", "Non Metalised", "Metal and Assembly", "Non Metal and Assembly"];

  const { notifyEditOrder } = useSocket()
  const capMaterialOptions = ["Plastic", "Aluminium", "Other"];
  const { isConnected } = useSocket()
  const [orderDetails, setOrderDetails] = useState({
    items: [{
      glass_name: "N/A",
      quantity: "",
      weight: "",
      neck_size: "",
      decoration: "N/A",
      decoration_no: "",
      status: "Pending"
    }],
    caps: [{
      cap_name: "N/A",
      neck_size: "",
      quantity: "",
      cap_process: "N/A",
      cap_material: "N/A",
      status: "Pending"
    }],
    boxes: [{
      box_name: "N/A",
      quantity: "",
      approval_code: "",
      status: "Pending"
    }],
    pumps: [{
      pump_name: "N/A",
      neck_type: "",
      quantity: "",
      status: "Pending"
    }]
  });

  useEffect(() => {
    setOrderNumber(orders.order_number || "");
    setDispatcherName(orders.dispatcher_name || "");
    setCustomerName(orders.customer_name || "");

    if (orders.order_details && orders.order_details.glass && orders.order_details.glass.length > 0) {

      const glassItems = orders.order_details.glass.map(item => ({
        glass_name: item.glass_name || "N/A",
        quantity: item.quantity || "",
        weight: item.weight || "",
        neck_size: item.neck_size || "",
        decoration: item.decoration || "N/A",
        decoration_no: item.decoration_no || "",
        team: item.team || "Glass Manufacturing - Mumbai",
        status: item.status || "Pending"
      }));

      setOrderDetails(prevDetails => ({
        ...prevDetails,
        items: glassItems
      }));

      const searches = {};
      glassItems.forEach((item, index) => {
        if (item.glass_name && item.glass_name !== "N/A") {
          searches[index] = item.glass_name;
        }
      });
      setGlassSearches(searches);
    }

    if (orders.order_details && orders.order_details.caps && orders.order_details.caps.length > 0) {
      setOrderDetails(prevDetails => ({
        ...prevDetails,
        caps: [...orders.order_details.caps]
      }));
    }

    if (orders.order_details && orders.order_details.boxes && orders.order_details.boxes.length > 0) {
      setOrderDetails(prevDetails => ({
        ...prevDetails,
        boxes: [...orders.order_details.boxes]
      }));
    }

    if (orders.order_details && orders.order_details.pumps && orders.order_details.pumps.length > 0) {
      setOrderDetails(prevDetails => ({
        ...prevDetails,
        pumps: [...orders.order_details.pumps]
      }));
    }
  }, [orders]);

  const handleDetailChange = (category, index, field, value) => {
    const updatedDetails = { ...orderDetails };
    updatedDetails[category][index][field] = value;
    setOrderDetails(updatedDetails);
  };

  const addItem = (category) => {
    const updatedDetails = { ...orderDetails };

    let newItem = {};

    switch (category) {
      case 'items':
        newItem = {
          glass_name: "N/A",
          quantity: "",
          weight: "",
          neck_size: "",
          decoration: "N/A",
          decoration_no: "",
          team: "Glass Manufacturing - Mumbai",
          status: "Pending"
        };
        break;
      case 'caps':
        newItem = {
          cap_name: "N/A",
          neck_size: "",
          quantity: "",
          cap_process: "N/A",
          cap_material: "N/A",
          team: "Cap Manufacturing Team",
          status: "Pending"
        };
        break;
      case 'boxes':
        newItem = {
          box_name: "N/A",
          quantity: "",
          approval_code: "",
          team: "Packaging Team",
          status: "Pending"
        };
        break;
      case 'pumps':
        newItem = {
          pump_name: "N/A",
          neck_type: "",
          quantity: "",
          team: "Pump Manufacturing Team",
          status: "Pending"
        };
        break;
      default:
        break;
    }

    updatedDetails[category].push(newItem);
    setOrderDetails(updatedDetails);

    setIsDropdownVisible(false);
  };

  const removeItem = (category, index) => {
    if (orderDetails[category].length === 1) return;

    const updatedDetails = { ...orderDetails };
    updatedDetails[category].splice(index, 1);
    setOrderDetails(updatedDetails);
  };

  const handleSave = async () => {
    try {

      const currentOrderDetails = orders.order_details || {};

      const mergedOrderDetails = { ...currentOrderDetails };

      if (orderDetails.caps?.length > 0) {

        const validCaps = orderDetails.caps.filter(cap =>
          cap.cap_name && cap.cap_name !== "N/A" &&
          cap.neck_size && cap.neck_size !== "-"
        );

        if (validCaps.length > 0) {
          mergedOrderDetails.caps = validCaps.map(cap => ({
            ...cap,
            cap_name: cap.cap_name,
            neck_size: cap.neck_size,
            quantity: cap.quantity,
            process: cap.process,
            material: cap.material,

            team: cap.team || "Cap Manufacturing Team",
            status: cap.status || "Pending",
            team_tracking: cap.team_tracking || undefined,
            _id: cap._id || undefined
          }));
        }
      }

      if (orderDetails.items?.length > 0) {
        const validItems = orderDetails.items.filter(item =>
          item.glass_name && item.glass_name !== "N/A"
        );

        if (validItems.length > 0) {
          mergedOrderDetails.glass = validItems.map(item => ({
            ...item,
            glass_name: item.glass_name,
            quantity: item.quantity,
            weight: item.weight,
            neck_size: item.neck_size,
            decoration: item.decoration,
            decoration_no: item.decoration_no,
            team: item.team || "Glass Manufacturing Team",
            status: item.status || "Pending",
            _id: item._id || undefined,
            decoration_details: item.decoration_details || {
              type: item.decoration,
              decoration_number: item.decoration_no
            }
          }));
        }
      }

      if (orderDetails.boxes?.length > 0) {
        const validBoxes = orderDetails.boxes.filter(box =>
          box.box_name && box.box_name !== "N/A"
        );

        if (validBoxes.length > 0) {
          mergedOrderDetails.boxes = validBoxes.map(box => ({
            ...box,
            box_name: box.box_name,
            approval_code: box.approval_code,
            quantity: box.quantity,
            team: box.team || "Packaging Team",
            status: box.status || "Pending",
            _id: box._id || undefined
          }));
        }
      }

      if (orderDetails.pumps?.length > 0) {
        const validPumps = orderDetails.pumps.filter(pump =>
          pump.pump_name && pump.pump_name !== "N/A"
        );

        if (validPumps.length > 0) {
          mergedOrderDetails.pumps = validPumps.map(pump => ({
            ...pump,
            pump_name: pump.pump_name,
            neck_type: pump.neck_type,
            quantity: pump.quantity,
            team: pump.team || "Pump Manufacturing Team",
            status: pump.status || "Pending",
            _id: pump._id || undefined
          }));
        }
      }

      const updatedOrder = {
        ...orders,
        order_number: orderNumber,
        dispatcher_name: dispatcherName,
        customer_name: customerName,
        order_details: mergedOrderDetails
      };

      console.log("Sending to DB:", updatedOrder);

      const updatedOrders = updateLocalStorageOrders(user, [updatedOrder]);
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: {
          key: generateLocalStorageKey(user),
          orders: updatedOrders
        }
      }));

      const response = await axios.put(
        `https://pragati-backend-omid.onrender.com/orders/${updatedOrder._id || updatedOrder.order_number}`,
        updatedOrder
      );

      if (isConnected && notifyEditOrder) {
        console.log("🔔 Notifying teams about order update via socket");
        notifyEditOrder(updatedOrder); // Emit to relevant teams
      }
      onSave(updatedOrder);
      onClose();

    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update order in DB. Changes saved locally.");
      onSave(orders);
      onClose();
    }
  };


  return (
    <Dialog open={true} onClose={onClose} className="relative z-10">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-screen-xl">
            <div className="bg-white px-1 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[90vh] overflow-y-auto">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <DialogTitle as="h3">
                    <div className="bg-[#FF6701] p-4 rounded-t-md border-b border-orange-200 shadow-sm text-center">
                      <h3 className="text-white text-xl font-bold flex tracking-wide gap-2">
                        Edit Order
                      </h3>
                    </div>
                  </DialogTitle>
                  <form className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 bg-[#FFF0E7] gap-6 mb-8">
                      <div className="p-5">
                        <label className="block text-sm font-medium text-orange-600 mb-1">
                          Order Number
                        </label>
                        <input
                          type="text"
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        />
                      </div>

                      <div className="rounded-md p-5">
                        <label className="block text-sm font-medium text-orange-600 mb-1">
                          Dispatcher Name
                        </label>
                        <select
                          value={dispatcherName}
                          onChange={(e) => setDispatcherName(e.target.value)}
                          className="w-full px-3 bg-white py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        >
                          <option value="">Select Dispatcher</option>
                          {dispatchers.map((dispatcher, idx) => (
                            <option key={idx} value={dispatcher}>
                              {dispatcher}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-md p-5">
                        <label className="block text-sm font-medium text-orange-600 mb-1">
                          Customer Name
                        </label>
                        <select
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 bg-white py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        >
                          <option value="">Select Customer</option>
                          {customers.map((customer, idx) => (
                            <option key={idx} value={customer}>
                              {customer}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-8 rounded-xl shadow-lg overflow-hidden border border-orange-200">
                      <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] p-4">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                          <span className="mr-2">Team - Glass</span>
                        </h3>
                      </div>
                      <div className="p-6 bg-[#FFF8F3] space-y-6">
                        {orderDetails.items.map((item, index) => (
                          <div
                            key={`item-${index}`}
                            className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100"
                          >
                            <div className="grid grid-cols-12 gap-4">
                              <div className="col-span-12 md:col-span-4">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Glass Name</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={item.glass_name === "N/A" ? "" : (glassSearches[index] || item.glass_name)}
                                    placeholder="Please Select"
                                    onFocus={() => {
                                      setIsDropdownVisible(index);
                                      setFilteredGlassData(glassData.filter(glass => glass.FORMULA !== "N/A"));
                                    }}
                                    onChange={(e) => {
                                      const newSearches = { ...glassSearches, [index]: e.target.value };
                                      setGlassSearches(newSearches);
                                      const searchTerm = e.target.value.toLowerCase();
                                      const filtered = glassData.filter(glass =>
                                        (glass.FORMULA !== "N/A" || searchTerm === "n/a") &&
                                        glass.FORMULA.toLowerCase().includes(searchTerm)
                                      );
                                      setFilteredGlassData(filtered);
                                    }}
                                    className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
     focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
     placeholder:text-gray-400"
                                  />
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 absolute right-3 top-3 text-orange-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>

                                  <div className="relative">
                                    {isDropdownVisible === index && (
                                      <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                                        {filteredGlassData.length > 0 ? (
                                          filteredGlassData.map((glass, idx) => (
                                            <div
                                              key={idx}
                                              className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                                              onClick={() => {
                                                const newSearches = { ...glassSearches, [index]: glass.FORMULA === "N/A" ? "" : glass.FORMULA };
                                                setGlassSearches(newSearches);
                                                handleDetailChange('items', index, 'glass_name', glass.FORMULA);
                                                handleDetailChange('items', index, 'neck_size', glass.NECK_DIAM);
                                                handleDetailChange('items', index, 'weight', glass.ML);
                                                setIsDropdownVisible(false);
                                              }}
                                            >
                                              <span className="text-orange-700 font-medium">
                                                {glass.FORMULA === "N/A" ? "Please Select" : glass.FORMULA}
                                              </span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="col-span-12 md:col-span-8">
                                <div className="grid grid-cols-12 gap-4">
                                  <div className="col-span-6 md:col-span-2">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Weight</label>
                                    <input
                                      type="text"
                                      value={item.weight}
                                      onChange={(e) => handleDetailChange('items', index, 'weight', e.target.value)}
                                      className="w-full px-4 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium"
                                      readOnly
                                    />
                                  </div>

                                  <div className="col-span-6 md:col-span-2">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Neck Size</label>
                                    <input
                                      type="text"
                                      value={item.neck_size}
                                      onChange={(e) => handleDetailChange('items', index, 'neck_size', e.target.value)}
                                      className="w-full px-4 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium"
                                      readOnly
                                    />
                                  </div>

                                  <div className="col-span-12 md:col-span-3">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Decoration</label>
                                    <div className="relative">
                                      <select
                                        value={item.decoration}
                                        onChange={(e) => handleDetailChange('items', index, 'decoration', e.target.value)}
                                        className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
        focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                      >
                                        <option value="N/A">Please Select</option>
                                        {decorationOptions
                                          .filter(name => name !== "N/A")
                                          .map((name, idx) => (
                                            <option key={idx} value={name}>
                                              {name}
                                            </option>
                                          ))}
                                      </select>

                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>

                                  <div className="col-span-6 md:col-span-2">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Deco No</label>
                                    <input
                                      type="text"
                                      value={item.decoration_no}
                                      onChange={(e) => handleDetailChange('items', index, 'decoration_no', e.target.value)}
                                      className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
      focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                  </div>


                                  <div className="col-span-6 md:col-span-3">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleDetailChange('items', index, 'quantity', e.target.value)}
                                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
        focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="absolute -top-3 right-3 flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => addItem("items")}
                                className="text-white p-1.5 cursor-pointer rounded-full bg-orange-600 hover:bg-orange-700 transition-colors shadow-sm"
                                title="Add New Item"
                              >
                                <Plus size={16} strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem("items", index)}
                                className={`text-white p-1.5 rounded-full transition-colors shadow-sm
${orderDetails.items.length === 1
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                                  }`}
                                disabled={orderDetails.items.length === 1}
                                title="Remove Item"
                              >
                                <GoTrash size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-8 rounded-xl shadow-lg overflow-hidden border border-orange-200">
                      <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] p-4">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                          <span className="mr-2">Team - Cap</span>
                        </h3>
                      </div>

                      <div className="p-6 bg-[#FFF8F3] space-y-6">
                        {orderDetails.caps.map((cap, index) => (
                          <div
                            key={`cap-${index}`}
                            className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                              <div className="col-span-1 md:col-span-4">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Cap Name</label>
                                <input
                                  type="text"
                                  value={cap.cap_name === "N/A" ? "" : (capSearches[index] || cap.cap_name)}
                                  placeholder="Please Select"
                                  onFocus={() => {
                                    setIsCapDropdownVisible(index);
                                    setFilteredCapData(CapData.filter(cap => cap.FORMULA !== "N/A"));
                                  }}
                                  onChange={(e) => {
                                    const newSearches = { ...capSearches, [index]: e.target.value };
                                    setCapSearches(newSearches);
                                    const searchTerm = e.target.value.toLowerCase();
                                    const filtered = CapData.filter(cap =>
                                      (cap.FORMULA !== "N/A" || searchTerm === "n/a") &&
                                      cap.FORMULA.toLowerCase().includes(searchTerm)
                                    );
                                    setFilteredCapData(filtered);
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-orange-300 rounded-md text-sm 
                       focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       placeholder:text-gray-400"
                                />

                                <div className="relative">
                                  {isCapDropdownVisible === index && (
                                    <div className="absolute z-10 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                                      {filteredCapData.length > 0 ? (
                                        filteredCapData.map((cap, idx) => (
                                          <div
                                            key={idx}
                                            className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors"
                                            onClick={() => {
                                              const newSearches = { ...capSearches, [index]: cap.FORMULA === "N/A" ? "" : cap.FORMULA };
                                              setCapSearches(newSearches);
                                              handleDetailChange('caps', index, 'cap_name', cap.FORMULA);
                                              handleDetailChange('caps', index, 'neck_size', cap.NECK_DIAM);
                                              setIsCapDropdownVisible(false);
                                            }}
                                          >
                                            <span className="text-orange-700 font-medium">
                                              {cap.FORMULA === "N/A" ? "Please Select" : cap.FORMULA}
                                            </span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Neck Size</label>
                                <input
                                  type="text"
                                  value={cap.neck_size}
                                  onChange={(e) => handleDetailChange('items', index, 'neck_size', e.target.value)}
                                  className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm bg-gray-50 text-orange-800 font-medium"
                                  readOnly
                                />
                              </div>

                              <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                <input
                                  type="number"
                                  value={cap.quantity}
                                  onChange={(e) => handleDetailChange('caps', index, 'quantity', e.target.value)}
                                  className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                              </div>

                              <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Process</label>
                                <div className="relative">
                                  <select
                                    value={cap.process}
                                    onChange={(e) => handleDetailChange('caps', index, 'process', e.target.value)}

                                    className="w-full appearance-none px-4 py-3 bg-white border border-orange-300 rounded-md text-sm 
                          focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  >
                                    <option value="N/A">Please Select</option>
                                    {capProcessOptions
                                      .filter(name => name !== "N/A")
                                      .map((name, idx) => (
                                        <option key={idx} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                  </select>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>

                              <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Material</label>
                                <div className="relative">
                                  <select
                                    value={cap.material}
                                    onChange={(e) => handleDetailChange('caps', index, 'material', e.target.value)}
                                    className="w-full appearance-none px-4 py-3 bg-white border border-orange-300 rounded-md text-sm 
                          focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  >
                                    <option value="N/A">Please Select</option>
                                    {capMaterialOptions
                                      .filter(name => name !== "N/A")
                                      .map((name, idx) => (
                                        <option key={idx} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                  </select>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>

                            </div>
                            <div className="absolute -top-3 right-3 flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => addItem('caps')}
                                className="text-white p-1.5 cursor-pointer rounded-full bg-orange-600 hover:bg-orange-700 transition-colors shadow-sm"
                                title="Add New Cap"
                              >
                                <Plus size={16} strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem('caps', index)}
                                className={`text-white p-1.5 rounded-full transition-colors shadow-sm
                    ${orderDetails.caps.length === 1
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                                  }`}
                                disabled={orderDetails.caps.length === 1}
                                title="Remove Cap"
                              >
                                <GoTrash size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>




                    <div className="mb-8 rounded-xl shadow-lg overflow-hidden border border-orange-200">
                      <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] p-4">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                          <span className="mr-2">Team - Box</span>
                        </h3>
                      </div>

                      <div className="p-6 bg-[#FFF8F3] space-y-6">
                        {orderDetails.boxes.map((box, index) => (
                          <div
                            key={`box-${index}`}
                            className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                              <div className="col-span-1">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Box Name</label>
                                <div className="relative">
                                  <select
                                    value={box.box_name}
                                    onChange={(e) => handleDetailChange('boxes', index, 'box_name', e.target.value)}
                                    className="w-full appearance-none px-4 py-3 border bg-white border-orange-300 rounded-md text-sm 
                          focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  >
                                    <option value="N/A">Please Select</option>
                                    {boxNames
                                      .filter(name => name !== "N/A")
                                      .map((name, idx) => (
                                        <option key={idx} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                  </select>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              <div className="col-span-1">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Approval Code</label>
                                <input
                                  type="text"
                                  value={box.approval_code}
                                  onChange={(e) => handleDetailChange('boxes', index, 'approval_code', e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-orange-300 rounded-md text-sm 
                        focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                              </div>

                              {/* Quantity */}
                              <div className="col-span-1">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                <input
                                  type="number"
                                  value={box.quantity}
                                  onChange={(e) => handleDetailChange('boxes', index, 'quantity', e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-orange-300 rounded-md text-sm 
                        focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="absolute -top-3 right-3 flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => addItem("boxes")}
                                className="text-white p-1.5 cursor-pointer rounded-full bg-orange-600 hover:bg-orange-700 transition-colors shadow-sm"
                                title="Add New Box"
                              >
                                <Plus size={16} strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem("boxes", index)}
                                className={`text-white p-1.5 rounded-full transition-colors shadow-sm
                      ${orderDetails.boxes.length === 1
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                                  }`}
                                disabled={orderDetails.boxes.length === 1}
                                title="Remove Box"
                              >
                                <GoTrash size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>


                    <div className="mb-8 rounded-xl shadow-lg overflow-hidden border border-orange-200">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] p-4">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                          <span className="mr-2">Team - Pump</span>
                        </h3>
                      </div>

                      <div className="p-6 bg-[#FFF8F3] space-y-6">
                        {orderDetails.pumps.map((pump, index) => (
                          <div
                            key={`pump-${index}`}
                            className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Pump Name */}
                              <div className="col-span-1">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Pump Name</label>
                                <div className="relative">
                                  <select
                                    value={pump.pump_name}
                                    onChange={(e) => handleDetailChange('pumps', index, 'pump_name', e.target.value)}
                                    className="w-full appearance-none px-4 py-3 bg-white border border-orange-300 rounded-md text-sm 
                          focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  >
                                    <option value="N/A">Please Select</option>
                                    {pumpNames
                                      .filter(name => name !== "N/A")
                                      .map((name, idx) => (
                                        <option key={idx} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                  </select>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>

                              {/* Neck Type */}
                              <div className="col-span-1">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Neck Type</label>
                                <input
                                  type="text"
                                  value={pump.neck_type}
                                  onChange={(e) => handleDetailChange('pumps', index, 'neck_type', e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-orange-300 rounded-md text-sm 
                        focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                              </div>

                              {/* Quantity */}
                              <div className="col-span-1">
                                <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                <input
                                  type="number"
                                  value={pump.quantity}
                                  onChange={(e) => handleDetailChange('pumps', index, 'quantity', e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-orange-300 rounded-md text-sm 
                        focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="absolute -top-3 right-3 flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => addItem("pumps")}
                                className="text-white p-1.5 cursor-pointer rounded-full bg-orange-600 hover:bg-orange-700 transition-colors shadow-sm"
                                title="Add New Pump"
                              >
                                <Plus size={16} strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem("pumps", index)}
                                className={`text-white p-1.5 rounded-full transition-colors shadow-sm
                      ${orderDetails.pumps.length === 1
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                                  }`}
                                disabled={orderDetails.pumps.length === 1}
                                title="Remove Pump"
                              >
                                <GoTrash size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-300 cursor-pointer text-black px-4 py-2 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="bg-[#FF6701] px-5 cursor-pointer text-white py-2 rounded-md"
                      >
                        Save
                      </button>

                    </div>
                  </form>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default EditDispatcherOrder;