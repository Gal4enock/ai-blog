/**
 * Controller for rendering the front-end part of the application.
 *
 * This controller handles HTTP requests for rendering and processing data on the front-end.
 * It utilizes decorators from the '@nestjs/common' library to define routes and their corresponding
 * handlers. The controller integrates with the AI service through the `AiController` to generate and
 * update posts based on user input. This class is excluded from the Swagger documentation using
 * the `@ApiExcludeEndpoint` decorator, as it is intended solely for rendering the front-end part of the application.
 *
 * @class AppController
 *
 * @constructor - Initializes the controller with a dependency on `AiController`.
 *
 * @method root - Handles GET requests to the root URL and renders the 'index' view.
 *
 * @method generateText - Handles POST requests to the '/generate' URL.
 *                        It generates text based on the user's description and renders the 'index' view with the generated content.
 *
 * @method saveContent - Handles POST requests to the '/save-content' URL.
 *                       It saves the updated content of a post and renders the 'index' view with the saved content.
 *
 * @param description - The description provided by the user for generating text.
 * @param postId - The unique identifier of the post.
 * @param content - The updated content of the post.
 */

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

      return { htmlContent: result?.text, postId: result?._id };
    } catch (error: any) {
      console.error('Error in generating text:', error);
      return { htmlContent: '', postId: '' };
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
      return { htmlContent: post?.text, postId: post?._id };
    } catch (error: any) {
      console.error('Error in saving content:', error);
      return { htmlContent: '', postId: '' };
    }
  }
}
