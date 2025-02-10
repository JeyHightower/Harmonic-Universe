// Common styles for consistent UI across components
export const commonStyles = {
  // Flexbox layouts
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },

  // Container styles
  pageContainer: {
    p: 3,
    width: '100%',
    maxWidth: '1200px',
    mx: 'auto',
  },
  sectionContainer: {
    mb: 4,
    p: 2,
    borderRadius: 1,
    bgcolor: 'background.paper',
  },

  // Form styles
  formField: {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: 'primary.main',
      },
    },
  },
  button: {
    textTransform: 'none',
    borderRadius: 1,
    px: 3,
    py: 1,
    minWidth: '120px',
  },

  // Card styles
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  cardMedia: {
    pt: '56.25%', // 16:9 aspect ratio
  },
  cardContent: {
    flexGrow: 1,
  },

  // List styles
  list: {
    width: '100%',
    bgcolor: 'background.paper',
    borderRadius: 1,
    overflow: 'hidden',
  },
  listItem: {
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      bgcolor: 'action.hover',
    },
  },

  // Modal styles
  modalPaper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  },

  // Animation styles
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out',
    '@keyframes fadeIn': {
      '0%': {
        opacity: 0,
      },
      '100%': {
        opacity: 1,
      },
    },
  },
  slideIn: {
    animation: 'slideIn 0.3s ease-in-out',
    '@keyframes slideIn': {
      '0%': {
        transform: 'translateY(20px)',
        opacity: 0,
      },
      '100%': {
        transform: 'translateY(0)',
        opacity: 1,
      },
    },
  },
};

// Header heights for consistent spacing
export const headerHeights = {
  desktop: 64,
  mobile: 56,
};

// Drawer widths
export const drawerWidths = {
  permanent: 240,
  temporary: 280,
};

// Breakpoints
export const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
};
