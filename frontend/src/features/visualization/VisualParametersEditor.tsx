import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useCallback } from 'react';
import { z } from 'zod';
import { combineRules, createValidator, formRules } from '../../../utils/validation';
import { BasePreviewEditor } from '../../common/ui/BasePreviewEditor';

// Define schema for visual parameters
const visualParametersSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  ambientLight: z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    intensity: z.number().min(0, 'Intensity must be positive').max(1, 'Intensity cannot exceed 1'),
  }),
  directionalLight: z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    intensity: z.number().min(0, 'Intensity must be positive').max(1, 'Intensity cannot exceed 1'),
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
  }),
  fog: z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    near: z.number().min(0, 'Near must be positive'),
    far: z.number().min(0, 'Far must be positive'),
  }),
  bloom: z.object({
    enabled: z.boolean(),
    intensity: z.number().min(0, 'Intensity must be positive').max(2, 'Intensity cannot exceed 2'),
    threshold: z.number().min(0, 'Threshold must be positive').max(1, 'Threshold cannot exceed 1'),
  }),
});

type VisualParameters = z.infer<typeof visualParametersSchema>;

interface VisualParametersEditorProps {
  initialValues: VisualParameters;
  onSave: (parameters: VisualParameters) => Promise<void>;
  onCancel?: () => void;
}

const validateVisualParameters = createValidator(visualParametersSchema);

export function VisualParametersEditor({
  initialValues,
  onSave,
  onCancel,
}: VisualParametersEditorProps) {
  const fields = [
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      rules: [formRules.required('Background Color')],
    },
    {
      name: ['ambientLight', 'color'],
      label: 'Ambient Light Color',
      type: 'color',
      rules: [formRules.required('Ambient Light Color')],
    },
    {
      name: ['ambientLight', 'intensity'],
      label: 'Ambient Light Intensity',
      type: 'number',
      rules: combineRules(
        formRules.required('Ambient Light Intensity'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Intensity must be between 0 and 1',
        }
      ),
    },
    {
      name: ['directionalLight', 'color'],
      label: 'Directional Light Color',
      type: 'color',
      rules: [formRules.required('Directional Light Color')],
    },
    {
      name: ['directionalLight', 'intensity'],
      label: 'Directional Light Intensity',
      type: 'number',
      rules: combineRules(
        formRules.required('Directional Light Intensity'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Intensity must be between 0 and 1',
        }
      ),
    },
    {
      name: ['directionalLight', 'position', 'x'],
      label: 'Light Position X',
      type: 'number',
      rules: [formRules.required('Light Position X')],
    },
    {
      name: ['directionalLight', 'position', 'y'],
      label: 'Light Position Y',
      type: 'number',
      rules: [formRules.required('Light Position Y')],
    },
    {
      name: ['directionalLight', 'position', 'z'],
      label: 'Light Position Z',
      type: 'number',
      rules: [formRules.required('Light Position Z')],
    },
    {
      name: ['fog', 'color'],
      label: 'Fog Color',
      type: 'color',
      rules: [formRules.required('Fog Color')],
    },
    {
      name: ['fog', 'near'],
      label: 'Fog Near',
      type: 'number',
      rules: combineRules(
        formRules.required('Fog Near'),
        {
          type: 'number',
          min: 0,
          message: 'Near must be positive',
        }
      ),
    },
    {
      name: ['fog', 'far'],
      label: 'Fog Far',
      type: 'number',
      rules: combineRules(
        formRules.required('Fog Far'),
        {
          type: 'number',
          min: 0,
          message: 'Far must be positive',
        }
      ),
    },
    {
      name: ['bloom', 'enabled'],
      label: 'Enable Bloom',
      type: 'switch',
    },
    {
      name: ['bloom', 'intensity'],
      label: 'Bloom Intensity',
      type: 'number',
      rules: combineRules(
        formRules.required('Bloom Intensity'),
        {
          type: 'number',
          min: 0,
          max: 2,
          message: 'Intensity must be between 0 and 2',
        }
      ),
    },
    {
      name: ['bloom', 'threshold'],
      label: 'Bloom Threshold',
      type: 'number',
      rules: combineRules(
        formRules.required('Bloom Threshold'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Threshold must be between 0 and 1',
        }
      ),
    },
  ];

  const handleSave = async (values: VisualParameters) => {
    const validationResult = validateVisualParameters(values);
    if (!validationResult.success) {
      throw new Error('Invalid parameters');
    }
    await onSave(values);
  };

  const renderPreview = useCallback((values: VisualParameters) => (
    <Canvas
      style={{ background: values.backgroundColor }}
      camera={{ position: [0, 0, 5] }}
    >
      <ambientLight
        color={values.ambientLight.color}
        intensity={values.ambientLight.intensity}
      />
      <directionalLight
        color={values.directionalLight.color}
        intensity={values.directionalLight.intensity}
        position={[
          values.directionalLight.position.x,
          values.directionalLight.position.y,
          values.directionalLight.position.z,
        ]}
      />
      <fog
        attach="fog"
        color={values.fog.color}
        near={values.fog.near}
        far={values.fog.far}
      />
      {/* Example 3D objects for preview */}
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
      <mesh position={[-2, 0, 0]}>
        <sphereGeometry />
        <meshStandardMaterial />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <torusGeometry />
        <meshStandardMaterial />
      </mesh>
      <OrbitControls />
    </Canvas>
  ), []);

  return (
    <BasePreviewEditor
      title="Visual Parameters"
      previewTitle="Scene Preview"
      initialValues={initialValues}
      onSave={handleSave}
      onCancel={onCancel}
      fields={fields}
      validationSchema={visualParametersSchema}
      renderPreview={renderPreview}
      previewHeight={400}
    />
  );
}
