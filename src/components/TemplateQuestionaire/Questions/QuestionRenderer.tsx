import React from 'react';
import TextQuestion from './TextQuestion';
import SelectQuestion from './SelectQuestion';
import MultiSelectQuestion from './MultiSelectQuestion';
import RepeatTextQuestion from './RepeatTextQuestion';
import RepeatGroupQuestion from './RepeatGroupQuestion';
import GroupQuestion from './GroupQuestion';

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
    />
  );
};

export default QuestionRenderer;
