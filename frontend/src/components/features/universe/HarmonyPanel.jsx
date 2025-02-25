import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateHarmonyParams } from '../../../store/thunks/universeThunks';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import './Universe.css';

const DEFAULT_HARMONY_PARAMS = {
  resonance: {
    value: 1.0,
    min: 0,
    max: 1,
    warning_threshold: 0.2,
  },
  dissonance: {
    value: 0.0,
    min: 0,
    max: 1,
    warning_threshold: 0.2,
  },
  harmony_scale: {
    value: 1.0,
    min: 0,
    max: 2,
    warning_threshold: 0.2,
  },
  balance: {
    value: 0.5,
    min: 0,
    max: 1,
    warning_threshold: 0.1,
  },
  tempo: {
    value: 120,
    unit: 'bpm',
    min: 60,
    max: 200,
    warning_threshold: 10,
  },
  key: {
    value: 'C',
    options: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab'],
  },
  scale: {
    value: 'major',
    options: [
      'major',
      'minor',
      'harmonic_minor',
      'melodic_minor',
      'pentatonic',
    ],
  },
  instruments: {
    primary: 'piano',
    secondary: ['strings', 'pad'],
    options: ['piano', 'strings', 'pad', 'bass', 'drums', 'synth'],
  },
};

function HarmonyPanel({
  universeId,
  initialHarmonyParams,
  readOnly = false,
  onHarmonyParamsChange,
}) {
  const dispatch = useDispatch();
  const [harmonyParams, setHarmonyParams] = useState(
    initialHarmonyParams || DEFAULT_HARMONY_PARAMS
  );
  const [selectedSecondary, setSelectedSecondary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  const status = useSelector(state => state.universes.status);
  const error = useSelector(state => state.universes.error);

  useEffect(() => {
    if (initialHarmonyParams) {
      setHarmonyParams(initialHarmonyParams);
    }
  }, [initialHarmonyParams]);

  useEffect(() => {
    if (status === 'succeeded' && isSubmitting) {
      setIsSubmitting(false);
      setHasChanges(false);
    }
  }, [status, isSubmitting]);

  const validateParameter = (name, value) => {
    if (typeof value === 'number') {
      const param = harmonyParams[name];
      if (value < param.min || value > param.max) {
        return `Value must be between ${param.min} and ${param.max}`;
      }

      // Check for warning threshold
      if (param.warning_threshold) {
        if (name === 'resonance' && value < param.warning_threshold) {
          return `Low resonance may produce weak harmonics`;
        }
        if (name === 'dissonance' && value > 1 - param.warning_threshold) {
          return `High dissonance may produce harsh sounds`;
        }
      }
    }
    return null;
  };

  const handleParameterChange = (name, value) => {
    let newValue = value;

    // Convert numeric strings to numbers
    if (!isNaN(value) && typeof value === 'string') {
      newValue = parseFloat(value);
    }

    const error = validateParameter(name, newValue);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));

    setHarmonyParams(prev => {
      const updated = { ...prev };

      // Handle special cases
      if (name === 'key' || name === 'scale') {
        updated[name].value = value;
      } else if (name === 'instruments.primary') {
        updated.instruments.primary = value;
      } else if (name === 'instruments.secondary.add') {
        if (value && !updated.instruments.secondary.includes(value)) {
          updated.instruments.secondary = [
            ...updated.instruments.secondary,
            value,
          ];
        }
      } else if (name === 'instruments.secondary.remove') {
        updated.instruments.secondary = updated.instruments.secondary.filter(
          instrument => instrument !== value
        );
      } else {
        // Handle standard numeric values
        updated[name].value = newValue;
      }

      return updated;
    });

    setHasChanges(true);

    if (onHarmonyParamsChange) {
      onHarmonyParamsChange(harmonyParams);
    }
  };

  const handleSubmit = async () => {
    if (Object.values(errors).some(error => error !== null)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(
        updateHarmonyParams({
          universeId,
          harmonyParams,
        })
      );
    } catch (error) {
      console.error('Error updating harmony parameters:', error);
      setIsSubmitting(false);
    }
  };

  const renderNumericInput = (name, label, showUnit = true) => {
    const param = harmonyParams[name];
    return (
      <div className="parameter-input">
        <label htmlFor={name}>{label}</label>
        <div className="input-with-unit">
          <Input
            id={name}
            type="number"
            value={param.value}
            onChange={e => handleParameterChange(name, e.target.value)}
            min={param.min}
            max={param.max}
            step="0.01"
            disabled={readOnly}
            error={errors[name]}
          />
          {showUnit && param.unit && <span className="unit">{param.unit}</span>}
        </div>
        {errors[name] && <div className="error-message">{errors[name]}</div>}
      </div>
    );
  };

  const renderSelectInput = (name, label, options) => {
    const param = harmonyParams[name];
    return (
      <div className="parameter-input">
        <label htmlFor={name}>{label}</label>
        <Select
          id={name}
          value={param.value}
          onChange={e => handleParameterChange(name, e.target.value)}
          disabled={readOnly}
        >
          {param.options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
    );
  };

  const renderInstrumentsSection = () => {
    const { instruments } = harmonyParams;
    return (
      <div className="parameter-section">
        <h3>Instruments</h3>

        <div className="parameter-input">
          <label htmlFor="instruments.primary">Primary Instrument</label>
          <Select
            id="instruments.primary"
            value={instruments.primary}
            onChange={e =>
              handleParameterChange('instruments.primary', e.target.value)
            }
            disabled={readOnly}
          >
            {instruments.options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div className="parameter-input">
          <label>Secondary Instruments</label>
          <div className="secondary-instruments">
            {instruments.secondary.map(instrument => (
              <div key={instrument} className="secondary-instrument">
                {instrument}
                {!readOnly && (
                  <button
                    type="button"
                    className="remove-instrument"
                    onClick={() =>
                      handleParameterChange(
                        'instruments.secondary.remove',
                        instrument
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {!readOnly && (
          <div className="add-instrument">
            <Select
              value={selectedSecondary}
              onChange={e => setSelectedSecondary(e.target.value)}
            >
              <option value="">Add instrument...</option>
              {instruments.options
                .filter(
                  option =>
                    !instruments.secondary.includes(option) &&
                    option !== instruments.primary
                )
                .map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
            </Select>
            <Button
              onClick={() => {
                if (selectedSecondary) {
                  handleParameterChange(
                    'instruments.secondary.add',
                    selectedSecondary
                  );
                  setSelectedSecondary('');
                }
              }}
              disabled={!selectedSecondary}
            >
              Add
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="harmony-panel">
      <h2>Music Parameters</h2>

      <div className="parameters-container">
        <div className="parameter-section">
          <h3>Harmony Controls</h3>
          {renderNumericInput('resonance', 'Resonance', false)}
          {renderNumericInput('dissonance', 'Dissonance', false)}
          {renderNumericInput('harmony_scale', 'Harmony Scale', false)}
          {renderNumericInput('balance', 'Balance', false)}
        </div>

        <div className="parameter-section">
          <h3>Music Basics</h3>
          {renderNumericInput('tempo', 'Tempo')}
          {renderSelectInput('key', 'Key')}
          {renderSelectInput('scale', 'Scale')}
        </div>

        {renderInstrumentsSection()}
      </div>

      {!readOnly && (
        <div className="panel-actions">
          <Button
            primary
            onClick={handleSubmit}
            disabled={
              !hasChanges ||
              isSubmitting ||
              Object.values(errors).some(error => error !== null)
            }
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>

          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </div>
  );
}

export default HarmonyPanel;
