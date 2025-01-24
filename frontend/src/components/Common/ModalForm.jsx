import { Close as CloseIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    useTheme,
} from '@mui/material';
import React from 'react';

const ModalForm = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitText = 'Save',
  maxWidth = 'sm',
  loading = false,
  hideActions = false,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          background: theme.palette.background.paper,
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.text.primary,
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 2,
          px: 3,
          '&:first-of-type': {
            pt: 2,
          },
        }}
      >
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}
          noValidate
        >
          {children}

          {!hideActions && (
            <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
              <Button
                onClick={onClose}
                variant="outlined"
                color="inherit"
                sx={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{
                  ml: 2,
                  px: 4,
                  position: 'relative',
                  '&::after': loading ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.1)',
                    animation: 'pulse 1.5s infinite',
                  } : {},
                }}
              >
                {submitText}
              </Button>
            </DialogActions>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ModalForm;
