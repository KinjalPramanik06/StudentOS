export const markStart = (name: string) => {
  if (typeof window !== 'undefined' && window.performance && performance.mark) {
    performance.mark(`${name}_start`);
  }
};

export const markEnd = (name: string) => {
  if (typeof window !== 'undefined' && window.performance && performance.mark) {
    const startName = `${name}_start`;
    const endName = `${name}_end`;
    performance.mark(endName);
    try {
      performance.measure(name, startName, endName);
      const entries = performance.getEntriesByName(name, 'measure');
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        console.debug(`[StudentOS Telemetry] ${name}: ${lastEntry.duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Ignore if start mark was absent
    }
  }
};
