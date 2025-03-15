import { Card, Typography } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import '../styles/Auth.css';
import UserProfileModal from './UserProfileModal.jsx';

const { Title } = Typography;

/**
 * Profile page component that displays the user's profile
 */
const ProfilePage = () => {
  const { user } = useSelector(state => state.auth);

  return (
    <div className="profile-page-container">
      <Card className="profile-card">
        <Title level={2}>User Profile</Title>
        {user ? (
          <UserProfileModal userId={user.id} isGlobalModal={false} />
        ) : (
          <p>Please log in to view your profile.</p>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
