import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#673ab7', // A nice violet color
    },
    secondary: {
      main: '#f3e5f5', // A light violet for backgrounds or accents
    },
    background: {
      default: '#ffffff', // White background
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});