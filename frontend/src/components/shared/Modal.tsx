import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    IconButton,
    Slide,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React from 'react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
    fullWidth?: boolean;
    fullScreen?: boolean;
    hideCloseButton?: boolean;
    disableBackdropClick?: boolean;
    disableEscapeKeyDown?: boolean;
    transitionVariant?: 'fade' | 'slide';
}

const SlideTransition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    children,
    actions,
    maxWidth = 'sm',
    fullWidth = true,
    fullScreen: fullScreenProp = false,
    hideCloseButton = false,
    disableBackdropClick = false,
    disableEscapeKeyDown = false,
    transitionVariant = 'fade',
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm')) || fullScreenProp;

    const handleBackdropClick = (event: React.MouseEvent) => {
        if (disableBackdropClick) {
            event.stopPropagation();
        }
    };

    const TransitionComponent = transitionVariant === 'slide' ? SlideTransition : Fade;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            fullScreen={fullScreen}
            onClick={handleBackdropClick}
            onBackdropClick={disableBackdropClick ? undefined : onClose}
            onKeyDown={(event) => {
                if (disableEscapeKeyDown && event.key === 'Escape') {
                    event.stopPropagation();
                }
            }}
            TransitionComponent={TransitionComponent}
            aria-labelledby="modal-title"
        >
            {title && (
                <DialogTitle
                    id="modal-title"
                    sx={{
                        m: 0,
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant="h6" component="div">
                        {title}
                    </Typography>
                    {!hideCloseButton && (
                        <IconButton
                            aria-label="close"
                            onClick={onClose}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
            )}
            <DialogContent
                sx={{
                    p: 2,
                    ...(fullScreen && {
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }),
                }}
            >
                <Box
                    sx={{
                        ...(fullScreen && {
                            flex: 1,
                            overflow: 'auto',
                        }),
                    }}
                >
                    {children}
                </Box>
            </DialogContent>
            {actions && (
                <DialogActions
                    sx={{
                        px: 2,
                        py: 1.5,
                        borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    {actions}
                </DialogActions>
            )}
        </Dialog>
    );
};

export default Modal;
