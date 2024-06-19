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
 * @method generateTextByUserDescription - Generates text based on the user's description and additional information using
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
      model: 'gpt-4o',
      temperature: 1,
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

  public async create(
    description: string,
    additionalDescription?: string,
  ): Promise<ResponsePostDto> {
    // const postImage = await this.generateAiImage(description);
    const postText = await this.generateTextByUserDescription(
      description,
      additionalDescription,
    );
    const newPost = new this.postModel({
      text: postText.response,
      image:
        'https://oaidalleapiprodscus.blob.core.windows.net/private/org-LORzMiTprZXrpqAURZlW3wGi/user-XC9g35RLbkFcklRoNpOivFLg/img-L91yynTa1Rf9oXz5nZEtoyzs.png?st=2024-06-18T11%3A13%3A16Z&se=2024-06-18T13%3A13%3A16Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-06-17T19%3A26%3A47Z&ske=2024-06-18T19%3A26%3A47Z&sks=b&skv=2023-11-03&sig=uICqmTyGd48N8AXbnWhsvIdraMdGtrkEW2iG5hpuTp4%3D',
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
    try {
      const imagePrompt = PromptTemplate.fromTemplate(`
      Based on the following user ${description}, you need to generate a main realistic photo for the blog post. It must be a realistic photo only, no pictures. The photo should be a visual representation of the blog post's content and theme.
        `);
      const prompt = await imagePrompt.format({ description });
      const image_url = await this.openAIImage.invoke(prompt);
      return image_url;
    } catch (error: any) {
      throw new Error(error);
    }
  }
  public async generateTextByUserDescription(
    description: string,
    additionalDescription?: string,
  ) {
    try {
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Based on the following description and ${additionalDescription}, write a professional blog post in HTML format with HTML text markup tags to insert in the <body> section.
          The generated blog post should be modern, contain multiple paragraphs, lists, etc., and be well-styled in HTML format. Use inline CSS for a better appearance. Include references as a link in the Vancouver style at the end of the post. Add links from the internet that have similar posts or information. The post should look like a scientific article with 5 headings and be 2000 words in length.`,
        ],
        [
          'system',
          'The post should be at least 2000 words in length in HTML format without head tags.All Blog text should be black. h2 text - "font-weight: bold". Blog main text should have "font-size: 18px; color: black; line-height: 1.6; font-family: Arial, sans-serif;"',
        ],
        [
          'system',
          'Do not explain yourself, just give the answer to the question.',
        ],
        [
          'system',
          'Do not use body, html, or DOCTYPE html tags. Only use tags for markup.',
        ],
        ['system', 'Use some inline CSS for better appearance.'],
        [
          'user',
          `Write the introduction and the first section (400-500 words) for a four-page magazine article on the topic: ${description}. Use HTML tags and inline CSS for styling.`,
        ],
      ]);

      const chain = prompt.pipe(this.openAI);

      // Get the result for the first part
      let result = await chain.invoke({
        input: `Write the introduction and the first section (400-500 words) for a four-page magazine article on the topic: ${description}. Use HTML tags and inline CSS for styling.`,
      });
      let AIResponse = result.content.toString();

      // Append the result for the next parts
      result = await chain.invoke({
        input: `Write the main sections (800-1000 words) as a continuation of the previous post on the topic: ${description}. Use the same HTML tags and inline CSS for styling.`,
      });
      AIResponse += result.content.toString();

      result = await chain.invoke({
        input: `Write the conclusion and final thoughts (400-500 words) for the previous post on the topic: ${description}. Write only the conclusion and final thoughts, do not repeat previous parts. Use the same HTML tags and inline CSS for styling.`,
      });
      AIResponse += result.content.toString();

      result = await chain.invoke({
        input: `For previous post write a list (<ul><li><li/><ul/>) of references as links in that style -[1] - https://www.bankrate.com/real-estate/renting-an-apartment-pros-and-cons/.. Include links from the internet that have similar posts or information relevant to the previous content.`,
      });
      console.log('====================================');
      console.log(result.content.toString());
      console.log('====================================');
      AIResponse += result.content.toString();

      return {
        response: AIResponse,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
