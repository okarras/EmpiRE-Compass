import { db } from '../firebase.ts';
import {
  collection,
  getDocs,
  DocumentData,
  doc,
  setDoc,
} from 'firebase/firestore';

const statisticsKeys = {
  R186491: 'empire-statistics',
};

/**
 * UPDATED FOR NEW NESTED STRUCTURE
 * Statistics are now stored in: Templates/{templateId}/Statistics/{statisticId}
 */

/**
 * Get statistics from new nested structure
 * @param templateId - Template ID (defaults to R186491)
 */
const getStatistics = async (templateId = 'R186491') => {
  const statisticId =
    statisticsKeys[templateId as keyof typeof statisticsKeys] ||
    'empire-statistics';
  const statisticsCollection = collection(
    db,
    'Templates',
    templateId,
    'Statistics'
  );
  console.log('statisticsCollection', statisticsCollection);
  const querySnapshot = await getDocs(statisticsCollection);
  console.log(
    'querySnapshot',
    querySnapshot.docs.map((doc) => doc.data())
  );
  const snapShotData = querySnapshot.docs.map((doc) => doc.data());
  const statisticsData = snapShotData.find((data) => data.id === statisticId);
  console.log('statisticsData', statisticsData);
  return statisticsData;
};

/**
 * Set/update a statistic in the new nested structure
 * @param statisticsData - Data to save
 * @param templateId - Template ID (defaults to R186491)
 * @param statisticId - Statistic document ID (defaults to 'empire-statistics')
 */
const setStatistics = async (
  statisticsData: DocumentData,
  templateId = 'R186491',
  statisticId = 'empire-statistics'
) => {
  try {
    const docRef = doc(db, 'Templates', templateId, 'Statistics', statisticId);
    await setDoc(docRef, {
      ...statisticsData,
      updatedAt: new Date().toISOString(),
    });
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
