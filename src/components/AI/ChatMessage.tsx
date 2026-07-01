import { Paper, Box, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import { DEBUG_AI } from '../../config/debugConfig';

import { useAIAssistantContext } from '../../context/AIAssistantContext';
import CodeBlock from './CodeBlock';
import ReasoningSection from './ReasoningSection';
import MessageContent from './MessageContent';
import ChartSuggestionGroup from './ChartSuggestionGroup';

interface ChartSuggestion {
  chartType: string;
  chartDescription: string;
}

interface SuggestionsPayload {
  Suggestions: ChartSuggestion[];
}

const parseChartSuggestions = (content: string): SuggestionsPayload | null => {
  if (DEBUG_AI)
    console.log('🛠️ DEBUG [Suggestions Phase]: Raw LLM Response:', content);

  if (!content || content.trim() === '') {
    if (DEBUG_AI)
      console.warn(
        '🛠️ DEBUG [Suggestions Phase]: LLM returned an empty response.'
      );
    return null;
  }

  // LLMs occasionally return JS instead of JSON.
  if (
    content.includes('```javascript') ||
    content.includes('```js') ||
    content.includes('return {')
  ) {
    if (DEBUG_AI)
      console.debug(
        '🛠️ DEBUG [Suggestions Phase]: JSON ignored (looks like JS code block, not valid Suggestion object).'
      );
    return null;
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extractedJsonStr = jsonMatch[0];
    if (DEBUG_AI)
      console.log(
        '🛠️ DEBUG [Suggestions Phase]: Extracted JSON String:',
        extractedJsonStr
      );

    try {
      const parsedData = JSON.parse(extractedJsonStr);
      if (DEBUG_AI)
        console.log(
          '🛠️ DEBUG [Suggestions Phase]: Successfully Parsed JSON Object:',
          parsedData
        );

      if (parsedData.Suggestions && Array.isArray(parsedData.Suggestions)) {
        const valid = parsedData.Suggestions.every(
          (item: any) =>
            item &&
            typeof item === 'object' &&
            typeof item.chartType === 'string' &&
            typeof item.chartDescription === 'string'
        );
        if (valid) {
          if (DEBUG_AI)
            console.log(
              '🛠️ DEBUG [Suggestions Phase]: Valid Suggestions array found. Triggering UI buttons.'
            );
          return parsedData as SuggestionsPayload;
        } else {
          if (DEBUG_AI)
            console.warn(
              "🛠️ DEBUG [Suggestions Phase]: JSON parsed, but 'Suggestions' array items are invalid."
            );
        }
      } else {
        if (DEBUG_AI)
          console.warn(
            "🛠️ DEBUG [Suggestions Phase]: JSON parsed, but 'Suggestions' array is missing or invalid."
          );
      }
    } catch (error) {
      if (DEBUG_AI)
        console.error(
          '🛠️ DEBUG [Suggestions Phase]: JSON Parsing Failed!',
          error
        );
    }
  } else {
    if (DEBUG_AI)
      console.warn(
        '🛠️ DEBUG [Suggestions Phase]: No JSON object detected in the response.'
      );
  }

  return null;
};

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  reasoning?: string;
  showReasoning?: boolean;
  chartHtml?: string;
  chartConfigs?: any[];
  showChart?: boolean;
  onSuggestionClick?: (chartType: string) => void;
  disabledSuggestions?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  isUser,
  reasoning,
  showReasoning,
  chartHtml,
  chartConfigs,
  showChart,
  onSuggestionClick,
  disabledSuggestions = false,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { isExpanded } = useAIAssistantContext();

  const suggestionsPayload = !isUser ? parseChartSuggestions(content) : null;

  useEffect(() => {
    const hasChart = chartHtml || (chartConfigs && chartConfigs.length > 0);
    if (hasChart && showChart && chartRef.current) {
      // Load Chart.js if not already loaded
      if (!window.Chart) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        script.onload = () => {
          renderChart();
        };
        document.head.appendChild(script);
      } else {
        renderChart();
      }
    }
  }, [chartHtml, chartConfigs, showChart, isExpanded]);

  const renderChart = () => {
    if (chartRef.current) {
      if (chartConfigs && chartConfigs.length > 0) {
        chartRef.current.innerHTML = ''; // Clear container

        chartConfigs.forEach((config, index) => {
          const canvasId = `chart-${Date.now()}-${index}`;

          // Create wrapper div and canvas elements
          const wrapper = document.createElement('div');
          wrapper.style.width = '100%';
          wrapper.style.height = isExpanded ? '400px' : '250px';
          wrapper.style.position = 'relative';
          wrapper.style.marginBottom = '32px';

          const canvas = document.createElement('canvas');
          canvas.id = canvasId;
          wrapper.appendChild(canvas);
          chartRef.current?.appendChild(wrapper);

          try {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              new (window as any).Chart(ctx, config);
            }
          } catch (error) {
            console.error(
              'Chart.js failed to render the generated config:',
              error
            );
          }
        });
      } else if (chartHtml) {
        // Extract all chart configurations from the provided HTML
        const chartConfigMatches = Array.from(
          chartHtml.matchAll(/new Chart\(.*?,\s*({[\s\S]*?})\);/g)
        );

        if (chartConfigMatches.length > 0) {
          chartRef.current.innerHTML = ''; // Clear container

          chartConfigMatches.forEach((match, index) => {
            const canvasId = `chart-${Date.now()}-${index}`;

            // Create wrapper div and canvas elements
            const wrapper = document.createElement('div');
            wrapper.style.width = '100%';
            wrapper.style.height = isExpanded ? '400px' : '250px';
            wrapper.style.position = 'relative';
            wrapper.style.marginBottom = '32px';

            const canvas = document.createElement('canvas');
            canvas.id = canvasId;
            wrapper.appendChild(canvas);
            chartRef.current?.appendChild(wrapper);

            try {
              // Function constructor to evaluate the object literal
              const chartConfig = new Function(`return ${match[1]}`)();
              const ctx = canvas.getContext('2d');
              if (ctx) {
                new (window as any).Chart(ctx, chartConfig);
              }
            } catch (error) {
              console.error(
                `Chart.js failed to render the generated config at index ${index}:`,
                error
              );
            }
          });
        }
      }
    }
  };

  const processContent = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('pre').forEach((pre) => {
      const codeBlock = document.createElement('div');
      codeBlock.setAttribute('data-code-content', pre.textContent || '');
      codeBlock.setAttribute('data-is-user', String(isUser));
      codeBlock.className = 'code-block-placeholder';
      pre.parentNode?.replaceChild(codeBlock, pre);
    });

    return doc.body.innerHTML;
  };

  const renderProcessedContent = () => {
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = processContent(content);
    let currentTextContent = '';
    const elements: JSX.Element[] = [];

    Array.from(contentDiv.childNodes).forEach((node, index) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;

        // If there's accumulated text content, add it as a MessageContent component
        if (currentTextContent.trim()) {
          elements.push(
            <MessageContent
              key={`text-${index}`}
              content={currentTextContent}
              isUser={isUser}
            />
          );
          currentTextContent = '';
        }

        // Handle code blocks
        if (element.className === 'code-block-placeholder' && showChart) {
          elements.push(
            <CodeBlock
              key={`code-${index}`}
              content={element.getAttribute('data-code-content') || ''}
              isUser={element.getAttribute('data-is-user') === 'true'}
            />
          );
        } else {
          // For other HTML elements, add them to the current text content
          currentTextContent += element.outerHTML;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Add text nodes to the current text content
        currentTextContent += node.textContent;
      }
    });

    // Add any remaining text content
    if (currentTextContent.trim()) {
      elements.push(
        <MessageContent
          key={`text-remainder-${elements.length}`}
          content={currentTextContent}
          isUser={isUser}
        />
      );
    }

    return elements;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: '80%',
          backgroundColor: isUser ? '#e86161' : 'background.paper',
          color: isUser ? 'white' : 'text.primary',
          borderRadius: 2,
          border: isUser ? 'none' : '1px solid',
          borderColor: 'divider',
        }}
      >
        {suggestionsPayload ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
              I have analyzed your request and suggested some custom alternative
              visualizations that best present this dataset:
            </Typography>
            <ChartSuggestionGroup
              suggestions={suggestionsPayload.Suggestions}
              onSuggestionClick={onSuggestionClick || (() => {})}
              disabled={disabledSuggestions}
            />
          </Box>
        ) : (
          renderProcessedContent()
        )}

        {(chartHtml || (chartConfigs && chartConfigs.length > 0)) &&
          showChart && (
            <Box
              ref={chartRef}
              sx={{
                mt: 2,
                width: '100%',
                position: 'relative',
              }}
            />
          )}

        {reasoning && showReasoning && (
          <ReasoningSection reasoning={reasoning} isUser={isUser} />
        )}
      </Paper>
    </Box>
  );
};

export default ChatMessage;
