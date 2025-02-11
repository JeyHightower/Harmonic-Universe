import {
    Box,
    Checkbox,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    Toolbar,
    Typography,
    alpha,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import React, { useState } from 'react';

interface Column<T> {
    id: keyof T;
    label: string;
    numeric?: boolean;
    width?: string | number;
    format?: (value: any) => string;
    sortable?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    defaultSortBy?: keyof T;
    defaultSortOrder?: 'asc' | 'desc';
    selectable?: boolean;
    onSelectionChange?: (selectedIds: (keyof T)[]) => void;
    getRowId: (row: T) => string | number;
    rowsPerPageOptions?: number[];
    defaultRowsPerPage?: number;
    tableTitle?: string;
}

function DataTable<T>({
    columns,
    data,
    defaultSortBy,
    defaultSortOrder = 'asc',
    selectable = false,
    onSelectionChange,
    getRowId,
    rowsPerPageOptions = [5, 10, 25],
    defaultRowsPerPage = 10,
    tableTitle,
}: DataTableProps<T>) {
    const [order, setOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
    const [orderBy, setOrderBy] = useState<keyof T | undefined>(defaultSortBy);
    const [selected, setSelected] = useState<(string | number)[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

    const handleRequestSort = (property: keyof T) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelected = data.map((row) => getRowId(row));
            setSelected(newSelected);
            onSelectionChange?.(newSelected as (keyof T)[]);
        } else {
            setSelected([]);
            onSelectionChange?.([]);
        }
    };

    const handleClick = (id: string | number) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: (string | number)[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }

        setSelected(newSelected);
        onSelectionChange?.(newSelected as (keyof T)[]);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const isSelected = (id: string | number) => selected.indexOf(id) !== -1;

    const sortedData = React.useMemo(() => {
        if (!orderBy) return data;

        return [...data].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return order === 'asc' ? -1 : 1;
            if (bValue === null || bValue === undefined) return order === 'asc' ? 1 : -1;

            return (
                (aValue < bValue ? -1 : 1) * (order === 'asc' ? 1 : -1)
            );
        });
    }, [data, order, orderBy]);

    const paginatedData = sortedData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Paper sx={{ width: '100%', mb: 2 }}>
            {(tableTitle || selectable) && (
                <Toolbar
                    sx={{
                        pl: { sm: 2 },
                        pr: { xs: 1, sm: 1 },
                        ...(selected.length > 0 && {
                            bgcolor: (theme) =>
                                alpha(
                                    theme.palette.primary.main,
                                    theme.palette.action.activatedOpacity
                                ),
                        }),
                    }}
                >
                    {selected.length > 0 ? (
                        <Typography
                            sx={{ flex: '1 1 100%' }}
                            color="inherit"
                            variant="subtitle1"
                            component="div"
                        >
                            {selected.length} selected
                        </Typography>
                    ) : (
                        <Typography
                            sx={{ flex: '1 1 100%' }}
                            variant="h6"
                            id="tableTitle"
                            component="div"
                        >
                            {tableTitle}
                        </Typography>
                    )}
                </Toolbar>
            )}
            <TableContainer>
                <Table aria-labelledby="tableTitle" size="medium">
                    <TableHead>
                        <TableRow>
                            {selectable && (
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        color="primary"
                                        indeterminate={
                                            selected.length > 0 && selected.length < data.length
                                        }
                                        checked={
                                            data.length > 0 && selected.length === data.length
                                        }
                                        onChange={handleSelectAllClick}
                                        inputProps={{
                                            'aria-label': 'select all',
                                        }}
                                    />
                                </TableCell>
                            )}
                            {columns.map((column) => (
                                <TableCell
                                    key={String(column.id)}
                                    align={column.numeric ? 'right' : 'left'}
                                    style={{ width: column.width }}
                                    sortDirection={orderBy === column.id ? order : false}
                                >
                                    {column.sortable !== false ? (
                                        <TableSortLabel
                                            active={orderBy === column.id}
                                            direction={orderBy === column.id ? order : 'asc'}
                                            onClick={() => handleRequestSort(column.id)}
                                        >
                                            {column.label}
                                            {orderBy === column.id ? (
                                                <Box component="span" sx={visuallyHidden}>
                                                    {order === 'desc'
                                                        ? 'sorted descending'
                                                        : 'sorted ascending'}
                                                </Box>
                                            ) : null}
                                        </TableSortLabel>
                                    ) : (
                                        column.label
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((row, index) => {
                            const id = getRowId(row);
                            const isItemSelected = isSelected(id);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    onClick={selectable ? () => handleClick(id) : undefined}
                                    role={selectable ? 'checkbox' : undefined}
                                    aria-checked={selectable ? isItemSelected : undefined}
                                    tabIndex={-1}
                                    key={id}
                                    selected={isItemSelected}
                                    sx={{ cursor: selectable ? 'pointer' : 'default' }}
                                >
                                    {selectable && (
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                color="primary"
                                                checked={isItemSelected}
                                                inputProps={{
                                                    'aria-labelledby': labelId,
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                    {columns.map((column) => (
                                        <TableCell
                                            key={String(column.id)}
                                            align={column.numeric ? 'right' : 'left'}
                                        >
                                            {column.format
                                                ? column.format(row[column.id])
                                                : row[column.id]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={rowsPerPageOptions}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}

export default DataTable;
