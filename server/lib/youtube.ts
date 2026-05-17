import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

const oauth2Client = new OAuth2Client(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
);

let userTokens: any = null;

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent'
  });
}

export async function setTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  userTokens = tokens;
  return tokens;
}

export async function uploadToYoutube(videoData: string, title: string, description: string) {
  if (!userTokens) throw new Error("Not authenticated");

  oauth2Client.setCredentials(userTokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  
  const buffer = Buffer.from(videoData.split(',')[1], 'base64');
  const readableStream = new Readable();
  readableStream._read = () => {};
  readableStream.push(buffer);
  readableStream.push(null);

  const result = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { 
        title, 
        description, 
        categoryId: '22', // People & Blogs
        tags: ['shorts', 'ai', 'generated']
      },
      status: { 
        privacyStatus: 'public', 
        selfDeclaredMadeForKids: false 
      }
    },
    media: { body: readableStream }
  });

  return result.data.id;
}
