import { DownloadOutlined } from '@ant-design/icons';
import { Button, Form, message, Modal, Select } from 'antd';
import { useState } from 'react';

const ExportModal = ({ visible, onClose, data, type = 'json' }) => {
  const [format, setFormat] = useState(type);
  const [loading, setLoading] = useState(false);

  const generateExportFile = () => {
    let exportData;
    let mimeType;
    let fileName;

    switch (type) {
      case 'json':
        mimeType = 'application/json';
        fileName = `export-${Date.now()}.json`;
        exportData = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        mimeType = 'text/csv';
        fileName = `export-${Date.now()}.csv`;
        // Create header row from first item's keys
        const headers = Object.keys(data[0]).join(',');
        // Create data rows
        const rows = data.map((item) => Object.values(item).join(',')).join('\n');
        exportData = `${headers}\n${rows}`;
        break;
      default:
        mimeType = 'application/json';
        fileName = `export-${Date.now()}.json`;
        exportData = JSON.stringify(data, null, 2);
    }

    // Create blob and download
    const blob = new window.Blob([exportData], { type: mimeType });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      generateExportFile();

      message.success('Export successful');
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      message.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Export Data"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleExport}
        >
          Export
        </Button>,
      ]}
    >
      <Form layout="vertical">
        <Form.Item label="Export Format">
          <Select value={format} onChange={setFormat}>
            <Select.Option value="json">JSON</Select.Option>
            <Select.Option value="csv">CSV</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExportModal;
