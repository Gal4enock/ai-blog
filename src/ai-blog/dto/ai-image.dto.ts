/**
 * Interface definitions for AI image generation parameters.
 *
 * These interfaces define the structure of objects used to configure and generate
 * images using AI-based algorithms. They provide a clear contract for the properties
 * that can be passed to methods responsible for generating images.
 *
 * @interface AiImageGenerationSchema
 *
 * @property prompt - The main text prompt or description used to generate the image.
 * @property negative_prompt - Optional. Additional prompt to influence the generation in a negative direction.
 * @property width - Optional. Width of the generated image in pixels.
 * @property height - Optional. Height of the generated image in pixels.
 * @property creativity - Optional. Degree of creativity or style variation in the generated image.
 * @property img_count - Optional. Number of images to generate.
 *
 * @interface UserImageGenerationSchema
 *
 * @property prompt - The main text prompt or description provided by the user for image generation.
 */

export interface AiImageGenerationSchema {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  creativity?: number;
  img_count?: number;
}
export interface UserImageGenerationSchema {
  prompt: string;
}
