import React from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';


function ViewDispatcherOrderDetails({ onClose, orders }) {
  if (!orders) {
    console.error("No order data provided to ViewDispatcherOrderDetails");
    return null;
  }

  const StatusBadge = ({ value }) => {
    const status = value || "Pending";

    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === "Completed"
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800"
          }`}>
          {status}
        </span>

      </div>
    );
  };

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };


  const categories = [
    {
      id: 'glass',
      title: 'Glass',
      items: orders.order_details.glass || [],
      keyField: 'glass_name',
      detailFields: [
        { key: 'weight', label: 'Weight' },
        { key: 'neck_size', label: 'Neck Size' },
        {
          key: 'decoration_type', label: 'Decoration', getValue: (item) =>
            item.decoration_details?.type || '-'
        }
      ]
    },
    {
      id: 'caps',
      title: 'Caps',
      items: orders.order_details.caps || [],
      keyField: 'cap_name',
      detailFields: [
        { key: 'neck_size', label: 'Neck Size' },
        { key: 'process', label: 'Process' },
        { key: 'material', label: 'Material' }
      ]
    },
    {
      id: 'boxes',
      title: 'Boxes',
      items: orders.order_details.boxes || [],
      keyField: 'box_name',
      detailFields: [
        { key: 'approval_code', label: 'Approval Code' }
      ]
    },
    {
      id: 'pumps',
      title: 'Pumps',
      items: orders.order_details.pumps || [],
      keyField: 'pump_name',
      detailFields: [
        { key: 'neck_type', label: 'Neck Type' }
      ]
    }
  ];

  const activeCategories = categories.filter(category => category.items.length > 0);

  return (
    <Dialog open={true} onClose={onClose} className="relative z-10">
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[90vw]">
            <div className="bg-[#FF6701] px-6 py-4">
              <DialogTitle as="h3" className="text-xl font-bold text-white flex items-center justify-between">
                Order #{orders.order_number} Details
                <button
                  onClick={onClose}
                  className="text-white hover:text-amber-200 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </DialogTitle>
            </div>

            <div className="bg-white px-6 pt-5 pb-6 max-h-[70vh] overflow-y-auto">
              {/* Order summary card */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 shadow-sm border border-orange-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-2">
                    <h4 className="text-sm font-medium text-orange-800">Customer</h4>
                    <p className="text-gray-900 font-semibold mt-1">{orders.customer_name}</p>
                  </div>
                  <div className="p-2">
                    <h4 className="text-sm font-medium text-orange-800">Order Date</h4>
                    <p className="text-gray-900 font-semibold mt-1">{formatDate(orders.created_at)}</p>
                  </div>
                  <div className="p-2">
                    <h4 className="text-sm font-medium text-orange-800">Dispatcher</h4>
                    <p className="text-gray-900 font-semibold mt-1">{orders.dispatcher_name}</p>
                  </div>
                  <div className="p-2">
                    <h4 className="text-sm font-medium text-orange-800">Status</h4>
                    <div className="mt-1">
                      <StatusBadge value={orders.order_status} />
                    </div>
                  </div>
                </div>
              </div>


              {activeCategories.map((category) => (
                <div key={category.id} className="mt-6">

                  <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] rounded-t-lg py-2 px-4">
                    <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                  </div>

                  <div className="overflow-x-auto border-x border-b border-orange-200 rounded-b-lg shadow-sm">
                    <table className="min-w-full divide-y divide-orange-200">
                      <thead className="bg-gradient-to-r from-orange-100 to-amber-100">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-orange-900 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-orange-900 uppercase tracking-wider">
                            Quantity
                          </th>
                          {category.detailFields.map((field) => (
                            <th key={field.key} scope="col" className="px-4 py-3 text-left text-sm font-semibold text-orange-900 uppercase tracking-wider">
                              {field.label}
                            </th>
                          ))}
                          <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-orange-900 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {item[category.keyField] || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.quantity || '-'}
                            </td>
                            {category.detailFields.map((field) => (
                              <td key={field.key} className="px-4 py-3 text-sm text-gray-900">
                                {field.getValue ? field.getValue(item) : (item[field.key] || '-')}
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <StatusBadge value={item.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex cursor-pointer justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
              >
                Close
              </button>     
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

export default ViewDispatcherOrderDetails;