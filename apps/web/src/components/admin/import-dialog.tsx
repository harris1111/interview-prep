import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ImportResult {
  filesProcessed: number;
  questionsImported: number;
  knowledgeEntriesCreated: number;
  errors: string[];
}

interface ImportDialogProps {
  open: boolean;
  result: ImportResult | null;
  onClose: () => void;
}

export function ImportDialog({ open, result, onClose }: ImportDialogProps) {
  if (!result) return null;

  const hasErrors = result.errors.length > 0;
  const hasSuccess =
    result.questionsImported > 0 || result.knowledgeEntriesCreated > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import Results</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Files Processed:</strong> {result.filesProcessed}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Questions Imported:</strong> {result.questionsImported}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Knowledge Entries Created:</strong>{' '}
            {result.knowledgeEntriesCreated}
          </Typography>
        </Box>

        {hasSuccess && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
            Import completed successfully!
          </Alert>
        )}

        {hasErrors && (
          <>
            <Divider sx={{ my: 2 }} />
            <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
              Some files encountered errors during import:
            </Alert>
            <List dense>
              {result.errors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={error}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
