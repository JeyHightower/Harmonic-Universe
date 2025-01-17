import React from 'react';
import { useParams } from 'react-router-dom';
import MusicControlPanel from '../MusicControls/MusicControlPanel';
import ForceFieldEditor from '../PhysicsControls/ForceFieldEditor';
import ParticleSystem from '../PhysicsControls/ParticleSystem';
import PhysicsControlPanel from '../PhysicsControls/PhysicsControlPanel';
import './UniverseEditor.css';

const UniverseEditor = () => {
  const { universeId } = useParams();

  return (
    <div className="universe-editor">
      <div className="editor-section">
        <h2>Universe Editor</h2>
        <div className="editor-content">
          <div className="visualization-panel">
            <ParticleSystem universeId={universeId} />
            <ForceFieldEditor universeId={universeId} />
          </div>
          <div className="control-panels">
            <MusicControlPanel universeId={universeId} />
            <PhysicsControlPanel universeId={universeId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniverseEditor;
