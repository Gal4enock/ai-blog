/**
 * Data Transfer Object for basic message processing.
 *
 * This class defines the data structure and validation rules for handling a basic
 * user query. It utilizes decorators from the 'class-validator' library to enforce
 * validation constraints on the data received from client requests. This ensures
 * that the user query adheres to the expected format and content requirements.
 *
 * @class BasicMessageDto
 *
 * @property userPrompt - The query string provided by the user.
 *                        It must be a non-empty string.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BasicMessageDto {
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
}
