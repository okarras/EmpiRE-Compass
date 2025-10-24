import { db } from '../firebase.ts';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  DocumentData,
} from 'firebase/firestore';
import { queries } from '../constants/queries_chart_info.js';

/**
 * UPDATED FOR NEW NESTED STRUCTURE
 * Questions are now stored in: Templates/{templateId}/Questions/{questionId}
 */

const addQuestion = async (templateId = 'R186491') => {
  // Use new nested structure: Templates/{templateId}/Questions
  const questionsCollection = collection(
    db,
    'Templates',
    templateId,
    'Questions'
  );
  try {
    for (const query of queries) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { dataProcessingFunction, chartSettings, ...rest } = query;
      const docRef = doc(questionsCollection, query.uid); // Specify the UID as the document ID
      await setDoc(docRef, rest);
    }
  } catch (e) {
    console.error('Error adding document: ', e);
  }
};

/**
 * Get questions from new nested structure
 * @param templateId - Template ID (defaults to R186491)
 */
const getQuestions = async (templateId = 'R186491') => {
  const questionsCollection = collection(
    db,
    'Templates',
    templateId,
    'Questions'
  );
  const querySnapshot = await getDocs(questionsCollection);
  const questions: DocumentData[] = [];
  querySnapshot.forEach((doc) => {
    questions.push({ id: doc.id, ...doc.data() });
  });
  return questions;
};

const CRUDQuestions = {
  addQuestion,
  getQuestions,
};

export default CRUDQuestions;
