export interface GenerationInput {
  type: 'motion-copy' | 'image-to-video' | 'clothes-change';
  [key: string]: unknown;
}

export interface GenerationResult {
  providerJobId: string;
  status:        'processing' | 'completed' | 'failed';
  outputUrl?:    string;
  error?:        string;
}

export abstract class BaseProvider {
  abstract name: string;

  abstract motionCopy(input: {
    characterImageUrl: string;
    motionVideoUrl:    string;
    prompt?:           string;
  }): Promise<GenerationResult>;

  abstract imageToVideo(input: {
    imageUrl:  string;
    prompt:    string;
    duration?: number;
  }): Promise<GenerationResult>;

  abstract clothesChange(input: {
    modelImageUrl:    string;
    garmentImageUrl:  string;
  }): Promise<GenerationResult>;

  // Poll for result of an async job
  abstract pollResult(providerJobId: string, jobType: string): Promise<GenerationResult>;
}
