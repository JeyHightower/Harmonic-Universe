import React, { useState } from "react";
import { Modal, Form, Upload, Button, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const ImportModal = ({ visible, onClose, onImport, type = "json" }) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleImport = async () => {
    if (!fileList.length) {
      message.warning("Please select a file to import");
      return;
    }

    // Check if FileReader is available
    if (typeof window === 'undefined' || !window.FileReader) {
      message.error("File reading is not supported in this environment");
      return;
    }

    try {
      setLoading(true);
      const file = fileList[0];
      const reader = new window.FileReader();

      reader.onload = async (e) => {
        try {
          let importedData;

          if (type === "json") {
            importedData = JSON.parse(e.target.result);
          } else if (type === "csv") {
            // Parse CSV
            const rows = e.target.result.split("\n");
            const headers = rows[0].split(",");
            importedData = rows.slice(1).map((row) => {
              const values = row.split(",");
              return headers.reduce((obj, header, index) => {
                obj[header] = values[index];
                return obj;
              }, {});
            });
          } else {
            throw new Error("Unsupported import format");
          }

          await onImport(importedData);
          message.success("Import successful");
          onClose();
        } catch (error) {
          console.error("Failed to parse file:", error);
          message.error("Failed to parse file. Please check the file format.");
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        message.error("Failed to read file");
        setLoading(false);
      };

      if (type === "json") {
        reader.readAsText(file.originFileObj);
      } else if (type === "csv") {
        reader.readAsText(file.originFileObj);
      }
    } catch (error) {
      console.error("Import failed:", error);
      message.error("Failed to import data");
      setLoading(false);
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
