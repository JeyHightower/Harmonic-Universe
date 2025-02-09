import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentVisualization } from '../../store/selectors/visualizationSelectors';
import VisualizationSettings from './VisualizationSettings';

const VisualizationWorkspace = () => {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const currentVisualization = useSelector(selectCurrentVisualization);
  const dispatch = useDispatch();

  return (
    <div className="visualization-workspace">
      <VisualizationSettings
        selectedProjectId={selectedProjectId}
        selectedAudioId={selectedAudioId}
        onProjectChange={setSelectedProjectId}
        onAudioChange={setSelectedAudioId}
      />
    </div>
  );
};

export default VisualizationWorkspace;
