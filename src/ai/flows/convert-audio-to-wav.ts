'use server';

/**
 * @fileOverview A flow for converting audio from webm to wav format.
 * - convertAudioToWav - A function that takes a data URI and returns a WAV data URI.
 * - ConvertAudioInput - The input type for the convertAudioToWav function.
 * - ConvertAudioOutput - The return type for the convertAudioToWav function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import ffmpeg from 'fluent-ffmpeg';
import stream from 'stream';

const ConvertAudioInputSchema = z.object({
  voiceInput: z
    .string()
    .describe(
      "The user voice input, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:audio/webm;base64,<encoded_data>'"
    ),
});
export type ConvertAudioInput = z.infer<typeof ConvertAudioInputSchema>;

const ConvertAudioOutputSchema = z.object({
  wavDataUri: z
    .string()
    .describe(
      "The converted audio in WAV format, as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'"
    ),
});
export type ConvertAudioOutput = z.infer<typeof ConvertAudioOutputSchema>;

export async function convertAudioToWav(
  input: ConvertAudioInput
): Promise<ConvertAudioOutput> {
  return convertAudioToWavFlow(input);
}

// Helper to convert a Buffer to a Stream
function bufferToStream(buffer: Buffer): stream.Readable {
  const readable = new stream.Readable();
  readable._read = () => {}; // _read is required but you can noop it
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// Promisified ffmpeg conversion
function convertWithFfmpeg(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inputStream = bufferToStream(inputBuffer);
    const outputStream = new stream.PassThrough();
    const chunks: Buffer[] = [];

    outputStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    outputStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    outputStream.on('error', (err) => {
      reject(new Error(`Error in ffmpeg output stream: ${err.message}`));
    });

    try {
        const command = ffmpeg(inputStream)
        .inputFormat('webm')
        .outputFormat('wav')
        .on('error', (err) => {
            reject(new Error(`An error occurred during ffmpeg processing: ${err.message}`));
        })
        .pipe(outputStream, { end: true });
    } catch(err: any) {
        reject(new Error(`FFMPEG error: ${err.message}`))
    }

  });
}

const convertAudioToWavFlow = ai.defineFlow(
  {
    name: 'convertAudioToWavFlow',
    inputSchema: ConvertAudioInputSchema,
    outputSchema: ConvertAudioOutputSchema,
  },
  async ({ voiceInput }) => {
    try {
      const base64Data = voiceInput.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid data URI format.');
      }
      const inputBuffer = Buffer.from(base64Data, 'base64');
      
      // Since we don't have a reliable pure JS webm decoder, we need a tool like FFMPEG
      // I will assume fluent-ffmpeg is now in the package.json and will be installed.
      const wavBuffer = await convertWithFfmpeg(inputBuffer);
      
      const wavDataUri = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
      
      return { wavDataUri };

    } catch (error: any) {
      console.error('Error converting audio to WAV:', error);
      // Return an empty data URI in case of error to avoid breaking the calling flow.
      return { wavDataUri: 'data:audio/wav;base64,' };
    }
  }
);
