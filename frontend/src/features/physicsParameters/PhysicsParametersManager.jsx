import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import useModalManager from '../../hooks/useModalManager';
import {
  fetchPhysicsParameters,
  deletePhysicsParameters,
} from '../../store/slices/physicsParametersSlice';
import PhysicsParametersModal from './PhysicsParametersModal';
import './PhysicsParameters.css';

const PhysicsParametersManager = ({ universeId }) => {
  const dispatch = useDispatch();
  const parameters = useSelector((state) => state.physicsParameters.parameters);
  const loading = useSelector((state) => state.physicsParameters.loading);

  const createModal = useModalManager('create-physics-parameters');
  const editModal = useModalManager('edit-physics-parameters');

  useEffect(() => {
    loadPhysicsParameters();
  }, [universeId]);

  const loadPhysicsParameters = async () => {
    try {
      await dispatch(fetchPhysicsParameters(universeId)).unwrap();
    } catch (error) {
      message.error('Failed to load physics parameters');
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deletePhysicsParameters(id)).unwrap();
      message.success('Physics parameters deleted successfully');
      loadPhysicsParameters();
    } catch (error) {
      message.error('Failed to delete physics parameters');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Gravity',
      dataIndex: 'gravity',
      key: 'gravity',
      render: (value) => `${value} m/s²`,
      sorter: (a, b) => a.gravity - b.gravity,
    },
    {
      title: 'Time Scale',
      dataIndex: 'time_scale',
      key: 'time_scale',
      sorter: (a, b) => a.time_scale - b.time_scale,
    },
    {
      title: 'Air Resistance',
      dataIndex: 'air_resistance',
      key: 'air_resistance',
      render: (value) => value.toFixed(2),
      sorter: (a, b) => a.air_resistance - b.air_resistance,
    },
    {
      title: 'Integration Method',
      dataIndex: 'integration_method',
      key: 'integration_method',
      filters: [
        { text: 'Verlet', value: 'verlet' },
        { text: 'Euler', value: 'euler' },
        { text: 'RK4', value: 'rk4' },
      ],
      onFilter: (value, record) => record.integration_method === value,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => editModal.openModal(record.id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete these parameters?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="physics-parameters-manager">
      <div className="physics-parameters-header">
        <h2>Physics Parameters</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => createModal.openModal()}
        >
          Create New Parameters
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={parameters}
        rowKey="id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} parameter sets`,
        }}
      />

      <PhysicsParametersModal
        universeId={universeId}
        initialData={editModal.isActive ? parameters.find(p => p.id === editModal.modalId) : null}
      />
    </div>
  );
};

PhysicsParametersManager.propTypes = {
  universeId: PropTypes.string.isRequired,
};

export default PhysicsParametersManager;
