import React, { useEffect, useState } from 'react';
import IconDefault, * as Icons from './common/Icons';

const IconTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [iconKeys, setIconKeys] = useState([]);

  useEffect(() => {
    const results = [];
    results.push({
      type: 'info',
      message: 'IconTest component mounted - Using custom Icons implementation',
    });

    // Log all available icons
    const keys = Object.keys(Icons);
    setIconKeys(keys);
    results.push({ type: 'info', message: `Found ${keys.length} icons` });

    // Test specific icons
    const iconNames = [
      'UserOutlined',
      'SettingOutlined',
      'EyeInvisibleOutlined',
      'PaperClipOutlined',
      'AccountBookFilled',
    ];

    iconNames.forEach(iconName => {
      if (Icons[iconName]) {
        results.push({
          type: 'success',
          message: `Icon ${iconName} is available`,
        });
      } else {
        results.push({
          type: 'error',
          message: `Icon ${iconName} is NOT available`,
        });
      }
    });

    // Test createFromIconfontCN
    const createFromIconfontCNAvailable =
      typeof Icons.createFromIconfontCN === 'function' ||
      (IconDefault && typeof IconDefault.createFromIconfontCN === 'function');

    if (createFromIconfontCNAvailable) {
      results.push({
        type: 'success',
        message: 'createFromIconfontCN is available',
      });
    } else {
      results.push({
        type: 'error',
        message: 'createFromIconfontCN is NOT available',
      });
    }

    // Test Context
    if ((IconDefault && IconDefault.Context) || Icons.Context) {
      results.push({ type: 'success', message: 'Icon.Context is available' });
    } else {
      results.push({ type: 'error', message: 'Icon.Context is NOT available' });
    }

    setTestResults(results);
  }, []);

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #ccc',
        margin: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h2>Icon Test Component</h2>

      <h3>Test Results:</h3>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '5px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {testResults.map((result, index) => (
          <div
            key={index}
            style={{
              margin: '5px 0',
              color:
                result.type === 'error'
                  ? 'red'
                  : result.type === 'success'
                  ? 'green'
                  : 'black',
            }}
          >
            {result.type === 'error'
              ? '❌ '
              : result.type === 'success'
              ? '✅ '
              : 'ℹ️ '}
            {result.message}
          </div>
        ))}
      </div>

      <h3>Icon Samples:</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {Icons.UserOutlined && (
          <div>
            <Icons.UserOutlined /> UserOutlined
          </div>
        )}
        {Icons.SettingOutlined && (
          <div>
            <Icons.SettingOutlined /> SettingOutlined
          </div>
        )}
        {Icons.EyeInvisibleOutlined && (
          <div>
            <Icons.EyeInvisibleOutlined /> EyeInvisibleOutlined
          </div>
        )}
        {Icons.PaperClipOutlined && (
          <div>
            <Icons.PaperClipOutlined /> PaperClipOutlined
          </div>
        )}
      </div>

      <h3>Available Icon Keys ({iconKeys.length}):</h3>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '5px',
          maxHeight: '200px',
          overflowY: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        {iconKeys.map((key, index) => (
          <div key={index} style={{ margin: '2px 0' }}>
            {key}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IconTest;
