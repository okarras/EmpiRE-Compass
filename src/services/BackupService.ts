import {
  convertBackupQuestionsToNewFormat,
  convertStatisticsToNewFormat,
} from '../firestore/RestoreFromBackup';
import { queries as empiricalQueriesFromCode } from '../constants/queries_chart_info';
import { queries as nlp4reQueriesFromCode } from '../constants/queries_nlp4re_chart_info';

// Define types for backup data structure
export interface BackupData {
  Users: any[];
  Questions: any[];
  'Questions Nlp4re': any[];
  Templates: any[];
  Statistics: any[];
  HomeContent?: any;
}

// Global state for current data
let currentData: BackupData | null = null;
let processedEmpiricalQuestions: any[] | null = null;
let processedNlp4reQuestions: any[] | null = null;
let processedEmpiricalStatistics: any[] | null = null;
let currentBackupFilename: string = '';

// Load available backups from file system using Vite's glob import
const backupFiles = import.meta.glob('../../backups/*.json');

/**
 * Get list of available backup files
 */
export const getAvailableBackups = () => {
  return Object.keys(backupFiles).map((path) => {
    // Extract filename from path (e.g., "../../backups/backup.json" -> "backup.json")
    return path.split('/').pop() || path;
  });
};

/**
 * Initialize data from default backup file
 */
const initializeDefaultData = async () => {
  if (currentData) return;

  try {
    const defaultFilename = import.meta.env.VITE_DEFAULT_BACKUP_FILENAME;
    const availableBackups = getAvailableBackups();

    let fileToLoad = '';

    // Try to find the default file
    if (defaultFilename) {
      const found = availableBackups.find((f) => f === defaultFilename);
      if (found) {
        fileToLoad = found;
      }
    }

    // Fallback to first available if default not found
    if (!fileToLoad && availableBackups.length > 0) {
      fileToLoad = availableBackups[availableBackups.length - 1]; // Use latest (usually)
    }

    if (fileToLoad) {
      await loadBackupFile(fileToLoad);
    } else {
      console.warn('No backup files found to initialize BackupService');
    }
  } catch (error) {
    console.error('Failed to initialize default backup data:', error);
  }
};

/**
 * Load a specific backup file by name
 */
export const loadBackupFile = async (filename: string) => {
  try {
    // Reconstruct the path key used in glob
    const pathKey = `../../backups/${filename}`;
    const loader = backupFiles[pathKey];

    if (!loader) {
      throw new Error(`Backup file not found: ${filename}`);
    }

    const module = (await loader()) as any;
    // Handle both default export and direct JSON content
    const rawData = module.default || module;
    const backupData = (rawData.data || rawData) as BackupData;

    setData(backupData);
    currentBackupFilename = filename;
    console.log(`Loaded backup file: ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error loading backup file ${filename}:`, error);
    throw error;
  }
};

/**
 * Set data manually (e.g. from drag and drop)
 */
export const setData = (newData: BackupData) => {
  currentData = newData;
  // Reset caches
  processedEmpiricalQuestions = null;
  processedNlp4reQuestions = null;
  processedEmpiricalStatistics = null;
};

/**
 * Get name of currently loaded backup
 */
export const getCurrentBackupName = () => currentBackupFilename;

// Ensure data is initialized before access
const ensureData = async () => {
  if (!currentData) {
    await initializeDefaultData();
  }
  return currentData;
};

// Helper to ensure data is an array
const ensureArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return Object.values(data);
  return [];
};

export const getQuestions = async (templateId: string) => {
  const data = await ensureData();
  if (!data) return [];

  if (templateId === 'R186491') {
    if (!processedEmpiricalQuestions) {
      processedEmpiricalQuestions = convertBackupQuestionsToNewFormat(
        ensureArray(data.Questions),
        empiricalQueriesFromCode
      );
    }
    return processedEmpiricalQuestions;
  } else if (templateId === 'R1544125') {
    if (!processedNlp4reQuestions) {
      processedNlp4reQuestions = convertBackupQuestionsToNewFormat(
        ensureArray(data['Questions Nlp4re']),
        nlp4reQueriesFromCode
      );
    }
    return processedNlp4reQuestions;
  }
  return [];
};

export const getStatistics = async (templateId: string) => {
  const data = await ensureData();
  if (!data) return [];

  if (templateId === 'R186491') {
    if (!processedEmpiricalStatistics) {
      processedEmpiricalStatistics = convertStatisticsToNewFormat(
        ensureArray(data.Statistics)
      );
    }
    return processedEmpiricalStatistics;
  }

  return [];
};

export const getHomeContent = async () => {
  const data = await ensureData();

  if (data?.HomeContent) {
    // Handle array structure from backup (firebase export often makes collections arrays)
    if (Array.isArray(data.HomeContent) && data.HomeContent.length > 0) {
      const sectionsDoc =
        data.HomeContent.find((doc: any) => doc.id === 'sections') ||
        data.HomeContent[0];
      return sectionsDoc;
    }
    return data.HomeContent;
  }

  return {
    templateInfoBoxes: {
      R186491: {
        title: 'Empirical Research Practice',
        description: 'Analysis of empirical research practices.',
      },
      R1544125: {
        title: 'NLP4RE ID Card',
        description:
          'Natural Language Processing for Requirements Engineering.',
      },
    },
    heroSection: {
      title: 'Welcome to EmpiRE Compass',
      subtitle: 'Navigating Empirical Research in Software Engineering',
    },
  };
};

export const getTemplates = async () => {
  // Ensure init to avoid race conditions, though templates are hardcoded for now
  await ensureData();

  return [
    {
      id: 'R186491',
      title: 'Empirical Research Practice',
      collectionName: 'Questions',
      description:
        'Template for analyzing empirical research practices in software engineering',
    },
    {
      id: 'R1544125',
      title: 'NLP4RE ID Card',
      collectionName: 'Questions Nlp4re',
      description: 'Template for NLP4RE research questions and analysis',
    },
  ];
};

const BackupService = {
  getQuestions,
  getStatistics,
  getHomeContent,
  getTemplates,
  // New API methods
  getAvailableBackups,
  loadBackupFile,
  setData,
  getCurrentBackupName,
};

export default BackupService;
