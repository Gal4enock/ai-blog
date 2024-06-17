/**
 * Controller responsible for handling web endpoints related to AI blog operations.
 *
 * This controller manages routes for generating text content based on user input,
 * saving generated content updates, and regenerating images associated with blog posts.
 * It interacts with the AiController to delegate specific business logic tasks related
 * to creating and updating blog posts using AI services.
 *
 * @class AppController
 *
 * @constructor Initializes the controller with a dependency on `AiController`.
 *
 * @method root Handles GET requests to the root URL ('/').
 *             Renders the 'index' template.
 *
 * @method generateText Handles POST requests to '/generate'.
 *                     Calls the 'create' method of `AiController` to generate a new blog post
 *                     based on the provided 'description'. Returns the generated HTML content,
 *                     post ID, and associated image.
 *
 * @param description - The user-provided description used for generating blog content.
 *
 * @returns An object containing HTML content, post ID, and associated image.
 *
 * @method saveContent Handles POST requests to '/save-content'.
 *                    Calls the 'updatePost' method of `AiController` to update an existing blog post
 *                    identified by 'postId' with new 'content'. Returns the updated HTML content,
 *                    post ID, and associated image.
 *
 * @param postId - The ID of the post to update.
 * @param content - The updated content for the post.
 *
 * @returns An object containing updated HTML content, post ID, and associated image.
 *
 * @method regenerateImage Handles POST requests to '/regenerate-image'.
 *                        Calls the 'updatePost' method of `AiController` to update an existing blog post
 *                        identified by 'postId' with a new 'image'. Returns the updated HTML content,
 *                        post ID, and updated image.
 *
 * @param postId - The ID of the post to update.
 * @param image - The new image URL or data for the post.
 *
 * @returns An object containing updated HTML content, post ID, and updated image.
 *
 * @throws Error - Throws an error if any operation fails during text generation, content saving,
 *                or image regeneration.
 *  */

import { Body, Controller, Get, Post, Render, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { AiController } from './ai-blog/ai.controller';

@Controller()
export class AppController {
  constructor(private readonly aiController: AiController) {}

  @Get()
  @Render('index')
  @ApiExcludeEndpoint()
  root() {
    return {};
  }

  @Post('generate')
  @Render('index')
  @ApiExcludeEndpoint()
  async generateText(@Body('description') description: string) {
    try {
      const result = await this.aiController.create(description);
      if (!result) {
        throw new Error('No generated post');
      }
      return {
        htmlContent: result.text,
        postId: result._id,
        image: result.image,
      };
    } catch (error: any) {
      console.error('Error in generating text:', error);
      return { htmlContent: '', postId: '', image: '' };
    }
  }

  @Post('save-content')
  @Render('index')
  @ApiExcludeEndpoint()
  async saveContent(
    @Body('postId') postId: string,
    @Body('content') content: string,
    @Res() res: Response,
  ) {
    try {
      const post = await this.aiController.updatePost({
        id: postId,
        text: content,
      });
      return { htmlContent: post?.text, postId: post?._id, image: post?.image };
    } catch (error: any) {
      console.error('Error in saving content:', error);
      return { htmlContent: '', postId: '', image: '' };
    }
  }

  @Post('regenerate-image')
  @Render('index')
  @ApiExcludeEndpoint()
  async regenerateImage(
    @Body('postId') postId: string,
    @Body('image') image: string,
    @Res() res: Response,
  ) {
    try {
      const post = await this.aiController.updatePost({
        id: postId,
        image: image,
      });
      return { htmlContent: post?.text, postId: post?._id, image: post?.image };
    } catch (error: any) {
      console.error('Error in saving content:', error);
      return { htmlContent: '', postId: '', image: '' };
    }
  }
}
