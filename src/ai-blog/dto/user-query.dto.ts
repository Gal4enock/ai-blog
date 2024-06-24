/**
 * Data Transfer Object (DTO) for basic message processing.
 *
 * This class defines the structure and validation rules for handling a basic
 * user query related to message processing. It ensures that the data received
 * from client requests adheres to specific format and content requirements.
 * The DTO uses decorators from the 'class-validator' library for validation.
 *
 * @class BasicMessageDto
 *
 * @property {string} userPrompt - The main query string provided by the user.
 *                                 It must be a non-empty string.
 * @property {string} [additionalPrompt] - Optional additional text provided by the user.
 * @property {string} [articleLength] - Optional enumeration representing the desired
 *                                      length of an article, defined by values in the
 *                                      ArticleLength enum.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ArticleLength {
  SHORT = '4',
  MEDIUM = '5',
  LONG = '6',
  EXTRA_LONG = '8',
  ULTRA_LONG = '10',
}

export class BasicMessageStremDto {
  @ApiProperty({
    description: 'Text content of the post',
    example: 'Online marketplace and hospitality services',
  })
  @IsNotEmpty()
  @IsString()
  userPrompt: string;
  @ApiProperty({
    description: 'Text to add some specific info to post',
    example: 'Slogan: Belong anywhere with My Trevel Company.',
  })
  @IsString()
  @IsOptional()
  additionalPrompt: string;

  @ApiProperty({
    enum: ArticleLength,
  })
  @IsOptional()
  articleLength: string;
}

export class BasicCreatePostDto {
  @ApiProperty({
    description: 'Text content of the post',
    example: 'Online marketplace and hospitality services',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
  @ApiProperty({
    description: 'Text to add some specific info to post',
    example: 'Slogan: Belong anywhere with My Trevel Company.',
  })
  @IsString()
  @IsNotEmpty()
  postText: string;
}
