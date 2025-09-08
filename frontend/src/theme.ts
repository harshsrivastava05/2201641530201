import { createTheme } from '@mui/material/styles';
import { Log } from './utils/logger';

// Log theme initialization
Log('frontend', 'info', 'style', 'Initializing Material-UI theme');

export const theme = createTheme({
  palette: {
    primary: {
      main: '#673ab7', 
    },
    secondary: {
      main: '#f3e5f5', 
    },
    background: {
      default: '#ffffff', 
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

Log('frontend', 'debug', 'style', 'Material-UI theme created successfully with violet color scheme');