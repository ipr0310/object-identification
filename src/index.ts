import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";

import {
  RekognitionClient,
  DetectLabelsCommand,
} from "@aws-sdk/client-rekognition";
import {
  TranslateClient,
  TranslateTextCommand,
} from "@aws-sdk/client-translate";

import { classifyLabels } from "./classify";

const credentialParams = {
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

const rekognitionClient = new RekognitionClient(credentialParams);
const translateClient = new TranslateClient(credentialParams);

const translateText = async (text: string) => {
  const input = {
    // TranslateTextRequest
    Text: text, // required
    SourceLanguageCode: "en", // required
    TargetLanguageCode: "es", // required
  };

  const command = new TranslateTextCommand(input);

  const response = await translateClient.send(command);

  if (!response.TranslatedText) throw new Error("Failed Translate Text");

  return response.TranslatedText;
};

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get("/", () => "Hello World")
  .post(
    "/detect-labels",
    async ({ body }) => {
      const { file } = body;

      // Read the file as an ArrayBuffer.
      const arrayBuffer = await file.arrayBuffer();

      // Create a Node.js Buffer from the ArrayBuffer.
      const buffer = Buffer.from(arrayBuffer);

      // Set up the parameters for the DetectLabelsCommand.
      const params = {
        Image: {
          // Directly use the in-memory Buffer as the image bytes.
          Bytes: buffer,
        },
        // Optional settings:
        MaxLabels: 5, // Limit the number of labels returned.
        MinConfidence: 50, // Only return labels with at least 50% confidence.
      };

      // Create and send the command to AWS Rekognition.
      const command = new DetectLabelsCommand(params);

      try {
        const data = await rekognitionClient.send(command);

        // Return the detected labels in the API response.
        const labels = classifyLabels(data.Labels || []);

        if (!labels) throw new Error("Labels Not Found");

        const name = await translateText(labels.name);
        const category = await translateText(labels.category);
        const confidence = labels.confidence;

        return {
          name,
          category,
          confidence,
          english: { name: labels.name, category: labels.category },
        };
      } catch (error) {
        console.error("Error detecting labels:", error);
        return { error: "Failed to detect labels" };
      }
    },
    {
      body: t.Object({
        file: t.File({ format: "image/*" }),
      }),
    }
  )
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
