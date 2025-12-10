import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StatisticEditDialog from '../../src/components/Admin/StatisticEditDialog';
import { StatisticData } from '../../src/firestore/TemplateManagement';

// mock statistic data matching actual ORKG usage patterns
const mockStatistic: StatisticData = {
  id: 'PAPERS_BY_YEAR',
  name: 'Papers Published Per Year',
  description:
    'Counts the total number of papers in the KG-EmpiRE knowledge graph grouped by publication year. Used in the Statistics dashboard to show publication trends over time.',
  sparqlQuery: `PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?year (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P31 orkgr:R12345 ;
         orkgp:P29 ?year ;
         rdfs:label ?label .
  FILTER(BOUND(?year))
}
GROUP BY ?year
ORDER BY ?year`,
};

const StatisticEditDialogWrapper = ({
  statistic,
}: {
  statistic: StatisticData | null;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ padding: '20px' }}>
      <Button
        variant="contained"
        startIcon={<EditIcon />}
        onClick={() => setOpen(true)}
        sx={{
          backgroundColor: '#e86161',
          '&:hover': { backgroundColor: '#d45151' },
        }}
      >
        Open Edit Dialog
      </Button>
      <StatisticEditDialog
        open={open}
        statistic={statistic}
        onClose={() => setOpen(false)}
        onSave={(stat) => {
          console.log('Saved:', stat);
          setOpen(false);
        }}
      />
    </Box>
  );
};

const meta: Meta<typeof StatisticEditDialog> = {
  title: 'Admin/StatisticEditDialog',
  component: StatisticEditDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`StatisticEditDialog` is a modal dialog for creating and editing statistical SPARQL queries used in the admin panel. It allows administrators to configure the statistic ID (unique identifier), display name, optional description, and the SPARQL query that fetches data from the ORKG knowledge graph. The dialog validates required fields and provides a consistent interface for managing statistics across different templates.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description:
        'Controls dialog visibility. When true, the dialog is displayed as a modal overlay with a backdrop. When false, the dialog is hidden but maintains its internal state until reopened.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    statistic: {
      control: 'object',
      description:
        'The StatisticData object to edit. When null, the dialog operates in "create new" mode with empty fields. When provided, all form fields are pre-populated with the statistic\'s current values for editing. The object must conform to the StatisticData interface with id, name, sparqlQuery, and optional description fields.',
      table: {
        type: { summary: 'StatisticData | null' },
      },
    },
    onClose: {
      action: 'dialog closed',
      description:
        'Callback fired when the dialog is closed via the Cancel button, backdrop click, or Escape key. The parent component should use this to reset any temporary state and hide the dialog by setting open to false.',
      table: {
        type: { summary: '() => void' },
      },
    },
    onSave: {
      action: 'statistic saved',
      description:
        'Callback fired when the Save button is clicked. Receives the complete StatisticData object with all form field values including id, name, description, and sparqlQuery. The parent component should persist this data to Firestore via the TemplateManagement API.',
      table: {
        type: { summary: '(statistic: StatisticData) => void' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatisticEditDialog>;

export const EditExisting: Story = {
  render: () => <StatisticEditDialogWrapper statistic={mockStatistic} />,
  parameters: {
    docs: {
      description: {
        story:
          'Edit dialog for modifying an existing statistic. Click "Open Edit Dialog" to view the form with all fields populated including ID, name, description, and SPARQL query with CodeEditor syntax highlighting.',
      },
    },
  },
};

export const CreateNew: Story = {
  render: () => <StatisticEditDialogWrapper statistic={null} />,
  parameters: {
    docs: {
      description: {
        story:
          'Edit dialog for creating a new statistic with empty fields. Click "Open Edit Dialog" to view the form. The dialog title shows "Add New Statistic" and all fields start empty.',
      },
    },
  },
};
