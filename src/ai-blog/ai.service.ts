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
import {
  ChatPromptTemplate,
  PromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RunnableConfig,
  RunnableWithMessageHistory,
} from '@langchain/core/runnables';
import { ChatMessageHistory } from '@langchain/community/stores/message/in_memory';
import { Socket } from 'socket.io';

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
    postText: string,
    imageUrl: string,
  ): Promise<ResponsePostDto> {
    const newPost = new this.postModel({
      text: postText,
      image: imageUrl,
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
      const imagePrompt = PromptTemplate.fromTemplate(
        `Generate a main real photo for the blog post in business journal, based on the following user description: "${description}". The photo schould looks like it was photographed with a digital camera. Ensure the photo visually represents the blog post's content and theme.`,
      );
      const prompt = await imagePrompt.format({ description });
      const image_url = await this.openAIImage.invoke(prompt);
      return image_url;
    } catch (error: any) {
      throw new Error(error);
    }
  }
  public async generateTextByUserDescription(
    description: string,
    articleLength: string,
    client: Socket,
    layoutStructure: string,
    callToAction: string,
    headings?: { introduction: string; mainBody: string; conclusion: string },
    subheadings?: string[],
    link?: string,
  ) {
    const postHeadings = Number(articleLength);
    try {
      const blogFromLink = link
        ? `include the information from this link - ${link}`
        : '';
      const headingIntroduction =
        headings && headings.introduction
          ? `Use this heading in introduction - ${headings.introduction}.`
          : '';
      const headingBody =
        headings && headings.introduction
          ? `Use this heading in middle sections - ${headings.mainBody}.`
          : '';
      const headingConclusion =
        headings && headings.introduction
          ? `Use this heading in conclusion sections - ${headings.conclusion}.`
          : '';

      let postSubheadingsPhrase = '';
      if (subheadings && subheadings.length) {
        postSubheadingsPhrase = subheadings.join('; ');
      }
      const postSubheadings = postSubheadingsPhrase.length
        ? `Use this subheadings in this sections - ${postSubheadingsPhrase}.`
        : '';
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          ` Based on the following description, write a professional blog for business Journal post in HTML format with HTML text markup tags to insert in the <body> section. Include in text Call To Action phrase ${callToAction}. ${blogFromLink}
          The generated blog post should be modern, contain multiple paragraphs, lists, etc., and be well-styled in HTML format. Use inline CSS for a better appearance.  The post should look like a scientific article.`,
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
        ['system', `Layout structure of blog schould be ${layoutStructure}`],
        ['system', 'Use inline CSS for better appearance.'],
        new MessagesPlaceholder('history'),
        ['human', '{input}'],
      ]);

      const runnable = prompt.pipe(this.openAI);
      // Define your session history store.
      const messageHistory = new ChatMessageHistory();

      const withHistory = new RunnableWithMessageHistory({
        runnable,
        getMessageHistory: (_sessionId: string) => messageHistory,
        inputMessagesKey: 'input',
        // This shows the runnable where to insert the history.
        historyMessagesKey: 'history',
      });
      const config: RunnableConfig = { configurable: { sessionId: '1' } };
      let fullArticle = '';

      const streamChunks = async (inputText: string) => {
        const stream = await withHistory.stream({ input: inputText }, config);
        for await (const chunk of stream) {
          client.emit('articlePartGenerated', chunk.content);
          fullArticle += chunk.content;
        }
      };
      await streamChunks(
        `Write the introduction and the first section (400-500 words) for a four-page magazine article on the topic: ${description}. ${headingIntroduction} ${blogFromLink}. Use HTML tags and inline CSS for styling.`,
      );

      for (let i = 0; i <= postHeadings - 2; i += 2) {
        await streamChunks(
          `Do not repeat the previous part, just write the middle sections (800 -1000 words) with two headings as a continuation of the previous post on the topic: ${description}. ${i === 0 ? postSubheadings : ''} ${headingBody} ${blogFromLink} Use the same HTML tags and inline CSS for styling.`,
        );
      }

      await streamChunks(
        `Do not repeat the previous part, just write the conclusion section as links (800 -1000 words) as a continuation of the previous post on the topic: ${description}.  ${blogFromLink} ${headingConclusion}`,
      );
      await streamChunks(
        `Do not repeat the previous part, just write the references section as links a list (<ul><li><li/><ul/>) in the Vancouver style. Include links from the internet, from where you took an information and that have similar posts or information relevant to the previous content.`,
      );
      return {
        response: fullArticle,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
