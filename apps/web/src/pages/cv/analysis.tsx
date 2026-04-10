import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  School as SchoolIcon,
  WorkspacePremium as CertIcon,
  Code as ProjectIcon,
} from '@mui/icons-material';
import { cvService, CvUpload } from '../../services/cv-service';
import { GapReportView } from '../../components/cv/gap-report-view';

export function CvAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cv, setCv] = useState<CvUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCv = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await cvService.getCv(id);
      setCv(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load CV');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll while analysis is in progress
  useEffect(() => {
    if (!cv?.analysis) return undefined;

    const status = cv.analysis.status;
    if (status === 'PENDING' || status === 'PROCESSING') {
      const interval = setInterval(loadCv, 3000);
      return () => clearInterval(interval);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv?.analysis?.status]);

  const handleReanalyze = async () => {
    if (!id) return;
    try {
      await cvService.reanalyze(id);
      loadCv();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reanalyze CV');
    }
  };

  if (loading && !cv) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/cv/my')} sx={{ mt: 2 }}>
          Back to My CVs
        </Button>
      </Container>
    );
  }

  if (!cv) {
    return null;
  }

  const analysis = cv.analysis;
  const structuredData = analysis?.structuredData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/cv/my')}>
          Back
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          {cv.fileName}
        </Typography>
        {analysis?.status === 'COMPLETED' && (
          <Button startIcon={<RefreshIcon />} onClick={handleReanalyze}>
            Reanalyze
          </Button>
        )}
      </Box>

      {/* Analysis Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">Analysis Status:</Typography>
          {analysis?.status === 'PENDING' && (
            <>
              <Chip label="Pending" color="default" />
              <CircularProgress size={20} />
            </>
          )}
          {analysis?.status === 'PROCESSING' && (
            <>
              <Chip label="Processing" color="info" />
              <CircularProgress size={20} />
            </>
          )}
          {analysis?.status === 'COMPLETED' && (
            <>
              <Chip label="Completed" color="success" icon={<CheckIcon />} />
            </>
          )}
          {analysis?.status === 'FAILED' && (
            <>
              <Chip label="Failed" color="error" icon={<ErrorIcon />} />
            </>
          )}
        </Box>
        {analysis?.status === 'FAILED' && analysis.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {analysis.error}
            <Button size="small" onClick={handleReanalyze} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}
      </Paper>

      {/* Structured Profile */}
      {structuredData && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Candidate Profile
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">{structuredData.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Current Role
              </Typography>
              <Typography variant="body1">{structuredData.currentRole || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Years of Experience
              </Typography>
              <Typography variant="body1">{structuredData.yearsOfExperience || 'N/A'}</Typography>
            </Grid>
          </Grid>

          {/* Skills */}
          {structuredData.skills && structuredData.skills.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Skills
              </Typography>
              <Grid container spacing={2}>
                {structuredData.skills.map((skill: any, index: number) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">{skill.name}</Typography>
                        <Chip label={skill.level} size="small" color="primary" sx={{ mt: 1 }} />
                        {skill.evidence && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {skill.evidence}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Experience */}
          {structuredData.experience && structuredData.experience.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Experience
              </Typography>
              {structuredData.experience.map((exp: any, index: number) => (
                <Card variant="outlined" key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">{exp.role}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {exp.company} • {exp.duration}
                    </Typography>
                    {exp.highlights && exp.highlights.length > 0 && (
                      <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                        {exp.highlights.map((highlight: string, i: number) => (
                          <li key={i}>
                            <Typography variant="body2">{highlight}</Typography>
                          </li>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Education */}
          {structuredData.education && structuredData.education.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Education
              </Typography>
              <List disablePadding>
                {structuredData.education.map((edu: any, index: number) => (
                  <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={edu.degree}
                      secondary={`${edu.institution}${edu.year ? ` • ${edu.year}` : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Projects */}
          {structuredData.projects && structuredData.projects.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Projects
              </Typography>
              {structuredData.projects.map((proj: any, index: number) => (
                <Card variant="outlined" key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ProjectIcon fontSize="small" color="primary" />
                      <Typography variant="subtitle1">{proj.name}</Typography>
                    </Box>
                    {proj.description && (
                      <Typography variant="body2" color="text.secondary">
                        {proj.description}
                      </Typography>
                    )}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {proj.technologies.map((tech: string, i: number) => (
                          <Chip key={i} label={tech} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Certifications */}
          {structuredData.certifications && structuredData.certifications.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Certifications
              </Typography>
              <List disablePadding>
                {structuredData.certifications.map((cert: any, index: number) => (
                  <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CertIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={typeof cert === 'string' ? cert : cert.name} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      )}

      {/* Gap Report */}
      {analysis?.gapReport && (
        <GapReportView gapReport={analysis.gapReport} />
      )}
    </Container>
  );
}
