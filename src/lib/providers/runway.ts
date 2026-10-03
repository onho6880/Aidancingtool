import axios from 'axios';
import { BaseProvider, GenerationResult } from './base';

// RunwayML Gen3 API
// Docs: https://docs.runwayml.com/docs/gen-3-alpha-turbo
const BASE_URL  = 'https://api.dev.runwayml.com/v1';
const API_TOKEN = () => process.env.RUNWAYML_API_SECRET || '';

function getHeaders() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${API_TOKEN()}`,
    'X-Runway-Version': '2024-11-06',
  };
}

export class RunwayProvider extends BaseProvider {
  name = 'runway';

  // RunwayML doesn't have a dedicated motion-copy, delegate to imageToVideo
  async motionCopy(input: { characterImageUrl: string; motionVideoUrl: string; prompt?: string }): Promise<GenerationResult> {
    return this.imageToVideo({
      imageUrl: input.characterImageUrl,
      prompt:   input.prompt || 'A person performing energetic dance moves',
    });
  }

  async imageToVideo(input: { imageUrl: string; prompt: string; duration?: number }): Promise<GenerationResult> {
    const { data } = await axios.post(`${BASE_URL}/image_to_video`, {
      model:        'gen3a_turbo',
      promptImage:  input.imageUrl,
      promptText:   input.prompt,
      duration:     input.duration || 5,
      ratio:        '1280:768',
    }, { headers: getHeaders() });

    return {
      providerJobId: data.id,
      status:        'processing',
    };
  }

  // RunwayML doesn't have virtual try-on — throw to indicate unsupported
  async clothesChange(_input: { modelImageUrl: string; garmentImageUrl: string }): Promise<GenerationResult> {
    throw new Error('RunwayML does not support Clothes Change. Please use provider=replicate.');
  }

  async pollResult(providerJobId: string, _jobType: string): Promise<GenerationResult> {
    const { data } = await axios.get(`${BASE_URL}/tasks/${providerJobId}`, { headers: getHeaders() });
    const statusMap: Record<string, GenerationResult['status']> = {
      PENDING:   'processing',
      RUNNING:   'processing',
      SUCCEEDED: 'completed',
      FAILED:    'failed',
    };
    return {
      providerJobId: data.id,
      status:        statusMap[data.status] || 'processing',
      outputUrl:     data.output?.[0],
      error:         data.failure || data.failureCode,
    };
  }
}
