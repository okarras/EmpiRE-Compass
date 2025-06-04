import type { Meta, StoryObj } from '@storybook/react';
import ScrollTop from './ScrollTop';
import { Box, Fab, Typography, Container } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const meta: Meta<typeof ScrollTop> = {
  title: 'Utilities/ScrollTop',
  component: ScrollTop,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'ScrollTop displays a floating action button (or any child) when the user scrolls past a threshold, and scrolls back to `#back-to-top-anchor` on click. Commonly used in layouts and dashboards.',
      },
    },
  },
  argTypes: {
    children: {
      description: 'The button or icon to display when scrolled down',
      control: false,
    },
    window: {
      description: 'Optional window reference (for iframe usage)',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollTop>;

export const WithFloatingButton: Story = {
  render: () => (
    <>
      <Box id="back-to-top-anchor" />
      <Box
        sx={{
          minHeight: '200vh',
          backgroundColor: '#f9f9f9',
          px: 4,
          pt: 4,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom>
            Scroll Down to See ScrollTop Button
          </Typography>
          <Typography variant="body1" paragraph>
            This long scrollable section mimics a layout like your dashboard. When you scroll down more than 100px, a floating action button (FAB) appears in the bottom-right corner. Clicking it will scroll you smoothly back to the top.
          </Typography>
        </Container>
      </Box>

      <ScrollTop>
        <Fab
          size="small"
          aria-label="scroll back to top"
          sx={{
            backgroundColor: '#e86161',
            color: 'white',
            '&:hover': {
              backgroundColor: '#d45555',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </>
  ),
  name: 'With Floating Button',
  parameters: {
    docs: {
      description: {
        story:
          'This example mimics how `ScrollTop` is used in your layout with a custom-colored FAB. Scroll down to see it in action.',
      },
    },
  },
};