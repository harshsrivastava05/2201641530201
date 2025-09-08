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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import { Log } from "../../../middleware-logger/src/index";

const API_BASE_URL = "http://localhost:8000/api";

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        await Log("frontend", "info", "api", "Fetching URL statistics.");
        const response = await axios.get(`${API_BASE_URL}/stats`);
        setStats(response.data);
        await Log(
          "frontend",
          "info",
          "api",
          `Successfully fetched ${response.data.length} stats records.`
        );
      } catch (err) {
        setError("Failed to load statistics.");
        await Log("frontend", "error", "api", "Failed to fetch statistics.");
      }
    };
    fetchStats();
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        URL Statistics
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Short URL</TableCell>
              <TableCell>Original URL</TableCell>
              <TableCell align="right">Clicks</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat._id}>
                <TableCell component="th" scope="row">
                  {`/${stat.shortCode}`}
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: "300px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {stat.longUrl}
                </TableCell>
                <TableCell align="right">{stat.clicks.length}</TableCell>
                <TableCell>
                  {new Date(stat.expiresAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Accordion
                    sx={{ boxShadow: "none", "&:before": { display: "none" } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">View Clicks</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {stat.clicks.length > 0 ? (
                        <Box>
                          {stat.clicks.map((click, index) => (
                            <Typography
                              key={index}
                              variant="caption"
                              display="block"
                            >
                              {new Date(click.timestamp).toLocaleString()} -{" "}
                              {click.source.substring(0, 40)}...
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2">No clicks yet.</Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default UrlStatsPage;
