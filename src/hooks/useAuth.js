// Example custom hook for authentication context
import { useContext } from 'react';
import { AuthContext } from '../context/Authcontext.jsx';

export function useAuth() {
  return useContext(AuthContext);
}
