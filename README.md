<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Welcome to our application for creating and editing text and images using AI. Generate informative blog posts effortlessly and edit content seamlessly with our intuitive interface. Unlock endless creative possibilities with our tool!.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Instructions for Use

1. **Generate Blog Post via WebSocket:**

   - Connect to the WebSocket server. You can use a WebSocket client library like `socket.io-client`.
   - Emit a request to generate an article:

   ```javascript
   const socket = io('http://localhost:3331');
   socket.emit('generateArticle', {
   description: 'Your article description here',
   articleLength: 5,
   layoutStructure: 'Your layout structure here',
   callToAction: 'Your call to action here',
   toneOfVoice: string,
   languageComplexity: "Simple",
   vocabularyLevel: "Beginner",
   formalityLevel: "Casual",
   tempOfVoice: "Passive",
   keywords:   ["Keyword Written 1", "Keyword Written 2"],
   sampleText: "sample of the blog post", // optional
   headings: {
    introduction: 'Introduction heading here',
    mainBody: 'Main body heading here',
    conclusion: 'Conclusion heading here',
   }, // optional
   subheadings: ['Subheading 1', 'Subheading 2'], // optional
   link: 'http://example.com', // optional
   });.

   ```

2. **Listen for the stream of article parts:**

```javascript
socket.on('articlePartGenerated', (chunk) => {
  // Append the received chunk to your content area
  console.log(ckunk); // part of post (few symbols)
});
```

3. **Generate Image Endpoint:**

#### Endpoint: `POST /generate-image`

This endpoint generates an AI-created image based on the provided description.

- **Operation**: `generateImage`
- **Description**: Create AI post photo
- **Request Body**:
  - **Type**: `BasicGenerateImageDto`
  - **Example**:
    ```json
    {
      "description": "A beautiful sunset over the mountains"
    }
    ```
- **Responses**:
  - **201**: The image created
    - **Type**: `ImageCreatedDto`
    - **Example**:
      ```json
      {
        "url": "http://example.com/image.png"
      }
      ```

4. **Save Blog Post Endpoint:**

#### Endpoint: `POST /save-blogpost`

This endpoint saves the AI-generated image and text to the database.

- **Operation**: `save`
- **Description**: Create AI post in database
- **Request Body**:
  - **Type**: `BasicCreatePostDto`
  - **Example**:
    ```json
    {
      "description": "A beautiful sunset over the mountains",
      "postText": "The sun set in a blaze of orange and red...",
      "imageUrl": "http://example.com/image.png"
    }
    ```
- **Responses**:
  - **201**: The created record
    - **Type**: `ResponsePostDto`
    - **Example**:
      ```json
      {
        "id": "12345",
        "description": "A beautiful sunset over the mountains",
        "postText": "The sun set in a blaze of orange and red...",
        "imageUrl": "http://example.com/image.png",
        "createdAt": "2024-06-24T12:34:56Z"
      }
      ```

5. **Edit Blog Post:**

   - After receiving the complete blog post, you can implement an editor on the client side to make necessary changes.
   - After editing, you can send the updated post to your backend for saving.

#### Endpoint: `PUT /modify-blogpost`

This endpoint updates an existing blog post.

- **Operation**: `updatePost`
- **Description**: Update post
- **Request Body**:
  - **Type**: `UpdatePostDto`
  - **Example**:
    ```json
    {
      "id": "12345",
      "description": "An updated description",
      "postText": "Updated text of the blog post..."
    }
    ```
- **Responses**:
  - **200**: The updated record
    - **Type**: `ResponsePostDto`
    - **Example**:
      ```json
      {
        "id": "12345",
        "description": "An updated description",
        "postText": "Updated text of the blog post...",
        "imageUrl": "http://example.com/image.png",
        "updatedAt": "2024-06-24T12:34:56Z"
      }
      ```

## Swagger documents for Backend part

- Open your web browser and navigate to [http://localhost:3331/api](http://localhost:3331/api).
