import React, { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  Clock,
  PieChart,
  Users,
  Package,
  X,
  Check,
  ArrowRight,
  Calendar,
  Filter,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  List,
  Grid
} from 'lucide-react';

// Utility function to process order data
const processOrderData = (orderData) => {
  const timeline = [];
  const itemDetails = {};

  // Process all items in the order
  ['glass', 'caps', 'boxes', 'pumps'].forEach(itemType => {
    if (orderData.order_details?.[itemType]) {
      orderData.order_details[itemType].forEach(item => {
        const completedEntries = item.team_tracking?.completed_entries || [];
        const itemKey = `${itemType}-${item.glass_name || item.name}`;

        if (!itemDetails[itemKey]) {
          itemDetails[itemKey] = {
            teamType: itemType,
            orderNumber: orderData.order_number,
            itemName: item.glass_name || item.name,
            decoration: item.decoration,
            decorationNumber: item.decoration_no,
            originalQuantity: item.quantity,
            entries: []
          };
        }

        completedEntries.forEach(entry => {
          const timelineEntry = {
            ...itemDetails[itemKey],
            timestamp: entry.timestamp,
            previousCompleted: completedEntries[completedEntries.indexOf(entry) - 1]?.qty_completed || 0,
            newCompleted: entry.qty_completed,
            change: entry.qty_completed,
            percentComplete: Math.round((entry.qty_completed / item.quantity) * 100),
            isComplete: item.team_tracking.total_completed_qty === item.quantity
          };

          timeline.push(timelineEntry);
          itemDetails[itemKey].entries.push(timelineEntry);
        });
      });
    }
  });

  // Sort timeline by timestamp
  return {
    timeline: timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    itemDetails: Object.values(itemDetails)
  };
};

