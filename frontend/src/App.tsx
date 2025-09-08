import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Container, Box, Typography, AppBar, Toolbar, Tabs, Tab } from '@mui/material';
import { theme } from './theme';
import UrlShortenerPage from './pages/UrlShortenerPage';
import UrlStatsPage from './pages/UrlStatsPage';
import { Log } from './utils/logger';

function App() {
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    Log('frontend', 'info', 'component', 'App component initialized');
  }, []);

  const handleTabChange = async (event: React.SyntheticEvent, newValue: number) => {
    const previousTab = tabIndex === 0 ? 'Shorten URL' : 'Statistics';
    const newTab = newValue === 0 ? 'Shorten URL' : 'Statistics';
    
    await Log('frontend', 'info', 'component', `Tab changed from "${previousTab}" to "${newTab}"`);
    setTabIndex(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', my: 2 }}>
          <Tabs value={tabIndex} onChange={handleTabChange} centered>
            <Tab label="Shorten URL" />
            <Tab label="Statistics" />
          </Tabs>
        </Box>
        {tabIndex === 0 && <UrlShortenerPage />}
        {tabIndex === 1 && <UrlStatsPage />}
      </Container>
    </ThemeProvider>
  );
}

export default App;