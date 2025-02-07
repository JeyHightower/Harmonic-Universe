import { useGetModelQuery } from '@services/aiService';
import { RootState } from '@store/index';
import { updateModel } from '@store/slices/aiSlice';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface ModelVersion {
  id: number;
  version: string;
  description: string;
  created_at: number;
  metrics: {
    [key: string]: any;
  };
  artifacts: {
    type: string;
    path: string;
    metadata: any;
  }[];
  status: string;
}

export const useModelVersioning = (modelId: number | null) => {
  const dispatch = useDispatch();
  const model = useSelector((state: RootState) => state.ai.models.find(m => m.id === modelId));
  const { data: modelData } = useGetModelQuery(modelId || 0, { skip: !modelId });

  // Create new version
  const createVersion = useCallback(
    async (version: string, description: string) => {
      if (!model) return null;

      try {
        dispatch(
          updateModel({
            id: model.id,
            versions: [
              ...(modelData?.versions || []),
              {
                id: Date.now(), // Temporary ID until backend responds
                version,
                description,
                created_at: Date.now(),
                metrics: {},
                artifacts: [],
                status: 'created',
              },
            ],
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to create version:', error);
        return null;
      }
    },
    [model, dispatch, modelData]
  );

  // Delete version
  const deleteVersion = useCallback(
    async (versionId: number) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            versions: modelData?.versions?.filter(v => v.id !== versionId),
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to delete version:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  // Set active version
  const setActiveVersion = useCallback(
    async (versionId: number) => {
      if (!model) return false;

      try {
        dispatch(
          updateModel({
            id: model.id,
            version: modelData?.versions?.find(v => v.id === versionId)?.version || model.version,
          })
        );
        return true;
      } catch (error) {
        console.error('Failed to set active version:', error);
        return false;
      }
    },
    [model, dispatch, modelData]
  );

  return {
    createVersion,
    deleteVersion,
    setActiveVersion,
    versions: modelData?.versions || [],
    activeVersion: modelData?.version,
  };
};
