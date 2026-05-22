import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ category: '', search: '', status: '' });

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const eventsRef = collection(db, 'events');
      let q = query(eventsRef, where('user_id', '==', user.id));

      if (filter.category) {
        q = query(q, where('category', '==', filter.category));
      }
      if (filter.status) {
        q = query(q, where('status', '==', filter.status));
      }
      
      // Note: Firestore doesn't support generic ilike search easily, 
      // we'll filter search client-side for now or you can use Algolia.
      
      const querySnapshot = await getDocs(q);
      let fetchedEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        fetchedEvents = fetchedEvents.filter(e => 
          e.title?.toLowerCase().includes(searchLower) || 
          e.description?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by date and time
      fetchedEvents.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
      });

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Exception fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filter.category, filter.status, filter.search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Compress image before saving (max 800px, 70% quality JPEG) as Base64 ──
  const compressImageAsBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > 800) {
            height = Math.round((height * 800) / width);
            width = 800;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Return base64 string directly
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = () => resolve(e.target.result);
      };
      reader.onerror = () => resolve(null);
    });
  };

  // ── Save event photo as Base64 ───────────────────────────────────
  const uploadEventPhoto = async (file, eventId) => {
    // Return the base64 string instead of uploading to Firebase Storage
    const base64Image = await compressImageAsBase64(file);
    return base64Image;
  };

  // ── Save certificate as Base64 ───────────────────────────────────
  const uploadCertificate = async (file, eventId) => {
    // Read file as base64 string
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
    });
  };

  // ── Add event (single operation, photo included in one call) ─────
  const addEvent = async (eventData, photoFile = null) => {
    if (!user) return { success: false, error: 'No user logged in' };

    setSaving(true);

    try {
      const newEvent = {
        title: eventData.title,
        description: eventData.description || null,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location || null,
        category: eventData.category || null,
        reminder_enabled: eventData.reminder_enabled,
        reminder_minutes: eventData.reminder_minutes,
        event_photo: null,
        status: 'pending',
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      // Create dummy ID first to use for photo upload if needed
      const eventsRef = collection(db, 'events');
      
      // If photo exists, upload it before creating the document to avoid update delays
      if (photoFile) {
        // We can just generate a random ID or use Date.now() for the photo path
        const tempId = `temp-${Date.now()}`;
        const photoUrl = await uploadEventPhoto(photoFile, tempId);
        newEvent.event_photo = photoUrl;
      }

      const docRef = await addDoc(eventsRef, newEvent);
      const finalData = { id: docRef.id, ...newEvent };

      setEvents(prev => {
        const updated = [finalData, ...prev];
        updated.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
        return updated;
      });
      
      return { success: true, data: finalData };
    } catch (error) {
      console.error('Error adding event:', error);
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  };

  // ── Update event status ──────────────────────────────────────────
  const updateEventStatus = async (id, status, certificateFile = null) => {
    if (!user) return { success: false, error: 'No user logged in' };

    setSaving(true);

    try {
      const updates = { status };

      if (status === 'completed' && certificateFile) {
        const certificateUrl = await uploadCertificate(certificateFile, id);
        updates.certificate_url = certificateUrl;
        updates.completed_at = new Date().toISOString();
      }

      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, updates);

      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      return { success: true, data: { id, ...updates } };
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  };

  // ── Update event (with optional photo) ──────────────────────────
  const updateEvent = async (id, eventData, photoFile = null) => {
    if (!user) return { success: false, error: 'No user logged in' };

    setSaving(true);

    try {
      const updates = { ...eventData };

      if (photoFile) {
        const photoUrl = await uploadEventPhoto(photoFile, id);
        updates.event_photo = photoUrl;
      }

      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, updates);

      setEvents(prev => {
        const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e);
        updated.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
        return updated;
      });
      
      return { success: true, data: { id, ...updates } };
    } catch (error) {
      console.error('Error updating event:', error);
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  };

  // ── Delete event ─────────────────────────────────────────────────
  const deleteEvent = async (id) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const docRef = doc(db, 'events', id);
      await deleteDoc(docRef);

      setEvents(prev => prev.filter(e => e.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { success: false, error };
    }
  };

  const getUpcomingEvents = (days = 7) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const future = new Date(today);
    future.setDate(today.getDate() + days);

    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && eventDate <= future && event.status !== 'completed';
      })
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  };

  return {
    events,
    loading,
    saving,
    filter,
    setFilter,
    addEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    fetchEvents,
    getUpcomingEvents,
    uploadEventPhoto,
    uploadCertificate,
  };
}