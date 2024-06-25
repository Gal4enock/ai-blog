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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AiService } from './ai.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { ResponsePostDto, UpdatePostDto } from './dto/ai-post.dto';
import {
  BasicCreatePostDto,
  BasicGenerateImageDto,
  ImageCreatedDto,
} from './dto/user-query.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@ApiTags('Ai blog')
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload PDF files',
    required: true,
    schema: {
      type: 'object',
      properties: {
        infoContent: {
          type: 'string',
          format: 'binary',
        },
        sampleText: {
          type: 'string',
          format: 'binary',
        },
        sampleKeywords: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'infoContent', maxCount: 1 },
        { name: 'sampleText', maxCount: 1 },
        { name: 'sampleKeywords', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            cb(null, file.fieldname + '.pdf');
          },
        }),
      },
    ),
  )
  async uploadFile(
    @UploadedFiles()
    files: {
      infoContent?: Express.Multer.File[];
      sampleText?: Express.Multer.File[];
      sampleKeywords?: Express.Multer.File[];
    },
  ) {
    return {
      message: 'File uploaded successfully',
    };
  }

  @Post('save-blogpost')
  @ApiOperation({ summary: 'Create AI post in data-base' })
  @ApiBody({ type: BasicCreatePostDto })
  @ApiResponse({
    status: 201,
    description: 'The created record',
    type: ResponsePostDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async save(
    @Body() blogPrompt: BasicCreatePostDto,
  ): Promise<ResponsePostDto | null> {
    try {
      const { description, postText, imageUrl } = blogPrompt;

      const post = await this.aiService.create(description, postText, imageUrl);
      return post;
    } catch (error: any) {
      console.error('Error in creating AI post:', error);
      throw new Error('Failed to create AI post');
    }
  }

  @Post('generate-image')
  @ApiOperation({ summary: 'Create AI post photo' })
  @ApiBody({ type: BasicGenerateImageDto })
  @ApiResponse({
    status: 201,
    description: 'The image created',
    type: ImageCreatedDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async generateImage(
    @Body() blogPrompt: BasicGenerateImageDto,
  ): Promise<string | null> {
    try {
      const { description } = blogPrompt;

      const image_url = await this.aiService.generateAiImage(description);
      return image_url;
    } catch (error: any) {
      console.error('Error in creating AI post photo:', error);
      throw new Error('Failed to create AI post photo');
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
  async updatePost(
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ResponsePostDto | null> {
    try {
      const updatedPost = await this.aiService.update(updatePostDto);
      return updatedPost;
    } catch (error: any) {
      console.error('Error in updating AI post:', error);
      throw new Error('Failed to update AI post');
    }
  }
}
