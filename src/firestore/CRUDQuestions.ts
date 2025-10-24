import { db } from '../firebase.ts';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  DocumentData,
} from 'firebase/firestore';
import { queries } from '../constants/queries_chart_info.js';

const addQuestion = async () => {
  const queriesCollection = collection(db, 'Questions'); // Collection name is "queries"
  try {
    for (const query of queries) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { dataProcessingFunction, chartSettings, ...rest } = query;
      const docRef = doc(queriesCollection, query.uid); // Specify the UID as the document ID
      await setDoc(docRef, rest);
    }
  } catch (e) {
    console.error('Error adding document: ', e);
  }
};
const getQuestions = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const questions: DocumentData[] = [];
  querySnapshot.forEach((doc) => {
    questions.push(doc.data());
  });
  return questions;
};

const CRUDQuestions = {
  addQuestion,
  getQuestions,
};

export default CRUDQuestions;
