import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Button, Chip } from '@mui/material';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'IN_PROGRESS':
        return <PlayCircle sx={{ color: 'primary.main', fontSize: 20 }} />;
      default:
        return <RadioButtonUnchecked sx={{ color: 'grey.400', fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success.light';
      case 'IN_PROGRESS':
        return 'primary.light';
      default:
        return 'grey.100';
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
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Interview Rounds
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {rounds.filter((r) => r.status === 'COMPLETED').length} of {rounds.length} completed
        </Typography>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {rounds.map((round) => (
          <ListItem key={round.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={round.roundNumber === activeRoundNumber}
              onClick={() => onRoundSelect(round.roundNumber)}
              disabled={round.status === 'PENDING'}
              sx={{
                mx: 1,
                borderRadius: 1,
                bgcolor: round.roundNumber === activeRoundNumber ? getStatusColor(round.status) : 'transparent',
                '&.Mui-selected': {
                  bgcolor: getStatusColor(round.status),
                  '&:hover': {
                    bgcolor: getStatusColor(round.status),
                  },
                },
              }}
            >
              <Box sx={{ mr: 1.5 }}>{getStatusIcon(round.status)}</Box>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={round.roundNumber === activeRoundNumber ? 600 : 400}>
                    Round {round.roundNumber}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {round.roundName}
                  </Typography>
                }
              />
              {round.score !== null && (
                <Chip label={`${round.score}/10`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
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
          >
            {isCompleting ? 'Finishing...' : 'Finish Interview'}
          </Button>
        ) : activeRound?.status === 'IN_PROGRESS' ? (
          <Button
            variant="contained"
            fullWidth
            onClick={onCompleteRound}
            disabled={isCompleting}
          >
            {isCompleting ? 'Completing...' : 'Complete Round'}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
