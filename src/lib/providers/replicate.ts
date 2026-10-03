import Replicate from 'replicate';
import { BaseProvider, GenerationResult } from './base';

const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Model versions — override via env vars
const MODELS = {
  motionCopy:    process.env.REPLICATE_MODEL_MOTION_COPY    || 'lucataco/animate-anyone',
  imageToVideo:  process.env.REPLICATE_MODEL_IMAGE_TO_VIDEO || 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
  clothesChange: process.env.REPLICATE_MODEL_CLOTHES_CHANGE || 'cuuupid/idm-vton:906425dbfd0b17b9df6ea3fcef058433cbaeefa7d24c37d0e5ab63b99de4b668',
};

export class ReplicateProvider extends BaseProvider {
  name = 'replicate';

  async motionCopy(input: { characterImageUrl: string; motionVideoUrl: string; prompt?: string }): Promise<GenerationResult> {
    const prediction = await client.predictions.create({
      version: MODELS.motionCopy.includes(':') ? MODELS.motionCopy.split(':')[1] : undefined,
      model:   MODELS.motionCopy.includes(':') ? undefined : MODELS.motionCopy,
      input: {
        ref_image:    input.characterImageUrl,
        motion_video: input.motionVideoUrl,
        prompt:       input.prompt || 'A person dancing gracefully',
      },
    } as any);

    return {
      providerJobId: prediction.id,
      status:        prediction.status === 'succeeded' ? 'completed'
                   : prediction.status === 'failed'    ? 'failed'
                   : 'processing',
      outputUrl:     Array.isArray(prediction.output) ? prediction.output[0] : prediction.output ?? undefined,
      error:         prediction.error ? String(prediction.error) : undefined,
    };
  }

  async imageToVideo(input: { imageUrl: string; prompt: string; duration?: number }): Promise<GenerationResult> {
    const prediction = await client.predictions.create({
      version: MODELS.imageToVideo.includes(':') ? MODELS.imageToVideo.split(':')[1] : undefined,
      model:   MODELS.imageToVideo.includes(':') ? undefined : MODELS.imageToVideo,
      input: {
        image:         input.imageUrl,
        prompt:        input.prompt,
        video_length:  input.duration || 14,
        fps:           24,
        motion_bucket_id: 127,
        cond_aug:      0.02,
      },
    } as any);

    return {
      providerJobId: prediction.id,
      status:        prediction.status === 'succeeded' ? 'completed'
                   : prediction.status === 'failed'    ? 'failed'
                   : 'processing',
      outputUrl:     Array.isArray(prediction.output) ? prediction.output[0] : prediction.output ?? undefined,
      error:         prediction.error ? String(prediction.error) : undefined,
    };
  }

  async clothesChange(input: { modelImageUrl: string; garmentImageUrl: string }): Promise<GenerationResult> {
    const prediction = await client.predictions.create({
      version: MODELS.clothesChange.includes(':') ? MODELS.clothesChange.split(':')[1] : undefined,
      model:   MODELS.clothesChange.includes(':') ? undefined : MODELS.clothesChange,
      input: {
        human_img:   input.modelImageUrl,
        garm_img:    input.garmentImageUrl,
        garment_des: 'clothing item',
        is_checked:  true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
      },
    } as any);

    return {
      providerJobId: prediction.id,
      status:        prediction.status === 'succeeded' ? 'completed'
                   : prediction.status === 'failed'    ? 'failed'
                   : 'processing',
      outputUrl:     Array.isArray(prediction.output) ? prediction.output[0] : prediction.output ?? undefined,
      error:         prediction.error ? String(prediction.error) : undefined,
    };
  }

  async pollResult(providerJobId: string, _jobType: string): Promise<GenerationResult> {
    const prediction = await client.predictions.get(providerJobId);
    return {
      providerJobId: prediction.id,
      status:        prediction.status === 'succeeded' ? 'completed'
                   : prediction.status === 'failed'    ? 'failed'
                   : 'processing',
      outputUrl:     Array.isArray(prediction.output) ? prediction.output[0] : prediction.output ?? undefined,
      error:         prediction.error ? String(prediction.error) : undefined,
    };
  }
}
