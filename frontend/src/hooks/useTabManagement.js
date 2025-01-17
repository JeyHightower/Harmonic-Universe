import { useState } from 'react';

export const useTabManagement = (initialTab = 'overview') => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = tabName => {
    setActiveTab(tabName);
  };

  return {
    activeTab,
    handleTabChange,
  };
};
