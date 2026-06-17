import { useState } from 'react';

export function useSparqlEditorState(
  sparqlQuery: string,
  onSparqlChange: (sparql: string) => void,
  onClearError?: () => void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(sparqlQuery);

  const handleEdit = () => {
    setEditContent(sparqlQuery);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSparqlChange(editContent);
    setIsEditing(false);
    onClearError?.();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(sparqlQuery);
    onClearError?.();
  };

  return {
    isEditing,
    editContent,
    setEditContent,
    handleEdit,
    handleSave,
    handleCancel,
  };
}
