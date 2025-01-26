import debounce from "lodash/debounce";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  addStoryboard,
  setSelectedStoryboard,
  updateStoryboard,
} from "../../store/slices/storyboardSlice";
import { storage } from "../utils/storage";

const initialFormState = {
  plot_point: "",
  description: "",
  harmony_tie: 0.5,
};

const AUTOSAVE_DELAY = 1000; // 1 second

export const useStoryboardForm = (universeId) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => {
    // Try to load draft on initial mount
    const draft = storage.getStoryboardDraft(universeId);
    return draft || initialFormState;
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Autosave draft
  const saveDraft = useCallback(
    debounce((draft) => {
      storage.setStoryboardDraft(universeId, draft);
      setHasUnsavedChanges(true);
    }, AUTOSAVE_DELAY),
    [universeId],
  );

  // Clear draft when form is reset or submitted
  const clearDraft = useCallback(() => {
    storage.clearStoryboardDraft(universeId);
    setHasUnsavedChanges(false);
  }, [universeId]);

  const handleSubmit = async (e, selectedStoryboard) => {
    e.preventDefault();
    if (isEditing && selectedStoryboard) {
      await dispatch(
        updateStoryboard({
          universeId,
          storyboardId: selectedStoryboard.id,
          storyboardData: formData,
        }),
      );
    } else {
      await dispatch(
        addStoryboard({
          universeId,
          storyboardData: formData,
        }),
      );
    }
    clearDraft();
    resetForm();
  };

  const handleEdit = (storyboard) => {
    clearDraft(); // Clear any existing draft when editing
    dispatch(setSelectedStoryboard(storyboard));
    setFormData({
      id: storyboard.id,
      plot_point: storyboard.plot_point,
      description: storyboard.description,
      harmony_tie: storyboard.harmony_tie,
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    dispatch(setSelectedStoryboard(null));
    clearDraft();
  };

  const updateField = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    saveDraft(newFormData);
  };

  // Handle beforeunload event if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    formData,
    isEditing,
    hasUnsavedChanges,
    handleSubmit,
    handleEdit,
    resetForm,
    updateField,
    clearDraft,
  };
};
