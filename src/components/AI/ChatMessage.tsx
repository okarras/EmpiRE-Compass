import { Paper, Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import { useAIAssistantContext } from '../../context/AIAssistantContext';
import CodeBlock from './CodeBlock';
import ReasoningSection from './ReasoningSection';
import MessageContent from './MessageContent';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  reasoning?: string;
  showReasoning?: boolean;
  chartHtml?: string;
  showChart?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  isUser,
  reasoning,
  showReasoning,
  chartHtml,
  showChart,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { isExpanded } = useAIAssistantContext();

  useEffect(() => {
    if (chartHtml && showChart && chartRef.current) {
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
  }, [chartHtml, showChart, isExpanded]);

  const renderChart = () => {
    if (chartRef.current && chartHtml) {
      // Create container for the chart
      chartRef.current.innerHTML = `
        <div style="width: 100%; height: ${isExpanded ? 400 : 200}px; position: relative;">
          <canvas id="chart-${Date.now()}"></canvas>
        </div>
      `;

      // Extract chart configuration from the provided HTML
      const chartConfigMatch = chartHtml.match(
        /new Chart\(.*?,\s*({[\s\S]*?})\);/
      );
      if (chartConfigMatch) {
        try {
          const chartConfig = eval(`(${chartConfigMatch[1]})`);
          const canvas = chartRef.current.querySelector('canvas');
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              new window.Chart(ctx, chartConfig);
            }
          }
        } catch (error) {
          console.error('Error initializing chart:', error);
        }
      }
    }
  };

  const processContent = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Process all pre blocks
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
        if (element.className === 'code-block-placeholder') {
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
          key={`text-${elements.length}`}
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
        {renderProcessedContent()}

        {chartHtml && showChart && (
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
