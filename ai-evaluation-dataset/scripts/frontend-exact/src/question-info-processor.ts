/**
 * Question Info Processor - Uses EXACT frontend question processing logic
 */

export interface QuestionInfo {
  id: string;
  text: string;
  type: string;
  options?: string[];
  required?: boolean;
  sectionId?: string;
  sectionTitle?: string;
  validation?: any;
}

export interface ProcessedQuestionInfo {
  questionText: string;
  questionType: string;
  questionOptions?: string[];
  hasOptions: boolean;
  isRequired: boolean;
  metadata: {
    questionId: string;
    sectionId?: string;
    sectionTitle?: string;
    validation?: any;
  };
}

export class FrontendQuestionProcessor {
  processQuestionInfo(question: QuestionInfo): ProcessedQuestionInfo {
    const questionText = question.text || question.id || '';

    const questionType = question.type || 'text';

    let questionOptions: string[] | undefined;
    let hasOptions = false;

    if (question.options && Array.isArray(question.options)) {
      questionOptions = question.options.filter(
        (option) => option && typeof option === 'string' && option.trim()
      );
      hasOptions = questionOptions.length > 0;
    }

    if (questionType.toLowerCase() === 'boolean' && !hasOptions) {
      questionOptions = ['yes', 'no'];
      hasOptions = true;
    }

    const selectTypes = [
      'select',
      'single_select',
      'multi_select',
      'multiselect',
      'checkbox',
      'radio',
      'dropdown',
    ];

    if (selectTypes.includes(questionType.toLowerCase()) && !hasOptions) {
      console.warn(
        `Question ${question.id} is type ${questionType} but has no options`
      );
    }

    return {
      questionText,
      questionType,
      questionOptions,
      hasOptions,
      isRequired: question.required || false,
      metadata: {
        questionId: question.id,
        sectionId: question.sectionId,
        sectionTitle: question.sectionTitle,
        validation: question.validation,
      },
    };
  }
}
