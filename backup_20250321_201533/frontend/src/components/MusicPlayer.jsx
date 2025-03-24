import {
  CaretRightOutlined,
  DownloadOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  PauseOutlined,
  RobotOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Collapse,
  Divider,
  Form,
  Select,
  Slider,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { useModal } from '../../../contexts/ModalContext';
import { api, endpoints } from '../../../utils/api';
import Modal from '../../common/Modal';
import './Music.css';
import MusicGenerationModal from './MusicGenerationModal';
import './MusicPlayer.css';
import MusicVisualizer3D from './MusicVisualizer3D';

const { Title, Text } = Typography;

const MusicPlayer = ({ universeId }) => {
  const { openModal } = useModal();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [musicData, setMusicData] = useState(null);
  const [volume, setVolume] = useState(75);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiStyle, setAiStyle] = useState('default');
  const [customParams, setCustomParams] = useState({
    tempo: 120,
    scale_type: 'major',
    root_note: 'C',
    melody_complexity: 0.5,
  });
  const [visualizationType, setVisualizationType] = useState('2D'); // '2D' or '3D'
  const [showMusicInfoModal, setShowMusicInfoModal] = useState(false);

  // References for Tone.js instruments and sequences
  const synthRef = useRef(null);
  const sequenceRef = useRef(null);
  const visualizerRef = useRef(null);
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize Tone.js
  useEffect(() => {
    // Create a polyphonic synth
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();

    // Set initial volume
    synthRef.current.volume.value = Tone.gainToDb(volume / 100);

    // Setup analyzer for visualization
    analyzerRef.current = new Tone.Analyser('waveform', 128);
    synthRef.current.connect(analyzerRef.current);

    // Clean up on unmount
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume / 100);
    }
  }, [volume]);

  // Setup visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Colors for visualization
    const colors = {
      background: 'rgba(25, 31, 45, 0.9)',
      primary: '#1890ff',
      secondary: '#722ed1',
      accent: '#13c2c2',
      highlight: '#eb2f96',
    };

    // Animation variables
    let particleArray = [];

    // Particle class for advanced visualization
    class Particle {
      constructor(x, y, size, color, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = speed;
        this.angle = Math.random() * Math.PI * 2;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        this.alpha = 1;
      }

      update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.alpha -= 0.01;
        this.size -= 0.1;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const drawVisualization = () => {
      if (!isPlaying || !analyzerRef.current) {
        return;
      }

      // Get waveform data
      const dataArray = analyzerRef.current.getValue();

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(26, 32, 53, 0.9)');
      gradient.addColorStop(1, 'rgba(13, 17, 38, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw grid lines
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < canvas.height; i += 10) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
      }
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
      }
      ctx.stroke();

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;

      ctx.moveTo(0, canvas.height / 2 + (dataArray[0] * canvas.height) / 2);

      for (let i = 1; i < dataArray.length; i++) {
        const x = i * (canvas.width / dataArray.length);
        const y = canvas.height / 2 + (dataArray[i] * canvas.height) / 2;
        ctx.lineTo(x, y);
      }

      ctx.stroke();

      // Add glow effect to waveform
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors.primary;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw frequency bars and particles if we have music data
      if (musicData) {
        // Add new particles based on audio data
        const intensity =
          dataArray.reduce((sum, value) => sum + Math.abs(value), 0) /
          dataArray.length;

        if (Math.random() < intensity * 0.8 && particleArray.length < 100) {
          const x = Math.random() * canvas.width;
          const y = canvas.height / 2;
          const size = 3 + Math.random() * 5;
          const color = [
            colors.primary,
            colors.secondary,
            colors.accent,
            colors.highlight,
          ][Math.floor(Math.random() * 4)];
          const speed = 0.5 + Math.random() * 2;

          particleArray.push(new Particle(x, y, size, color, speed));
        }

        // Update and draw particles
        particleArray = particleArray.filter(
          particle => particle.alpha > 0 && particle.size > 0
        );
        particleArray.forEach(particle => {
          particle.update();
          particle.draw();
        });

        // Draw bars that react to music notes
        const barWidth = canvas.width / musicData.melody.length;

        musicData.melody.forEach((note, index) => {
          // Normalize MIDI notes (C4 = 60)
          const notePosition = (note.note - 60) / 36;

          // Get height from note position and current audio data
          const intensityIndex = Math.floor(
            (index / musicData.melody.length) * dataArray.length
          );
          const currentIntensity = Math.abs(dataArray[intensityIndex] || 0);
          const barHeight = 20 + notePosition * 60 + currentIntensity * 40;

          // Position is based on note index
          const x = (index / musicData.melody.length) * canvas.width;

          // Color based on note height
          const barColor = `hsl(${180 + notePosition * 120}, 80%, 60%)`;

          // Draw with glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = barColor;
          ctx.fillStyle = barColor;

          // Make the bars thinner and with rounded tops
          const finalBarWidth = barWidth * 0.7;
          ctx.beginPath();
          ctx.roundRect(
            x + (barWidth - finalBarWidth) / 2,
            canvas.height - barHeight,
            finalBarWidth,
            barHeight,
            [4, 4, 0, 0]
          );
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animationRef.current = requestAnimationFrame(drawVisualization);
    };

    // Start visualization loop
    if (isPlaying) {
      drawVisualization();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);

      // Clear canvas when not playing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(26, 32, 53, 0.9)');
      gradient.addColorStop(1, 'rgba(13, 17, 38, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw placeholder text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Click play to start visualization',
        canvas.width / 2,
        canvas.height / 2
      );
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, musicData]);

  const generateMusic = async (params = null) => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop any existing playback
      if (isPlaying) {
        await togglePlayback();
      }

      // Use provided params or the current customParams
      const musicParams =
        params || (customizationEnabled ? customParams : null);

      // Build query parameters
      let queryParams = '';
      if (musicParams && customizationEnabled) {
        queryParams = `?custom_params=${encodeURIComponent(
          JSON.stringify(musicParams)
        )}`;
      }

      // Add AI parameters if enabled
      if (aiEnabled) {
        const aiParams = queryParams ? '&' : '?';
        queryParams += `${aiParams}ai_style=${aiStyle}`;
      }

      // Make API request to generate music
      const response = await api.get(
        endpoints.universes.generateMusic(universeId) + queryParams
      );

      if (response.music_data) {
        setMusicData(response.music_data);
        message.success('Music generated successfully');

        // Auto-play the generated music
        setTimeout(() => {
          togglePlayback();
        }, 500);
      } else {
        throw new Error('No music data received from the server');
      }
    } catch (err) {
      console.error('Failed to generate music:', err);
      setError(err.message || 'Failed to generate music');
      message.error('Failed to generate music');
    } finally {
      setIsLoading(false);
    }
  };

  // Download the generated music
  const downloadMusic = async () => {
    if (!musicData) {
      message.warning('Please generate music first');
      return;
    }

    try {
      setIsDownloading(true);

      // Construct the URL for downloading
      const downloadUrl = endpoints.music.download(universeId);

      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `universe_${universeId}_music.wav`;

      // Add token for authentication
      const token = localStorage.getItem('accessToken');
      if (token) {
        link.href = `${downloadUrl}?token=${token}`;
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Download started');
    } catch (err) {
      console.error('Failed to download music:', err);
      message.error('Failed to download music');
    } finally {
      setIsDownloading(false);
    }
  };

  // Create a Tone.js sequence from the music data
  const createMusicSequence = data => {
    if (!data || !data.melody || !synthRef.current) return;

    // Clean up existing sequence
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    // Set tempo
    Tone.Transport.bpm.value = data.tempo;

    // Convert melody to notes and durations
    const notes = [];
    const durations = [];

    data.melody.forEach(note => {
      // Convert MIDI note to frequency
      const freq = Tone.Frequency(note.note, 'midi');
      notes.push(freq);
      durations.push(note.duration);
    });

    // Create the sequence
    let index = 0;
    sequenceRef.current = new Tone.Sequence(
      (time, note) => {
        synthRef.current.triggerAttackRelease(
          note,
          durations[index] + 'n',
          time
        );
        index = (index + 1) % notes.length;
      },
      notes,
      '8n'
    );

    // Start the sequence (but don't play yet)
    sequenceRef.current.start(0);
  };

  // Toggle play/pause
  const togglePlayback = async () => {
    // If no music data, generate it first
    if (!musicData) {
      await generateMusic();
    }

    // Toggle playback
    if (isPlaying) {
      Tone.Transport.pause();
    } else {
      // Start audio context if it's not running
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      Tone.Transport.start();
    }

    setIsPlaying(!isPlaying);
  };

  // Handle parameter changes
  const handleParamChange = (param, value) => {
    setCustomParams(prev => ({
      ...prev,
      [param]: value,
    }));
  };

  // Toggle visualization type between 2D and 3D
  const toggleVisualizationType = () => {
    setVisualizationType(prev => (prev === '2D' ? '3D' : '2D'));
  };

  // Show music info modal
  const handleShowMusicInfo = () => {
    setShowMusicInfoModal(true);
  };

  // Get note name from MIDI note number
  const getNoteNameFromMidi = midiNote => {
    const noteNames = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
  };

  // New function to open the music generation modal
  const openMusicGenerationModal = () => {
    openModal({
      component: MusicGenerationModal,
      props: {
        initialParams: customParams,
        onSubmit: params => {
          setCustomParams(params);
          setCustomizationEnabled(true);
          generateMusic(params);
        },
      },
      modalProps: {
        title: 'Music Generation Settings',
        size: 'medium',
        animation: 'slide',
        position: 'center',
      },
    });
  };

  return (
    <Card
      className="music-player"
      title={<Title level={4}>Universe Harmony</Title>}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={openMusicGenerationModal}
            title="Customize music generation parameters"
          >
            Customize
          </Button>
          <Button
            type="default"
            icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
            onClick={togglePlayback}
            loading={isLoading}
            disabled={!musicData && !isLoading}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            type="default"
            icon={<SyncOutlined />}
            onClick={() => generateMusic()}
            loading={isLoading}
          >
            Generate
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={downloadMusic}
            disabled={!musicData || isDownloading}
            loading={isDownloading}
          >
            Download
          </Button>
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={handleShowMusicInfo}
          />
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={toggleVisualizationType}
            title={`Switch to ${
              visualizationType === '2D' ? '3D' : '2D'
            } visualization`}
          />
        </Space>
      }
    >
      <div
        className={`visualization-container ${
          visualizationType === '3D' ? 'visualization-3d' : ''
        }`}
      >
        {visualizationType === '2D' ? (
          <canvas
            ref={canvasRef}
            width="500"
            height="120"
            className="audio-visualizer"
          />
        ) : (
          <div className="visualization-3d-container">
            <MusicVisualizer3D
              isPlaying={isPlaying}
              musicData={musicData}
              analyzerData={
                analyzerRef.current ? analyzerRef.current.getValue() : null
              }
            />
            <canvas
              ref={canvasRef}
              width="500"
              height="120"
              className="audio-visualizer audio-visualizer-backup"
              style={{ opacity: 0 }} // We still need this for analyzer data, but hide it
            />
          </div>
        )}
      </div>

      <div className="music-controls">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {error && <Text type="danger">{error}</Text>}

          <div className="control-buttons">
            <Button
              type="primary"
              shape="circle"
              icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
              size="large"
              onClick={togglePlayback}
              disabled={isLoading}
            />

            <Button
              type="default"
              shape="circle"
              icon={<SyncOutlined />}
              size="large"
              onClick={generateMusic}
              loading={isLoading}
            />

            <Button
              type="default"
              shape="circle"
              icon={<DownloadOutlined />}
              size="large"
              onClick={downloadMusic}
              loading={isDownloading}
              disabled={!musicData}
            />

            <Button
              type={aiEnabled ? 'primary' : 'default'}
              shape="circle"
              icon={<RobotOutlined />}
              size="large"
              onClick={() => setAiEnabled(!aiEnabled)}
              title={
                aiEnabled
                  ? 'AI-assisted mode enabled'
                  : 'Enable AI-assisted mode'
              }
            />
          </div>

          <div className="volume-control">
            <Text>Volume</Text>
            <Slider value={volume} onChange={setVolume} disabled={isLoading} />
          </div>

          <Collapse ghost className="customization-panel">
            <Collapse.Panel
              header={<Text strong>Music Customization</Text>}
              key="1"
              extra={<SettingOutlined />}
            >
              <div className="customization-controls">
                <Form layout="vertical">
                  <Form.Item label={<Text>Use Custom Parameters</Text>}>
                    <Switch
                      checked={customizationEnabled}
                      onChange={setCustomizationEnabled}
                      disabled={isLoading}
                    />
                  </Form.Item>

                  <Divider style={{ margin: '8px 0' }} />

                  <div
                    className={customizationEnabled ? '' : 'disabled-controls'}
                  >
                    <Form.Item label={<Text>Tempo (BPM)</Text>}>
                      <Slider
                        value={customParams.tempo}
                        min={60}
                        max={180}
                        onChange={value => handleParamChange('tempo', value)}
                        disabled={!customizationEnabled || isLoading}
                      />
                    </Form.Item>

                    <Form.Item label={<Text>Scale Type</Text>}>
                      <Select
                        value={customParams.scale_type}
                        onChange={value =>
                          handleParamChange('scale_type', value)
                        }
                        disabled={!customizationEnabled || isLoading}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="major">Major</Select.Option>
                        <Select.Option value="minor">Minor</Select.Option>
                        <Select.Option value="pentatonic">
                          Pentatonic
                        </Select.Option>
                        <Select.Option value="blues">Blues</Select.Option>
                        <Select.Option value="chromatic">
                          Chromatic
                        </Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label={<Text>Root Note</Text>}>
                      <Select
                        value={customParams.root_note}
                        onChange={value =>
                          handleParamChange('root_note', value)
                        }
                        disabled={!customizationEnabled || isLoading}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value={60}>C (Middle C)</Select.Option>
                        <Select.Option value={62}>D</Select.Option>
                        <Select.Option value={64}>E</Select.Option>
                        <Select.Option value={65}>F</Select.Option>
                        <Select.Option value={67}>G</Select.Option>
                        <Select.Option value={69}>A</Select.Option>
                        <Select.Option value={71}>B</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label={<Text>Melody Complexity</Text>}>
                      <Slider
                        value={customParams.melody_complexity}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        onChange={value =>
                          handleParamChange('melody_complexity', value)
                        }
                        disabled={!customizationEnabled || isLoading}
                        marks={{
                          0.1: 'Simple',
                          0.5: 'Medium',
                          1.0: 'Complex',
                        }}
                      />
                    </Form.Item>
                  </div>

                  <Divider style={{ margin: '16px 0 8px 0' }} />

                  <Form.Item label={<Text>Use AI-Assisted Generation</Text>}>
                    <Switch
                      checked={aiEnabled}
                      onChange={setAiEnabled}
                      disabled={isLoading}
                    />
                  </Form.Item>

                  <div className={aiEnabled ? '' : 'disabled-controls'}>
                    <Form.Item label={<Text>AI Music Style</Text>}>
                      <Select
                        value={aiStyle}
                        onChange={setAiStyle}
                        disabled={!aiEnabled || isLoading}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="default">
                          Default Enhancements
                        </Select.Option>
                        <Select.Option value="ambient">Ambient</Select.Option>
                        <Select.Option value="classical">
                          Classical
                        </Select.Option>
                        <Select.Option value="electronic">
                          Electronic
                        </Select.Option>
                        <Select.Option value="jazz">Jazz</Select.Option>
                      </Select>
                    </Form.Item>
                  </div>
                </Form>
              </div>
            </Collapse.Panel>
          </Collapse>

          {musicData && (
            <div className="music-info" onClick={handleShowMusicInfo}>
              <div className="music-info-header">
                <Text type="secondary">Music Information</Text>
                <InfoCircleOutlined className="info-icon" />
              </div>
              <Text type="secondary">Tempo: {musicData.tempo} BPM</Text>
              <Text type="secondary">Scale: {musicData.scale_type}</Text>
              <Text type="secondary">
                Physics Influence: Gravity{' '}
                {musicData.physics_influence.gravity.toFixed(2)}, Temperature{' '}
                {musicData.physics_influence.temperature.toFixed(2)}
              </Text>
              {musicData.ai_metadata && (
                <>
                  <Divider
                    style={{
                      margin: '8px 0',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                  <Text type="secondary">
                    AI Style: {musicData.ai_metadata.style}
                  </Text>
                  <Text type="secondary">
                    Mood: {musicData.ai_metadata.mood}
                  </Text>
                  <Text type="secondary">
                    Complexity:{' '}
                    {(musicData.ai_metadata.complexity * 100).toFixed(0)}%
                  </Text>
                </>
              )}
            </div>
          )}
        </Space>
      </div>

      {/* Music Info Modal */}
      <Modal
        isOpen={showMusicInfoModal}
        onClose={() => setShowMusicInfoModal(false)}
        title="Music Information Details"
      >
        {musicData && (
          <div className="music-info-modal">
            <div className="music-info-section">
              <h3>Basic Information</h3>
              <div className="music-info-grid">
                <div className="info-row">
                  <span className="info-label">Tempo:</span>
                  <span className="info-value">{musicData.tempo} BPM</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Scale Type:</span>
                  <span className="info-value">{musicData.scale_type}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Root Note:</span>
                  <span className="info-value">
                    {getNoteNameFromMidi(musicData.root_note)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">
                    {((musicData.melody.length * 60) / musicData.tempo).toFixed(
                      1
                    )}{' '}
                    seconds
                  </span>
                </div>
              </div>
            </div>

            <div className="music-info-section">
              <h3>Physics Influence</h3>
              <div className="music-info-grid">
                <div className="info-row">
                  <span className="info-label">Gravity:</span>
                  <span className="info-value">
                    {musicData.physics_influence.gravity.toFixed(2)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Temperature:</span>
                  <span className="info-value">
                    {musicData.physics_influence.temperature.toFixed(2)}
                  </span>
                </div>
                {musicData.physics_influence.pressure && (
                  <div className="info-row">
                    <span className="info-label">Pressure:</span>
                    <span className="info-value">
                      {musicData.physics_influence.pressure.toFixed(2)}
                    </span>
                  </div>
                )}
                {musicData.physics_influence.elasticity && (
                  <div className="info-row">
                    <span className="info-label">Elasticity:</span>
                    <span className="info-value">
                      {musicData.physics_influence.elasticity.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {musicData.ai_metadata && (
              <div className="music-info-section">
                <h3>AI Enhancement Details</h3>
                <div className="music-info-grid">
                  <div className="info-row">
                    <span className="info-label">AI Style:</span>
                    <span className="info-value">
                      {musicData.ai_metadata.style}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Mood:</span>
                    <span className="info-value">
                      {musicData.ai_metadata.mood}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Complexity:</span>
                    <span className="info-value">
                      {(musicData.ai_metadata.complexity * 100).toFixed(0)}%
                    </span>
                  </div>
                  {musicData.ai_metadata.harmony_level && (
                    <div className="info-row">
                      <span className="info-label">Harmony Level:</span>
                      <span className="info-value">
                        {musicData.ai_metadata.harmony_level}
                      </span>
                    </div>
                  )}
                  {musicData.ai_metadata.description && (
                    <div className="info-row description">
                      <span className="info-label">AI Description:</span>
                      <span className="info-value">
                        {musicData.ai_metadata.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="music-info-section">
              <h3>Melody Structure</h3>
              <div className="melody-preview">
                {musicData.melody.slice(0, 10).map((note, index) => (
                  <div key={index} className="note-preview">
                    <span className="note-name">
                      {getNoteNameFromMidi(note.note)}
                    </span>
                    <span className="note-duration">{note.duration}</span>
                  </div>
                ))}
                {musicData.melody.length > 10 && (
                  <div className="more-notes">
                    ... and {musicData.melody.length - 10} more notes
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default MusicPlayer;
