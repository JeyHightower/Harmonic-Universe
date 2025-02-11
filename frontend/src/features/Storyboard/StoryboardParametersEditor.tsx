import { Space } from 'antd';
import { useState } from 'react';
import { z } from 'zod';
import { combineRules, createValidator, formRules } from '../../../utils/validation';
import { BaseParameterEditor } from '../../common/ui/BaseParameterEditor';
import { BaseTimelineEditor, TimelineParameters } from '../../common/ui/BaseTimelineEditor';

// Define schema for storyboard parameters
const transitionSchema = z.object({
  type: z.enum(['fade', 'slide', 'zoom', 'none']),
  duration: z.number().min(0.1, 'Duration must be at least 0.1 seconds'),
  easing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),
});

const storyboardParametersSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  defaultTransition: transitionSchema,
  autoPlay: z.boolean(),
  loop: z.boolean(),
  showControls: z.boolean(),
  showProgress: z.boolean(),
  showThumbnails: z.boolean(),
  thumbnailSize: z.number().min(50, 'Thumbnail size must be at least 50px'),
  spacing: z.number().min(0, 'Spacing must be positive'),
  timeline: z.object({
    duration: z.number().min(0.1, 'Duration must be at least 0.1 seconds'),
    fps: z.number().min(1, 'FPS must be at least 1').max(120, 'FPS cannot exceed 120'),
    tracks: z.array(z.any()),
    currentTime: z.number(),
    loop: z.boolean(),
    autoPlay: z.boolean(),
  }),
});

type StoryboardParameters = z.infer<typeof storyboardParametersSchema>;

interface StoryboardParametersEditorProps {
  initialValues: StoryboardParameters;
  onSave: (parameters: StoryboardParameters) => Promise<void>;
  onCancel?: () => void;
}

const validateStoryboardParameters = createValidator(storyboardParametersSchema);

const KEYFRAME_TYPES = [
  { value: 'scene', label: 'Scene Change' },
  { value: 'camera', label: 'Camera Movement' },
  { value: 'transition', label: 'Transition Effect' },
  { value: 'audio', label: 'Audio Event' },
  { value: 'effect', label: 'Visual Effect' },
];

export function StoryboardParametersEditor({
  initialValues,
  onSave,
  onCancel,
}: StoryboardParametersEditorProps) {
  const [parameters, setParameters] = useState<StoryboardParameters>(initialValues);

  const handleTimelineSave = async (timelineParams: TimelineParameters) => {
    const newParameters = {
      ...parameters,
      timeline: timelineParams,
    };
    setParameters(newParameters);
  };

  const fields = [
    {
      name: 'name',
      label: 'Storyboard Name',
      type: 'text',
      rules: [formRules.required('Name')],
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
    },
    // Default transition parameters
    {
      name: ['defaultTransition', 'type'],
      label: 'Default Transition Type',
      type: 'select',
      options: [
        { value: 'fade', label: 'Fade' },
        { value: 'slide', label: 'Slide' },
        { value: 'zoom', label: 'Zoom' },
        { value: 'none', label: 'None' },
      ],
      rules: [formRules.required('Transition Type')],
    },
    {
      name: ['defaultTransition', 'duration'],
      label: 'Default Transition Duration',
      type: 'number',
      rules: combineRules(
        formRules.required('Duration'),
        {
          type: 'number',
          min: 0.1,
          message: 'Duration must be at least 0.1 seconds',
        }
      ),
    },
    {
      name: ['defaultTransition', 'easing'],
      label: 'Default Transition Easing',
      type: 'select',
      options: [
        { value: 'linear', label: 'Linear' },
        { value: 'easeIn', label: 'Ease In' },
        { value: 'easeOut', label: 'Ease Out' },
        { value: 'easeInOut', label: 'Ease In Out' },
      ],
      rules: [formRules.required('Easing')],
    },
    // Playback settings
    {
      name: 'autoPlay',
      label: 'Auto Play',
      type: 'switch',
    },
    {
      name: 'loop',
      label: 'Loop Playback',
      type: 'switch',
    },
    // UI settings
    {
      name: 'showControls',
      label: 'Show Controls',
      type: 'switch',
    },
    {
      name: 'showProgress',
      label: 'Show Progress',
      type: 'switch',
    },
    {
      name: 'showThumbnails',
      label: 'Show Thumbnails',
      type: 'switch',
    },
    {
      name: 'thumbnailSize',
      label: 'Thumbnail Size',
      type: 'number',
      rules: combineRules(
        formRules.required('Thumbnail Size'),
        {
          type: 'number',
          min: 50,
          message: 'Thumbnail size must be at least 50px',
        }
      ),
    },
    {
      name: 'spacing',
      label: 'Spacing',
      type: 'number',
      rules: combineRules(
        formRules.required('Spacing'),
        {
          type: 'number',
          min: 0,
          message: 'Spacing must be positive',
        }
      ),
    },
  ];

  const handleSave = async (values: StoryboardParameters) => {
    const validationResult = validateStoryboardParameters(values);
    if (!validationResult.success) {
      throw new Error('Invalid parameters');
    }
    await onSave(values);
  };

  const renderTimelinePreview = (time: number, timelineParams: TimelineParameters) => {
    // Find the active keyframes at the current time
    const activeKeyframes = timelineParams.tracks.flatMap(track =>
      track.keyframes.filter(keyframe =>
        Math.abs(keyframe.time - time) < 0.1
      )
    );

    return (
      <div style={{ padding: 16, background: '#f0f2f5' }}>
        <h4>Active Events at {time.toFixed(2)}s:</h4>
        <ul>
          {activeKeyframes.map(keyframe => (
            <li key={keyframe.id}>
              {keyframe.type}: {JSON.stringify(keyframe.parameters)}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <BaseParameterEditor
        title="Storyboard Parameters"
        initialValues={parameters}
        onSave={handleSave}
        onCancel={onCancel}
        fields={fields}
        validationSchema={storyboardParametersSchema}
      />

      <BaseTimelineEditor
        title="Storyboard Timeline"
        initialValues={parameters.timeline}
        onSave={handleTimelineSave}
        keyframeTypes={KEYFRAME_TYPES}
        renderPreview={renderTimelinePreview}
      />
    </Space>
  );
}
