import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import { Log } from "../utils/logger";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

interface Click {
  timestamp: string;
  source: string;
}

interface Stat {
  _id: string;
  longUrl: string;
  shortCode: string;
  createdAt: string;
  expiresAt: string;
  clicks: Click[];
}

const UrlStatsPage = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Log("frontend", "info", "page", "UrlStatsPage component mounted");
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");
      
      await Log("frontend", "info", "api", "Initiating request to fetch URL statistics");
      await Log("frontend", "debug", "config", `API endpoint: ${API_BASE_URL}/stats`);
      
      const startTime = Date.now();
      const response = await axios.get(`${API_BASE_URL}/stats`);
      const endTime = Date.now();
      
      await Log("frontend", "info", "api", `Successfully fetched ${response.data.length} statistics records in ${endTime - startTime}ms`);
      
      // Log summary of statistics
      const totalClicks = response.data.reduce((sum: number, stat: Stat) => sum + stat.clicks.length, 0);
      const activeUrls = response.data.filter((stat: Stat) => new Date(stat.expiresAt) > new Date()).length;
      const expiredUrls = response.data.length - activeUrls;
      
      await Log("frontend", "info", "component", `Statistics summary: ${response.data.length} total URLs, ${activeUrls} active, ${expiredUrls} expired, ${totalClicks} total clicks`);
      
      setStats(response.data);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to load statistics";
      setError(errorMessage);
      await Log("frontend", "error", "api", `Failed to fetch statistics: ${errorMessage}`);
      
      // Log additional error details
      if (err.response) {
        await Log("frontend", "error", "api", `HTTP Status: ${err.response.status}, Response: ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        await Log("frontend", "error", "api", "No response received from server");
      } else {
        await Log("frontend", "error", "api", `Request setup error: ${err.message}`);
      }
    } finally {
      setLoading(false);
      await Log("frontend", "debug", "component", "Statistics loading state updated to false");
    }
  };

  const handleAccordionChange = async (shortCode: string, expanded: boolean) => {
    if (expanded) {
      await Log("frontend", "info", "component", `User expanded click details for shortcode: ${shortCode}`);
    } else {
      await Log("frontend", "debug", "component", `User collapsed click details for shortcode: ${shortCode}`);
    }
  };

  const formatUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  const isUrlExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) <= new Date();
  };

  // Log component state changes
  useEffect(() => {
    if (stats.length > 0) {
      Log("frontend", "info", "component", `Statistics table rendered with ${stats.length} entries`);
    }
  }, [stats]);

  useEffect(() => {
    if (error) {
      Log("frontend", "error", "component", `Error state set: ${error}`);
    }
  }, [error]);

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 4, mt: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Statistics...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        URL Statistics
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {stats.length === 0 && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No URL statistics available yet. Create some short URLs to see statistics here.
        </Alert>
      )}
      
      {stats.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Short URL</TableCell>
                <TableCell>Original URL</TableCell>
                <TableCell align="right">Clicks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((stat) => {
                const expired = isUrlExpired(stat.expiresAt);
                return (
                  <TableRow 
                    key={stat._id}
                    sx={{ 
                      backgroundColor: expired ? '#ffebee' : 'inherit',
                      opacity: expired ? 0.7 : 1 
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          color: expired ? 'text.secondary' : 'primary.main'
                        }}
                      >
                        /{stat.shortCode}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={stat.longUrl}
                    >
                      {formatUrl(stat.longUrl, 60)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: stat.clicks.length > 0 ? 'bold' : 'normal',
                          color: stat.clicks.length > 0 ? 'success.main' : 'text.secondary'
                        }}
                      >
                        {stat.clicks.length}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: expired ? 'error.light' : 'success.light',
                          color: expired ? 'error.contrastText' : 'success.contrastText',
                        }}
                      >
                        {expired ? 'EXPIRED' : 'ACTIVE'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={expired ? 'error' : 'text.primary'}>
                        {new Date(stat.expiresAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Accordion
                        sx={{ 
                          boxShadow: "none", 
                          "&:before": { display: "none" },
                          minHeight: 'auto'
                        }}
                        onChange={(_, expanded) => handleAccordionChange(stat.shortCode, expanded)}
                      >
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ minHeight: 'auto', '& .MuiAccordionSummary-content': { margin: '8px 0' } }}
                        >
                          <Typography variant="body2">
                            {stat.clicks.length > 0 ? `View ${stat.clicks.length} clicks` : 'No clicks'}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          {stat.clicks.length > 0 ? (
                            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {stat.clicks
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .map((click, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    py: 0.5,
                                    borderBottom: index < stat.clicks.length - 1 ? '1px solid #f0f0f0' : 'none'
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(click.timestamp).toLocaleString()}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ 
                                      maxWidth: '200px', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis',
                                      ml: 1
                                    }}
                                    title={click.source}
                                  >
                                    {formatUrl(click.source, 30)}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No clicks recorded yet
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default UrlStatsPage;