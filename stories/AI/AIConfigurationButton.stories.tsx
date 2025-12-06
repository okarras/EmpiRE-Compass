import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AIConfigurationButton from '../../src/components/AI/AIConfigurationButton';
import aiReducer from '../../src/store/slices/aiSlice';

// mock store for Storybook
const createMockStore = (isConfigured: boolean = false) =>
  configureStore({
    reducer: {
      ai: aiReducer,
    },
    preloadedState: {
      ai: {
        provider: 'mistral' as const,
        openaiModel: 'gpt-4o-mini' as const,
        groqModel: 'llama-3.1-8b-instant' as const,
        mistralModel: 'mistral-large-latest' as const,
        openaiApiKey: '',
        groqApiKey: '',
        mistralApiKey: '',
        isConfigured,
        useEnvironmentKeys: false,
      },
    },
  });

const meta: Meta<typeof AIConfigurationButton> = {
  title: 'AI/AIConfigurationButton',
  component: AIConfigurationButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`AIConfigurationButton` provides a settings icon button that opens the `AIConfigurationDialog` when clicked. It displays a red error badge indicator when AI is not configured, prompting users to set up their provider and API keys. The button integrates with Redux store to check configuration status and shows a tooltip indicating whether settings are saved in browser localStorage. This component is typically placed in the application header or toolbar for easy access to AI settings. **Context Requirements:** Requires Redux Provider with AI slice configured. The component reads `isConfigured` state from the AI slice and manages the dialog open/close state internally.',
      },
    },
  },
  decorators: [
    (Story, context) => {
      const isConfigured = context.args?.isConfigured ?? false;
      return (
        <Provider store={createMockStore(isConfigured)}>
          <div style={{ padding: '20px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
  argTypes: {
    isConfigured: {
      control: 'boolean',
      description:
        'Mock prop for Storybook to control the configuration state. In production, this value comes from Redux store (state.ai.isConfigured). When false, displays a red error badge on the settings icon. When true, the badge is hidden and the icon appears in default text.secondary color.',
      table: {
        type: { summary: 'boolean (Storybook only)' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<
  typeof AIConfigurationButton & { isConfigured?: boolean }
>;

export const NotConfigured: Story = {
  args: {
    isConfigured: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration button with a red error badge indicating AI is not configured. Clicking opens the AIConfigurationDialog where users can select a provider (Mistral, Groq, OpenAI), choose a model, and enter API keys.',
      },
    },
  },
};

export const Configured: Story = {
  args: {
    isConfigured: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration button when AI is already configured. The error badge is hidden and the icon appears in text.secondary color. Clicking opens the dialog in edit mode to update settings.',
      },
    },
  },
};
