import React, { useState, useEffect } from 'react';
import {
  Tabs as MuiTabs,
  Tab,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface TabItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string | number;
  onChange: (value: string | number) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  centered?: boolean;
  showMoreMenu?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  onChange,
  orientation = 'horizontal',
  variant = 'standard',
  centered = false,
  showMoreMenu = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [visibleTabs, setVisibleTabs] = useState<TabItem[]>([]);
  const [overflowTabs, setOverflowTabs] = useState<TabItem[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (isMobile && showMoreMenu) {
      const maxVisibleTabs = 3;
      setVisibleTabs(items.slice(0, maxVisibleTabs));
      setOverflowTabs(items.slice(maxVisibleTabs));
    } else {
      setVisibleTabs(items);
      setOverflowTabs([]);
    }
  }, [items, isMobile, showMoreMenu]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (tabValue: string | number) => {
    onChange(tabValue);
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <MuiTabs
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        orientation={orientation}
        variant={variant}
        centered={centered}
        sx={{
          flex: 1,
          '& .MuiTabs-flexContainer': {
            ...(orientation === 'vertical' && {
              alignItems: 'stretch',
            }),
          },
        }}
      >
        {visibleTabs.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            icon={tab.icon}
            disabled={tab.disabled}
            sx={{
              minHeight: orientation === 'vertical' ? 'auto' : undefined,
              ...(orientation === 'vertical' && {
                justifyContent: 'flex-start',
                px: 3,
              }),
            }}
          />
        ))}
      </MuiTabs>

      {overflowTabs.length > 0 && (
        <>
          <IconButton
            aria-label="more tabs"
            aria-controls="tab-menu"
            aria-haspopup="true"
            onClick={handleMenuClick}
            size="small"
            sx={{ ml: 1 }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="tab-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {overflowTabs.map((tab) => (
              <MenuItem
                key={tab.value}
                onClick={() => handleMenuItemClick(tab.value)}
                disabled={tab.disabled}
                selected={value === tab.value}
              >
                {tab.icon && (
                  <Box
                    component="span"
                    sx={{
                      mr: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {tab.icon}
                  </Box>
                )}
                {tab.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
};

export default Tabs;
