import React from 'react';
import TextQuestion from './TextQuestion';
import SelectQuestion from './SelectQuestion';
import MultiSelectQuestion from './MultiSelectQuestion';
import RepeatTextQuestion from './RepeatTextQuestion';
import RepeatGroupQuestion from './RepeatGroupQuestion';
import GroupQuestion from './GroupQuestion';
import type { AIVerificationResult } from '../../../services/backendAIService';

const QuestionRenderer: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
  pdfContent?: string;
  onNavigateToPage?: (pageNumber: number) => void;
  onHighlightsChange?: (
    highlights: Record<
      number,
      { left: number; top: number; width: number; height: number }[]
    >
  ) => void;
  pdfUrl?: string | null;
  pageWidth?: number | null;
  validationError?: string | null;
  questionRef?: (element: HTMLElement | null) => void;
  onAIVerificationComplete?: (result: AIVerificationResult) => void;
}> = ({
  q,
  value,
  onChange,
  idAttr,
  level = 0,
  pdfContent,
  onNavigateToPage,
  onHighlightsChange,
  pdfUrl,
  pageWidth,
  validationError,
  questionRef,
  onAIVerificationComplete,
}) => {
  if (q.type === 'text' || q.type === 'url' || !q.type) {
    return (
      <TextQuestion
        q={q}
        value={value}
        onChange={onChange}
        idAttr={idAttr}
        level={level}
        pdfContent={pdfContent}
        onNavigateToPage={onNavigateToPage}
        onHighlightsChange={onHighlightsChange}
        pdfUrl={pdfUrl}
        pageWidth={pageWidth}
        validationError={validationError}
        questionRef={questionRef}
        onAIVerificationComplete={onAIVerificationComplete}
      />
    );
  }
  if (
    q.type === 'text_object' ||
    q.type === 'single_select' ||
    q.type === 'boolean'
  ) {
    return (
      <SelectQuestion
        q={q}
        value={value}
        onChange={onChange}
        idAttr={idAttr}
        level={level}
        pdfContent={pdfContent}
        onNavigateToPage={onNavigateToPage}
        onHighlightsChange={onHighlightsChange}
        pdfUrl={pdfUrl}
        pageWidth={pageWidth}
        questionRef={questionRef}
        onAIVerificationComplete={onAIVerificationComplete}
      />
    );
  }
  if (q.type === 'multi_select') {
    return (
      <MultiSelectQuestion
        q={q}
        value={value}
        onChange={onChange}
        idAttr={idAttr}
        level={level}
        pdfContent={pdfContent}
        onNavigateToPage={onNavigateToPage}
        onHighlightsChange={onHighlightsChange}
        pdfUrl={pdfUrl}
        pageWidth={pageWidth}
        questionRef={questionRef}
        onAIVerificationComplete={onAIVerificationComplete}
      />
    );
  }
  if (q.type === 'repeat_text') {
    return (
      <RepeatTextQuestion
        q={q}
        value={value}
        onChange={onChange}
        idAttr={idAttr}
        level={level}
        pdfContent={pdfContent}
        onNavigateToPage={onNavigateToPage}
        onHighlightsChange={onHighlightsChange}
        pdfUrl={pdfUrl}
        pageWidth={pageWidth}
        questionRef={questionRef}
        onAIVerificationComplete={onAIVerificationComplete}
      />
    );
  }
  if (q.type === 'repeat_group') {
    return (
      <RepeatGroupQuestion
        q={q}
        value={value}
        onChange={onChange}
        idAttr={idAttr}
        level={level}
      />
    );
  }
  if (q.type === 'group') {
    return (
      <GroupQuestion
        q={q}
        value={value}
        onChange={onChange}
        idAttr={idAttr}
        level={level}
      />
    );
  }

  return (
    <TextQuestion
      q={q}
      value={value}
      onChange={onChange}
      idAttr={idAttr}
      level={level}
      pdfContent={pdfContent}
      onNavigateToPage={onNavigateToPage}
      onHighlightsChange={onHighlightsChange}
      pdfUrl={pdfUrl}
      pageWidth={pageWidth}
      validationError={validationError}
      questionRef={questionRef}
      onAIVerificationComplete={onAIVerificationComplete}
    />
  );
};

export default QuestionRenderer;
