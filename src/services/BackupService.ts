import backupData from '../../backups/firebase-backup-2026-02-03T22-13-29-646Z.json';
import {
  convertBackupQuestionsToNewFormat,
  convertStatisticsToNewFormat,
} from '../firestore/RestoreFromBackup';
import { queries as empiricalQueriesFromCode } from '../constants/queries_chart_info';
import { queries as nlp4reQueriesFromCode } from '../constants/queries_nlp4re_chart_info';

// Define types for backup data structure
interface BackupData {
  Users: any[];
  Questions: any[];
  'Questions Nlp4re': any[];
  Templates: any[];
  Statistics: any[];
  HomeContent?: any;
}

//@ts-ignore
const data = (backupData.data || backupData) as unknown as BackupData;

// Cache processed data
let processedEmpiricalQuestions: any[] | null = null;
let processedNlp4reQuestions: any[] | null = null;
let processedEmpiricalStatistics: any[] | null = null;

export const getQuestions = async (templateId: string) => {
  if (templateId === 'R186491') {
    if (!processedEmpiricalQuestions) {
      processedEmpiricalQuestions = convertBackupQuestionsToNewFormat(
        data.Questions || [],
        empiricalQueriesFromCode
      );
    }
    return processedEmpiricalQuestions;
  } else if (templateId === 'R1544125') {
    if (!processedNlp4reQuestions) {
      processedNlp4reQuestions = convertBackupQuestionsToNewFormat(
        data['Questions Nlp4re'] || [],
        nlp4reQueriesFromCode
      );
    }
    return processedNlp4reQuestions;
  }
  return [];
};

export const getStatistics = async (templateId: string) => {
  if (templateId === 'R186491') {
    if (!processedEmpiricalStatistics) {
      processedEmpiricalStatistics = convertStatisticsToNewFormat(
        data.Statistics || []
      );
    }
    return processedEmpiricalStatistics;
  }

  return [];
};

export const getHomeContent = async () => {
  if (data.HomeContent) {
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
};

export default BackupService;
