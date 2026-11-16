import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField, Typography,
} from '@mui/material';
import { FaLock, FaLockOpen, FaEye, FaEyeSlash, FaKey, FaCheckCircle } from 'react-icons/fa';
import Authcontext from '../context/Authcontext.jsx';
import { PILL, PILL_OUTLINE_NEUTRAL } from './common/pillButton';
import { BRAND, NEUTRAL_COLORS } from './layout/shellTheme';

/**
 * Password check before signing (self-sign, and signers whose sender requires
 * it). Same flow as before: verify with the account password; on success the
 * document unlocks, the dialog closes and, for self-sign, the confirm step opens.
 * Cancel reloads the page.
 */
const AuthGuestDialog = (props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { authenticateGuest } = useContext(Authcontext);
  const inputRef = useRef(null);

  // After a wrong password, put the cursor back in the field (text selected) to retype.
  useEffect(() => {
    if (error && !loading && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [error, loading]);

  const handleCancel = () => {
    window.location.reload();
  };

  async function VerifyGuest(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const username = props.signersEmail;
    const password = e.target.password.value;
    const response = await authenticateGuest(e, username, password);

    if (response === 200) {
      setTimeout(() => {
        setLoading(false);
        props.setLocked(false);
        setTimeout(() => {
          props.setOpenDialogAuthGuest(false);
          if (props.selfSign) {
            props.setOpenConfirmCompleteDialog(true);
          }
        }, 1000);
      }, 1000);
    } else {
      setLoading(false);
      setError('Incorrect password. Please try again.');
    }
  }

  const unlocked = !props.locked;

  return (
    <Dialog
      open={props.opendialogauthguest}
      keepMounted
      fullWidth
      maxWidth="xs"
      aria-labelledby="auth-guest-title"
      PaperProps={{ sx: { borderRadius: 2, m: 2, width: 'calc(100% - 32px)' } }}
    >
      <DialogTitle id="auth-guest-title" sx={{ bgcolor: BRAND.primary, color: '#fff', py: 1.25, px: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {unlocked ? <FaLockOpen size={15} aria-hidden /> : <FaLock size={14} aria-hidden />}
          <Typography component="span" sx={{ fontSize: 15, fontWeight: 600 }}>
            {unlocked ? 'Document unlocked' : 'Confirm it’s you'}
          </Typography>
        </Box>
      </DialogTitle>

      {unlocked ? (
        <DialogContent sx={{ px: 3, pt: '32px !important', pb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, textAlign: 'center' }}>
          <FaCheckCircle size={44} color="#2e7d32" aria-hidden />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: NEUTRAL_COLORS.strong }}>You&apos;re verified</Typography>
          <Typography sx={{ fontSize: 13, color: NEUTRAL_COLORS.body }}>
            {props.selfSign ? 'Taking you to confirm your signature…' : 'Click on the page to place your signature.'}
          </Typography>
        </DialogContent>
      ) : (
        <form autoComplete="off" onSubmit={VerifyGuest} noValidate={false}>
          <DialogContent sx={{ px: 3, pt: '24px !important', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box
                aria-hidden
                sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', bgcolor: BRAND.surfaceLight, color: BRAND.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FaLock size={18} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13.5, color: NEUTRAL_COLORS.strong, fontWeight: 600 }}>
                  Enter your password to sign
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: NEUTRAL_COLORS.muted }}>
                  Signing as{' '}
                  <Box component="span" title={props.signersEmail} sx={{ color: BRAND.primary, fontWeight: 500, wordBreak: 'break-all' }}>
                    {props.signersEmail}
                  </Box>
                </Typography>
              </Box>
            </Box>

            <TextField
              id="password"
              name="password"
              label="Account password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              fullWidth
              size="small"
              autoFocus
              inputRef={inputRef}
              disabled={loading}
              error={Boolean(error)}
              helperText={error || ' '}
              onChange={() => { if (error) setError(''); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaKey size={13} color={NEUTRAL_COLORS.muted} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      sx={{ color: BRAND.primary }}
                    >
                      {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 13.5 }, '& .MuiFormHelperText-root': { fontSize: 12, mx: 0 } }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5, gap: 1 }}>
            <Button onClick={handleCancel} disabled={loading} sx={PILL_OUTLINE_NEUTRAL}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <FaLockOpen />}
              sx={{ ...PILL, bgcolor: BRAND.primary, minWidth: 140, '&:hover': { bgcolor: BRAND.primaryDark, boxShadow: 'none' } }}
            >
              {loading ? 'Verifying…' : 'Unlock & sign'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
};

export default AuthGuestDialog;
