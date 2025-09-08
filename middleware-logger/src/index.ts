import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();


type Stack = 'backend' | 'frontend';
type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

type BackendPackage =
  | 'cache'
  | 'controller'
  | 'cron_job'
  | 'db'
  | 'domain'
  | 'handler'
  | 'repository'
  | 'route'
  | 'service';

type FrontendPackage =
  | 'api'
  | 'component'
  | 'hook'
  | 'page'
  | 'state'
  | 'style';

type SharedPackage = 'auth' | 'config' | 'middleware' | 'utils';

type Package = BackendPackage | FrontendPackage | SharedPackage;

let authToken: string | null = null;
let tokenExpiry: Date | null = null;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;
const FAILURE_COOLDOWN_MINUTES = 5;
let lastFailureTime: Date | null = null;

/**
 * Fetches a new authentication token unless cached and valid.
 */
const getAuthToken = async (): Promise<string | null> => {
  // If too many failures, enter cooldown
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && lastFailureTime) {
    const cooldownEnd = new Date(
      lastFailureTime.getTime() + FAILURE_COOLDOWN_MINUTES * 60 * 1000
    );
    if (new Date() < cooldownEnd) {
      console.warn(`Logging paused until ${cooldownEnd.toISOString()}`);
      return null;
    }
    consecutiveFailures = 0;
    lastFailureTime = null;
  }

  // Return cached token if still valid
  if (authToken && tokenExpiry && new Date() < tokenExpiry) {
    return authToken;
  }

  console.log('Fetching new logging token...');
  try {
    const { data } = await axios.post(`${process.env.EVALUATION_SERVER_URL}/auth`, {
      email: process.env.EVALUATION_EMAIL,
      name: process.env.EVALUATION_NAME,
      rollNo: process.env.EVALUATION_ROLL_NO,
      accessCode: process.env.EVALUATION_ACCESS_CODE,
      clientID: process.env.EVALUATION_CLIENT_ID,
      clientSecret: process.env.EVALUATION_CLIENT_SECRET,
    });

    const { access_token, expires_in } = data;

    authToken = access_token;
    tokenExpiry = new Date(Date.now() + (parseInt(expires_in, 10) - 60) * 1000);

    console.log('New logging token acquired.');
    consecutiveFailures = 0;
    return authToken;
  } catch (error) {
    consecutiveFailures++;
    lastFailureTime = new Date();
    console.error(`Auth failure #${consecutiveFailures}:`, error);
    authToken = null;
    tokenExpiry = null;
    return null;
  }
};

/**
 * Logs a message to the evaluation server.
 */
export const Log = async (
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<void> => {
  // Skip if in cooldown
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && lastFailureTime) {
    const cooldownEnd = new Date(
      lastFailureTime.getTime() + FAILURE_COOLDOWN_MINUTES * 60 * 1000
    );
    if (new Date() < cooldownEnd) return;
  }

  const token = await getAuthToken();
  if (!token) {
    if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
      console.warn(`Log skipped (auth failed): [${level.toUpperCase()}] ${message}`);
    }
    return;
  }

  try {
    const payload = {
      stack,
      level,
      package: pkg,
      message: String(message).slice(0, 1000),
    };

    // Basic validation
    if (!payload.stack || !payload.level || !payload.package || !payload.message) {
      throw new Error('Invalid log payload: missing fields');
    }

    await axios.post(`${process.env.EVALUATION_SERVER_URL}/logs`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });

    consecutiveFailures = 0; // Reset after success
  } catch (error: any) {
    consecutiveFailures++;
    lastFailureTime = new Date();

    if (consecutiveFailures <= 3) {
      console.error(`Log send failure #${consecutiveFailures}: [${level.toUpperCase()}] ${message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`, error.response.data);
      } else if (error.request) {
        console.error('No response from logging server.');
      } else {
        console.error('Logging request error:', error.message);
      }
    } else if (consecutiveFailures === MAX_CONSECUTIVE_FAILURES) {
      console.warn(`Logging disabled for ${FAILURE_COOLDOWN_MINUTES} min after repeated failures.`);
    }

    if (error.response?.status === 400) {
      const msg = String(error.response.data?.message || '').toLowerCase();
      if (['invalid token', 'token expired', 'unauthorized'].some(m => msg.includes(m))) {
        authToken = null;
        tokenExpiry = null;
        console.log('Token invalidated, will refresh on next attempt.');
      }
    }
  }
};
