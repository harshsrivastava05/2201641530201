import { ReportHandler } from 'web-vitals';
import { Log } from './utils/logger';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    Log('frontend', 'info', 'utils', 'Web Vitals reporting initialized');
    
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      Log('frontend', 'debug', 'utils', 'Web Vitals library loaded successfully');
      
      // Enhanced Web Vitals reporting with logging
      getCLS((metric) => {
        onPerfEntry(metric);
        const level = metric.value > 0.25 ? 'warn' : metric.value > 0.1 ? 'info' : 'debug';
        Log('frontend', level, 'utils', `CLS (Cumulative Layout Shift): ${metric.value.toFixed(4)}`);
      });
      
      getFID((metric) => {
        onPerfEntry(metric);
        const level = metric.value > 300 ? 'warn' : metric.value > 100 ? 'info' : 'debug';
        Log('frontend', level, 'utils', `FID (First Input Delay): ${metric.value.toFixed(2)}ms`);
      });
      
      getFCP((metric) => {
        onPerfEntry(metric);
        const level = metric.value > 3000 ? 'warn' : metric.value > 1800 ? 'info' : 'debug';
        Log('frontend', level, 'utils', `FCP (First Contentful Paint): ${metric.value.toFixed(2)}ms`);
      });
      
      getLCP((metric) => {
        onPerfEntry(metric);
        const level = metric.value > 4000 ? 'warn' : metric.value > 2500 ? 'info' : 'debug';
        Log('frontend', level, 'utils', `LCP (Largest Contentful Paint): ${metric.value.toFixed(2)}ms`);
      });
      
      getTTFB((metric) => {
        onPerfEntry(metric);
        const level = metric.value > 800 ? 'warn' : metric.value > 600 ? 'info' : 'debug';
        Log('frontend', level, 'utils', `TTFB (Time to First Byte): ${metric.value.toFixed(2)}ms`);
      });
      
      Log('frontend', 'info', 'utils', 'All Web Vitals metrics initialized for monitoring');
    }).catch((error) => {
      Log('frontend', 'error', 'utils', `Failed to load Web Vitals library: ${error.message}`);
    });
  } else {
    Log('frontend', 'debug', 'utils', 'Web Vitals reporting not initialized - no callback provided');
  }
};

export default reportWebVitals;