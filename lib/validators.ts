import { z } from 'zod';

// Auth validators (Section 5.1)
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Channel validators (Section 5.2)
export const createChannelSchema = z.object({
  name: z
    .string()
    .min(3, 'Channel name must be at least 3 characters')
    .max(50, 'Channel name must be at most 50 characters'),
  is_private: z.boolean().default(false),
});

// Message validators (Section 5.3)
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
  channel_id: z.string().uuid().optional(),
  conversation_id: z.string().uuid().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
});

// Profile validators (Section 5.10)
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  display_name: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  status_message: z.string().max(100, 'Status message is too long').optional(),
});

// Reaction validators (Section 5.11)
export const addReactionSchema = z.object({
  message_id: z.string().uuid(),
  emoji: z.string().min(1).max(10),
});

// Search validators (Section 5.9)
export const searchMessagesSchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty'),
  channel_id: z.string().uuid().optional(),
});

// Export types from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;
