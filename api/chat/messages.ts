import type { VercelRequest, VercelResponse } from '@vercel/node';
import chatHandler from '../chat';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return chatHandler(req, res);
}
