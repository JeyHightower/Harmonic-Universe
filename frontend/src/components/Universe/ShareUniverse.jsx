import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  shareUniverse,
  unshareUniverse,
} from '../../store/slices/universeSlice';
import {
  clearSearchResults,
  fetchUsersByIds,
  searchUsers,
} from '../../store/slices/userSlice';
import styles from './Universe.module.css';

const ShareUniverse = ({ universeId }) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const { currentUniverse, isLoading: universeLoading } = useSelector(
    state => state.universe
  );
  const {
    searchResults,
    userDetails,
    isLoading: userLoading,
  } = useSelector(state => state.users);
  const currentUser = useSelector(state => state.auth.user);
  const isLoading = universeLoading || userLoading;

  // Only show sharing interface if user is the creator
  if (!currentUniverse || currentUniverse.creator_id !== currentUser?.id) {
    return null;
  }

  useEffect(() => {
    // Fetch usernames for shared users when component mounts or shared_with changes
    if (currentUniverse.shared_with?.length > 0) {
      const missingUserIds = currentUniverse.shared_with.filter(
        id => !userDetails[id]
      );
      if (missingUserIds.length > 0) {
        dispatch(fetchUsersByIds(missingUserIds));
      }
    }
  }, [dispatch, currentUniverse.shared_with, userDetails]);

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        dispatch(searchUsers(searchQuery));
      } else {
        dispatch(clearSearchResults());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch, searchQuery]);

  const handleShare = async () => {
    if (!selectedUser) return;

    try {
      await dispatch(
        shareUniverse({
          universeId,
          userId: selectedUser.id,
        })
      ).unwrap();
      setSelectedUser(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to share universe:', error);
    }
  };

  const handleUnshare = async userId => {
    try {
      await dispatch(
        unshareUniverse({
          universeId,
          userId,
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to unshare universe:', error);
    }
  };

  const handleSelectUser = user => {
    setSelectedUser(user);
    setSearchQuery('');
    dispatch(clearSearchResults());
  };

  return (
    <div className={styles.shareUniverse}>
      <h3>Share Universe</h3>

      <div className={styles.shareForm}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className={styles.searchInput}
          />
          {searchQuery && searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map(user => (
                <div
                  key={user.id}
                  className={styles.searchResult}
                  onClick={() => handleSelectUser(user)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && !isLoading && (
            <div className={styles.noResults}>No users found</div>
          )}
        </div>

        {selectedUser && (
          <div className={styles.selectedUser}>
            <span>{selectedUser.username}</span>
            <button
              onClick={handleShare}
              disabled={isLoading}
              className={styles.shareButton}
            >
              Share
            </button>
          </div>
        )}
      </div>

      <div className={styles.sharedWith}>
        <h4>Shared with:</h4>
        {currentUniverse.shared_with?.length > 0 ? (
          <ul className={styles.sharedList}>
            {currentUniverse.shared_with.map(userId => (
              <li key={userId} className={styles.sharedUser}>
                <span>{userDetails[userId]?.username || 'Loading...'}</span>
                <button
                  onClick={() => handleUnshare(userId)}
                  disabled={isLoading}
                  className={styles.unshareButton}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noShares}>Not shared with anyone yet</p>
        )}
      </div>
    </div>
  );
};

ShareUniverse.propTypes = {
  universeId: PropTypes.string.isRequired,
};

export default ShareUniverse;
