import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AccessDeniedPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showGlitch, setShowGlitch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {

    setIsLoaded(true);
    
    const glitchInterval = setInterval(() => {
      setShowGlitch(true);
      setTimeout(() => setShowGlitch(false), 150);
    }, 3000);
  
    const timer = countdown > 0 && 
      setInterval(() => setCountdown(countdown - 1), 1000);

    if (countdown === 0) {
      navigate('/login');
    }
    
    return () => {
      clearInterval(timer);
      clearInterval(glitchInterval);
    };
  }, [countdown, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className={`relative w-full max-w-md p-8 mx-4 bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
       
        <div className="absolute inset-0 opacity-5 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute left-1/3 top-1/3 w-16 h-16 bg-yellow-400 rounded-full opacity-70 animate-ping" style={{animationDuration: '3s'}}></div>
        </div>
        
      
        <div className="absolute top-5 -right-10 rotate-45 bg-red-500 text-white text-xs font-bold py-1 px-12 shadow-md">
          RESTRICTED
        </div>
        
        <div className="relative z-10">
        
          <div className="relative">
            <h1 className={`text-9xl font-bold text-center text-gray-900 tracking-tighter transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-150'} ${showGlitch ? 'skew-x-3 translate-x-1' : ''}`}>
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="animate-ping absolute h-16 w-16 rounded-full bg-red-400 opacity-20"></span>
            </div>
          </div>

          <div className="flex justify-center -mt-6 mb-5">
            <span className={`px-4 py-1 bg-red-500 text-white font-medium text-sm rounded-full shadow-md transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-0'} ${showGlitch ? 'skew-x-3 translate-x-1' : ''}`}>
              ACCESS DENIED
            </span>
          </div>
          <p className={`text-center text-gray-600 mb-6 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            Sorry, you don't have permission to access this page or the resource you're looking for doesn't exist.
          </p>
          
          <div className="mb-4">
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-1">
              Redirecting to login in <span className="font-medium">{countdown}</span> seconds...
            </p>
          </div>

          <div className={`flex flex-col gap-3 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 flex justify-center items-center gap-2 group relative overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-30"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="relative">Back to Login</span>
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-300 flex justify-center items-center gap-2 group relative overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-gray-200 to-gray-100 opacity-50"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
              </svg>
              <span className="relative">Return Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;