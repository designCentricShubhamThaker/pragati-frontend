import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from './context/auth';

export const ProtectedRoute = ({ allowedRoles, redirectPath = '/login' }) => {
  const { user, isLoading } = useAuth();
  const params = useParams();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }


  if (params.teamId) {
    if (user.role === 'admin') {
      return <Outlet />;
    }
    
    if (params.teamId !== user.team) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    if (!params.subteamId) {
  
      if (user.team !== user.subteam) {
        return <Navigate to={`/${user.team}/${user.subteam}`} replace />;
      }
    } 
   
    else if (params.subteamId) {
     
      if (params.subteamId !== user.subteam && user.team !== user.subteam) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return <Outlet />;
};

export const DynamicRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.team === user.subteam) {
    return <Navigate to={`/${user.team}`} replace />;
  }


  return <Navigate to={`/${user.team}/${user.subteam}`} replace />;
};