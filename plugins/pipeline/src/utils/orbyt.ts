import { OrbytEngine } from '@orbytautomation/engine';
import { MediaProcAdapter } from '../adapters/MediaProcAdapter.js';


/**
 * Create an OrbytEngine instance pre-loaded with the MediaProcAdapter.
 *
 * @param logLevel  'silent' for CLI (default) — suppresses engine-internal noise.
 *                  'info' / 'debug' for development inspection.
 */
export function createOrbytEngine(
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent' = 'silent',
): OrbytEngine {
  return new OrbytEngine({
    logLevel,
    adapters: [new MediaProcAdapter()],
  });
}