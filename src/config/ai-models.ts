export interface AIModel {
  id: string;
  name: string;
  replicateId: string; // The model path or version ID
  type: 'image' | 'text' | 'utility';
  description: string;
  cost: string;
  features: {
    resolution: boolean;
    safety_filter: boolean;
    multi_reference?: boolean;
  };
}

export const AI_MODELS: Record<string, AIModel> = {
  'background-remover': {
    id: 'background-remover',
    name: 'Background Remover (851-labs)',
    replicateId: '851-labs/background-remover',
    type: 'utility',
    description: 'Specialized model for removing backgrounds (RGBA output).',
    cost: '~$0.02/image',
    features: {
      resolution: false,
      safety_filter: false
    }
  },
  'nano-banana-pro': {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    replicateId: 'google/nano-banana-pro',
    type: 'image',
    description: 'High quality, supports resolution control.',
    cost: '~$0.15/image',
    features: {
      resolution: true,
      safety_filter: true,
      multi_reference: true
    }
  },
  'nano-banana': {
    id: 'nano-banana',
    name: 'Nano Banana',
    replicateId: 'google/nano-banana',
    type: 'image',
    description: 'Standard version, faster generation.',
    cost: '~$0.04/image',
    features: {
      resolution: false,
      safety_filter: false,
      multi_reference: true
    }
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'OpenAI GPT-5',
    replicateId: 'openai/gpt-5',
    type: 'text',
    description: 'Advanced reasoning for text translation.',
    cost: '~$0.01/1k tokens',
    features: {
      resolution: false,
      safety_filter: false
    }
  },
  'gemini-3-pro': {
    id: 'gemini-3-pro',
    name: 'Google Gemini 3 Pro',
    replicateId: 'google/gemini-3-pro',
    type: 'text',
    description: 'Google\'s latest reasoning model. Fast and accurate.',
    cost: '~$0.005/1k tokens',
    features: {
      resolution: false,
      safety_filter: false
    }
  }
};

export const DEFAULT_MODEL_ID = 'nano-banana-pro';
export const DEFAULT_TEXT_MODEL_ID = 'gemini-3-pro';