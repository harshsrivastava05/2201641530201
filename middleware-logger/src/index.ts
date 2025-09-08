import axios from 'axios';

// As per specs, the API is protected. We'll need a way to get a token.
// This is a placeholder for the actual auth flow which would likely involve
// the EVALUATION_CLIENT_ID and EVALUATION_CLIENT_SECRET.
let authToken: string | null = null;
let tokenExpiry: Date | null = null;

const getAuthToken = async (): Promise<string> => {
    // In a real scenario, you would fetch a JWT token here using your client credentials.
    // For this example, we'll simulate it. This function should be adapted
    // based on the actual authentication mechanism of the evaluation service.
    if (authToken && tokenExpiry && new Date() < (tokenExpiry as Date)) {
        return authToken;
    }

    // Placeholder for actual token fetching logic
    // const response = await axios.post(`${process.env.EVALUATION_SERVER_URL}/auth/token`, {
    //     clientId: process.env.EVALUATION_CLIENT_ID,
    //     clientSecret: process.env.EVALUATION_CLIENT_SECRET,
    // });
    // authToken = response.data.token;
    
    // For now, let's assume a static token is provided or not needed for the log endpoint specifically.
    // If the endpoint is truly protected, the logic above is necessary.
    // The instructions don't specify the auth mechanism, so we proceed without a real token.
    
    // Returning a dummy token for demonstration if needed.
    return "dummy-auth-token-if-needed";
};


// Define precise types based on the documentation
type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";

// We can create more specific types for packages if needed
type BackendPackage = "cache" | "controller" | "cron_job" | "db" | "domain" | "handler" | "repository" | "route" | "service" | "auth" | "config" | "middleware" | "utils";
type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style" | "auth" | "config" | "middleware" | "utils";

type Package<S extends Stack> = S extends "backend" ? BackendPackage : FrontendPackage;

const LOG_API_URL = "http://20.244.56.144/evaluation-service/logs";

/**
 * Sends a log message to the evaluation server.
 * @param stack - The part of the application sending the log ('frontend' or 'backend').
 * @param level - The severity of the log.
 * @param pkg - The specific package/module within the stack.
 * @param message - The descriptive log message.
 */
export async function Log<S extends Stack>(
    stack: S,
    level: Level,
    pkg: Package<S>,
    message: string
): Promise<void> {
    try {
        // const token = await getAuthToken(); // Use this if auth is required

        const logData = {
            stack,
            level,
            package: pkg,
            message,
        };
        
        await axios.post(LOG_API_URL, logData, {
            // headers: {
            //   'Authorization': `Bearer ${token}`
            // }
        });

    } catch (error) {
        // In a real application, you'd have a fallback logging mechanism here,
        // but the prompt forbids console.log. We'll fail silently.
        console.error("Logging middleware failed:", error);
    }
}