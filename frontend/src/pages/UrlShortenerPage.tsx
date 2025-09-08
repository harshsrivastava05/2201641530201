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
import { Log } from "../../../middleware-logger/src/index";

const API_BASE_URL = "http://localhost:8000/api";

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
  }, []);

  const handleAddInput = () => {
    if (inputs.length < 5) {
      setInputs([
        ...inputs,
        { id: Date.now(), longUrl: "", shortcode: "", validity: "" },
      ]);
      Log("frontend", "info", "component", "Added new URL input field");
    }
  };

  const handleRemoveInput = (id: number) => {
    setInputs(inputs.filter((input) => input.id !== id));
    Log(
      "frontend",
      "info",
      "component",
      `Removed URL input field with id ${id}`
    );
  };

  const handleInputChange = (
    id: number,
    field: keyof Omit<UrlInput, "id">,
    value: string
  ) => {
    setInputs(
      inputs.map((input) =>
        input.id === id ? { ...input, [field]: value } : input
      )
    );
  };

  const handleSubmit = async () => {
    setError("");
    setResults([]);
    await Log(
      "frontend",
      "info",
      "component",
      `Form submitted with ${inputs.length} URLs.`
    );

    const promises = inputs
      .filter((input) => input.longUrl.trim() !== "")
      .map((input) => {
        // Client-side validation
        try {
          new URL(input.longUrl); // Basic URL validation
        } catch (_) {
          throw new Error(`Invalid URL format: ${input.longUrl}`);
        }
        if (input.validity && !/^\d+$/.test(input.validity)) {
          throw new Error(
            `Validity must be an integer for URL: ${input.longUrl}`
          );
        }

        return axios
          .post(`${API_BASE_URL}/shorturls`, {
            url: input.longUrl,
            shortcode: input.shortcode || undefined,
            validity: input.validity || undefined,
          })
          .then((response) => ({
            originalUrl: input.longUrl,
            ...response.data,
          }));
      });

    try {
      const settledResults = await Promise.all(promises);
      setResults(settledResults);
      await Log(
        "frontend",
        "info",
        "api",
        "Successfully shortened all valid URLs."
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "An unknown error occurred.";
      setError(errorMessage);
      await Log(
        "frontend",
        "error",
        "api",
        `Failed to shorten URLs: ${errorMessage}`
      );
    }
  };

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
          Add URL
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          size="large"
        >
          Shorten
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
