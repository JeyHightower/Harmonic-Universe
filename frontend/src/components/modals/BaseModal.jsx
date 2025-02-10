import { Close as CloseIcon } from '@mui/icons-material';
import {
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    useTheme,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useCallback, useEffect } from 'react';

const BaseModal = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  'aria-describedby': ariaDescribedby,
  'aria-labelledby': ariaLabelledby,
}) => {
  const theme = useTheme();
  const titleId = ariaLabelledby || 'modal-title';
  const descriptionId = ariaDescribedby || 'modal-description';

  const handleClose = useCallback((event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
    onClose();
  }, [disableBackdropClick, disableEscapeKeyDown, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      // Close on Escape if not disabled
      if (e.key === 'Escape' && !disableEscapeKeyDown) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, disableEscapeKeyDown]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      sx={{
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        },
        '& .MuiDialog-paper': {
          borderRadius: theme.shape.borderRadius * 2,
          boxShadow: theme.customShadows?.modal || '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          animation: 'modalEnter 0.3s ease-out',
          '@keyframes modalEnter': {
            from: {
              opacity: 0,
              transform: 'scale(0.95) translateY(-8px)',
            },
            to: {
              opacity: 1,
              transform: 'scale(1) translateY(0)',
            },
          },
        },
      }}
      PaperComponent={Paper}
      PaperProps={{
        elevation: 0,
        role: 'dialog',
        'aria-modal': true,
      }}
      keepMounted={false}
      disablePortal={false}
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 300,
        },
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        id={titleId}
        sx={{
          p: 2.5,
          m: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`,
          fontSize: '1.25rem',
          fontWeight: 600,
          color: theme.palette.text.primary,
        }}
      >
        <Box component="span" sx={{ mr: 2 }}>
          {title}
        </Box>
        <IconButton
          aria-label="close modal"
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            transition: 'all 0.2s ease',
            '&:hover': {
              color: theme.palette.text.primary,
              bgcolor: theme.palette.action.hover,
              transform: 'rotate(90deg)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Modal Content */}
      <DialogContent
        id={descriptionId}
        sx={{
          p: 3,
          bgcolor: theme.palette.background.paper,
          '&:first-of-type': {
            pt: 3,
          },
        }}
      >
        {children}
      </DialogContent>

      {/* Modal Actions */}
      {actions && (
        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: theme.palette.background.default,
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
            '& .MuiButton-root': {
              minWidth: 100,
            },
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

BaseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  disableBackdropClick: PropTypes.bool,
  disableEscapeKeyDown: PropTypes.bool,
  'aria-describedby': PropTypes.string,
  'aria-labelledby': PropTypes.string,
};

export default BaseModal;
