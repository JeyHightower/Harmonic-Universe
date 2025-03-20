import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import Spinner from '../../common/Spinner';
import './Music.css';
import MusicModal from './MusicModal';
import MusicPlayer from './MusicPlayer';

const MusicManager = ({ universeId }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [musicList, setMusicList] = useState([]);
  const [selectedMusicId, setSelectedMusicId] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'create', 'edit', 'view', 'delete'
  const [selectedMusic, setSelectedMusic] = useState(null);

  // Fetch music list for the universe
  useEffect(() => {
    const fetchMusicList = async () => {
      if (!universeId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(
          `${endpoints.music}?universe_id=${universeId}`
        );
        setMusicList(response.data);

        // Set the first music as selected if available
        if (response.data.length > 0 && !selectedMusicId) {
          setSelectedMusicId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching music list:', error);
        setError('Failed to load music. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMusicList();
  }, [universeId, selectedMusicId]);

  // Handle creating a new music
  const handleAddMusic = () => {
    setSelectedMusic(null);
    setModalMode('create');
  };

  // Handle viewing music details
  const handleViewMusic = music => {
    setSelectedMusic(music);
    setModalMode('view');
  };

  // Handle editing music
  const handleEditMusic = music => {
    setSelectedMusic(music);
    setModalMode('edit');
  };

  // Handle deleting music
  const handleDeleteMusic = music => {
    setSelectedMusic(music);
    setModalMode('delete');
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalMode(null);
    setSelectedMusic(null);
  };

  // Handle modal success (create, edit, delete)
  const handleModalSuccess = (data, mode) => {
    if (mode === 'create') {
      // Add new music to the list
      setMusicList(prev => [...prev, data]);
      setSelectedMusicId(data.id);
    } else if (mode === 'edit' || mode === 'generate') {
      // Update existing music in the list
      setMusicList(prev =>
        prev.map(item => (item.id === data.id ? data : item))
      );
      setSelectedMusicId(data.id);
    } else if (mode === 'delete') {
      // Remove music from the list
      setMusicList(prev => prev.filter(item => item.id !== data.id));

      // Update selected music if the deleted one was selected
      if (selectedMusicId === data.id) {
        const newList = musicList.filter(item => item.id !== data.id);
        setSelectedMusicId(newList.length > 0 ? newList[0].id : null);
      }
    }
  };

  // Render music list
  const renderMusicList = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading music...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          <Icon name="error" /> {error}
        </div>
      );
    }

    if (musicList.length === 0) {
      return (
        <div className="empty-message">
          <Icon name="music" size="large" />
          <p>No music found for this universe.</p>
          <Button variant="primary" onClick={handleAddMusic} icon="plus">
            Create Music
          </Button>
        </div>
      );
    }

    return (
      <div className="music-list">
        {musicList.map(music => (
          <div
            key={music.id}
            className={`music-item ${
              selectedMusicId === music.id ? 'selected' : ''
            }`}
            onClick={() => setSelectedMusicId(music.id)}
          >
            <div className="music-item-content">
              <h3>{music.name || 'Unnamed Music'}</h3>
              {music.description && <p>{music.description}</p>}
              <div className="music-item-details">
                <span>Tempo: {music.tempo} BPM</span>
                <span>Scale: {music.scale_type}</span>
                <span>Root: {music.root_note}</span>
              </div>
            </div>
            <div className="music-item-actions">
              <Button
                variant="text"
                icon="view"
                tooltip="View Details"
                onClick={e => {
                  e.stopPropagation();
                  handleViewMusic(music);
                }}
              />
              <Button
                variant="text"
                icon="edit"
                tooltip="Edit"
                onClick={e => {
                  e.stopPropagation();
                  handleEditMusic(music);
                }}
              />
              <Button
                variant="text"
                icon="delete"
                tooltip="Delete"
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteMusic(music);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render selected music player
  const renderMusicPlayer = () => {
    if (!selectedMusicId || musicList.length === 0) {
      return null;
    }

    const selectedMusic = musicList.find(music => music.id === selectedMusicId);
    if (!selectedMusic) return null;

    return (
      <div className="music-player-container">
        <MusicPlayer universeId={universeId} musicData={selectedMusic} />
      </div>
    );
  };

  return (
    <div className="music-manager">
      <div className="music-manager-header">
        <h2>
          <Icon name="music" /> Music
        </h2>
        <Button variant="primary" icon="plus" onClick={handleAddMusic}>
          Create Music
        </Button>
      </div>

      <div className="music-manager-content">
        <div className="music-sidebar">{renderMusicList()}</div>
        <div className="music-main">{renderMusicPlayer()}</div>
      </div>

      {modalMode && (
        <MusicModal
          universeId={universeId}
          musicId={selectedMusic?.id}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          mode={modalMode}
          initialData={selectedMusic}
        />
      )}
    </div>
  );
};

export default MusicManager;
