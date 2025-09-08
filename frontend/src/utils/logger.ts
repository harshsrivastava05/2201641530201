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

/**
 * Simple frontend logger - logs to console
 * In a real application, you might send these to your backend or a logging service
 */
export const Log = async (
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const logLevel = level.toUpperCase();
  const logMessage = `[${timestamp}] [${stack.toUpperCase()}] [${logLevel}] [${pkg}] ${message}`;
  
  // Use appropriate console method based on level
  switch (level) {
    case 'debug':
      console.debug(logMessage);
      break;
    case 'info':
      console.info(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    case 'error':
    case 'fatal':
      console.error(logMessage);
      break;
    default:
      console.log(logMessage);
  }
};