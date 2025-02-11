import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    IconButton,
    InputAdornment,
    TextField,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

interface SearchInputProps {
    placeholder?: string;
    onSearch: (value: string) => void;
    debounceMs?: number;
    fullWidth?: boolean;
    size?: 'small' | 'medium';
    initialValue?: string;
    disabled?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = 'Search...',
    onSearch,
    debounceMs = 300,
    fullWidth = true,
    size = 'medium',
    initialValue = '',
    disabled = false,
}) => {
    const [value, setValue] = useState(initialValue);
    const [debouncedValue, setDebouncedValue] = useState(initialValue);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, debounceMs);

        return () => {
            clearTimeout(timer);
        };
    }, [value, debounceMs]);

    useEffect(() => {
        onSearch(debouncedValue);
    }, [debouncedValue, onSearch]);

    const handleClear = useCallback(() => {
        setValue('');
        setDebouncedValue('');
    }, []);

    return (
        <Box sx={{ position: 'relative' }}>
            <TextField
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                fullWidth={fullWidth}
                size={size}
                disabled={disabled}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: value ? (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="clear search"
                                onClick={handleClear}
                                edge="end"
                                size="small"
                            >
                                <ClearIcon />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'divider',
                        },
                        '&:hover fieldset': {
                            borderColor: 'primary.main',
                        },
                    },
                }}
            />
        </Box>
    );
};

export default SearchInput;
