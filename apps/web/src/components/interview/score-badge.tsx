import { Chip, Tooltip } from '@mui/material';

interface ScoreBadgeProps {
  score: number;
  feedback?: string | null;
}

export function ScoreBadge({ score, feedback }: ScoreBadgeProps) {
  // Determine color based on score (0-10 scale)
  const getColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 7) return 'success';
    if (score >= 4) return 'warning';
    return 'error';
  };

  const badge = (
    <Chip
      label={`${score}/10`}
      color={getColor(score)}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );

  // If there's feedback, wrap in tooltip
  if (feedback) {
    return (
      <Tooltip title={feedback} arrow placement="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
