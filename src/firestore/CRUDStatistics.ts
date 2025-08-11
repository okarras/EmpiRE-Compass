import { db } from '../firebase.ts';
import {
  collection,
  getDocs,
  DocumentData,
  doc,
  setDoc,
} from 'firebase/firestore';

const getStatistics = async () => {
  const querySnapshot = await getDocs(collection(db, 'Statistics'));
  const statistics: DocumentData[] = [];
  querySnapshot.forEach((doc) => {
    statistics.push(doc.data());
  });
  return statistics;
};

const setStatistics = async (statisticsData: DocumentData) => {
  try {
    const docRef = doc(db, 'Statistics', 'empire-statistics');
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
