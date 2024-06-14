/**
 * Data Transfer Objects for handling post creation, updating, and response formatting.
 *
 * These classes define the data structures and validation rules for handling post-related
 * operations such as creating, updating, and formatting responses. They utilize decorators
 * from the 'class-validator' library to enforce validation constraints on the data received
 * from client requests, ensuring that the post data adheres to the expected format and
 * content requirements. Additionally, the 'nestjs/swagger' decorators are used to provide
 * metadata for automatic API documentation generation.
 *
 * @class CreatePostDto
 * @class UpdatePostDto
 * @class ResponsePostDto
 *
 * @property image - The URL of the image associated with the post.
 *                   It must be a string.
 * @property text - The text content of the post.
 *                  It must be a string.
 * @property id - The unique identifier of the post.
 *                It must be a string (only in UpdatePostDto).
 * @property _id - The unique identifier of the post in the database.
 *                 It must be a string (only in ResponsePostDto).
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'URL of the image',
    example: 'http://example.com/image.jpg',
  })
  @IsString()
  readonly image?: string;
  @ApiProperty({
    description: 'Text content of the post',
    example: 'This is a sample post.',
  })
  @IsString()
  readonly text: string;
}
export class UpdatePostDto extends CreatePostDto {
  id: string;
}

export class ResponsePostDto extends CreatePostDto {
  @ApiProperty({
    description: 'The unique identifier of the post',
    example: '666c523f48d96faa55963847',
  })
  _id: string;
}
