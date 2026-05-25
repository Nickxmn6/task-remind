import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function processMentions(text, usersList, currentUser, source) {
  if (!text || !usersList || !currentUser) return;

  // Extract all strings that start with @
  const mentions = text.match(/@[a-zA-Z0-9_]+/g);
  if (!mentions) return;

  // Get unique usernames without the @ symbol
  const mentionedUsernames = [...new Set(mentions.map(m => m.substring(1).toLowerCase()))];

  for (const username of mentionedUsernames) {
    // Find the user in the usersList by matching their username stripped of spaces
    const targetUser = usersList.find(u => u.username && u.username.replace(/\s+/g, '').toLowerCase() === username);
    
    // Don't notify yourself
    if (targetUser && targetUser.id !== currentUser.id) {
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: targetUser.id,
          fromUserId: currentUser.id,
          fromUsername: currentUser.username || 'User',
          type: 'mention',
          source: source, // e.g., 'WebinarInfo' or 'GlobalChat'
          message: `${currentUser.username || 'Seseorang'} menyebut Anda dalam postingan.`,
          read: false,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Failed to send mention notification to", username, error);
      }
    }
  }
}
