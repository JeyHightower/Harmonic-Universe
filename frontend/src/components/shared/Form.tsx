import {
    Box,
    Button,
    CircularProgress,
    Grid,
    Stack,
    Typography,
    useTheme
} from '@mui/material';
import { Formik, Form as FormikForm, FormikHelpers } from 'formik';
import React from 'react';
import * as Yup from 'yup';

interface FormField {
    name: string;
    label: string;
    type?: string;
    component: React.ComponentType<any>;
    props?: Record<string, any>;
    gridProps?: {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
    };
}

interface FormProps {
    title?: string;
    description?: string;
    fields: FormField[];
    initialValues: Record<string, any>;
    validationSchema: Yup.ObjectSchema<any>;
    onSubmit: (
        values: Record<string, any>,
        helpers: FormikHelpers<Record<string, any>>
    ) => Promise<void>;
    submitLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
    loading?: boolean;
    error?: string;
    success?: string;
    gridSpacing?: number;
    actions?: React.ReactNode;
}

const Form: React.FC<FormProps> = ({
    title,
    description,
    fields,
    initialValues,
    validationSchema,
    onSubmit,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    onCancel,
    loading = false,
    error,
    success,
    gridSpacing = 2,
    actions,
}) => {
    const theme = useTheme();

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ isSubmitting, touched, errors }) => (
                <FormikForm noValidate>
                    <Stack spacing={3}>
                        {(title || description) && (
                            <Box>
                                {title && (
                                    <Typography variant="h6" gutterBottom>
                                        {title}
                                    </Typography>
                                )}
                                {description && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 2 }}
                                    >
                                        {description}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <Grid container spacing={gridSpacing}>
                            {fields.map((field) => (
                                <Grid
                                    item
                                    key={field.name}
                                    xs={12}
                                    {...field.gridProps}
                                >
                                    <field.component
                                        name={field.name}
                                        label={field.label}
                                        type={field.type}
                                        fullWidth
                                        error={touched[field.name] && Boolean(errors[field.name])}
                                        helperText={touched[field.name] && errors[field.name]}
                                        {...field.props}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {(error || success) && (
                            <Typography
                                color={error ? 'error' : 'success.main'}
                                variant="body2"
                                sx={{ mt: 2 }}
                            >
                                {error || success}
                            </Typography>
                        )}

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 2,
                                mt: 3,
                            }}
                        >
                            {actions || (
                                <>
                                    {onCancel && (
                                        <Button
                                            onClick={onCancel}
                                            disabled={isSubmitting || loading}
                                        >
                                            {cancelLabel}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isSubmitting || loading}
                                        startIcon={
                                            (isSubmitting || loading) && (
                                                <CircularProgress size={20} color="inherit" />
                                            )
                                        }
                                    >
                                        {submitLabel}
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Stack>
                </FormikForm>
            )}
        </Formik>
    );
};

export default Form;
