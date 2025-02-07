import CloseIcon from '@mui/icons-material/Close';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from '@mui/material';
import { ReactNode } from 'react';


const FormDialog = ({
    open,
    title,
    children,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    onSubmit,
    onClose,
    maxWidth = 'sm',
    loading = false,
    disableSubmit = false,
}: FormDialogProps) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth
            aria-labelledby="form-dialog-title"
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle id="form-dialog-title" sx={{ m: 0, p: 2 }}>
                    {title}
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
                </DialogTitle>
                <DialogContent dividers>{children}</DialogContent>
                
                    <Button onClick={onClose} color="inherit" disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || disableSubmit}
                    >
                        {loading ? 'Saving...' : submitLabel}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default FormDialog;