const OrderActivity = ({ onClose, orderData }) => {
  const [processedData, setProcessedData] = useState({ timeline: [], itemDetails: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [viewMode, setViewMode] = useState('timeline');
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  useEffect(() => {
    if (orderData) {
      const processed = processOrderData(orderData);
      setProcessedData(processed);
      setIsLoading(false);
    }
  }, [orderData]);

  const filteredTimeline = selectedTeam === 'all'
    ? timeline
    : timeline.filter(entry => entry.teamType === selectedTeam);

  const groupedByDate = filteredTimeline.reduce((acc, entry) => {
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});

  const dateKeys = Object.keys(groupedByDate).sort((a, b) =>
    new Date(b) - new Date(a)
  );

  const teams = [...new Set(timeline.map(entry => entry.teamType))];

  const getTeamIcon = (teamType, size = 18) => {
    switch (teamType) {
      case 'glass':
        return <PieChart size={size} className="text-blue-500" />;
      case 'caps':
        return <Clock size={size} className="text-green-500" />;
      case 'boxes':
        return <Package size={size} className="text-amber-500" />;
      case 'pumps':
        return <Users size={size} className="text-purple-500" />;
      default:
        return <Users size={size} className="text-gray-500" />;
    }
  };

  const getTeamDisplayName = (teamType) => {
    const teamNames = {
      'glass': 'Glass Manufacturing',
      'caps': 'Caps Team',
      'boxes': 'Packaging Team',
      'pumps': 'Pumps Team'
    };
    return teamNames[teamType] || 'Unknown Team';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';

    return formatDate(dateString);
  };

  const goToPreviousDate = () => {
    if (currentDateIndex < dateKeys.length - 1) {
      setCurrentDateIndex(currentDateIndex + 1);
    }
  };

  const goToNextDate = () => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(currentDateIndex - 1);
    }
  };

  const currentDate = dateKeys[currentDateIndex] || '';


  const renderCardView = () => {
    const filteredItems = processedData.itemDetails.filter(
      item => selectedTeam === 'all' || item.teamType === selectedTeam
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {filteredItems.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all hover:shadow-xl"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  {getTeamIcon(item.teamType, 24)}
                  <h3 className="text-lg font-semibold text-gray-800">{item.itemName}</h3>
                </div>
                <span className="bg-[#FF6900]/10 text-[#FF6900] px-3 py-1 rounded-full text-xs font-medium">
                  {item.orderNumber}
                </span>
              </div>

              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#FF6900] h-3 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${item.entries.length > 0
                        ? item.entries[item.entries.length - 1].percentComplete
                        : 0
                        }%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>{item.originalQuantity} units</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Decoration</span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.decoration || 'N/A'} {item.decorationNumber && `- ${item.decorationNumber}`}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Team</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getTeamDisplayName(item.teamType)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {item.entries.slice(-3).map((entry, entryIndex) => (
                  <div
                    key={entryIndex}
                    className="bg-gray-50 rounded-md p-3 flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-xs text-gray-600">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{entry.previousCompleted}</span>
                      <ArrowRight size={12} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{entry.newCompleted}</span>
                      <span className="ml-2 px-2 py-0.5 bg-[#FF6900]/10 text-[#FF6900] text-xs font-medium rounded">
                        +{entry.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {item.entries.length > 0
                    ? item.entries[item.entries.length - 1].percentComplete
                    : 0}% Complete
                </span>
                {item.entries.length > 0 && item.entries[item.entries.length - 1].isComplete ? (
                  <div className="flex items-center text-green-600">
                    <Check size={16} className="mr-1" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">
                    {item.originalQuantity - (item.entries[item.entries.length - 1]?.newCompleted || 0)} remaining
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-20">
      <DialogBackdrop
        className="fixed inset-0 bg-gray-500/75 transition-opacity"
      />

      <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className="relative transform rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header with view mode toggle */}
            <div className="flex items-center justify-between bg-[#FF6900] px-6 py-4">
              <DialogTitle as="h3" className="text-xl font-semibold text-white flex items-center">
                <Clock className="mr-2" size={20} />
                Order Activity
              </DialogTitle>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'timeline'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10'
                      }`}
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'cards'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10'
                      }`}
                  >
                    <Grid size={18} />
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-3 bg-gray-50 border-b sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <Filter size={16} className="text-gray-500 mr-1" />
                  <span className="text-sm font-medium text-gray-700 mr-3">Filter by team:</span>
                  <button
                    onClick={() => setSelectedTeam('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedTeam === 'all'
                        ? 'bg-[#FF6900] text-white border-[#FF6900]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    All Teams
                  </button>
                  {teams.map(team => (
                    <button
                      key={team}
                      onClick={() => setSelectedTeam(team)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center ${selectedTeam === team
                          ? 'bg-[#FF6900] text-white border-[#FF6900]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {getTeamIcon(team)}
                      <span className="ml-2">{getTeamDisplayName(team)}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800`}>
                        {timeline.filter(entry => entry.teamType === team).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-gray-50">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6900]"></div>
                </div>
              ) : processedData.timeline.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No activity found</h3>
                  <p className="mt-1 text-sm text-gray-500">There is no recorded activity for this order yet.</p>
                </div>
              ) : (
                <>
                  {viewMode === 'timeline' && (
                    <div className="space-y-8">
                      {(currentDate ? [currentDate] : dateKeys).map(date => (
                        <div key={date} className="relative">
                          <div className="ml-6 relative border-l-2 border-gray-200 pl-8 space-y-6">
                            {groupedByDate[date].map((entry, entryIndex) => (
                              <div key={`${entry.timestamp}-${entryIndex}`} className="relative">
                                <div className="absolute w-4 h-4 bg-[#FF6900] rounded-full -left-[2.9rem] top-6 border-4 border-white shadow-sm"></div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                  <div className="px-6 py-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        {getTeamIcon(entry.teamType, 16)}
                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                          {getTeamDisplayName(entry.teamType)}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">
                                          {formatTime(entry.timestamp)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatRelativeTime(entry.timestamp)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-5">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div>
                                        <span className="block text-xs font-medium text-gray-500 mb-1">Order Number</span>
                                        <span className="text-sm font-medium text-gray-900">{entry.orderNumber}</span>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-medium text-gray-500 mb-1">Item</span>
                                        <span className="text-sm font-medium text-gray-900">{entry.itemName}</span>
                                      </div>
                                      <div>
                                        <span className="block text-xs font-medium text-gray-500 mb-1">Decoration</span>
                                        <span className="text-sm font-medium text-gray-900">
                                          {entry.decoration} - {entry.decorationNumber}
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-500">Progress Update</span>
                                        <div className="flex items-center">
                                          <span className="text-sm font-medium text-gray-500">{entry.previousCompleted}</span>
                                          <ArrowRight size={14} className="mx-1.5 text-gray-400" />
                                          <span className="text-sm font-medium text-gray-900">{entry.newCompleted}</span>
                                          <span className="ml-2 px-2 py-0.5 bg-[#FF6900]/10 text-[#FF6900] text-xs font-medium rounded">
                                            +{entry.change} units
                                          </span>
                                        </div>
                                      </div>

                                      <div className="mt-1 mb-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                          <div
                                            className="bg-[#FF6900] h-2.5 rounded-full"
                                            style={{ width: `${entry.percentComplete}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                      <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-medium">{entry.percentComplete}%</span>
                                          <span className="text-gray-500">of {entry.originalQuantity} units</span>
                                        </div>
                                        {entry.isComplete ? (
                                          <div className="flex items-center text-green-600">
                                            <Check size={14} className="mr-1" />
                                            <span className="font-medium">Completed</span>
                                          </div>
                                        ) : (
                                          <div className="text-gray-500">
                                            {entry.originalQuantity - entry.newCompleted} remaining
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {viewMode === 'cards' && renderCardView()}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default OrderActivity;