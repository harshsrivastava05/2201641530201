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

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}


export const Log = async (
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string,
  context?: LogContext
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const logLevel = level.toUpperCase();
  
  let logMessage = `[${timestamp}] [${stack.toUpperCase()}] [${logLevel}] [${pkg}] ${message}`;
  
  if (context && Object.keys(context).length > 0) {
    const contextStr = JSON.stringify(context);
    logMessage += ` | Context: ${contextStr}`;
  }
  
  if (stack === 'frontend' && typeof window !== 'undefined') {
    const perfData = getPerformanceData();
    if (perfData) {
      logMessage += ` | Perf: ${perfData}`;
    }
  }
  
  
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
     
      if (level === 'fatal') {
        console.trace('Fatal error stack trace:');
      }
      break;
    default:
      console.log(logMessage);
  }
  
  if (process.env.NODE_ENV === 'development') {
    storeLogInMemory({ timestamp, stack, level, pkg, message, context });
  }
};


const getPerformanceData = (): string | null => {
  if (typeof window === 'undefined' || !window.performance) return null;
  
  try {
    const memory = (performance as any).memory;
    const memoryInfo = memory ? `Mem: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : '';
    const timing = performance.now ? `Time: ${performance.now().toFixed(1)}ms` : '';
    
    return [memoryInfo, timing].filter(Boolean).join(', ');
  } catch (e) {
    return null;
  }
};


const logStore: Array<{
  timestamp: string;
  stack: Stack;
  level: Level;
  pkg: Package;
  message: string;
  context?: LogContext;
}> = [];

const MAX_LOGS_IN_MEMORY = 1000;

const storeLogInMemory = (logEntry: {
  timestamp: string;
  stack: Stack;
  level: Level;
  pkg: Package;
  message: string;
  context?: LogContext;
}) => {
  logStore.push(logEntry);
  
  if (logStore.length > MAX_LOGS_IN_MEMORY) {
    logStore.shift();
  }
};


export const getStoredLogs = (filterLevel?: Level) => {
  if (filterLevel) {
    return logStore.filter(log => log.level === filterLevel);
  }
  return [...logStore];
};

export const clearStoredLogs = () => {
  logStore.length = 0;
  console.info('Stored logs cleared from memory');
};


export const LogWithTiming = async (
  stack: Stack,
  level: Level,
  pkg: Package,
  operation: string,
  startTime: number,
  context?: LogContext
): Promise<void> => {
  const duration = Date.now() - startTime;
  const message = `${operation} completed in ${duration}ms`;
  await Log(stack, level, pkg, message, { ...context, duration });
};

export const LogApiCall = async (
  method: string,
  url: string,
  status: number,
  duration: number,
  error?: string
): Promise<void> => {
  const level: Level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
  const message = `${method.toUpperCase()} ${url} - ${status} (${duration}ms)`;
  
  const context: LogContext = {
    method,
    url,
    status,
    duration
  };
  
  if (error) {
    context.error = error;
  }
  
  await Log('frontend', level, 'api', message, context);
};

export const LogUserAction = async (
  action: string,
  component: string,
  details?: Record<string, any>
): Promise<void> => {
  const message = `User action: ${action} in ${component}`;
  const context: LogContext = {
    action,
    component,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ...details
  };
  
  await Log('frontend', 'info', 'component', message, context);
};

export const LogError = async (
  error: Error,
  pkg: Package,
  additionalContext?: LogContext
): Promise<void> => {
  const message = `Error: ${error.message}`;
  const context: LogContext = {
    errorName: error.name,
    errorStack: error.stack,
    ...additionalContext
  };
  
  await Log('frontend', 'error', pkg, message, context);
};

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugLogs = {
    getLogs: getStoredLogs,
    clearLogs: clearStoredLogs,
    logStore
  };
}