import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Collapse, Select, Space, Tooltip } from 'antd';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { combineRules, createValidator, formRules } from '../../../utils/validation';
import { BasePreviewEditor } from '../../common/ui/BasePreviewEditor';
import { TextureParameters, TextureUploader } from '../../common/ui/TextureUploader';
import { MATERIAL_PRESETS, getAllMaterialCategories, getMaterialPresetsByCategory } from './MaterialPresets';

const { Panel } = Collapse;

// Define schema for material parameters
const textureSchema = z.object({
  url: z.string().url('Invalid texture URL'),
  repeat: z.object({
    x: z.number().min(0, 'Repeat X must be positive'),
    y: z.number().min(0, 'Repeat Y must be positive'),
  }),
  offset: z.object({
    x: z.number(),
    y: z.number(),
  }),
  rotation: z.number(),
});

const materialParametersSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['standard', 'physical', 'toon', 'basic']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  emissive: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  emissiveIntensity: z.number().min(0, 'Emissive intensity must be positive'),
  roughness: z.number().min(0, 'Roughness must be positive').max(1, 'Roughness cannot exceed 1'),
  metalness: z.number().min(0, 'Metalness must be positive').max(1, 'Metalness cannot exceed 1'),
  opacity: z.number().min(0, 'Opacity must be positive').max(1, 'Opacity cannot exceed 1'),
  transparent: z.boolean(),
  wireframe: z.boolean(),
  side: z.enum(['front', 'back', 'double']),
  flatShading: z.boolean(),
  map: textureSchema.optional(),
  normalMap: textureSchema.optional(),
  roughnessMap: textureSchema.optional(),
  metalnessMap: textureSchema.optional(),
  emissiveMap: textureSchema.optional(),
  aoMap: textureSchema.optional(),
  envMapIntensity: z.number().min(0, 'Environment map intensity must be positive'),
  refractionRatio: z.number().min(0, 'Refraction ratio must be positive').max(1, 'Refraction ratio cannot exceed 1'),
});

type MaterialParameters = z.infer<typeof materialParametersSchema>;

interface MaterialParametersEditorProps {
  initialValues: MaterialParameters;
  onSave: (parameters: MaterialParameters) => Promise<void>;
  onCancel?: () => void;
}

const validateMaterialParameters = createValidator(materialParametersSchema);

const PREVIEW_MESHES = [
  { type: 'sphere', position: [-2, 0, 0] },
  { type: 'box', position: [0, 0, 0] },
  { type: 'torus', position: [2, 0, 0] },
];

