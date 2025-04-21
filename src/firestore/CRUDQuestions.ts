import { db } from '../firebase.ts';
import { collection, getDocs, doc, setDoc, DocumentData } from 'firebase/firestore';
import { queries } from '../constants/queries_chart_info.js';

const addQuestion = async () => {
  const queriesCollection = collection(db, 'Questions'); // Collection name is "queries"
  try {
    for (const query of queries) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { dataProcessingFunction, chartSettings, additionalData, ...rest } = query;
      const docRef = doc(queriesCollection, query.uid); // Specify the UID as the document ID
      await setDoc(docRef, rest);
      console.log(`Document with UID ${query.uid} added successfully!`);
    }
  } catch (e) {
    console.error('Error adding document: ', e);
  }
};
const getQuestions = async () => {
  const querySnapshot = await getDocs(collection(db, 'Questions'));
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
