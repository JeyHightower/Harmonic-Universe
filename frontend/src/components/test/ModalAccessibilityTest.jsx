import { Button, Card, Form, Input, Space, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { MODAL_TYPES } from '../../utils/modalRegistry';
import Modal from '../common/Modal';

const { Title, Paragraph, Text } = Typography;

/**
 * Test component for demonstrating and verifying modal accessibility
 * and route integration features
 */
const ModalAccessibilityTest = () => {
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isAccessibleModalOpen, setIsAccessibleModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({});
  const { openModalByType, getModalUrl } = useModal();

  // References for focus management
  const firstButtonRef = useRef(null);
  const submitButtonRef = useRef(null);
  const modalDeepLinkUrl = getModalUrl(MODAL_TYPES.PHYSICS_PARAMETERS, {
    universeId: '123',
  });

  const handleOpenRegisteredModal = () => {
    openModalByType(
      MODAL_TYPES.PHYSICS_PARAMETERS,
      {
        universeId: '123',
      },
      {
        updateUrl: true,
        preserveState: true,
      }
    );
  };

  const handleFormSubmit = values => {
    setFormValues(values);
    setIsAccessibleModalOpen(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Modal Accessibility & Route Integration Test</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Basic Modal Test">
          <Paragraph>
            This demonstrates a basic modal without enhanced accessibility
            features.
          </Paragraph>

          <Button type="primary" onClick={() => setIsBasicModalOpen(true)}>
            Open Basic Modal
          </Button>

          <Modal
            isOpen={isBasicModalOpen}
            onClose={() => setIsBasicModalOpen(false)}
            title="Basic Modal"
          >
            <div style={{ padding: '1rem' }}>
              <Paragraph>
                This is a basic modal without enhanced accessibility features.
                Try navigating with Tab key and notice the differences.
              </Paragraph>

              <Space>
                <Button>Button 1</Button>
                <Button>Button 2</Button>
                <Button onClick={() => setIsBasicModalOpen(false)}>
                  Close
                </Button>
              </Space>
            </div>
          </Modal>
        </Card>

        <Card title="Accessible Modal Test">
          <Paragraph>
            This demonstrates a modal with enhanced accessibility features.
          </Paragraph>

          <Button
            ref={firstButtonRef}
            type="primary"
            onClick={() => setIsAccessibleModalOpen(true)}
          >
            Open Accessible Modal
          </Button>

          <Modal
            isOpen={isAccessibleModalOpen}
            onClose={() => setIsAccessibleModalOpen(false)}
            title="Accessible Modal Example"
            initialFocusRef={submitButtonRef}
            ariaDescribedBy="modal-description"
          >
            <div style={{ padding: '1rem' }}>
              <Paragraph id="modal-description">
                This modal demonstrates enhanced accessibility features:
              </Paragraph>

              <ul>
                <li>Focus is trapped within the modal</li>
                <li>Initial focus is set to the Submit button</li>
                <li>ESC key closes the modal</li>
                <li>Proper ARIA attributes are applied</li>
                <li>Screen readers announce the modal correctly</li>
              </ul>

              <Form
                layout="vertical"
                onFinish={handleFormSubmit}
                style={{ marginTop: '1rem' }}
              >
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[
                    { required: true, message: 'Please enter your name' },
                  ]}
                >
                  <Input placeholder="Enter your name" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      ref={submitButtonRef}
                    >
                      Submit
                    </Button>
                    <Button onClick={() => setIsAccessibleModalOpen(false)}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>

              {Object.keys(formValues).length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <Text strong>Form was submitted with:</Text>
                  <pre>{JSON.stringify(formValues, null, 2)}</pre>
                </div>
              )}
            </div>
          </Modal>
        </Card>

        <Card title="Route Integration Test">
          <Paragraph>
            This demonstrates deep linking and browser history integration with
            modals.
          </Paragraph>

          <Space direction="vertical">
            <Button type="primary" onClick={handleOpenRegisteredModal}>
              Open Modal with URL Update
            </Button>

            <Paragraph>
              <Text>Deep link URL: </Text>
              <a
                href={modalDeepLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {modalDeepLinkUrl}
              </a>
            </Paragraph>

            <Text>
              Notice that the URL updates when opening the modal. The browser's
              back button will close the modal.
            </Text>
          </Space>
        </Card>

        <Card title="Accessibility Testing Checklist">
          <Paragraph>
            Use this checklist to verify accessibility features:
          </Paragraph>

          <ol>
            <li>
              Open the accessible modal and verify focus is on the Submit button
            </li>
            <li>
              Tab through the modal and verify focus remains trapped within it
            </li>
            <li>Press ESC to close the modal</li>
            <li>Verify focus returns to the button that opened the modal</li>
            <li>Test with a screen reader to verify proper announcements</li>
            <li>
              Open the modal with URL update and use browser back button to
              close it
            </li>
            <li>Click the deep link URL and verify the modal opens properly</li>
          </ol>
        </Card>
      </Space>
    </div>
  );
};

export default ModalAccessibilityTest;
