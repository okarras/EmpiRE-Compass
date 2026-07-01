/**
 * @swagger
 * components:
 *   schemas:
 *     Template:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - collectionName
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         collectionName:
 *           type: string
 *         description:
 *           type: string
 *     Question:
 *       type: object
 *       required:
 *         - id
 *         - uid
 *         - title
 *         - dataAnalysisInformation
 *       properties:
 *         id:
 *           type: integer
 *         uid:
 *           type: string
 *         uid_2:
 *           type: string
 *         uid_2_merge:
 *           type: string
 *         title:
 *           type: string
 *         chartType:
 *           type: string
 *           enum: [bar, pie]
 *         dataAnalysisInformation:
 *           type: object
 *           properties:
 *             question:
 *               type: string
 *             questionExplanation:
 *               type: array
 *               items:
 *                 type: string
 *             dataAnalysis:
 *               type: array
 *               items:
 *                 type: string
 *             dataInterpretation:
 *               type: array
 *               items:
 *                 type: string
 *             requiredDataForAnalysis:
 *               type: array
 *               items:
 *                 type: string
 *         sparqlQuery:
 *           type: string
 *         sparqlQuery2:
 *           type: string
 *         chartSettings:
 *           type: object
 *         chartSettings2:
 *           type: object
 *         dataProcessingFunctionName:
 *           type: string
 *         dataProcessingFunctionName2:
 *           type: string
 *         tabs:
 *           type: object
 *           properties:
 *             tab1_name:
 *               type: string
 *             tab2_name:
 *               type: string
 *         gridOptions:
 *           type: object
 *           properties:
 *             defaultColumns:
 *               type: array
 *               items:
 *                 type: string
 *             defaultGroupBy:
 *               type: string
 *     Statistic:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - sparqlQuery
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         sparqlQuery:
 *           type: string
 *         description:
 *           type: string
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 */

export interface TemplateData {
  id: string;
  title: string;
  collectionName: string;
  description?: string;
}

export interface QuestionData {
  id: number;
  uid: string;
  uid_2?: string;
  uid_2_merge?: string;
  title: string;
  chartType?: 'bar' | 'pie';
  dataAnalysisInformation: {
    question: string;
    questionExplanation?: string | string[];
    dataAnalysis?: string | string[];
    dataInterpretation?: string | string[];
    requiredDataForAnalysis?: string | string[];
  };
  sparqlQuery?: string;
  sparqlQuery2?: string;
  chartSettings?: unknown;
  chartSettings2?: unknown;
  dataProcessingFunctionName?: string;
  dataProcessingFunctionName2?: string;
  tabs?: {
    tab1_name: string;
    tab2_name: string;
  };
  gridOptions?: {
    defaultColumns?: string[];
    defaultGroupBy?: string;
  };
}

export interface StatisticData {
  id: string;
  name: string;
  sparqlQuery: string;
  description?: string;
}
