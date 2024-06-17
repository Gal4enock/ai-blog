/**
 * Service for handling Langchain Chat and AI-related operations.
 *
 * This service is responsible for processing user chat messages and generating images
 * using OpenAI's language models and creating blog posts with HTML content based on
 * user prompts. It integrates with OpenAI's GPT-3.5-turbo model for generating text
 * responses and formatting them as HTML blog posts. Additionally, it manages the
 * creation and updating of posts in the database.
 *
 * @class AiService
 * @decorator Injectable - Marks the class as a service that can be injected.
 *
 * @property openAIkey - The API key for accessing OpenAI services.
 * @property openAI - An instance of the ChatOpenAI class configured with the OpenAI API key.
 *
 * @constructor - Initializes the service with a dependency on the Post model and sets up
 *                the OpenAI client.
 *
 * @method toResponsePostDto - Converts a PostDocument object to a ResponsePostDto object.
 *
 * @method create - Creates a new post by generating text based on the user's description.
 *
 * @method update - Updates an existing post with new content.
 *
 * @method generateAiImage - Generates an image based on the provided user prompt using the Dall-E model.
 *
 * @method generateTextByUserDescription - Generates text based on the user's description using
 *                                         the OpenAI model and a prompt template.
 *
 * @param description - The description provided by the user for generating text.
 * @param postDto - The data transfer object containing the post's details to be updated.
 * @param params - The parameters for generating an image, including the user prompt.
 * @param postDocument - The Mongoose document representing a post in the database.
 *
 * @throws HttpException - Throws an exception in case of errors during processing.
 */

import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { DallEAPIWrapper } from '@langchain/openai';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ResponsePostDto, UpdatePostDto } from './dto/ai-post.dto';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class AiService {
  private openAIkey = process.env.OPENAI_KEY;

  private openAI: ChatOpenAI;
  private openAIImage: DallEAPIWrapper;

  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {
    this.openAI = new ChatOpenAI({
      openAIApiKey: this.openAIkey,
      model: 'gpt-3.5-turbo',
    });

    this.openAIImage = new DallEAPIWrapper({
      n: 1,
      model: 'dall-e-3',
      size: '1792x1024',
      apiKey: this.openAIkey,
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
    const postImage = await this.generateAiImage(description);
    const postText = await this.generateTextByUserDescription(description);
    const newPost = new this.postModel({
      text: postText.response,
      image: postImage,
      description,
    });
    const savedPost = await newPost.save();
    return this.toResponsePostDto(savedPost);
  }

  public async update(postDto: UpdatePostDto): Promise<ResponsePostDto | null> {
    const { id, ...restDto } = postDto;
    let newImage = null;
    const blogPost = await this.postModel.findById(id);
    if (!blogPost) {
      throw new Error('No posts available');
    }
    if (restDto.image) {
      newImage = await this.generateAiImage(blogPost.description);
    }

    return this.postModel.findByIdAndUpdate(
      id,
      { text: restDto.text, image: restDto.image ? newImage : blogPost.image },
      { new: true },
    );
  }

  public async generateAiImage(description: string) {
    console.log(description);

    try {
      const imagePrompt = PromptTemplate.fromTemplate(`
      Based on the following user ${description}, you need to generate a main photo for the blog post. It should be a realistic image or photo. Make sure not to include the title of the blog post in the image. The image should be a visual representation of the blog post's content and theme.
        `);
      const prompt = await imagePrompt.format({ description });
      const image_url = await this.openAIImage.invoke(prompt);
      return image_url;
    } catch (error: any) {
      throw new Error(error);
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
        [
          'system',
          'Do not use body, html, DOCTYPE html tags. Only tags for markup',
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
