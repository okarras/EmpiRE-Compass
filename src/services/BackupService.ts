/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Team?: any[];
  DynamicQuestions?: any[];
}

// Global state for current data
let currentData: BackupData | null = null;
let processedEmpiricalQuestions: any[] | null = null;
let processedNlp4reQuestions: any[] | null = null;
let processedEmpiricalStatistics: any[] | null = null;
let currentBackupFilename: string = '';

const STORAGE_KEY = 'EMPIRE_BACKUP_FILENAME';
const LIVE_MODE_KEY = 'EMPIRE_LIVE_MODE_ENABLED'; // Track if user explicitly chose live mode

// Custom event name for backup changes
const BACKUP_CHANGE_EVENT = 'backup-changed';

// Event emitter for backup changes
const emitBackupChange = () => {
  window.dispatchEvent(new CustomEvent(BACKUP_CHANGE_EVENT));
};

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
    const storedFilename = localStorage.getItem(STORAGE_KEY);
    const availableBackups = getAvailableBackups();

    let fileToLoad = '';

    // Priority 1: explicitly selected backup from localStorage
    if (storedFilename) {
      if (storedFilename === 'UPLOADED_FILE') {
        // If it was an uploaded file, we can't reload it automatically from disk
        // effectively we just don't load anything and let the user re-upload or select default
        console.log(
          'Last session used an uploaded file. Please re-upload or select a backup.'
        );
      } else {
        const found = availableBackups.find((f) => f === storedFilename);
        if (found) {
          fileToLoad = found;
        }
      }
    }

    // Priority 2: default from env var
    if (!fileToLoad && defaultFilename) {
      const found = availableBackups.find((f) => f === defaultFilename);
      if (found) {
        fileToLoad = found;
      }
    }

    // Priority 3: fallback to first available
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

    // Clear all existing data and caches before loading new backup
    currentData = null;
    processedEmpiricalQuestions = null;
    processedNlp4reQuestions = null;
    processedEmpiricalStatistics = null;

    // Set new data
    setData(backupData);
    currentBackupFilename = filename;
    localStorage.setItem(STORAGE_KEY, filename);
    // Note: We no longer clear LIVE_MODE_KEY - users can switch between live and backup freely
    // Check for nested structure (Templates with Questions inside)
    const hasNestedQuestions = backupData.Templates?.some(
      (t: any) =>
        t.Questions && Array.isArray(t.Questions) && t.Questions.length > 0
    );
    const r186491Questions = extractQuestionsFromBackup(backupData, 'R186491');
    const r1544125Questions = extractQuestionsFromBackup(
      backupData,
      'R1544125'
    );

    console.log(`BackupService: Loaded backup file: ${filename}`, {
      hasFlatQuestions: !!backupData.Questions?.length,
      hasFlatNlp4reQuestions: !!backupData['Questions Nlp4re']?.length,
      hasNestedQuestions,
      templatesCount: backupData.Templates?.length || 0,
      r186491QuestionsCount: r186491Questions.length,
      r1544125QuestionsCount: r1544125Questions.length,
      hasStatistics:
        !!backupData.Statistics?.length ||
        !!extractStatisticsFromBackup(backupData, 'R186491').length,
      hasHomeContent: !!backupData.HomeContent,
    });
    // Emit event to notify components
    emitBackupChange();
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
  // Reset all caches to force re-processing
  processedEmpiricalQuestions = null;
  processedNlp4reQuestions = null;
  processedEmpiricalStatistics = null;
  // Clear currentBackupFilename for uploaded files (will be set by caller if needed)
  // Note: emitBackupChange() should be called by the caller after setting data
};

/**
 * Get name of currently loaded backup
 */
export const getCurrentBackupName = () => currentBackupFilename;

/**
 * Check if we are explicitly using a selected backup (vs just default fallback)
 */
export const isExplicitlyUsingBackup = () => {
  return !!localStorage.getItem(STORAGE_KEY);
};

/**
 * Clear backup selection and return to "live" mode (or default backup if offline/fallback needed)
 */
export const clearBackupSelection = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(LIVE_MODE_KEY, 'true'); // Mark that user explicitly chose live mode
  currentBackupFilename = '';
  currentData = null;
  processedEmpiricalQuestions = null;
  processedNlp4reQuestions = null;
  processedEmpiricalStatistics = null;
  // Emit event to notify components
  emitBackupChange();
  // We don't automatically reload default here, closest is to let caller handle it or next API call will init default
};

/**
 * Check if user has explicitly chosen to use live mode
 */
export const isLiveModeEnabled = () => {
  return localStorage.getItem(LIVE_MODE_KEY) === 'true';
};

