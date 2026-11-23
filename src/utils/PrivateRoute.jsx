import { Navigate } from 'react-router-dom'

import React from 'react'
import { useContext } from 'react';
import Authcontext from '../context/Authcontext.jsx';


// Signed-in pages. A user with a temporary (emailed) password is sent to choose
// their own first; the server refuses everything else until they do.
const PrivateRoute = ({ children }) => {
  let {user}= useContext(Authcontext)
  if (!user) return <Navigate to="/login" />;
  if (user.must_change_password) return <Navigate to="/change-password" replace />;
  return children;
  };
export default PrivateRoute
