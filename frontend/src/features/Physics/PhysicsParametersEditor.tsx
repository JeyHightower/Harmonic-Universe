import { z } from 'zod';
import { combineRules, createValidator, formRules } from '../../../utils/validation';
import { BaseParameterEditor } from '../../common/ui/BaseParameterEditor';

// Define the schema for physics parameters
const physicsParametersSchema = z.object({
  gravity: z.number().min(-100, 'Gravity must be at least -100').max(100, 'Gravity cannot exceed 100'),
  airResistance: z.number().min(0, 'Air resistance must be positive').max(1, 'Air resistance cannot exceed 1'),
  friction: z.number().min(0, 'Friction must be positive').max(1, 'Friction cannot exceed 1'),
  elasticity: z.number().min(0, 'Elasticity must be positive').max(1, 'Elasticity cannot exceed 1'),
  timeScale: z.number().min(0.1, 'Time scale must be at least 0.1').max(10, 'Time scale cannot exceed 10'),
  simulationQuality: z.enum(['low', 'medium', 'high']),
  collisionPrecision: z.number().int().min(1, 'Collision precision must be at least 1').max(10, 'Collision precision cannot exceed 10')
});

type PhysicsParameters = z.infer<typeof physicsParametersSchema>;

interface PhysicsParametersEditorProps {
  initialValues: PhysicsParameters;
  onSave: (parameters: PhysicsParameters) => Promise<void>;
  onCancel?: () => void;
}

const validatePhysicsParameters = createValidator(physicsParametersSchema);

export function PhysicsParametersEditor({
  initialValues,
  onSave,
  onCancel,
}: PhysicsParametersEditorProps) {
  const fields = [
    {
      name: 'gravity',
      label: 'Gravity',
      type: 'number',
      rules: combineRules(
        formRules.required('Gravity'),
        {
          type: 'number',
          min: -100,
          max: 100,
          message: 'Gravity must be between -100 and 100',
        }
      ),
    },
    {
      name: 'airResistance',
      label: 'Air Resistance',
      type: 'number',
      rules: combineRules(
        formRules.required('Air Resistance'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Air resistance must be between 0 and 1',
        }
      ),
    },
    {
      name: 'friction',
      label: 'Friction',
      type: 'number',
      rules: combineRules(
        formRules.required('Friction'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Friction must be between 0 and 1',
        }
      ),
    },
    {
      name: 'elasticity',
      label: 'Elasticity',
      type: 'number',
      rules: combineRules(
        formRules.required('Elasticity'),
        {
          type: 'number',
          min: 0,
          max: 1,
          message: 'Elasticity must be between 0 and 1',
        }
      ),
    },
    {
      name: 'timeScale',
      label: 'Time Scale',
      type: 'number',
      rules: combineRules(
        formRules.required('Time Scale'),
        {
          type: 'number',
          min: 0.1,
          max: 10,
          message: 'Time scale must be between 0.1 and 10',
        }
      ),
    },
    {
      name: 'simulationQuality',
      label: 'Simulation Quality',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      rules: [formRules.required('Simulation Quality')],
    },
    {
      name: 'collisionPrecision',
      label: 'Collision Precision',
      type: 'number',
      rules: combineRules(
        formRules.required('Collision Precision'),
        {
          type: 'number',
          min: 1,
          max: 10,
          message: 'Collision precision must be between 1 and 10',
        }
      ),
    },
  ];

  const handleSave = async (values: PhysicsParameters) => {
    const validationResult = validatePhysicsParameters(values);
    if (!validationResult.success) {
      throw new Error('Invalid parameters');
    }
    await onSave(values);
  };

  return (
    <BaseParameterEditor
      title="Physics Parameters"
      initialValues={initialValues}
      onSave={handleSave}
      onCancel={onCancel}
      fields={fields}
      validationSchema={physicsParametersSchema}
    />
  );
}
