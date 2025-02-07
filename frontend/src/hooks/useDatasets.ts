import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface Dataset {
  id: number;
  name: string;
  description: string;
  type: string;
  size: number;
  created_at: number;
  updated_at: number;
  metadata: {
    features: string[];
    target?: string;
    format: string;
    schema: {
      [key: string]: string;
    };
  };
  stats: {
    [key: string]: {
      mean?: number;
      std?: number;
      min?: number;
      max?: number;
      unique?: number;
      missing?: number;
    };
  };
}

export const useDatasets = (modelId: number | null) => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });

  // Create new dataset
  const createDataset = useCallback(
    async (
      name: string,
      config: {
        description: string;
        type: string;
        metadata: {
          features: string[];
          target?: string;
          format: string;
          schema: {
            [key: string]: string;
          };
        };
      }
    ) => {
      if (!model) return null;

      try {
        dispatch(
          updateModel({
            id: model.id,
            datasets: [
              ...(modelData?.datasets || []),
              {
                id: Date.now(), // Temporary ID until backend responds
                name,
                ...config,
                size: 0,
                created_at: Date.now(),
                updated_at: Date.now(),
                stats: {},
              },
            ],
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to create dataset:', error);
        return null;
      }
    },
    [model, dispatch, modelData]
  );

  // Delete dataset
  const deleteDataset = useCallback(
    async (datasetId: number) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            datasets: modelData?.datasets?.filter(d => d.id !== datasetId),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to delete dataset:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  // Update dataset metadata
  const updateDatasetMetadata = useCallback(
    async (
      datasetId: number,
      metadata: {
        features?: string[];
        target?: string;
        format?: string;
        schema?: {
          [key: string]: string;
        };
      }
    ) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            datasets: modelData?.datasets?.map(d =>
              d.id === datasetId
                ? {
                    ...d,
                    metadata: {
                      ...d.metadata,
                      ...metadata,
                    },
                    updated_at: Date.now(),
                  }
                : d
            ),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to update dataset metadata:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  return {
    createDataset,
    deleteDataset,
    updateDatasetMetadata,
    datasets: modelData?.datasets || [],
  };
};
