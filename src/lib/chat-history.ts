/**
 * Chat history service
 * Loads chat history from Firestore or local copy
 * Backend path: /Users/anshriyal/Downloads/mety-chatbot/firestore_copy/chat_history
 */

import type { ChatHistoryMessage } from "./api-types";

/**
 * Load chat history for a user
 * Tries to load from local copy directory
 * Returns empty array if no history found
 */
export async function loadChatHistory(userId: string): Promise<ChatHistoryMessage[]> {
  console.log(`[CHAT HISTORY] Loading history for user: ${userId}`);
  
  try {
    // For now, we'll use a simple approach:
    // The backend stores chat history in firestore_copy/chat_history/
    // We can't directly read from the file system in the browser
    // So we'll rely on the backend to provide chat history via the chat endpoint
    // The backend automatically fetches previous messages from Firestore
    
    // Return empty array - chat history is handled by backend
    // Frontend only sends latest message, backend fetches history
    console.log(`[CHAT HISTORY] Chat history is managed by backend`);
    return [];
  } catch (error) {
    console.error(`[CHAT HISTORY ERROR] Failed to load history:`, error);
    return [];
  }
}

/**
 * Note: Chat history is managed by the backend.
 * The backend automatically fetches previous messages from Firestore
 * when processing a chat request. Frontend only needs to send the latest message.
 */