export function MaterialParametersEditor({
  initialValues,
  onSave,
  onCancel,
}: MaterialParametersEditorProps) {
  const [parameters, setParameters] = useState<MaterialParameters>(initialValues);

  const handlePresetSelect = (presetId: string) => {
    const preset = MATERIAL_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setParameters({
        ...preset,
        name: parameters.name, // Keep the current name
      });
    }
  };

  const basicFields = [
    {
      name: 'name',
      label: 'Material Name',
      type: 'text',
      rules: [formRules.required('Name')],
    },
    {
      name: 'type',
      label: 'Material Type',
      type: 'select',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'physical', label: 'Physical' },
        { value: 'toon', label: 'Toon' },
        { value: 'basic', label: 'Basic' },
      ],
      rules: [formRules.required('Material Type')],
    },
    {
      name: 'color',
      label: 'Base Color',
      type: 'color',
      rules: [formRules.required('Color')],
    },
  ];

  const surfaceFields = [
    {
      name: 'roughness',
      label: 'Roughness',
      type: 'number',
      rules: combineRules(
        formRules.required('Roughness'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Roughness must be between 0 and 1',
        }
      ),
    },
    {
      name: 'metalness',
      label: 'Metalness',
      type: 'number',
      rules: combineRules(
        formRules.required('Metalness'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Metalness must be between 0 and 1',
        }
      ),
    },
    {
      name: 'opacity',
      label: 'Opacity',
      type: 'number',
      rules: combineRules(
        formRules.required('Opacity'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Opacity must be between 0 and 1',
        }
      ),
    },
  ];

  const emissiveFields = [
    {
      name: 'emissive',
      label: 'Emissive Color',
      type: 'color',
      rules: [formRules.required('Emissive Color')],
    },
    {
      name: 'emissiveIntensity',
      label: 'Emissive Intensity',
      type: 'number',
      rules: combineRules(
        formRules.required('Emissive Intensity'),
        {
          type: 'number',
          min: 0,
          message: 'Emissive intensity must be positive',
        }
      ),
    },
  ];

  const advancedFields = [
    {
      name: 'transparent',
      label: 'Transparent',
      type: 'switch',
    },
    {
      name: 'wireframe',
      label: 'Wireframe',
      type: 'switch',
    },
    {
      name: 'side',
      label: 'Side',
      type: 'select',
      options: [
        { value: 'front', label: 'Front' },
        { value: 'back', label: 'Back' },
        { value: 'double', label: 'Double' },
      ],
      rules: [formRules.required('Side')],
    },
    {
      name: 'flatShading',
      label: 'Flat Shading',
      type: 'switch',
    },
    {
      name: 'envMapIntensity',
      label: 'Environment Map Intensity',
      type: 'number',
      rules: combineRules(
        formRules.required('Environment Map Intensity'),
        {
          type: 'number',
          min: 0,
          message: 'Environment map intensity must be positive',
        }
      ),
    },
    {
      name: 'refractionRatio',
      label: 'Refraction Ratio',
      type: 'number',
      rules: combineRules(
        formRules.required('Refraction Ratio'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Refraction ratio must be between 0 and 1',
        }
      ),
    },
  ];

  const handleTextureChange = (
    type: keyof Pick<MaterialParameters, 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'emissiveMap' | 'aoMap'>,
    texture: TextureParameters
  ) => {
    setParameters({
      ...parameters,
      [type]: texture,
    });
  };

  const handleSave = async (values: MaterialParameters) => {
    const validationResult = validateMaterialParameters(values);
    if (!validationResult.success) {
      throw new Error('Invalid parameters');
    }
    await onSave(values);
  };

  const renderPreview = useCallback((values: MaterialParameters) => (
    <Canvas
      camera={{ position: [0, 2, 5] }}
      style={{ background: '#1f1f1f' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      {PREVIEW_MESHES.map(({ type, position }) => {
        const MaterialComponent = values.type === 'physical'
          ? 'meshPhysicalMaterial'
          : values.type === 'toon'
          ? 'meshToonMaterial'
          : values.type === 'basic'
          ? 'meshBasicMaterial'
          : 'meshStandardMaterial';

        return (
          <mesh key={type} position={position}>
            {type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
            {type === 'box' && <boxGeometry />}
            {type === 'torus' && <torusGeometry args={[0.8, 0.2, 16, 32]} />}
            <MaterialComponent
              {...values}
              map={values.map?.url ? new THREE.TextureLoader().load(values.map.url) : null}
              normalMap={values.normalMap?.url ? new THREE.TextureLoader().load(values.normalMap.url) : null}
              roughnessMap={values.roughnessMap?.url ? new THREE.TextureLoader().load(values.roughnessMap.url) : null}
              metalnessMap={values.metalnessMap?.url ? new THREE.TextureLoader().load(values.metalnessMap.url) : null}
              emissiveMap={values.emissiveMap?.url ? new THREE.TextureLoader().load(values.emissiveMap.url) : null}
              aoMap={values.aoMap?.url ? new THREE.TextureLoader().load(values.aoMap.url) : null}
            />
          </mesh>
        );
      })}

      <OrbitControls />
    </Canvas>
  ), []);

  const categories = getAllMaterialCategories();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Select
          style={{ width: 200 }}
          placeholder="Select Material Preset"
          onChange={handlePresetSelect}
        >
          {categories.map(category => (
            <Select.OptGroup key={category} label={category}>
              {getMaterialPresetsByCategory(category).map(preset => (
                <Select.Option key={preset.id} value={preset.id}>
                  <Tooltip title={preset.description}>
                    {preset.name}
                  </Tooltip>
                </Select.Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>
      </Space>

      <BasePreviewEditor
        title="Material Parameters"
        previewTitle="Material Preview"
        initialValues={parameters}
        onSave={handleSave}
        onCancel={onCancel}
        fields={[
          ...basicFields,
          ...surfaceFields,
          ...emissiveFields,
          ...advancedFields,
        ]}
        validationSchema={materialParametersSchema}
        renderPreview={renderPreview}
        previewHeight={400}
      >
        <Collapse ghost>
          <Panel header="Textures" key="textures">
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextureUploader
                label="Base Color Map"
                value={parameters.map}
                onChange={(texture) => handleTextureChange('map', texture)}
              />
              <TextureUploader
                label="Normal Map"
                value={parameters.normalMap}
                onChange={(texture) => handleTextureChange('normalMap', texture)}
              />
              <TextureUploader
                label="Roughness Map"
                value={parameters.roughnessMap}
                onChange={(texture) => handleTextureChange('roughnessMap', texture)}
              />
              <TextureUploader
                label="Metalness Map"
                value={parameters.metalnessMap}
                onChange={(texture) => handleTextureChange('metalnessMap', texture)}
              />
              <TextureUploader
                label="Emissive Map"
                value={parameters.emissiveMap}
                onChange={(texture) => handleTextureChange('emissiveMap', texture)}
              />
              <TextureUploader
                label="Ambient Occlusion Map"
                value={parameters.aoMap}
                onChange={(texture) => handleTextureChange('aoMap', texture)}
              />
            </Space>
          </Panel>
        </Collapse>
      </BasePreviewEditor>
    </Space>
  );
}
