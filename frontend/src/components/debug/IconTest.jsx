import React, { useEffect, useState } from 'react';
import Icon from '../common/Icon';
import SafeIcon from '../common/SafeIcon';
import * as AntIcons from '@ant-design/icons';

const IconTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [iconKeys, setIconKeys] = useState([]);

  useEffect(() => {
    const results = [];
    results.push({
      type: 'info',
      message: 'IconTest component mounted - Using standard Icon component',
    });

    // Get available icons
    const standardIconNames = ['add', 'delete', 'edit', 'info', 'warning', 'error'];
    setIconKeys(standardIconNames);

    results.push({
      type: 'info',
      message: `Testing standard icons: ${standardIconNames.join(', ')}`,
    });

    // Test icons
    standardIconNames.forEach((iconName) => {
      results.push({
        type: 'success',
        message: `Testing icon: ${iconName}`,
      });
    });

    setTestResults(results);
  }, []);

  return (
    <div className="icon-test-container">
      <h2>Icon Test Component</h2>
      <div className="test-results">
        {testResults.map((result, index) => (
          <div key={index} className={`test-result test-result-${result.type}`}>
            {result.message}
          </div>
        ))}
      </div>
      <div className="icon-grid">
        {iconKeys.map((iconName) => (
          <div key={iconName} className="icon-test-item">
            <Icon name={iconName} />
            <span>{iconName}</span>
          </div>
        ))}
      </div>
      <h3>Ant Design Icons via SafeIcon</h3>
      <div className="icon-grid">
        {['UserOutlined', 'SettingOutlined', 'HomeOutlined'].map((iconName) => (
          <div key={iconName} className="icon-test-item">
            <SafeIcon icon={AntIcons[iconName]} />
            <span>{iconName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IconTest;
