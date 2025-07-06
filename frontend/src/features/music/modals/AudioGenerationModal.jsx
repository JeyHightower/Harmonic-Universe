import PropTypes from 'prop-types';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Slider from '../../../components/common/Slider.jsx';
import Spinner from '../../../components/common/Spinner.jsx';
import { audioService } from '../../../services';
import '../../../styles/Modal.css';
import { initializeAudioContext } from '../../../utils/audioManager';

const ModalSystem = lazy(() => import('../../../components/modals/ModalSystem'));

/**
 * Modal for generating audio based on the physics of a universe and scene.
 * @param {Object} props - Component props
 * @param {string} props.universeId - ID of the universe
 * @param {string} props.sceneId - ID of the scene
 * @param {Object} props.initialData - Initial data for the modal
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Object} props.modalProps - Props for the Modal component
 * @param {boolean} props.isGlobalModal - Whether this modal is opened globally
 */
const AudioGenerationModal = ({
  universeId,
  sceneId,
  initialData,
  onClose,
  modalProps = {},
  isGlobalModal = false,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    algorithm: 'harmonic_synthesis',
    duration: 30,
    key: 'C',
    scale: 'major',
    parameters: {
      // Harmonic Synthesis parameters
      amplitude: 0.5,
      frequency: 440,
      harmonics: 8,
      attack: 0.1,
      decay: 0.2,
      sustain: 0.7,
      release: 0.5,

      // Granular Synthesis parameters
      grain_size: 0.1,
      grain_overlap: 0.5,
      grain_randomization: 0.2,

      // Physical Modeling parameters
      stiffness: 0.5,
      mass: 1.0,
      damping: 0.2,
      tension: 0.7,
    },
    ...initialData,
  });

  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(initialData?.id ? true : false);
  const audioPlayer = useRef(null);
  const synthRef = useRef(null);

  // Initialize Tone.js
  useEffect(() => {
    // Clean up if component is unmounted during playback
    return () => {
      const synth = synthRef.current;
      if (synth) {
        synth.dispose();
      }
      // Clean up Tone.js if it was loaded
      const cleanup = async () => {
        try {
          const Tone = await import('tone');
          if (Tone.Transport.state === 'started') {
            Tone.Transport.stop();
          }
        } catch (error) {
          // Tone wasn't loaded, nothing to clean up
        }
      };
      cleanup();
    };
  }, []);

  // Fetch audio data if editing
  useEffect(() => {
    const fetchAudioData = async () => {
      if (initialData?.id) {
        try {
          setIsLoading(true);
          const response = await audioService.getAudio(universeId, sceneId, initialData.id);
          if (response.success) {
            setFormData({
              ...formData,
              ...response.data,
            });
            if (response.data.audio_url) {
              setAudioUrl(response.data.audio_url);
            }
          } else {
            throw new Error(response.message || 'Failed to load audio data');
          }
        } catch (error) {
          console.error('Error fetching audio:', error);
          setError('Failed to load audio data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAudioData();
  }, [initialData?.id, universeId, sceneId, formData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle algorithm change
  const handleAlgorithmChange = (e) => {
    setFormData({
      ...formData,
      algorithm: e.target.value,
    });
  };

  // Handle parameter changes
  const handleParameterChange = (parameter, value) => {
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        [parameter]: value,
      },
    });
  };

  // Generate audio based on current parameters
  const handleGenerate = async () => {
    setError('');
    setSuccessMessage('');
    setIsGenerating(true);

    try {
      // Track user gesture before attempting to initialize audio
      if (typeof window !== 'undefined') {
        // First, ensure we track this as a user gesture
        if (window.audioManager) {
          window.audioManager.trackUserGesture();
        } else if (window.__AUDIO_MANAGER) {
          window.__AUDIO_MANAGER.userGestureTimestamp = Date.now();
        }

        // Set a global flag that can be used by other components
        window.__AUDIO_USER_GESTURE_TIMESTAMP = Date.now();
      }

      // Wait briefly to ensure the user gesture is recognized
      await new Promise((resolve) => setTimeout(resolve, 10));

      // If audio is already initializing elsewhere, wait for it to complete
      // rather than attempting a competing initialization
      if (window.audioManager?.isInitializing()) {
        console.log('Waiting for existing audio initialization to complete...');

        // Create a waiting promise with timeout
        const waitForInit = new Promise((resolve) => {
          const startTime = Date.now();
          const MAX_WAIT_TIME = 3000; // 3 seconds max wait

          const checkInterval = setInterval(() => {
            // Stop waiting if initialization completes or times out
            if (window.audioManager?.isInitialized() || Date.now() - startTime > MAX_WAIT_TIME) {
              clearInterval(checkInterval);
              resolve(window.audioManager?.isInitialized() || false);
            }
          }, 100);
        });

        // Wait for existing initialization to complete
        const initSuccess = await waitForInit;
        if (!initSuccess) {
          console.warn('Timed out waiting for audio initialization, proceeding anyway');
        }
      }

      // Safely initialize audio context
      console.log('Attempting to initialize audio context...');
      let contextInitialized = false;

      try {
        // First try our managed approach
        contextInitialized = await initializeAudioContext();
      } catch (initError) {
        console.warn('Error during managed audio initialization:', initError);
      }

      // If managed initialization failed, try direct Tone.js approach
      if (!contextInitialized) {
        console.log('Managed initialization failed, trying Tone.js directly');
        try {
          // Dynamically import Tone.js only when needed
          const Tone = await import('tone');

          // Try to start Tone.js directly - we're definitely in a user gesture context here
          if (Tone.context && Tone.context.state !== 'running') {
            try {
              await Tone.start();
              console.log('AudioContext started directly via Tone.start()');
              contextInitialized = true;
            } catch (toneStartError) {
              console.warn('Failed to start via Tone.start():', toneStartError);

              // Try resume as a fallback
              try {
                await Tone.context.resume();
                console.log('AudioContext resumed via Tone.context.resume()');
                contextInitialized = true;
              } catch (resumeError) {
                console.warn('Failed to resume Tone context:', resumeError);
              }
            }
          } else if (Tone.context && Tone.context.state === 'running') {
            // Context is already running
            console.log('AudioContext already in running state');
            contextInitialized = true;
          }
        } catch (toneError) {
          console.warn('Failed to initialize via Tone.js:', toneError);
        }
      }

      // Last ditch effort - try playing a silent sound
      if (!contextInitialized) {
        try {
          console.log('Using fallback silent sound technique');
          const tempContext = new (window.AudioContext || window.webkitAudioContext)();
          const buffer = tempContext.createBuffer(1, 1, 22050);
          const source = tempContext.createBufferSource();
          source.buffer = buffer;
          source.connect(tempContext.destination);
          source.start(0);
          await tempContext.resume();

          // We don't close this context as it might be needed for the actual generation
          console.log('Successfully unlocked audio via silent sound');
          contextInitialized = true;
        } catch (silentSoundError) {
          console.warn('Silent sound technique failed:', silentSoundError);
        }
      }

      // Log the result of our initialization attempts
      console.log(
        `Audio context initialization ${contextInitialized ? 'succeeded' : 'may have failed'}, proceeding with generation attempt...`
      );

      // Generate audio using the API
      const response = await audioService.generateAudio(universeId, sceneId, {
        algorithm: formData.algorithm,
        duration: formData.duration,
        key: formData.key,
        scale: formData.scale,
        parameters: formData.parameters,
      });

      if (response.success) {
        setAudioUrl(response.data.audio_url);
        setSuccessMessage('Audio generated successfully!');

        // Play the audio automatically
        window.setTimeout(() => {
          if (audioPlayer.current) {
            audioPlayer.current.load();
            audioPlayer.current
              .play()
              .then(() => setIsPlaying(true))
              .catch((e) => {
                console.error('Error playing audio', e);
                // If autoplay fails, don't show an error to the user
                // as this is likely due to browser autoplay restrictions
              });
          }
        }, 500);
      } else {
        throw new Error(response.message || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      setError('Failed to generate audio. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the generated audio
  const handleSave = async () => {
    if (!audioUrl) {
      setError('Please generate audio before saving');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please provide a name for the audio');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const saveData = {
        name: formData.name,
        description: formData.description,
        algorithm: formData.algorithm,
        duration: formData.duration,
        key: formData.key,
        scale: formData.scale,
        parameters: formData.parameters,
        audio_url: audioUrl,
      };

      const response = await audioService.saveAudio(universeId, sceneId, saveData, initialData?.id);

      if (response.success) {
        setSuccessMessage('Audio saved successfully!');
        window.setTimeout(() => {
          if (isGlobalModal) {
            // Navigate to the scene page
            navigate(`/universes/${universeId}/scenes/${sceneId}`);
          } else {
            // Return to the parent component with the saved audio
            onClose({ action: 'save', audio: response.data });
          }
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to save audio');
      }
    } catch (error) {
      console.error('Error saving audio:', error);
      setError('Failed to save audio. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Play/pause the generated audio
  const handlePlayPause = () => {
    if (audioPlayer.current) {
      if (isPlaying) {
        audioPlayer.current.pause();
      } else {
        audioPlayer.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Render algorithm-specific parameters
  const renderAlgorithmParameters = () => {
    switch (formData.algorithm) {
      case 'harmonic_synthesis':
        return (
          <div className="parameters-section">
            <h3>Harmonic Synthesis Parameters</h3>

            <div className="parameter-row">
              <label>Amplitude</label>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={formData.parameters.amplitude}
                onChange={(value) => handleParameterChange('amplitude', value)}
              />
              <span>{formData.parameters.amplitude.toFixed(2)}</span>
            </div>

            <div className="parameter-row">
              <label>Frequency (Hz)</label>
              <Slider
                min={20}
                max={1000}
                step={1}
                value={formData.parameters.frequency}
                onChange={(value) => handleParameterChange('frequency', value)}
              />
              <span>{Math.round(formData.parameters.frequency)} Hz</span>
            </div>

            <div className="parameter-row">
              <label>Harmonics</label>
              <Slider
                min={1}
                max={16}
                step={1}
                value={formData.parameters.harmonics}
                onChange={(value) => handleParameterChange('harmonics', value)}
              />
              <span>{Math.round(formData.parameters.harmonics)}</span>
            </div>

            <div className="parameter-row">
              <label>Attack (s)</label>
              <Slider
                min={0.01}
                max={2}
                step={0.01}
                value={formData.parameters.attack}
                onChange={(value) => handleParameterChange('attack', value)}
              />
              <span>{formData.parameters.attack.toFixed(2)} s</span>
            </div>

            <div className="parameter-row">
              <label>Decay (s)</label>
              <Slider
                min={0.01}
                max={2}
                step={0.01}
                value={formData.parameters.decay}
                onChange={(value) => handleParameterChange('decay', value)}
              />
              <span>{formData.parameters.decay.toFixed(2)} s</span>
            </div>

            <div className="parameter-row">
              <label>Sustain</label>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={formData.parameters.sustain}
                onChange={(value) => handleParameterChange('sustain', value)}
              />
              <span>{formData.parameters.sustain.toFixed(2)}</span>
            </div>

            <div className="parameter-row">
              <label>Release (s)</label>
              <Slider
                min={0.01}
                max={5}
                step={0.01}
                value={formData.parameters.release}
                onChange={(value) => handleParameterChange('release', value)}
              />
              <span>{formData.parameters.release.toFixed(2)} s</span>
            </div>
          </div>
        );

      case 'granular_synthesis':
        return (
          <div className="parameters-section">
            <h3>Granular Synthesis Parameters</h3>

            <div className="parameter-row">
              <label>Grain Size (s)</label>
              <Slider
                min={0.01}
                max={1}
                step={0.01}
                value={formData.parameters.grain_size}
                onChange={(value) => handleParameterChange('grain_size', value)}
              />
              <span>{formData.parameters.grain_size.toFixed(2)} s</span>
            </div>

            <div className="parameter-row">
              <label>Grain Overlap</label>
              <Slider
                min={0}
                max={0.9}
                step={0.01}
                value={formData.parameters.grain_overlap}
                onChange={(value) => handleParameterChange('grain_overlap', value)}
              />
              <span>{formData.parameters.grain_overlap.toFixed(2)}</span>
            </div>

            <div className="parameter-row">
              <label>Randomization</label>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={formData.parameters.grain_randomization}
                onChange={(value) => handleParameterChange('grain_randomization', value)}
              />
              <span>{formData.parameters.grain_randomization.toFixed(2)}</span>
            </div>
          </div>
        );

      case 'physical_modeling':
        return (
          <div className="parameters-section">
            <h3>Physical Modeling Parameters</h3>

            <div className="parameter-row">
              <label>Stiffness</label>
              <Slider
                min={0.1}
                max={10}
                step={0.1}
                value={formData.parameters.stiffness}
                onChange={(value) => handleParameterChange('stiffness', value)}
              />
              <span>{formData.parameters.stiffness.toFixed(1)}</span>
            </div>

            <div className="parameter-row">
              <label>Mass</label>
              <Slider
                min={0.1}
                max={10}
                step={0.1}
                value={formData.parameters.mass}
                onChange={(value) => handleParameterChange('mass', value)}
              />
              <span>{formData.parameters.mass.toFixed(1)}</span>
            </div>

            <div className="parameter-row">
              <label>Damping</label>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={formData.parameters.damping}
                onChange={(value) => handleParameterChange('damping', value)}
              />
              <span>{formData.parameters.damping.toFixed(2)}</span>
            </div>

            <div className="parameter-row">
              <label>Tension</label>
              <Slider
                min={0.1}
                max={2}
                step={0.01}
                value={formData.parameters.tension}
                onChange={(value) => handleParameterChange('tension', value)}
              />
              <span>{formData.parameters.tension.toFixed(2)}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModalSystem
        title={initialData ? 'Edit Audio' : 'Generate Audio'}
        onClose={onClose}
        {...modalProps}
      >
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Name</label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter a name for this audio"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe this audio (optional)"
            multiline
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="algorithm">Algorithm</label>
            <Select
              id="algorithm"
              value={formData.algorithm}
              onChange={handleAlgorithmChange}
              options={[
                { value: 'harmonic_synthesis', label: 'Harmonic Synthesis' },
                { value: 'granular_synthesis', label: 'Granular Synthesis' },
                { value: 'physical_modeling', label: 'Physical Modeling' },
              ]}
            />
          </div>
          <div className="form-group">
            <label htmlFor="duration">Duration (seconds)</label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min={1}
              max={60}
              value={formData.duration}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="key">Key</label>
            <Select
              id="key"
              name="key"
              value={formData.key}
              onChange={handleInputChange}
              options={[
                { value: 'C', label: 'C' },
                { value: 'C#', label: 'C#' },
                { value: 'D', label: 'D' },
                { value: 'D#', label: 'D#' },
                { value: 'E', label: 'E' },
                { value: 'F', label: 'F' },
                { value: 'F#', label: 'F#' },
                { value: 'G', label: 'G' },
                { value: 'G#', label: 'G#' },
                { value: 'A', label: 'A' },
                { value: 'A#', label: 'A#' },
                { value: 'B', label: 'B' },
              ]}
            />
          </div>
          <div className="form-group">
            <label htmlFor="scale">Scale</label>
            <Select
              id="scale"
              name="scale"
              value={formData.scale}
              onChange={handleInputChange}
              options={[
                { value: 'major', label: 'Major' },
                { value: 'minor', label: 'Minor' },
                { value: 'harmonic_minor', label: 'Harmonic Minor' },
                { value: 'melodic_minor', label: 'Melodic Minor' },
                { value: 'pentatonic', label: 'Pentatonic' },
                { value: 'blues', label: 'Blues' },
                { value: 'dorian', label: 'Dorian' },
                { value: 'phrygian', label: 'Phrygian' },
                { value: 'lydian', label: 'Lydian' },
                { value: 'mixolydian', label: 'Mixolydian' },
                { value: 'locrian', label: 'Locrian' },
              ]}
            />
          </div>
        </div>

        {/* Render algorithm-specific parameters */}
        {renderAlgorithmParameters()}

        {/* Audio player */}
        {audioUrl && (
          <div className="audio-preview">
            <h3>Preview</h3>
            <audio
              ref={audioPlayer}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="audio-controls">
              <Button onClick={handlePlayPause} variant="outlined" color="primary">
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button onClick={() => window.open(audioUrl, '_blank')} variant="outlined">
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Success message */}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Action buttons */}
        <div className="modal-footer">
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>

          <div className="button-group">
            <Button
              onClick={handleGenerate}
              variant="outlined"
              color="primary"
              disabled={isGenerating || isSaving}
            >
              {isGenerating ? <Spinner size="small" /> : 'Generate'}
            </Button>

            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={!audioUrl || isGenerating || isSaving}
            >
              {isSaving ? <Spinner size="small" /> : 'Save'}
            </Button>
          </div>
        </div>
      </ModalSystem>
    </Suspense>
  );
};

AudioGenerationModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  sceneId: PropTypes.string.isRequired,
  initialData: PropTypes.object,
  onClose: PropTypes.func,
  modalProps: PropTypes.object,
  isGlobalModal: PropTypes.bool,
};

AudioGenerationModal.defaultProps = {
  initialData: null,
  onClose: () => {},
  modalProps: {},
  isGlobalModal: false,
};

export default AudioGenerationModal;
