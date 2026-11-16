import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/Authcontext';
import { getOtpAvailability } from '../api/otp';

// Whether the logged-in user's organisation can protect signers with SMS OTP.
// `enabled` lets callers only fetch when their dialog is open.
//
// The access token is refreshed every few minutes; it is read through a ref so
// a refresh doesn't trigger another request (or flicker the OTP switch).
export default function useOtpAvailability(enabled = true) {
  const { authTokens } = useContext(AuthContext);
  const tokenRef = useRef(authTokens?.access);
  useEffect(() => { tokenRef.current = authTokens?.access; }, [authTokens?.access]);
  const hasToken = !!authTokens?.access;

  const [state, setState] = useState({ loading: true, available: false, message: '', code: null });

  const refresh = useCallback(async () => {
    if (!tokenRef.current) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await getOtpAvailability(tokenRef.current);
      setState({ loading: false, available: !!data.available, message: data.message || '', code: data.code || null });
    } catch {
      // Fail closed: if we can't confirm OTP works, don't offer it.
      setState({
        loading: false,
        available: false,
        message: 'Could not check whether SMS OTP is set up. Please try again later.',
        code: 'availability_unknown',
      });
    }
  }, []);

  useEffect(() => {
    if (enabled && hasToken) refresh();
  }, [enabled, hasToken, refresh]);

  return { ...state, refresh };
}
