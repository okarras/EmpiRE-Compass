import { useEffect, useState } from 'react';
import { BACKUP_CHANGE_EVENT_NAME } from '../services/BackupService';

/**
 * Hook to listen for backup changes and trigger re-renders
 * Returns a version number that increments when backup changes
 */
export const useBackupChange = () => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleBackupChange = () => {
      setVersion((prev) => prev + 1);
    };

    window.addEventListener(BACKUP_CHANGE_EVENT_NAME, handleBackupChange);
    return () => {
      window.removeEventListener(BACKUP_CHANGE_EVENT_NAME, handleBackupChange);
    };
  }, []);

  return version;
};
