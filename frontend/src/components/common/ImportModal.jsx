import { InboxOutlined } from "@ant-design/icons";
import { Button, Form, Modal, Upload } from "antd";
import { useState } from "react";

const ImportModal = ({ visible, onClose, onImport, type = "json" }) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState(null);

  const handleImport = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (!file) return;

    const reader = new window.FileReader();
    reader.onload = (event) => {
      try {
        let importedData;
        if (type === 'json') {
          importedData = JSON.parse(event.target.result);
        } else if (type === 'csv') {
          // CSV parsing logic here
          // This is simplified and may need more robust parsing logic
          const lines = event.target.result.split('\n');
          const headers = lines[0].split(',');
          importedData = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i];
              return obj;
            }, {});
          });
        }
        onImport(importedData);
        onClose();
      } catch (err) {
        setError('Failed to parse file. Please check the file format and try again.');
      }
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };

    if (type === 'json') {
      reader.readAsText(file);
    } else if (type === 'csv') {
      reader.readAsText(file);
    }
  };

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  return (
    <Modal
      title="Import Data"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="import"
          type="primary"
          loading={loading}
          onClick={handleImport}
          disabled={!fileList.length}
        >
          Import
        </Button>,
      ]}
    >
      <Form layout="vertical">
        <Form.Item>
          <Upload.Dragger
            accept={type === "json" ? ".json" : ".csv"}
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single {type.toUpperCase()} file.
            </p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ImportModal;
