import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Button, Chip, LinearProgress } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, PlayCircle } from '@mui/icons-material';
import { InterviewRound } from '../../services/interview-service';

interface RoundSidebarProps {
  rounds: InterviewRound[];
  activeRoundNumber: number;
  onRoundSelect: (roundNumber: number) => void;
  onCompleteRound: () => void;
  onFinishInterview: () => void;
  isCompleting?: boolean;
}

export function RoundSidebar({
  rounds,
  activeRoundNumber,
  onRoundSelect,
  onCompleteRound,
  onFinishInterview,
  isCompleting,
}: RoundSidebarProps) {
  const activeRound = rounds.find((r) => r.roundNumber === activeRoundNumber);
  const allRoundsCompleted = rounds.every((r) => r.status === 'COMPLETED');
  const completedCount = rounds.filter((r) => r.status === 'COMPLETED').length;
  const progressPercent = rounds.length > 0 ? (completedCount / rounds.length) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'IN_PROGRESS':
        return <PlayCircle sx={{ color: 'primary.main', fontSize: 20 }} />;
      default:
        return <RadioButtonUnchecked sx={{ color: 'text.disabled', fontSize: 20 }} />;
    }
  };

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Interview Rounds
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {completedCount} of {rounds.length} completed
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{ borderRadius: 2 }}
        />
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', py: 1, px: 1 }}>
        {rounds.map((round) => (
          <ListItem key={round.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={round.roundNumber === activeRoundNumber}
              onClick={() => onRoundSelect(round.roundNumber)}
              disabled={round.status === 'PENDING'}
              sx={{ mx: 0.5, py: 1 }}
            >
              <Box sx={{ mr: 1.5, display: 'flex' }}>{getStatusIcon(round.status)}</Box>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={round.roundNumber === activeRoundNumber ? 600 : 400}>
                    Round {round.roundNumber}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {round.topicFocus}
                  </Typography>
                }
              />
              {round.score !== null && (
                <Chip label={`${round.score}/10`} size="small" color="primary" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {allRoundsCompleted ? (
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={onFinishInterview}
            disabled={isCompleting}
            size="large"
          >
            {isCompleting ? 'Finishing...' : 'Finish Interview'}
          </Button>
        ) : activeRound?.status === 'IN_PROGRESS' ? (
          <Button
            variant="contained"
            fullWidth
            onClick={onCompleteRound}
            disabled={isCompleting}
            size="large"
          >
            {isCompleting ? 'Completing...' : 'Complete Round'}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
