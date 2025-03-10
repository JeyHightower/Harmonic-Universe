const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((webVitals) => {
      webVitals?.getCLS?.(onPerfEntry);
      webVitals?.getFID?.(onPerfEntry);
      webVitals?.getFCP?.(onPerfEntry);
      webVitals?.getLCP?.(onPerfEntry);
      webVitals?.getTTFB?.(onPerfEntry);
    }).catch(() => {
      console.log('Web vitals library not available');
    });
  }
};

export default reportWebVitals;
