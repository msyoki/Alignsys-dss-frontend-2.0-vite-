
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../components/axiosConfig';  // Import the Axios instance
import { TextField, Button, Container, Typography, Box, CircularProgress, InputLabel } from '@mui/material';
import Logo from '../../images/techedge.png'


const ChangePassword = () => {
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
            const response = await axiosInstance.post('/api/password_reset_confirm/', {
                uidb64: uid,
                token,
                new_password: newPassword,
            });
            setMessage(response.data.message);
            setResetSuccessful(true);
            setLoading(false);
        } catch (error) {
            setMessage(error.response?.data?.error || 'An error occurred');
            setLoading(false);
        }
    };

    const handleRedirect = () => {
        navigate('/login');
    };

    return (
        <Container maxWidth="sm" className='text-center'>
            <Box style={{ marginTop: '10%' }} className='shadow-lg p-4'>
                <div >
                    <img src={Logo} alt="Sample image" style={{ width: '260px' }} />
                    <Typography variant="p" component="p" gutterBottom className='my-3 text-secondary' >
                        Reset Your Password
                    </Typography>



                </div>

                <form onSubmit={handleSubmit} >
                    {!resetSuccessful && (
                        <>
                            <InputLabel htmlFor="password" ><small>Please enter new pasword and confirm below</small></InputLabel>
                            <TextField
                                label="New Password"
                                type="password"
                                fullWidth
                                margin="normal"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                size='small'
                                autoComplete="new-password"
                                style={{ width: '350px' }}
                            />
                            <TextField
                                label="Confirm Password"
                                type="password"
                                autof
                                fullWidth
                                margin="small"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                size='small'
                                autoComplete="new-password"
                                style={{ width: '350px' }}
                            />
                        </>
                    )}

                    {error && (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    )}
                    {!resetSuccessful && (
                        <Box mt={2}>
                            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} style={{ width: '250px' }}>
                                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                            </Button>
                        </Box>
                    )}
                </form>
                {message && (
                    <Box mt={2}>
                        <Typography variant="body1" color="textSecondary">
                            <small>{message}</small>
                        </Typography>
                    </Box>
                )}

                <Box mt={2}>
                    <Button variant="contained" color="warning" fullWidth onClick={handleRedirect} style={{ width: '250px' }}>
                        {resetSuccessful ? <>Go to Login</> : <>Cancel</>}
                    </Button>
                </Box>

            </Box>
        </Container>
    );
};

export default ChangePassword;
