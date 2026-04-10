import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';

function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Interview Review Platform
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered interview preparation and practice platform
        </Typography>
      </Box>
    </Container>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
