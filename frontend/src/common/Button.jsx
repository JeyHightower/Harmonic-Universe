import React from "react";
import "./Button.css";

const Button = ({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
  ...props
}) => {
  const buttonClasses = `button button-${variant} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