// Ensure data is initialized before access
const ensureData = async () => {
  // Only initialize default data if we're explicitly using a backup
  // If backup selection was cleared, we want to return null so components can use live data
  if (!currentData && isExplicitlyUsingBackup()) {
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

// Helper to extract questions from backup data (handles both flat and nested structures)
const extractQuestionsFromBackup = (
  data: BackupData,
  templateId: string
): any[] => {
  // Try new nested structure first (questions inside Templates)
  if (data.Templates && Array.isArray(data.Templates)) {
    const template = data.Templates.find((t: any) => t.id === templateId);
    if (template && template.Questions && Array.isArray(template.Questions)) {
      return template.Questions;
    }
  }

  // Fall back to flat structure (legacy format)
  if (templateId === 'R186491' && data.Questions) {
    return ensureArray(data.Questions);
  } else if (templateId === 'R1544125' && data['Questions Nlp4re']) {
    return ensureArray(data['Questions Nlp4re']);
  }

  return [];
};

// Helper to extract statistics from backup data (handles both flat and nested structures)
const extractStatisticsFromBackup = (
  data: BackupData,
  templateId: string
): any[] => {
  // Try new nested structure first (statistics inside Templates)
  if (data.Templates && Array.isArray(data.Templates)) {
    const template = data.Templates.find((t: any) => t.id === templateId);
    if (template && template.Statistics && Array.isArray(template.Statistics)) {
      return template.Statistics;
    }
  }

  // Fall back to flat structure (legacy format)
  if (data.Statistics) {
    return ensureArray(data.Statistics);
  }

  return [];
};

export const getQuestions = async (templateId: string) => {
  const data = await ensureData();
  if (!data) return [];

  if (templateId === 'R186491') {
    if (!processedEmpiricalQuestions) {
      const backupQuestions = extractQuestionsFromBackup(data, templateId);
      console.log(
        `BackupService.getQuestions: Extracted ${backupQuestions.length} questions for ${templateId}`
      );
      if (backupQuestions.length > 0) {
        console.log('BackupService.getQuestions: Sample backup question', {
          id: backupQuestions[0].id,
          uid: backupQuestions[0].uid,
          dataAnalysisInfoKeys: Object.keys(
            backupQuestions[0].dataAnalysisInformation || {}
          ),
        });
      }
      processedEmpiricalQuestions = convertBackupQuestionsToNewFormat(
        backupQuestions,
        empiricalQueriesFromCode
      );
      console.log(
        `BackupService.getQuestions: Converted to ${processedEmpiricalQuestions.length} questions`
      );
      if (processedEmpiricalQuestions.length > 0) {
        console.log('BackupService.getQuestions: Sample converted question', {
          id: processedEmpiricalQuestions[0].id,
          uid: processedEmpiricalQuestions[0].uid,
          dataAnalysisInfoKeys: Object.keys(
            processedEmpiricalQuestions[0].dataAnalysisInformation || {}
          ),
        });
      }
    }
    return processedEmpiricalQuestions;
  } else if (templateId === 'R1544125') {
    if (!processedNlp4reQuestions) {
      const backupQuestions = extractQuestionsFromBackup(data, templateId);
      processedNlp4reQuestions = convertBackupQuestionsToNewFormat(
        backupQuestions,
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
      const backupStatistics = extractStatisticsFromBackup(data, templateId);
      processedEmpiricalStatistics =
        convertStatisticsToNewFormat(backupStatistics);
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
      console.log(
        'BackupService: Returning home content from backup (array format)'
      );
      return sectionsDoc;
    }
    console.log(
      'BackupService: Returning home content from backup (object format)'
    );
    return data.HomeContent;
  }

  console.log('BackupService: No home content in backup, returning default');
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

export const getTeamMembers = async () => {
  const data = await ensureData();
  if (!data) return [];

  return ensureArray(data.Team);
};

export const getDynamicQuestions = async () => {
  const data = await ensureData();
  if (!data) return [];

  return ensureArray(data.DynamicQuestions);
};

// Export event name for components to use
export const BACKUP_CHANGE_EVENT_NAME = BACKUP_CHANGE_EVENT;

const BackupService = {
  getQuestions,
  getStatistics,
  getHomeContent,
  getTemplates,
  getTeamMembers,
  getDynamicQuestions,
  // New API methods
  getAvailableBackups,
  loadBackupFile,
  setData,
  getCurrentBackupName,
  isExplicitlyUsingBackup,
  clearBackupSelection,
  isLiveModeEnabled,
};

export default BackupService;
