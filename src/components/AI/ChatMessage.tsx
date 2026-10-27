import { Paper, Box, Typography } from '@mui/material';
import { useCallback, useEffect, useRef } from 'react';
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

const CHART_JS_SRC = 'https://cdn.jsdelivr.net/npm/chart.js';
const RADIAL_CHART_TYPES = new Set(['pie', 'doughnut', 'polararea', 'radar']);

interface GeneratedChartConfig {
  type?: string;
  options?: Record<string, unknown>;
}

interface ChartJsInstance {
  destroy: () => void;
  resize: () => void;
}

type ChartJsConstructor = new (
  context: CanvasRenderingContext2D,
  config: GeneratedChartConfig
) => ChartJsInstance;

const getChartJs = () =>
  (window as Window & { Chart?: ChartJsConstructor }).Chart;

const isRadialChart = (type?: string) =>
  RADIAL_CHART_TYPES.has(String(type ?? '').toLowerCase());

const ensureChartJs = (): Promise<void> => {
  if (getChartJs()) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${CHART_JS_SRC}"]`
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (getChartJs()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Chart.js')),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHART_JS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Chart.js'));
    document.head.appendChild(script);
  });
};

const prepareChartConfig = (config: GeneratedChartConfig) => {
  const radial = isRadialChart(config?.type);
  return {
    ...config,
    options: {
      ...(config?.options ?? {}),
      responsive: true,
      maintainAspectRatio: radial,
      ...(radial ? { aspectRatio: 1 } : {}),
    },
  };
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
  const chartInstancesRef = useRef<
    Array<{ destroy: () => void; resize: () => void }>
  >([]);
  const { isExpanded } = useAIAssistantContext();

  const suggestionsPayload = !isUser ? parseChartSuggestions(content) : null;
  const hasGeneratedChart = Boolean(
    chartHtml || (chartConfigs && chartConfigs.length > 0)
  );

  const destroyCharts = useCallback(() => {
    chartInstancesRef.current.forEach((chart) => {
      chart.destroy();
    });
    chartInstancesRef.current = [];
  }, []);

  const renderChart = useCallback(() => {
    const container = chartRef.current;
    if (!container) return;

    destroyCharts();
    container.innerHTML = '';

    const configs =
      chartConfigs && chartConfigs.length > 0
        ? chartConfigs
        : Array.from(
            chartHtml?.matchAll(/new Chart\(.*?,\s*({[\s\S]*?})\);/g) ?? []
          ).flatMap((match) => {
            try {
              return [new Function(`return ${match[1]}`)()];
            } catch (error) {
              console.error(
                'Chart.js failed to parse the generated config:',
                error
              );
              return [];
            }
          });

    configs.forEach((config, index) => {
      const radial = isRadialChart(config?.type);
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.maxWidth = '100%';
      wrapper.style.minWidth = '0';
      wrapper.style.height = isExpanded ? '400px' : '250px';
      wrapper.style.position = 'relative';
      wrapper.style.boxSizing = 'border-box';
      wrapper.style.marginBottom = index === configs.length - 1 ? '0' : '32px';
      wrapper.style.overflow = 'hidden';
      if (radial) {
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';
      }

      const canvas = document.createElement('canvas');
      canvas.id = `chart-${Date.now()}-${index}`;
      canvas.style.display = 'block';
      canvas.style.maxWidth = '100%';
      canvas.style.minWidth = '0';
      if (!radial) {
        canvas.style.setProperty('width', '100%', 'important');
        canvas.style.setProperty('height', '100%', 'important');
      }
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);

      try {
        const ctx = canvas.getContext('2d');
        const ChartImpl = getChartJs();
        if (!ctx || !ChartImpl) return;
        const chart = new ChartImpl(ctx, prepareChartConfig(config));
        chartInstancesRef.current.push(chart);

        let frames = 0;
        const resizeWhenLaidOut = () => {
          if (frames > 10 || !chartInstancesRef.current.includes(chart)) return;
          frames += 1;
          if (wrapper.clientWidth > 0) {
            chart.resize();
            return;
          }
          requestAnimationFrame(resizeWhenLaidOut);
        };
        requestAnimationFrame(resizeWhenLaidOut);
      } catch (error) {
        console.error('Chart.js failed to render the generated config:', error);
      }
    });
  }, [chartConfigs, chartHtml, destroyCharts, isExpanded]);

  useEffect(() => {
    if (!hasGeneratedChart || !showChart || !chartRef.current) {
      destroyCharts();
      return;
    }

    let cancelled = false;
    ensureChartJs()
      .then(() => {
        if (!cancelled) renderChart();
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
      destroyCharts();
    };
  }, [destroyCharts, hasGeneratedChart, renderChart, showChart]);

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
        width: '100%',
        minWidth: 0,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          width: hasGeneratedChart && showChart ? '100%' : 'auto',
          maxWidth: hasGeneratedChart && showChart ? '100%' : '80%',
          minWidth: 0,
          boxSizing: 'border-box',
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
                maxWidth: '100%',
                minWidth: 0,
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
