import { Button } from 'antd';
import React from 'react';

interface PrimaryButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'middle' | 'large';
}

export function PrimaryButton({ onClick, children, disabled, loading, size = 'middle' }: PrimaryButtonProps) {
  return (
    <Button
      type="primary"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      size={size}
    >
      {children}
    </Button>
  );
}
