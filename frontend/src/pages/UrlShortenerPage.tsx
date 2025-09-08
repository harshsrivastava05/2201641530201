import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import axios from "axios";
import { Log } from "../utils/logger";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

interface UrlInput {
  id: number;
  longUrl: string;
  shortcode: string;
  validity: string;
}

interface ShortenedResult {
  originalUrl: string;
  shortlink: string;
  expiry: string;
}

const UrlShortenerPage = () => {
  const [inputs, setInputs] = useState<UrlInput[]>([
    { id: 1, longUrl: "", shortcode: "", validity: "" },
  ]);
  const [results, setResults] = useState<ShortenedResult[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    Log("frontend", "info", "page", "UrlShortenerPage loaded");
    Log("frontend", "debug", "config", `API Base URL: ${API_BASE_URL}`);
  }, []);

  const handleAddInput = async () => {
    if (inputs.length < 5) {
      const newInput = { id: Date.now(), longUrl: "", shortcode: "", validity: "" };
      setInputs([...inputs, newInput]);
      await Log("frontend", "info", "component", `Added new URL input field. Total fields: ${inputs.length + 1}`);
    } else {
      await Log("frontend", "warn", "component", "Maximum number of URL input fields (5) reached");
    }
  };

  const handleRemoveInput = async (id: number) => {
    if (inputs.length > 1) {
      setInputs(inputs.filter((input) => input.id !== id));
      await Log("frontend", "info", "component", `Removed URL input field with id ${id}. Remaining fields: ${inputs.length - 1}`);
    } else {
      await Log("frontend", "warn", "component", "Cannot remove the last remaining input field");
    }
  };

  const handleInputChange = async (
    id: number,
    field: keyof Omit<UrlInput, "id">,
    value: string
  ) => {
    setInputs(
      inputs.map((input) =>
        input.id === id ? { ...input, [field]: value } : input
      )
    );
    
    // Log input changes for debugging (be careful not to log sensitive data)
    if (field === 'longUrl' && value) {
      await Log("frontend", "debug", "component", `URL input updated for field ${id}`);
    } else if (field === 'shortcode' && value) {
      await Log("frontend", "debug", "component", `Custom shortcode "${value}" entered for field ${id}`);
    } else if (field === 'validity' && value) {
      await Log("frontend", "debug", "component", `Validity "${value}" minutes set for field ${id}`);
    }
  };

  const validateInputs = async (inputs: UrlInput[]) => {
    const validInputs = inputs.filter((input) => input.longUrl.trim() !== "");
    await Log("frontend", "info", "component", `Validating ${validInputs.length} URLs out of ${inputs.length} input fields`);

    for (const input of validInputs) {
      try {
        new URL(input.longUrl); // Basic URL validation
        await Log("frontend", "debug", "component", `URL validation passed for input ${input.id}`);
      } catch (_) {
        const error = `Invalid URL format: ${input.longUrl}`;
        await Log("frontend", "error", "component", error);
        throw new Error(error);
      }

      if (input.validity && !/^\d+$/.test(input.validity)) {
        const error = `Validity must be an integer for URL: ${input.longUrl}`;
        await Log("frontend", "error", "component", error);
        throw new Error(error);
      }

      if (input.validity) {
        await Log("frontend", "debug", "component", `Custom validity ${input.validity} minutes set for input ${input.id}`);
      }
    }

    return validInputs;
  };

  const handleSubmit = async () => {
    setError("");
    setResults([]);
    
    await Log("frontend", "info", "component", `Form submission started with ${inputs.length} input fields`);

    try {
      const validInputs = await validateInputs(inputs);
      
      if (validInputs.length === 0) {
        const errorMsg = "No valid URLs to process";
        setError(errorMsg);
        await Log("frontend", "warn", "component", errorMsg);
        return;
      }

      await Log("frontend", "info", "api", `Sending ${validInputs.length} URLs to API for shortening`);
      
      const promises = validInputs.map(async (input) => {
        const payload = {
          url: input.longUrl,
          shortcode: input.shortcode || undefined,
          validity: input.validity || undefined,
        };

        await Log("frontend", "debug", "api", `Making API request for URL: ${input.longUrl.substring(0, 50)}${input.longUrl.length > 50 ? '...' : ''}`);
        
        return axios
          .post(`${API_BASE_URL}/shorturls`, payload)
          .then(async (response) => {
            await Log("frontend", "info", "api", `Successfully shortened URL with shortcode: ${response.data.shortcode || 'auto-generated'}`);
            return {
              originalUrl: input.longUrl,
              ...response.data,
            };
          })
          .catch(async (error) => {
            const errorMsg = error.response?.data?.error || error.message;
            await Log("frontend", "error", "api", `Failed to shorten URL ${input.longUrl}: ${errorMsg}`);
            throw error;
          });
      });

      const settledResults = await Promise.all(promises);
      setResults(settledResults);
      
      await Log("frontend", "info", "component", `Successfully processed ${settledResults.length} URLs. Form submission completed.`);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
      setError(errorMessage);
      await Log("frontend", "error", "component", `Form submission failed: ${errorMessage}`);
    }
  };

  const handleLinkClick = async (shortlink: string) => {
    await Log("frontend", "info", "component", `User clicked on generated short link: ${shortlink}`);
  };

  // Log when results are displayed
  useEffect(() => {
    if (results.length > 0) {
      Log("frontend", "info", "component", `Displaying ${results.length} shortened URL results to user`);
    }
  }, [results]);

  // Log when errors occur
  useEffect(() => {
    if (error) {
      Log("frontend", "error", "component", `Error state updated: ${error}`);
    }
  }, [error]);

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Create Short URLs
      </Typography>
      {inputs.map((input, index) => (
        <Box
          key={input.id}
          sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}
        >
          <TextField
            label="Original Long URL"
            variant="outlined"
            fullWidth
            value={input.longUrl}
            onChange={(e) =>
              handleInputChange(input.id, "longUrl", e.target.value)
            }
          />
          <TextField
            label="Custom Code (Opt.)"
            variant="outlined"
            sx={{ width: "200px" }}
            value={input.shortcode}
            onChange={(e) =>
              handleInputChange(input.id, "shortcode", e.target.value)
            }
          />
          <TextField
            label="Validity (mins)"
            variant="outlined"
            sx={{ width: "150px" }}
            value={input.validity}
            onChange={(e) =>
              handleInputChange(input.id, "validity", e.target.value)
            }
          />
          <IconButton
            onClick={() => handleRemoveInput(input.id)}
            disabled={inputs.length === 1}
          >
            <RemoveCircleOutlineIcon />
          </IconButton>
        </Box>
      ))}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleAddInput}
          disabled={inputs.length >= 5}
        >
          Add URL ({inputs.length}/5)
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          size="large"
        >
          Shorten URLs
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Results</Typography>
          {results.map((result, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mt: 1 }}>
              <Typography>
                <strong>Original:</strong> {result.originalUrl}
              </Typography>
              <Typography>
                <strong>Short Link:</strong>{" "}
                <a
                  href={result.shortlink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(result.shortlink)}
                >
                  {result.shortlink}
                </a>
              </Typography>
              <Typography>
                <strong>Expires:</strong>{" "}
                {new Date(result.expiry).toLocaleString()}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default UrlShortenerPage;