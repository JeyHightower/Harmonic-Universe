import { verifyEmail } from '@/store/slices/authSlice';
import { commonStyles } from '@/styles/commonStyles';
import { Alert, Box, CircularProgress, Container, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector(state => state.auth);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      dispatch(verifyEmail(token))
        .unwrap()
        .then(() => {
          setVerified(true);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        });
    }
  }, [dispatch, navigate, searchParams]);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          ...commonStyles.flexCenter,
          minHeight: '100vh',
          py: 8,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Email Verification
          </Typography>

          {loading && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {verified && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              Email verified successfully! Redirecting to login...
            </Alert>
          )}

          {!loading && !error && !verified && (
            <Typography sx={{ mt: 2, textAlign: 'center' }}>
              Verifying your email address...
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail;
