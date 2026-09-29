import { afterEach } from 'vitest';

// Enable React's act() environment checks for jsdom-based component tests.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Each component test mounts into its own container; clean up any leftovers.
afterEach(() => {
  if (typeof document !== 'undefined') document.body.innerHTML = '';
});
