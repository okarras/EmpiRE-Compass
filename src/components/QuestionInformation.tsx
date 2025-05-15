import { Divider, Typography, Box } from '@mui/material';

interface Props {
  information?: string;
  label: string;
}

const QuestionInformation = (props: Props) => {
  const { information, label } = props;
  
  if (!information) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#e86161',
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: '1.1rem', sm: '1.2rem' }
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          '& p': {
            fontSize: { xs: '0.95rem', sm: '1rem' },
            lineHeight: 1.7,
            color: 'text.primary',
            mb: 2,
          },
          '& a': {
            color: '#e86161',
            textDecoration: 'none',
            fontWeight: 500,
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& strong': {
            color: 'text.primary',
            fontWeight: 600,
          },
        }}
        dangerouslySetInnerHTML={{ __html: information }}
      />
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
};

export default QuestionInformation;
