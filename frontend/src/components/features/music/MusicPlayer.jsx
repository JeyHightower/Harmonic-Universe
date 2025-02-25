import {
  CaretRightOutlined,
  DownloadOutlined,
  PauseOutlined,
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
import { api, endpoints } from '../../../utils/api';
import './MusicPlayer.css';

const { Title, Text } = Typography;

const MusicPlayer = ({ universeId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [musicData, setMusicData] = useState(null);
  const [volume, setVolume] = useState(75);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [customParams, setCustomParams] = useState({
    tempo: 120,
    scale_type: 'major',
    root_note: 60,
    melody_complexity: 0.5,
  });

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

  // Generate music based on universe parameters
  const generateMusic = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop any currently playing music
      if (isPlaying) {
        Tone.Transport.stop();
        setIsPlaying(false);
      }

      // Prepare request parameters
      const params = {};

      // Add custom parameters if customization is enabled
      if (customizationEnabled) {
        params.custom_params = customParams;
      }

      // Get music data from API with optional custom parameters
      const response = await api.get(endpoints.music.generate(universeId), {
        params,
      });

      // The API returns { universe_id, music_data }, so we need to extract music_data
      const musicData = response.music_data;
      setMusicData(musicData);

      // Create a new sequence
      createMusicSequence(musicData);

      message.success('Music generated successfully');
    } catch (err) {
      console.error('Failed to generate music:', err);
      setError('Failed to generate music. Please try again.');
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

  return (
    <Card className="music-player">
      <Title level={4}>Universal Harmony</Title>

      <div className="visualization-container">
        <canvas
          ref={canvasRef}
          width="500"
          height="120"
          className="audio-visualizer"
        />
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
                </Form>
              </div>
            </Collapse.Panel>
          </Collapse>

          {musicData && (
            <div className="music-info">
              <Text type="secondary">Tempo: {musicData.tempo} BPM</Text>
              <Text type="secondary">Scale: {musicData.scale_type}</Text>
              <Text type="secondary">
                Physics Influence: Gravity{' '}
                {musicData.physics_influence.gravity.toFixed(2)}, Temperature{' '}
                {musicData.physics_influence.temperature.toFixed(2)}
              </Text>
            </div>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default MusicPlayer;
