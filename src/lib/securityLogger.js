import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const logSecurityEvent = async (action, userId, email, details = {}) => {
  try {
    const userAgent = navigator.userAgent;
    const timestamp = new Date().toISOString();

    await addDoc(collection(db, 'security_logs'), {
      action,
      userId: userId || 'anonymous',
      email: email || 'unknown',
      details,
      userAgent,
      timestamp: serverTimestamp(),
      isoTime: timestamp
    });
  } catch (error) {
    console.error('Failed to write security log (Possible permission issue):', error);
  }
};
