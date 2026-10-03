import { BaseProvider } from './base';
import { ReplicateProvider } from './replicate';
import { KlingProvider }     from './kling';
import { RunwayProvider }    from './runway';

type FeatureKey = 'motion-copy' | 'image-to-video' | 'clothes-change';

const ENV_MAP: Record<FeatureKey, string> = {
  'motion-copy':    'AI_PROVIDER_MOTION_COPY',
  'image-to-video': 'AI_PROVIDER_IMAGE_TO_VIDEO',
  'clothes-change': 'AI_PROVIDER_CLOTHES_CHANGE',
};

const PROVIDERS: Record<string, () => BaseProvider> = {
  replicate: () => new ReplicateProvider(),
  kling:     () => new KlingProvider(),
  runway:    () => new RunwayProvider(),
};

export function getProvider(feature: FeatureKey): BaseProvider {
  const name = (process.env[ENV_MAP[feature]] || 'replicate').toLowerCase();
  const factory = PROVIDERS[name];
  if (!factory) throw new Error(`Unknown AI provider: "${name}". Valid options: ${Object.keys(PROVIDERS).join(', ')}`);
  return factory();
}

export { BaseProvider } from './base';
