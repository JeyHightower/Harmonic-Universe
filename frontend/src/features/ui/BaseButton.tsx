import { Button } from 'antd';
import React from 'react';

interface BaseButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export function BaseButton({ onClick, children, disabled, loading }: BaseButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {children}
    </Button>
  );
}
