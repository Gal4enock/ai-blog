/**
 * Controller for handling AI blog operations.
 *
 * This controller defines endpoints for creating and updating blog posts using AI services.
 * It utilizes decorators from the '@nestjs/common' library to define routes and their corresponding
 * handlers. The controller integrates with the `AiService` to perform operations such as creating
 * new blog posts based on user prompts and updating existing posts.
 *
 * @class AiController
 *
 * @constructor Initializes the controller with a dependency on `AiService`.
 *
 * @method create Handles POST requests to '/generate-blogpost'.
 *               It creates a new blog post using the provided user prompt and returns
 *               a `ResponsePostDto` representing the created post.
 *
 * @param userPrompt - The user prompt used to generate the blog post content.
 *
 * @returns A promise resolving to a `ResponsePostDto` or null if the operation fails.
 *
 * @method updatePost Handles PUT requests to '/modify-blogpost'.
 *                    It updates an existing blog post with new content provided in
 *                    the `UpdatePostDto` and returns a `ResponsePostDto` representing
 *                    the updated post.
 *
 * @param updatePostDto - The data object containing the ID and updated content of the post.
 *
 * @returns A promise resolving to a `ResponsePostDto` or null if the operation fails.
 */

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { ResponsePostDto, UpdatePostDto } from './dto/ai-post.dto';
import { BasicMessageDto } from './dto/user-query.dto';

@ApiTags('Ai blog')
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-blogpost')
  @ApiOperation({ summary: 'Create AI post' })
  @ApiBody({ type: BasicMessageDto })
  @ApiResponse({
    status: 201,
    description: 'The created record',
    type: ResponsePostDto,
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() userPrompt: string): Promise<ResponsePostDto | null> {
    try {
      return this.aiService.create(userPrompt);
    } catch (error: any) {
      console.error('Error in creating AI post:', error);
      throw new Error('Failed to create AI post');
    }
  }

  @Put('modify-blogpost')
  @ApiOperation({ summary: 'Upddated post' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({
    status: 200,
    description: 'The updated record',
    type: ResponsePostDto,
  })
  updatePost(
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ResponsePostDto | null> {
    try {
      return this.aiService.update(updatePostDto);
    } catch (error: any) {
      console.error('Error in updating AI post:', error);
      throw new Error('Failed to update AI post');
    }
  }
}
