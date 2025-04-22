import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertCircle, Users } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const ConnectionStatus = () => {
  const { isConnected, lastPing, connectedUsers } = useSocket();
  const [animate, setAnimate] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 800);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const getTotalConnectedUsers = () => {
    const dispatchers = connectedUsers?.dispatchers || [];

    let teamUsers = 0;
    if (connectedUsers?.teams) {
      teamUsers = Object.values(connectedUsers.teams)
        .flat()
        .length;
    } else if (connectedUsers?.teamMembers) {
      teamUsers = connectedUsers.teamMembers.length;
    }

    return dispatchers.length + teamUsers;
  };

  const getAllConnectedUsers = () => {
    let teamMembers = [];
    if (connectedUsers?.teams) {
      Object.values(connectedUsers.teams).forEach(users => {
        teamMembers = [...teamMembers, ...users];
      });
    } else if (connectedUsers?.teamMembers) {
      teamMembers = connectedUsers.teamMembers;
    }
    // console.log([...teamMembers])
    return [...teamMembers];
  };

  const getStatusDetails = () => {
    if (!isConnected) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-white',
        borderColor: 'border-red-500',
        icon: <WifiOff size={16} className="text-red-500" />,
        text: 'Disconnected'
      };
    }

    if (!lastPing || Date.now() - new Date(lastPing.time).getTime() > 60000) {
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-white',
        borderColor: 'border-gray-200',
        icon: <AlertCircle size={16} className="text-yellow-500" />,
        text: 'Unstable'
      };
    }
    return {
      color: 'text-green-600',
      bgColor: 'bg-transparent',
      borderColor: 'border-green-950',
      icon: <Users size={16} className="text-green-900" />,
      text: 'Connected'
    };
  };

  const { icon, text } = getStatusDetails();
  const totalConnectedUsers = getTotalConnectedUsers();
  const allUsers = getAllConnectedUsers();

  return (
    <div
    className="relative"
    onMouseEnter={() => setIsHovering(true)}
    onMouseLeave={() => setIsHovering(false)}
  >
      <div className={`flex items-center px-4 py-3 w-fit  cursor-pointer  rounded-sm transition-colors duration-300
  ${isConnected && text === 'Connected' ? 'bg-green-900' :
          isConnected && text === 'Unstable' ? 'bg-yellow-600' :
            'bg-gray-600'}
`}>
        <div className="relative">
          {isConnected && text === 'Connected' ? (
            <>
              <Users size={18} className="text-white animate-pulse" />
              <div className={`absolute inset-0 flex items-center justify-center ${animate ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
              </div>
              {/* <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> */}
            </>
          ) : isConnected && text === 'Unstable' ? (
            <>
              <Users size={18} className="text-white animate-pulse" />
              <div className={`absolute inset-0 flex items-center justify-center ${animate ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
                <div className="absolute inset-0 bg-yellow-300 rounded-full animate-ping opacity-30"></div>
              </div>
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            </>
          ) : (
            <Users size={18} className="text-white opacity-70" />
          )}
        </div>
      </div>


      {isHovering && isConnected && totalConnectedUsers > 0 && (
        <div className="absolute z-40 right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 transform origin-top-right">

          <div className="bg-gradient-to-r from-green-50 to-teal-50 px-3 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-green-800">Connected Users</h3>
              <div className="flex items-center space-x-1">
                <Users size={14} className="text-green-700" />
                <span className="text-sm font-medium text-green-900">{totalConnectedUsers}</span>
              </div>
            </div>
          </div>


          <div className="px-3 py-2">
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
              {allUsers.map((user, idx) => (
                <div key={idx} className="flex items-center bg-green-100 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs font-medium text-green-900 truncate max-w-[120px]">{user.team}</span>
                </div>
              ))}
            </div>
          </div>


        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;