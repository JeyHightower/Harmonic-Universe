import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  List,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPhysicsObject } from '../../../store/slices/physicsObjectsSlice';
import { fetchPhysicsObjects } from '../../../store/thunks/physicsObjectsThunks';
import '../scenes/Scenes.css';

const { Title, Text } = Typography;

const PhysicsObjectsList = ({
  sceneId,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}) => {
  const dispatch = useDispatch();
  const { physicsObjects, loading, error } = useSelector(
    state => state.physicsObjects
  );

  useEffect(() => {
    if (sceneId) {
      dispatch(fetchPhysicsObjects(sceneId));
    }
  }, [sceneId, dispatch]);

  const handleEditClick = physicsObject => {
    dispatch(setCurrentPhysicsObject(physicsObject));
    if (onEditClick) onEditClick(physicsObject);
  };

  const handleDeleteClick = physicsObject => {
    if (onDeleteClick) onDeleteClick(physicsObject);
  };

  const getCollisionShapeColor = shape => {
    const colors = {
      box: 'blue',
      sphere: 'green',
      capsule: 'orange',
      cylinder: 'purple',
      cone: 'red',
      plane: 'geekblue',
    };
    return colors[shape] || 'default';
  };

  if (error) {
    return <div>Error loading physics objects: {error.message}</div>;
  }

  return (
    <Card
      title={<Title level={4}>Physics Objects</Title>}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick}>
          Add Object
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : physicsObjects.length === 0 ? (
        <Empty description="No physics objects yet" />
      ) : (
        <List
          dataSource={physicsObjects}
          renderItem={item => (
            <List.Item
              key={item.id}
              className="physics-object-item"
              actions={[
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEditClick(item)}
                  type="text"
                />,
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteClick(item)}
                  danger
                  type="text"
                />,
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={
                  <Space direction="vertical" size={1}>
                    <Space>
                      <Text type="secondary">Mass:</Text>
                      <Text>{item.mass}</Text>
                      <Tag color={item.is_static ? 'volcano' : 'green'}>
                        {item.is_static ? 'Static' : 'Dynamic'}
                      </Tag>
                      <Tag color={getCollisionShapeColor(item.collision_shape)}>
                        {item.collision_shape}
                      </Tag>
                    </Space>
                    <Space>
                      <Text type="secondary">Position:</Text>
                      <Text>
                        ({item.position.x.toFixed(2)},{' '}
                        {item.position.y.toFixed(2)},{' '}
                        {item.position.z.toFixed(2)})
                      </Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default PhysicsObjectsList;
