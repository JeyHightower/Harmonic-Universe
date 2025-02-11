import PropTypes from 'prop-types';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { IconButton } from '../common/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const SceneList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const SceneItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: ${({ theme, isSelected }) =>
    isSelected ? theme.colors.primaryLight : theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: ${({ theme, isSelected }) =>
      isSelected ? theme.colors.primaryLight : theme.colors.surfaceHover};
  }
`;

const SceneThumbnail = styled.div`
  width: 80px;
  height: 45px;
  background: ${({ theme }) => theme.colors.surfaceDark};
  border-radius: 2px;
  margin-right: 1rem;
  flex-shrink: 0;
`;

const SceneInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SceneTitle = styled.h3`
  margin: 0 0 0.25rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SceneDuration = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AddButton = styled(IconButton)`
  margin: 1rem auto;
  padding: 0.5rem 1rem;
  width: calc(100% - 1rem);
`;

export function SceneManager({
  scenes,
  selectedSceneId,
  onSceneSelect,
  onAddScene,
  onUpdateScene,
  onReorderScenes,
}) {
  const handleDragEnd = result => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    onReorderScenes(sourceIndex, destinationIndex);
  };

  const formatDuration = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Container>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="scenes">
          {provided => (
            <SceneList ref={provided.innerRef} {...provided.droppableProps}>
              {scenes.map((scene, index) => (
                <Draggable
                  key={scene.id}
                  draggableId={scene.id.toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <SceneItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      isSelected={scene.id === selectedSceneId}
                      onClick={() => onSceneSelect(scene.id)}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                      }}
                    >
                      <SceneThumbnail />
                      <SceneInfo>
                        <SceneTitle>{scene.title}</SceneTitle>
                        <SceneDuration>
                          {formatDuration(scene.content.duration)}
                        </SceneDuration>
                      </SceneInfo>
                      <IconButton
                        icon="edit"
                        onClick={e => {
                          e.stopPropagation();
                          // TODO: Implement edit dialog
                        }}
                        title="Edit scene"
                      />
                      <IconButton
                        icon="delete"
                        onClick={e => {
                          e.stopPropagation();
                          // TODO: Implement delete confirmation
                        }}
                        title="Delete scene"
                      />
                    </SceneItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </SceneList>
          )}
        </Droppable>
      </DragDropContext>

      <AddButton icon="plus" onClick={onAddScene} title="Add new scene">
        Add Scene
      </AddButton>
    </Container>
  );
}

SceneManager.propTypes = {
  scenes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      sequence: PropTypes.number.isRequired,
      content: PropTypes.shape({
        duration: PropTypes.number.isRequired,
      }).isRequired,
    })
  ).isRequired,
  selectedSceneId: PropTypes.number,
  onSceneSelect: PropTypes.func.isRequired,
  onAddScene: PropTypes.func.isRequired,
  onUpdateScene: PropTypes.func.isRequired,
  onReorderScenes: PropTypes.func.isRequired,
};
