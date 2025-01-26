import React from "react";
import { useNotification } from "../../contexts/NotificationContext";
import ErrorMessage from "./ErrorMessage";
import "./NotificationContainer.css";
import SuccessMessage from "./SuccessMessage";

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  const renderNotification = (notification) => {
    const { id, type, message, details, category, duration, variant } =
      notification;

    const commonProps = {
      key: id,
      message,
      details,
      category,
      duration,
      variant,
      onDismiss: () => removeNotification(id),
    };

    switch (type) {
      case "error":
        return <ErrorMessage {...commonProps} severity="error" />;
      case "warning":
        return <ErrorMessage {...commonProps} severity="warning" />;
      case "info":
        return <ErrorMessage {...commonProps} severity="info" />;
      case "success":
        return <SuccessMessage {...commonProps} />;
      default:
        return null;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(renderNotification)}
    </div>
  );
};

export default NotificationContainer;
