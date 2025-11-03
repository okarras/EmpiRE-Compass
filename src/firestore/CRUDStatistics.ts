import { DocumentData } from 'firebase/firestore';
import {
  getStatistics as getStatisticsApi,
  updateStatistic as updateStatisticApi,
  createStatistic as createStatisticApi,
} from '../services/backendApi';

const statisticsKeys = {
  R186491: 'empire-statistics',
};

/**
 * UPDATED: Now uses backend API instead of direct Firestore access
 * Statistics are stored in: Templates/{templateId}/Statistics/{statisticId}
 */

/**
 * Get statistics from backend API
 * @param templateId - Template ID (defaults to R186491)
 */
const getStatistics = async (templateId = 'R186491') => {
  try {
    const statisticId =
      statisticsKeys[templateId as keyof typeof statisticsKeys] ||
      'empire-statistics';

    // Get all statistics from backend
    const statisticsList = await getStatisticsApi(templateId);

    // Find the specific statistic by ID
    const statisticsData = Array.isArray(statisticsList)
      ? statisticsList.find((stat: DocumentData) => stat.id === statisticId)
      : null;

    console.log('statisticsData', statisticsData);
    return statisticsData || null;
  } catch (error) {
    console.error('Error fetching statistics from backend:', error);
    throw error;
  }
};

/**
 * Set/update a statistic via backend API
 * @param statisticsData - Data to save
 * @param templateId - Template ID (defaults to R186491)
 * @param statisticId - Statistic document ID (defaults to 'empire-statistics')
 * @param userId - User ID (required for backend API)
 * @param userEmail - User email (required for backend API)
 * @param keycloakToken - Keycloak token (optional)
 */
const setStatistics = async (
  statisticsData: DocumentData,
  templateId = 'R186491',
  statisticId = 'empire-statistics',
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  try {
    if (!userId || !userEmail) {
      throw new Error(
        'UserId and userEmail are required for updating statistics'
      );
    }

    const statisticWithId = {
      ...statisticsData,
      id: statisticId,
      updatedAt: new Date().toISOString(),
    };

    // Try to update first, if it fails (404), create it
    try {
      await updateStatisticApi(
        templateId,
        statisticId,
        statisticWithId,
        userId,
        userEmail,
        keycloakToken
      );
    } catch (updateError: any) {
      // If update fails with 404, create new statistic
      if (
        updateError?.message?.includes('404') ||
        updateError?.message?.includes('not found')
      ) {
        await createStatisticApi(
          templateId,
          statisticWithId,
          userId,
          userEmail,
          keycloakToken
        );
      } else {
        throw updateError;
      }
    }
  } catch (error) {
    console.error('Error updating statistics:', error);
    throw error;
  }
};

const CRUDStatistics = {
  getStatistics,
  setStatistics,
};
export default CRUDStatistics;
