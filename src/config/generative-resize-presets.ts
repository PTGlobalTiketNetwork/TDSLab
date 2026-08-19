/**
 * Generates a strict instruction prompt based on the target ratio.
 * @param ratio - The selected aspect ratio (e.g., "16:9")
 */
export const generateResizePrompt = (ratio: string): string => {
  const ratioText = ratio === 'match_input_image' ? 'matching input' : ratio;
  return `Resize this banner to ${ratioText} aspect ratio. Preserve all text legibility and key elements. Seamlessly extend the background to fill the new dimensions while maintaining the original visual style and lighting.`;
};

export const AVAILABLE_RATIOS = [
  { label: 'Square (1:1)', value: '1:1' },
  { label: 'Portrait (2:3)', value: '2:3' },
  { label: 'Landscape (3:2)', value: '3:2' },
  { label: 'Portrait (3:4)', value: '3:4' },
  { label: 'Landscape (4:3)', value: '4:3' },
  { label: 'Portrait (4:5)', value: '4:5' },
  { label: 'Landscape (5:4)', value: '5:4' },
  { label: 'Vertical (9:16)', value: '9:16' },
  { label: 'Landscape Wide (16:9)', value: '16:9' },
  { label: 'Cinema (21:9)', value: '21:9' },
  { label: 'Match Input Image', value: 'match_input_image' }
];

export const AVAILABLE_RESOLUTIONS = [
  { label: '1K (Standard)', value: '1K' },
  { label: '2K (High Quality - Default)', value: '2K' },
  { label: '4K (Ultra HD)', value: '4K' }
];
