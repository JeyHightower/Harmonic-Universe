import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import Input from "../common/Input";
import Modal from "../common/Modal";
import Select from "../common/Select";
import Slider from "../common/Slider";
import Spinner from "../common/Spinner";
import "../../styles/Modal.css";
import * as Tone from "tone";

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
const AudioGenerationModalFinal = ({
  universeId,
  sceneId,
  initialData,
  onClose,
  modalProps = {},
  isGlobalModal = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioId, setAudioId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    algorithm: "harmonic_synthesis",
    duration: 10,
    tempo: 120,
    scale: "major",
    key: "C",
    parameters: {
      harmonicity: 1.0,
      modulation_index: 3.0,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.5,
      release: 0.8,
      reverb_amount: 0.3,
      delay_time: 0.4,
      delay_feedback: 0.2,
    },
  });

  useEffect(() => {
    // Initialize form with initial data if available (for editing)
    if (initialData) {
      setFormData({
        ...initialData,
        parameters: initialData.parameters || formData.parameters,
      });
      if (initialData.audio_url) {
        setAudioUrl(initialData.audio_url);
      }
      if (initialData.id) {
        setAudioId(initialData.id);
      }
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParameterChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [name]: value,
      },
    }));
  };

  const handleAlgorithmChange = (value) => {
    // Reset parameters based on selected algorithm
    const defaultParams = {
      harmonic_synthesis: {
        harmonicity: 1.0,
        modulation_index: 3.0,
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8,
        reverb_amount: 0.3,
        delay_time: 0.4,
        delay_feedback: 0.2,
      },
      granular_synthesis: {
        grain_size: 0.1,
        grain_spacing: 0.2,
        position: 0.5,
        spread: 0.2,
        density: 50,
        reverb_amount: 0.4,
      },
      physical_modeling: {
        stiffness: 0.8,
        damping: 0.2,
        resonance: 0.7,
        position: 0.5,
        excitation: 0.6,
      },
    };

    setFormData((prev) => ({
      ...prev,
      algorithm: value,
      parameters: defaultParams[value] || {},
    }));
  };

  const generatePreview = async () => {
    setGenerating(true);
    setError(null);
    try {
      // Use our new music generation endpoint
      const url = `/api/universes/${universeId}/generate-music`;
      
      // Build query parameters for custom configuration
      let queryParams = '';
      if (formData.algorithm === 'harmonic_synthesis') {
        // Only include custom parameters if using the harmonic synthesis algorithm
        const customParams = {
          tempo: formData.tempo,
          scale_type: formData.scale,
          root_note: formData.key,
          melody_complexity: formData.parameters.modulation_index / 10 // Scale to 0-1 range
        };
        
        queryParams = `?custom_params=${encodeURIComponent(JSON.stringify(customParams))}`;
      }
      
      // Make API request
      const response = await fetch(url + queryParams);
      const data = await response.json();
      
      if (data.music_data) {
        // Store the resulting audio URL or ID
        if (data.audio_url) {
          setAudioUrl(data.audio_url);
        }
        
        // Store generated music data for later use
        setFormData(prev => ({
          ...prev,
          generated_data: data.music_data
        }));
        
        // Play the generated music immediately
        if (data.music_data.notes) {
          playGeneratedMusic(data.music_data);
        }
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Failed to generate audio preview");
      }
    } catch (err) {
      console.error("Error generating audio preview:", err);
      setError(err.message || "Failed to generate audio preview");
    } finally {
      setGenerating(false);
    }
  };

  // Function to play generated music using Tone.js
  const playGeneratedMusic = async (musicData) => {
    try {
      // Make sure Tone.js is initialized
      if (Tone.context.state !== "running") {
        await Tone.start();
      }

      // Create a polyphonic synth if it doesn't exist
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      
      // Set the tempo based on music data
      Tone.Transport.bpm.value = musicData.tempo || 120;
      
      // Stop any currently playing sequences
      Tone.Transport.cancel();
      
      // Create a new sequence with the notes from the music data
      const sequence = new Tone.Sequence(
        (time, note) => {
          if (note) {
            synth.triggerAttackRelease(
              Tone.Frequency(note.midi, "midi").toFrequency(),
              note.duration || "8n",
              time,
              note.velocity || 0.8
            );
          }
        },
        musicData.notes,
        "8n"
      );
      
      // Start the sequence
      sequence.start(0);
      Tone.Transport.start();
      
      // Store references for cleanup
      return { synth, sequence };
    } catch (error) {
      console.error("Error playing generated music:", error);
      setError("Failed to play music. " + error.message);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we have generated music data
      if (!formData.generated_data) {
        setError("Please generate a preview first");
        setLoading(false);
        return;
      }

      // Create the payload with required data
      const payload = {
        name: formData.name,
        description: formData.description || '',
        universe_id: universeId,
        scene_id: sceneId || null,
        music_data: formData.generated_data,
        settings: {
          algorithm: formData.algorithm,
          tempo: formData.tempo,
          scale: formData.scale,
          key: formData.key,
          parameters: formData.parameters
        }
      };

      // Save the generated music using our new endpoint
      const saveUrl = `/api/universes/${universeId}/save-music`;
      
      const response = await fetch(saveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.id || data.success) {
        // Success - close the modal and navigate if needed
        onClose?.();
        if (!isGlobalModal && data.id) {
          // Navigate to audio details if needed
          navigate(
            `/universes/${universeId}/scenes/${sceneId}/audio/${data.id}`
          );
        }
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Failed to save audio");
      }
    } catch (err) {
      console.error("Error saving audio:", err);
      setError(err.message || "Failed to save audio");
    } finally {
      setLoading(false);
    }
  };

  const renderParameterControls = () => {
    const { algorithm } = formData;

    switch (algorithm) {
      case "harmonic_synthesis":
        return (
          <div className="parameters-fieldset">
            <legend>Harmonic Synthesis Parameters</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="harmonicity">Harmonicity</label>
                <Slider
                  id="harmonicity"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={formData.parameters.harmonicity}
                  onChange={(value) =>
                    handleParameterChange("harmonicity", value)
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="modulation_index">Modulation Index</label>
                <Slider
                  id="modulation_index"
                  min={0}
                  max={10}
                  step={0.1}
                  value={formData.parameters.modulation_index}
                  onChange={(value) =>
                    handleParameterChange("modulation_index", value)
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="attack">Attack (s)</label>
                <Slider
                  id="attack"
                  min={0.001}
                  max={2}
                  step={0.001}
                  value={formData.parameters.attack}
                  onChange={(value) => handleParameterChange("attack", value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="decay">Decay (s)</label>
                <Slider
                  id="decay"
                  min={0.001}
                  max={2}
                  step={0.001}
                  value={formData.parameters.decay}
                  onChange={(value) => handleParameterChange("decay", value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sustain">Sustain</label>
                <Slider
                  id="sustain"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.sustain}
                  onChange={(value) => handleParameterChange("sustain", value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="release">Release (s)</label>
                <Slider
                  id="release"
                  min={0.001}
                  max={5}
                  step={0.001}
                  value={formData.parameters.release}
                  onChange={(value) => handleParameterChange("release", value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reverb_amount">Reverb Amount</label>
                <Slider
                  id="reverb_amount"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.reverb_amount}
                  onChange={(value) =>
                    handleParameterChange("reverb_amount", value)
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="delay_time">Delay Time (s)</label>
                <Slider
                  id="delay_time"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.delay_time}
                  onChange={(value) =>
                    handleParameterChange("delay_time", value)
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="delay_feedback">Delay Feedback</label>
              <Slider
                id="delay_feedback"
                min={0}
                max={0.9}
                step={0.01}
                value={formData.parameters.delay_feedback}
                onChange={(value) =>
                  handleParameterChange("delay_feedback", value)
                }
              />
            </div>
          </div>
        );

      case "granular_synthesis":
        return (
          <div className="parameters-fieldset">
            <legend>Granular Synthesis Parameters</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grain_size">Grain Size (s)</label>
                <Slider
                  id="grain_size"
                  min={0.01}
                  max={1}
                  step={0.01}
                  value={formData.parameters.grain_size}
                  onChange={(value) =>
                    handleParameterChange("grain_size", value)
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="grain_spacing">Grain Spacing (s)</label>
                <Slider
                  id="grain_spacing"
                  min={0.01}
                  max={1}
                  step={0.01}
                  value={formData.parameters.grain_spacing}
                  onChange={(value) =>
                    handleParameterChange("grain_spacing", value)
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <Slider
                  id="position"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.position}
                  onChange={(value) => handleParameterChange("position", value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="spread">Spread</label>
                <Slider
                  id="spread"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.spread}
                  onChange={(value) => handleParameterChange("spread", value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="density">Density</label>
                <Slider
                  id="density"
                  min={1}
                  max={100}
                  step={1}
                  value={formData.parameters.density}
                  onChange={(value) => handleParameterChange("density", value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reverb_amount">Reverb Amount</label>
                <Slider
                  id="reverb_amount"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.reverb_amount}
                  onChange={(value) =>
                    handleParameterChange("reverb_amount", value)
                  }
                />
              </div>
            </div>
          </div>
        );

      case "physical_modeling":
        return (
          <div className="parameters-fieldset">
            <legend>Physical Modeling Parameters</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="stiffness">Stiffness</label>
                <Slider
                  id="stiffness"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={formData.parameters.stiffness}
                  onChange={(value) =>
                    handleParameterChange("stiffness", value)
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="damping">Damping</label>
                <Slider
                  id="damping"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.damping}
                  onChange={(value) => handleParameterChange("damping", value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="resonance">Resonance</label>
                <Slider
                  id="resonance"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.resonance}
                  onChange={(value) =>
                    handleParameterChange("resonance", value)
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <Slider
                  id="position"
                  min={0}
                  max={1}
                  step={0.01}
                  value={formData.parameters.position}
                  onChange={(value) => handleParameterChange("position", value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="excitation">Excitation</label>
              <Slider
                id="excitation"
                min={0}
                max={1}
                step={0.01}
                value={formData.parameters.excitation}
                onChange={(value) => handleParameterChange("excitation", value)}
              />
            </div>
          </div>
        );

      default:
        return <p>Select an algorithm to view parameters</p>;
    }
  };

  const renderAudioPreview = () => {
    if (!audioUrl) return null;

    return (
      <div className="audio-player">
        <h3>Preview</h3>
        <audio controls src={audioUrl} style={{ width: "100%" }}>
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  };

  return (
    <Modal
      title={initialData ? "Edit Audio" : "Generate Audio"}
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
              { value: "harmonic_synthesis", label: "Harmonic Synthesis" },
              { value: "granular_synthesis", label: "Granular Synthesis" },
              { value: "physical_modeling", label: "Physical Modeling" },
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
          <label htmlFor="tempo">Tempo (BPM)</label>
          <Input
            id="tempo"
            name="tempo"
            type="number"
            min={40}
            max={240}
            value={formData.tempo}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="key">Key</label>
          <Select
            id="key"
            value={formData.key}
            onChange={(value) =>
              handleInputChange({ target: { name: "key", value } })
            }
            options={[
              { value: "C", label: "C" },
              { value: "C#", label: "C#" },
              { value: "D", label: "D" },
              { value: "D#", label: "D#" },
              { value: "E", label: "E" },
              { value: "F", label: "F" },
              { value: "F#", label: "F#" },
              { value: "G", label: "G" },
              { value: "G#", label: "G#" },
              { value: "A", label: "A" },
              { value: "A#", label: "A#" },
              { value: "B", label: "B" },
            ]}
          />
        </div>
        <div className="form-group">
          <label htmlFor="scale">Scale</label>
          <Select
            id="scale"
            value={formData.scale}
            onChange={(value) =>
              handleInputChange({ target: { name: "scale", value } })
            }
            options={[
              { value: "major", label: "Major" },
              { value: "minor", label: "Minor" },
              { value: "harmonic_minor", label: "Harmonic Minor" },
              { value: "melodic_minor", label: "Melodic Minor" },
              { value: "dorian", label: "Dorian" },
              { value: "phrygian", label: "Phrygian" },
              { value: "lydian", label: "Lydian" },
              { value: "mixolydian", label: "Mixolydian" },
              { value: "locrian", label: "Locrian" },
              { value: "pentatonic_major", label: "Pentatonic Major" },
              { value: "pentatonic_minor", label: "Pentatonic Minor" },
              { value: "blues", label: "Blues" },
            ]}
          />
        </div>
      </div>

      {renderParameterControls()}

      {renderAudioPreview()}

      <div className="form-actions">
        <Button
          onClick={generatePreview}
          variant="secondary"
          disabled={generating || loading}
        >
          {generating ? (
            <>
              <Spinner size="small" /> Generating...
            </>
          ) : (
            "Generate Preview"
          )}
        </Button>
        <Button onClick={onClose} variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="primary" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="small" /> Saving...
            </>
          ) : initialData ? (
            "Update"
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </Modal>
  );
};

AudioGenerationModalFinal.propTypes = {
  universeId: PropTypes.string.isRequired,
  sceneId: PropTypes.string.isRequired,
  initialData: PropTypes.object,
  onClose: PropTypes.func,
  modalProps: PropTypes.object,
  isGlobalModal: PropTypes.bool,
};

AudioGenerationModalFinal.defaultProps = {
  initialData: null,
  onClose: () => {},
  modalProps: {},
  isGlobalModal: false,
};

export default AudioGenerationModalFinal; 