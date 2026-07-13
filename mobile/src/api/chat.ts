import { ChatMessageDto } from '@obi/shared';
import { api } from '../lib/api';

export interface Conversation {
  peerId: string;
  lastMessage: ChatMessageDto;
  unread: number;
}

export async function sendMessage(input: {
  recipientId: string;
  orderId?: string | null;
  text: string;
}): Promise<ChatMessageDto> {
  const { data } = await api.post('/chat', input);
  return data;
}

export async function getConversation(withUserId: string, orderId?: string): Promise<ChatMessageDto[]> {
  const { data } = await api.get('/chat/conversation', { params: { withUserId, orderId } });
  return data;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get('/chat/conversations');
  return data;
}
