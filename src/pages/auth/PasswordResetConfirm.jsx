import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Container, Typography, Box, CircularProgress, InputLabel } from '@mui/material';
import Logo from '../../images/ZFBLU.webp';
import Button from '@mui/material/Button';
import "../../styles/App.css";
import axios from 'axios'
import * as constants from '../../components/constants/constants'

const PasswordResetConfirm = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSuccessful, setResetSuccessful] = useState(false);

    const validatePasswords = () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validatePasswords()) return;
        setLoading(true);
        try {
            const response = await axios.post(`${constants.devApiBaseUrl}/api/password_reset_confirm/`, {
                uidb64: uid,
                token,
                new_password: newPassword,
            });
            setMessage(response.data.message);
            setResetSuccessful(true);
        } catch (error) {
            setMessage(error.response?.data?.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRedirect = () => {
        navigate('/login');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#2757aa',
            }}
        >
            <Container
                maxWidth="sm"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box className="shadow-lg p-4 bg-white text-center" sx={{ borderRadius: 2, textAlign: 'center' }}>


                    <img src={Logo} alt="Techedge Logo" style={{ width: '200px', margin: '0 auto', display: 'block' }} />

                    {!resetSuccessful ? (
                        <form onSubmit={handleSubmit}>
                            <p style={{ backgroundColor: '#fff', color: '#555', margin: '10px ' }} >
                                Reset Your Password
                            </p>
                            <InputLabel htmlFor="password">
                                <small>Please enter your new password and confirm below</small>
                            </InputLabel>
                            <TextField
                                label="New Password"
                                type="password"
                                fullWidth
                                margin="normal"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                size="small"
                                autoComplete="new-password"
                            />
                            <TextField
                                label="Confirm Password"
                                type="password"
                                fullWidth
                                margin="normal"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                size="small"
                                autoComplete="new-password"
                            />
                            {error && (
                                <Typography color="error" variant="body2">
                                    {error}
                                </Typography>
                            )}
                            <Box mt={2}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="success"
                                    style={{ textTransform: 'none', width: '40%', padding: '10px' }}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={12} className="text-white" /> : 'Reset Password'}
                                </Button>
                            </Box>
                        </form>
                    ) : (
                        <Typography m={2} variant="body1" color="textSecondary">
                           
                            <p className='p-4' style={{ backgroundColor: '#fff', color: '#555', margin: '10px ', fontSize:'13px' }} >
                            {message}
                            </p>
                        </Typography>
                    )}

                    <Box mt={2}>
                        <Button
                            variant="contained"
                            color={resetSuccessful ? 'success' : 'primary'}
                            style={{ textTransform: 'none', width: '40%', padding: '10px' }}
                            onClick={handleRedirect}
                        >
                            {resetSuccessful ? 'Go to Login' : 'Cancel'}
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default PasswordResetConfirm;
