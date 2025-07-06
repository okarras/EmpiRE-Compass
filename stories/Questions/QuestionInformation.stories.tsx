import type { Meta, StoryObj } from '@storybook/react-vite';
import QuestionInformation from '../../src/components/QuestionInformation';

const meta: Meta<typeof QuestionInformation> = {
  title: 'Components/QuestionInformation',
  component: QuestionInformation,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a titled text block with structured HTML content. Often used to show supporting context like Explanation of the Competency Question, Required Data for Analysis, Data Analysis and Data Interpretation in questions.',
      },
    },
  },
  argTypes: {
    label: {
      description: 'The heading shown above the content',
      control: { type: 'text' },
    },
    information: {
      description:
        'Raw HTML string content (rendered using `dangerouslySetInnerHTML`)',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuestionInformation>;

export const Default: Story = {
  args: {
    label: 'Explanation of the Competency Question',
    information: `
      <p>
          According to <a href="https://doi.org/10.1109/FOSE.2007.30" target="_blank">Sjøberg et al. (2007)</a>,
          the <strong>"current" state of practice (2007)</strong> shows that there are relatively
          <strong>few empirical studies</strong>. For the <strong>target state (2020 - 2025)</strong>,
          <a href="https://doi.org/10.1109/FOSE.2007.30" target="_blank">Sjøberg et al. (2007)</a> envision
          a <strong>large number of studies</strong>. This predicted change from a few to a large number of
          empirical studies leads to the corresponding competency question.
      </p>
    `,
  },
};

export const NoInformation: Story = {
  args: {
    label: 'This Should Not Render',
    information: '',
  },
  name: 'Empty Info (Hidden)',
  parameters: {
    docs: {
      description: {
        story:
          'This demonstrates that when `information` is undefined or empty, the component renders nothing.',
      },
    },
  },
};
