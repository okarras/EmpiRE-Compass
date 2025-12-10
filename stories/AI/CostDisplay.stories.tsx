import type { Meta, StoryObj } from '@storybook/react-vite';
import CostDisplay from '../../src/components/AI/CostDisplay';
import type { CostBreakdown } from '../../src/utils/costCalculator';

const meta: Meta<typeof CostDisplay> = {
  title: 'AI/CostDisplay',
  component: CostDisplay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`CostDisplay` shows a detailed breakdown of AI model usage costs in an expandable accordion format. Displays token usage (input/output) and associated costs for each AI operation section. The header shows a summary chip with total cost, colored green for costs under $0.10 and orange/warning for costs exceeding $0.10. The expanded view shows a detailed table with per-section breakdowns and aggregated totals.',
      },
    },
  },
  argTypes: {
    costs: {
      description:
        'Array of CostBreakdown objects, one for each AI operation. Each object contains: `model` (AI model name), `provider` (openai/groq/mistral), `promptTokens` (input tokens), `completionTokens` (output tokens), `totalTokens`, `inputCost`, `outputCost`, `totalCost`, and optional `section` label. Costs are calculated based on provider pricing per 1M tokens.',
      table: {
        type: {
          summary: 'CostBreakdown[]',
          detail: `interface CostBreakdown {
  model: string;           // e.g., 'gpt-4o-mini', 'gpt-4-turbo'
  provider: AIProvider;    // 'openai' | 'groq' | 'mistral'
  promptTokens: number;    // Input tokens used
  completionTokens: number; // Output tokens generated
  totalTokens: number;     // Sum of prompt + completion
  inputCost: number;       // Cost for input tokens (USD)
  outputCost: number;      // Cost for output tokens (USD)
  totalCost: number;       // Total cost (USD)
  section?: string;        // Label like 'Query Generation'
}`,
        },
      },
    },
    title: {
      control: 'text',
      description:
        'Title displayed in the accordion header before the cost chip. Describes the context of the cost breakdown.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"AI Model Costs"' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CostDisplay>;

// low-cost ORKG analysis operation using gpt-4o-mini
const typicalAnalysisCosts: CostBreakdown[] = [
  {
    model: 'gpt-4o-mini',
    provider: 'openai',
    promptTokens: 1850,
    completionTokens: 420,
    totalTokens: 2270,
    inputCost: 0.000278,
    outputCost: 0.000252,
    totalCost: 0.00053,
    section: 'SPARQL Query Generation',
  },
  {
    model: 'gpt-4o-mini',
    provider: 'openai',
    promptTokens: 2100,
    completionTokens: 680,
    totalTokens: 2780,
    inputCost: 0.000315,
    outputCost: 0.000408,
    totalCost: 0.000723,
    section: 'Data Analysis',
  },
  {
    model: 'gpt-4o-mini',
    provider: 'openai',
    promptTokens: 1200,
    completionTokens: 350,
    totalTokens: 1550,
    inputCost: 0.00018,
    outputCost: 0.00021,
    totalCost: 0.00039,
    section: 'Chart Configuration',
  },
];

// High-cost complex analysis with reasoning model
const highCostAnalysis: CostBreakdown[] = [
  {
    model: 'gpt-4-turbo',
    provider: 'openai',
    promptTokens: 15000,
    completionTokens: 4500,
    totalTokens: 19500,
    inputCost: 0.15,
    outputCost: 0.135,
    totalCost: 0.285,
    section: 'Comprehensive Literature Analysis',
  },
  {
    model: 'o1-preview',
    provider: 'openai',
    promptTokens: 8000,
    completionTokens: 2500,
    totalTokens: 10500,
    inputCost: 0.12,
    outputCost: 0.15,
    totalCost: 0.27,
    section: 'Deep Reasoning & Synthesis',
  },
  {
    model: 'gpt-4o',
    provider: 'openai',
    promptTokens: 5000,
    completionTokens: 2000,
    totalTokens: 7000,
    inputCost: 0.0125,
    outputCost: 0.02,
    totalCost: 0.0325,
    section: 'Report Generation',
  },
];

export const Default: Story = {
  args: {
    costs: typicalAnalysisCosts,
    title: 'AI Model Costs',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typical cost display for an ORKG analysis operation using gpt-4o-mini. Shows three sections: SPARQL query generation, data analysis, and chart configuration. Total cost is under $0.01, displayed with a green success chip.',
      },
    },
  },
};

export const HighCostWarning: Story = {
  args: {
    costs: highCostAnalysis,
    title: 'Comprehensive Analysis Costs',
  },
  parameters: {
    docs: {
      description: {
        story:
          'High-cost analysis using premium models including o1-preview for reasoning. Total cost exceeds $0.10, triggering the warning (orange) chip color. This represents a complex, multi-step analysis with deep reasoning.',
      },
    },
  },
};
