import React from 'react';
import {
  Tooltip as MuiTooltip,
  TooltipProps as MuiTooltipProps,
  styled,
  tooltipClasses,
  useTheme,
  Zoom,
} from '@mui/material';

interface TooltipProps extends Omit<MuiTooltipProps, 'children'> {
  children: React.ReactElement;
  variant?: 'light' | 'dark';
  maxWidth?: number | string;
  interactive?: boolean;
}

const LightTooltip = styled(({ className, ...props }: MuiTooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[1],
    fontSize: 13,
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.common.white,
  },
}));

const DarkTooltip = styled(({ className, ...props }: MuiTooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    boxShadow: theme.shadows[1],
    fontSize: 13,
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.grey[900],
  },
}));

const Tooltip: React.FC<TooltipProps> = ({
  children,
  variant = 'dark',
  maxWidth = 220,
  interactive = false,
  TransitionComponent = Zoom,
  arrow = true,
  placement = 'top',
  enterDelay = 200,
  leaveDelay = 0,
  ...props
}) => {
  const theme = useTheme();
  const TooltipComponent = variant === 'light' ? LightTooltip : DarkTooltip;

  return (
    <TooltipComponent
      TransitionComponent={TransitionComponent}
      arrow={arrow}
      placement={placement}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      interactive={interactive}
      sx={{
        [`& .${tooltipClasses.tooltip}`]: {
          maxWidth,
        },
      }}
      {...props}
    >
      {children}
    </TooltipComponent>
  );
};

export default Tooltip;
