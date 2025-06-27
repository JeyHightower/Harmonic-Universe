import React, { useState } from "react";
import { Modal, Form, Select, Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const ExportModal = ({ visible, onClose, data, type = "json" }) => {
  const [format, setFormat] = useState(type);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);

      // Convert data to selected format
      let exportData;
      let mimeType;
      let fileExtension;

      switch (format) {
        case "json":
          exportData = JSON.stringify(data, null, 2);
          mimeType = "application/json";
          fileExtension = "json";
          break;
        case "csv":
          // Convert data to CSV format
          const headers = Object.keys(data[0] || {}).join(",");
          const rows = data
            .map((item) => Object.values(item).join(","))
            .join("\n");
          exportData = `${headers}\n${rows}`;
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
        default:
          throw new Error("Unsupported export format");
      }

      // Create blob and download
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `export.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success("Export successful");
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Failed to export data");
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
