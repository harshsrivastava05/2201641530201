Full-Stack URL Shortener MicroserviceThis repository contains a robust, full-stack URL shortener application built with a modern technology stack. It features a React frontend, an Express.js backend, and a reusable logging middleware. The application provides core URL shortening functionality, analytics, and extensive logging as per the project requirements.Table of ContentsFeaturesTech StackProject StructureSetup and InstallationConfigurationAPI EndpointsLive Demo (Placeholder)FeaturesShorten Multiple URLs: Concurrently shorten up to 5 long URLs.Custom Shortcodes: Optionally provide a preferred shortcode for your link.Link Expiration: Set a custom validity period (in minutes) for each shortened link (defaults to 30 minutes).URL Analytics: View a detailed statistics page with click counts and timestamps for each link.Redirect Service: The backend handles the redirection from the short URL to the original long URL and logs the click.Mandatory Logging: A dedicated, reusable logging middleware sends detailed logs from both the frontend and backend to a specified evaluation server.Minimalist UI: A clean, professional, and responsive user interface built with Material-UI, using a white and violet color scheme.Tech StackThe project is built using a modern, type-safe stack:Frontend:React.jsTypeScriptMaterial-UI (for styling and components)Axios (for API communication)Backend:Node.js with Express.jsTypeScriptMongoDB with Mongoose (for data persistence)nanoid (for unique shortcode generation)Shared:Middleware Logger: A reusable TypeScript package for sending logs to the evaluation server.Project StructureThe project is organized into three distinct packages to separate concerns./
├── /backend/               # Express.js microservice
├── /frontend/              # React.js web application
└── /middleware-logger/     # Reusable logging package
middleware-logger: A self-contained, buildable package that can be used as a dependency in both the frontend and backend.backend: The Express server that exposes the REST API for creating, redirecting, and fetching stats for URLs.frontend: A React single-page application that provides the user interface for interacting with the backend service.Setup and InstallationFollow these steps to get the application running on your local machine.Prerequisites:Node.js (v16 or higher)npm (v7 or higher)MongoDB instance (local or a cloud service like MongoDB Atlas)Step 1: Clone the Repositorygit clone [https://github.com/harshsrivastava05/2201641530201.git](https://github.com/harshsrivastava05/2201641530201.git)
cd 2201641530201
Step 2: Install Dependencies for Each PackageYou will need to install the dependencies for each of the three packages individually.# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install middleware-logger dependencies
cd ../middleware-logger
npm install
Step 3: Build the Logger MiddlewareThe shared logger package needs to be compiled from TypeScript to JavaScript before it can be used.# From the middleware-logger directory
npm run build
cd ..
Step 4: Link the Logger to Frontend and BackendAfter building the logger, link it to the other packages so they can use the local version.# Link logger to backend
cd backend
npm link ../middleware-logger

# Link logger to frontend
cd ../frontend
npm link ../middleware-logger
cd ..
Step 5: Configure Environment VariablesNavigate to the backend directory and create a .env file. Copy the contents of .env.example (if provided) or use the structure below and fill in your details.See the Configuration section for more details.Step 6: Run the ApplicationYou need to run the frontend and backend servers in separate terminals.Terminal 1: Start the Backend Servercd backend
npm run dev
The backend will be running at http://localhost:8000.Terminal 2: Start the Frontend Applicationcd frontend
npm start
The React app will open in your browser at http://localhost:3000.ConfigurationThe backend requires a .env file for configuration. Create a file named .env inside the /backend directory with the following variables:# MongoDB Connection String
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster-url>/shortener?retryWrites=true&w=majority"

# Server Configuration
PORT=8000
APP_URL="http://localhost:8000"

# Evaluation Server Credentials (if applicable)
EVALUATION_SERVER_URL="[http://20.244.56.144/evaluation-service](http://20.244.56.144/evaluation-service)"
# ... other evaluation-related variables
DATABASE_URL: Your full MongoDB connection string.PORT: The port on which the backend server will run.APP_URL: The base URL of the backend, used for constructing the short links.API EndpointsThe backend microservice exposes the following RESTful API endpoints:MethodRouteDescriptionRequest BodySuccess Response (201)POST/api/shorturlsCreates a new shortened URL.{ "url": string, "validity"?: int, "shortcode"?: string }{ "shortlink": string, "expiry": string }GET/:shortcodeRedirects to the original long URL.(None)302 Found RedirectGET/api/statsFetches statistics for all shortened URLs.(None)200 OK with an array of URL stat objectsLive Demo (Placeholder)[Link to the deployed application will go here.]