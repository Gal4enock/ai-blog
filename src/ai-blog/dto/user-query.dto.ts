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
import { IsNotEmpty, IsString } from 'class-validator';

export class BasicMessageDto {
  @ApiProperty({
    description: 'Text content of the post',
    example: 'I want a post about kittens',
  })
  @IsNotEmpty()
  @IsString()
  userPrompt: string;
}
