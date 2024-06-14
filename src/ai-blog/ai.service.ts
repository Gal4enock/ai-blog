/**
 * Service for handling Langchain Chat and AI-related operations.
 *
 * This service is responsible for processing user chat messages and handling image generation
 * by leveraging OpenAI's language models and Stability AI's image generation capabilities. It
 * transforms user input using a prompt template, processes it through the ChatOpenAI model, and
 * then formats the response appropriately before sending it back to the user. Additionally, it
 * handles the generation of images based on user-provided prompts and manages the creation and
 * updating of posts in the database.
 *
 * @class AiService
 * @decorator Injectable - Marks the class as a service that can be injected.
 *
 * @property stabilityAIapiHost - The base URL for the Stability AI API.
 * @property stabilityAIkey - The API key for accessing the Stability AI services.
 * @property openAIkey - The API key for accessing OpenAI services.
 * @property stabilityAIapiHeaders - The headers used for Stability AI API requests.
 * @property openAI - An instance of the ChatOpenAI class configured with the OpenAI API key.
 *
 * @method generateSeed - Generates a random seed value.
 *
 * @constructor - Initializes the service with a dependency on the Post model and sets up the
 *                Stability AI and OpenAI clients.
 *
 * @method toResponsePostDto - Converts a PostDocument object to a ResponsePostDto object.
 *
 * @method create - Creates a new post by generating text based on the user's description.
 *
 * @method update - Updates an existing post with new content.
 *
 * @method generateImage - Generates an image based on the provided user prompt.
 *
 * @method generateTextByUserDescription - Generates text based on the user's description using
 *                                         the OpenAI model and a prompt template.
 *
 * @param description - The description provided by the user for generating text.
 * @param postDto - The data transfer object containing the post's details to be updated.
 * @param params - The parameters for generating an image, including the user prompt.
 * @param postDocument - The Mongoose document representing a post in the database.
 * @param StabilityAIFinishReason - Enum representing the possible finish reasons for Stability AI responses.
 * @param StabilityAIRawResponse - Union type representing the raw response from the Stability AI API.
 * @param StabilityFormattedImageResponse - Interface representing the formatted response from the Stability AI API.
 * @param prompt - The prompt template used for generating text.
 * @param chain - The chain of operations for processing the prompt through the OpenAI model.
 * @param result - The result of the OpenAI model's processing.
 *
 * @throws HttpException - Throws an exception in case of errors during processing.
 */

import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  AiImageGenerationSchema,
  UserImageGenerationSchema,
} from './dto/ai-image.dto';
import { ResponsePostDto, UpdatePostDto } from './dto/ai-post.dto';
import { Post, PostDocument } from './schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
enum StabilityAIFinishReason {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
}

type StabilityAIRawResponse =
  | {
      artifacts: {
        seed: number;
        finishReason: StabilityAIFinishReason;
        base64: string;
      }[];
    }
  | {
      message: string;
    };

const isStabilityResponseErrored = (
  response: StabilityAIRawResponse,
): response is { message: string } => {
  return !!(response as { message: string }).message;
};

export interface StabilityFormattedImageResponse
  extends Required<Omit<AiImageGenerationSchema, 'negative_prompt'>> {
  fileUrl: string[];
  seed: number;
  finishReason: StabilityAIFinishReason;
}

@Injectable()
export class AiService {
  private stabilityAIapiHost = 'https://api.stability.ai';
  private stabilityAIkey = '';

  private openAIkey = process.env.OPENAI_KEY;
  private stabilityAIapiHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${this.stabilityAIkey}`,
  };

  private openAI: ChatOpenAI;
  public generateSeed = (): number => Math.floor(Math.random() * 1000000000);

  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {
    console.log(
      '[*] Stability AI client initialized with key: ',
      this.stabilityAIkey,
    );

    this.openAI = new ChatOpenAI({
      openAIApiKey: this.openAIkey,
      model: 'gpt-3.5-turbo',
    });

    console.log('[*] OpenAI client initialized with key: ', this.openAIkey);
  }
  private toResponsePostDto(postDocument: PostDocument): ResponsePostDto {
    return {
      _id: (postDocument._id as Types.ObjectId).toString(),
      image: postDocument.image,
      text: postDocument.text,
    };
  }
  public async create(description: string): Promise<ResponsePostDto> {
    const postText = await this.generateTextByUserDescription(description);
    // const postImage = await this.generateImage({ prompt: description });
    const newPost = new this.postModel({ text: postText.response });
    const savedPost = await newPost.save();
    return this.toResponsePostDto(savedPost);
  }

  public async update(postDto: UpdatePostDto): Promise<ResponsePostDto | null> {
    const { id, ...restDto } = postDto;

    return this.postModel.findByIdAndUpdate(id, restDto, { new: true });
  }
  public async generateImage(
    params: UserImageGenerationSchema,
  ): Promise<StabilityFormattedImageResponse> {
    try {
      const body = {
        steps: 40,
        width: 512,
        height: 512,
        seed: this.generateSeed(),
        cfg_scale: 35,
        samples: 1,
        text_prompts: [
          {
            text: params.prompt,
            weight: 1,
          },
        ],
      };

      let stabilityResponse: StabilityAIRawResponse;

      const path = `${this.stabilityAIapiHost}/v1/generation/stable-diffusion-v1-6/text-to-image`;

      stabilityResponse = await fetch(path, {
        headers: this.stabilityAIapiHeaders,
        method: 'POST',
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .catch((error) => {
          console.log('error', error);
          throw new Error(error.message);
        });

      if (isStabilityResponseErrored(stabilityResponse)) {
        throw new Error(stabilityResponse.message);
      }
      if (stabilityResponse.artifacts.length < 1) {
        throw new Error('No artifacts found');
      }
      const fileUrl = [];
      for (const item of stabilityResponse.artifacts) {
        const imgUrl = item.base64;
        fileUrl.push(imgUrl);
      }

      const result: StabilityFormattedImageResponse = {
        prompt: `${params.prompt} `,
        height: body.height,
        width: body.width,
        creativity: body.cfg_scale,
        img_count: 1,
        seed: stabilityResponse.artifacts[0].seed,
        finishReason: stabilityResponse.artifacts[0].finishReason,
        fileUrl,
      };

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async generateTextByUserDescription(description: string) {
    try {
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Based on the following description - generate a blog post in HTML format with HTML text markup tags to incert in <body>.
          The generated blog post should be modern, contain multiple paragraphs, lists etc,
          and be very good styled in be styled in HTML format. Blog Post should be 1500-2000 words length. Use inline css for it looks better.`,
        ],
        [
          'system',
          'Post should be 1500-2000 words length in HTML format wothout head tags',
        ],
        [
          'system',
          'Do not explain yourself, just give answer to the question.',
        ],
        ['system', 'Use some inline css for it looks better.'],
        ['user', '{input}'],
      ]);

      const chain = prompt.pipe(this.openAI);

      const result = await chain.invoke({
        input: description,
      });
      const AIResponse = result.content.toString();

      return {
        response: AIResponse,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
