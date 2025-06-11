import { Box, Skeleton } from '@mui/material';

interface TextSkeletonProps {
  lines?: number;
  width?: string | number;
}

const TextSkeleton: React.FC<TextSkeletonProps> = ({ lines = 3, width = '100%' }) => {
  return (
    <Box sx={{ width, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '60%' : '100%'}
          height={24}
          sx={{ bgcolor: 'rgba(232, 97, 97, 0.1)' }}
        />
      ))}
    </Box>
  );
};

export default TextSkeleton; 