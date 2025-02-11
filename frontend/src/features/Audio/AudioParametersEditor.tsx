import { Space } from 'antd';
import { useState } from 'react';
import { z } from 'zod';
import { combineRules, createValidator, formRules } from '../../../utils/validation';
import { BaseListEditor } from '../../common/ui/BaseListEditor';
import { BaseParameterEditor } from '../../common/ui/BaseParameterEditor';

// Define schemas for audio parameters
const audioTrackSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  volume: z.number().min(0, 'Volume must be positive').max(1, 'Volume cannot exceed 1'),
  pan: z.number().min(-1, 'Pan must be at least -1').max(1, 'Pan cannot exceed 1'),
  loop: z.boolean(),
  fadeIn: z.number().min(0, 'Fade in must be positive'),
  fadeOut: z.number().min(0, 'Fade out must be positive'),
});

const audioParametersSchema = z.object({
  masterVolume: z.number().min(0, 'Master volume must be positive').max(1, 'Master volume cannot exceed 1'),
  spatialAudio: z.boolean(),
  reverbLevel: z.number().min(0, 'Reverb must be positive').max(1, 'Reverb cannot exceed 1'),
  tracks: z.array(audioTrackSchema),
});

type AudioTrack = z.infer<typeof audioTrackSchema>;
type AudioParameters = z.infer<typeof audioParametersSchema>;

interface AudioParametersEditorProps {
  initialValues: AudioParameters;
  onSave: (parameters: AudioParameters) => Promise<void>;
  onCancel?: () => void;
}

const validateAudioParameters = createValidator(audioParametersSchema);

export function AudioParametersEditor({
  initialValues,
  onSave,
  onCancel,
}: AudioParametersEditorProps) {
  const [parameters, setParameters] = useState<AudioParameters>(initialValues);

  const globalFields = [
    {
      name: 'masterVolume',
      label: 'Master Volume',
      type: 'number',
      rules: combineRules(
        formRules.required('Master Volume'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Master volume must be between 0 and 1',
        }
      ),
    },
    {
      name: 'spatialAudio',
      label: 'Spatial Audio',
      type: 'switch',
    },
    {
      name: 'reverbLevel',
      label: 'Reverb Level',
      type: 'number',
      rules: combineRules(
        formRules.required('Reverb Level'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Reverb level must be between 0 and 1',
        }
      ),
    },
  ];

  const handleGlobalSave = async (values: Omit<AudioParameters, 'tracks'>) => {
    const newParameters = { ...parameters, ...values };
    const validationResult = validateAudioParameters(newParameters);
    if (!validationResult.success) {
      throw new Error('Invalid parameters');
    }
    setParameters(newParameters);
    await onSave(newParameters);
  };

  const handleAddTrack = () => {
    const newTrack: AudioTrack = {
      name: `Track ${parameters.tracks.length + 1}`,
      volume: 0.8,
      pan: 0,
      loop: false,
      fadeIn: 0,
      fadeOut: 0,
    };
    const newParameters = {
      ...parameters,
      tracks: [...parameters.tracks, newTrack],
    };
    setParameters(newParameters);
  };

  const handleRemoveTrack = (index: number) => {
    const newParameters = {
      ...parameters,
      tracks: parameters.tracks.filter((_, i) => i !== index),
    };
    setParameters(newParameters);
  };

  const handleEditTrack = (index: number, track: AudioTrack) => {
    const newParameters = {
      ...parameters,
      tracks: parameters.tracks.map((t, i) => i === index ? track : t),
    };
    setParameters(newParameters);
  };

  const renderTrack = (track: AudioTrack, index: number) => (
    <BaseParameterEditor
      initialValues={track}
      onSave={(values) => handleEditTrack(index, values as AudioTrack)}
      fields={[
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          rules: [formRules.required('Name')],
        },
        {
          name: 'volume',
          label: 'Volume',
          type: 'number',
          rules: combineRules(
            formRules.required('Volume'),
            {
              type: 'number',
              min: 0,
              max: 1,
              message: 'Volume must be between 0 and 1',
            }
          ),
        },
        {
          name: 'pan',
          label: 'Pan',
          type: 'number',
          rules: combineRules(
            formRules.required('Pan'),
            {
              type: 'number',
              min: -1,
              max: 1,
              message: 'Pan must be between -1 and 1',
            }
          ),
        },
        {
          name: 'loop',
          label: 'Loop',
          type: 'switch',
        },
        {
          name: 'fadeIn',
          label: 'Fade In (seconds)',
          type: 'number',
          rules: combineRules(
            formRules.required('Fade In'),
            {
              type: 'number',
              min: 0,
              message: 'Fade in must be positive',
            }
          ),
        },
        {
          name: 'fadeOut',
          label: 'Fade Out (seconds)',
          type: 'number',
          rules: combineRules(
            formRules.required('Fade Out'),
            {
              type: 'number',
              min: 0,
              message: 'Fade out must be positive',
            }
          ),
        },
      ]}
      validationSchema={audioTrackSchema}
    />
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <BaseParameterEditor
        title="Global Audio Parameters"
        initialValues={parameters}
        onSave={handleGlobalSave}
        onCancel={onCancel}
        fields={globalFields}
        validationSchema={audioParametersSchema}
      />

      <BaseListEditor
        title="Audio Tracks"
        items={parameters.tracks}
        onAdd={handleAddTrack}
        onRemove={handleRemoveTrack}
        onEdit={handleEditTrack}
        renderItem={renderTrack}
        itemName="track"
        maxItems={16}
      />
    </Space>
  );
}
