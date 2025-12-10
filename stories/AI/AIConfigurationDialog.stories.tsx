import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useState } from 'react';
import { Button } from '@mui/material';
import AIConfigurationDialog from '../../src/components/AI/AIConfigurationDialog';
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

// Wrapper component to control dialog state
const DialogWrapper = ({
  defaultOpen = false,
  isConfigured = false,
}: {
  defaultOpen?: boolean;
  isConfigured?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Provider store={createMockStore(isConfigured)}>
      <div style={{ padding: '20px' }}>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d45151' },
          }}
        >
          Open Configuration Dialog
        </Button>
        <AIConfigurationDialog open={open} onClose={() => setOpen(false)} />
      </div>
    </Provider>
  );
};

const meta: Meta<typeof AIConfigurationDialog> = {
  title: 'AI/AIConfigurationDialog',
  component: AIConfigurationDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`AIConfigurationDialog` is a comprehensive modal dialog for configuring AI provider settings. Users can select between OpenAI, Groq, and Mistral providers, choose specific models, and configure API keys. The dialog supports both user-provided API keys and backend environment variables. Configuration is persisted to Redux store and localStorage for session continuity. The component integrates with the AI slice to manage provider selection (Mistral, Groq, OpenAI), model selection (15+ OpenAI models, 9 Groq models, 5 Mistral models), and API key management with secure password fields.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description:
        'Controls dialog visibility. When true, the dialog is displayed as a modal overlay with backdrop. When false, the dialog is hidden but maintains its internal state. The dialog resets its local form state to match Redux store values whenever it opens.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onClose: {
      action: 'dialog closed',
      description:
        "Callback fired when the dialog is closed via Cancel button, backdrop click, or ESC key. Should be used to update the parent component's open state. Does not save configuration changes - only the Save button persists changes to Redux store.",
      table: {
        type: { summary: '() => void' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AIConfigurationDialog>;

export const Default: Story = {
  render: () => <DialogWrapper defaultOpen={false} isConfigured={false} />,
  parameters: {
    docs: {
      description: {
        story:
          'AI Configuration Dialog with button to open. Click the button to see the dialog with provider selection (Mistral, OpenAI, Groq), model dropdown, and API key input. Note: When open, the dialog backdrop may block interaction - this is normal MUI Dialog behavior.',
      },
    },
    layout: 'padded',
  },
};
