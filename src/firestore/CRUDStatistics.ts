import { db } from '../firebase.ts';
import { collection, getDocs, DocumentData } from 'firebase/firestore';

const getStatistics = async () => {
  const querySnapshot = await getDocs(collection(db, 'Statistics'));
  const statistics: DocumentData[] = [];
  querySnapshot.forEach((doc) => {
    statistics.push(doc.data());
  });
  return statistics;
};

const CRUDStatistics = {
  getStatistics,
};
export default CRUDStatistics;
