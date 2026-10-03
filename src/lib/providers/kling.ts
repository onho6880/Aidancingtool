import axios from 'axios';
import { BaseProvider, GenerationResult } from './base';

// Kling AI (Kuaishou) API integration
// Docs: https://klingai.com/dev
const BASE_URL = 'https://api.klingai.com/v1';

function getHeaders() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${process.env.KLING_API_KEY || ''}`,
  };
}

export class KlingProvider extends BaseProvider {
  name = 'kling';

  async motionCopy(input: { characterImageUrl: string; motionVideoUrl: string; prompt?: string }): Promise<GenerationResult> {
    const { data } = await axios.post(`${BASE_URL}/images/generations/kolors-virtual-try-on`, {
      // Kling uses their own motion-copy endpoint — adjust when API is available
      human_image:  input.characterImageUrl,
      motion_video: input.motionVideoUrl,
      prompt:       input.prompt || '',
    }, { headers: getHeaders() });

    return this._mapResponse(data);
  }

  async imageToVideo(input: { imageUrl: string; prompt: string; duration?: number }): Promise<GenerationResult> {
    const { data } = await axios.post(`${BASE_URL}/videos/image2video`, {
      model:    'kling-v1-5',
      image_url: input.imageUrl,
      prompt:    input.prompt,
      duration:  String(input.duration || 5),
      cfg_scale: 0.5,
    }, { headers: getHeaders() });

    return this._mapResponse(data?.data?.task);
  }

  async clothesChange(input: { modelImageUrl: string; garmentImageUrl: string }): Promise<GenerationResult> {
    const { data } = await axios.post(`${BASE_URL}/images/generations/kolors-virtual-try-on`, {
      human_image:   input.modelImageUrl,
      garment_image: input.garmentImageUrl,
    }, { headers: getHeaders() });

    return this._mapResponse(data?.data);
  }

  async pollResult(providerJobId: string, jobType: string): Promise<GenerationResult> {
    const endpoint = jobType === 'image-to-video'
      ? `${BASE_URL}/videos/image2video/${providerJobId}`
      : `${BASE_URL}/images/generations/${providerJobId}`;

    const { data } = await axios.get(endpoint, { headers: getHeaders() });
    return this._mapResponse(data?.data?.task || data?.data);
  }

  private _mapResponse(task: any): GenerationResult {
    if (!task) throw new Error('Invalid Kling API response');
    const statusMap: Record<string, GenerationResult['status']> = {
      submitted: 'processing',
      processing: 'processing',
      succeed: 'completed',
      failed: 'failed',
    };
    return {
      providerJobId: task.task_id || task.id,
      status:        statusMap[task.task_status] || 'processing',
      outputUrl:     task.task_result?.videos?.[0]?.url || task.task_result?.images?.[0]?.url,
      error:         task.task_status_msg,
    };
  }
}
