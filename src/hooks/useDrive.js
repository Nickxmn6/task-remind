import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  updateDoc,
  or,
  writeBatch
} from 'firebase/firestore';

export function useDrive() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeUploads, setActiveUploads] = useState([]);

  const fetchFiles = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const filesRef = collection(db, 'drive_files');
      
      // Get files where user is owner OR user is in shared_with OR shared_with contains "all"
      const q = query(
        filesRef,
        or(
          where('owner_id', '==', user.id),
          where('shared_with', 'array-contains', user.id),
          where('shared_with', 'array-contains', 'all')
        )
      );

      const querySnapshot = await getDocs(q);
      const fetchedFiles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort by creation date (newest first)
      fetchedFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Remove duplicates just in case (e.g. if owner_id and array-contains overlap)
      const uniqueFiles = Array.from(new Map(fetchedFiles.map(item => [item.id, item])).values());
      
      setFiles(uniqueFiles);
    } catch (error) {
      console.error('Error fetching drive files:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const startUpload = async (file) => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    const uploadId = Date.now().toString() + Math.random().toString();

    const newUpload = {
      id: uploadId,
      file,
      progress: 0,
      bytesTransferred: 0,
      totalBytes: file.size,
      state: 'running'
    };

    setActiveUploads(prev => [...prev, newUpload]);

    try {
      // 1. Read file as Data URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Split string into 700KB chunks (Firestore document limit is 1MB)
      const MAX_CHARS = 700000;
      const chunks = [];
      for (let i = 0; i < dataUrl.length; i += MAX_CHARS) {
        chunks.push(dataUrl.substring(i, i + MAX_CHARS));
      }

      // 3. Create metadata document
      const newFile = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        owner_id: user.id,
        shared_with: [],
        created_at: new Date().toISOString(),
        chunk_count: chunks.length
      };

      const docRef = await addDoc(collection(db, 'drive_files'), newFile);
      const fileId = docRef.id;

      // 4. Upload chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        // Upload chunk
        await addDoc(collection(db, 'file_chunks'), {
          file_id: fileId,
          index: i,
          data: chunks[i]
        });

        // Update progress
        const progress = ((i + 1) / chunks.length) * 100;
        const bytesTransferred = Math.min(file.size, Math.round((progress / 100) * file.size));
        
        setActiveUploads(prev => prev.map(u => 
          u.id === uploadId ? { ...u, progress, bytesTransferred } : u
        ));
      }

      // 5. Finish
      const finalData = { id: fileId, ...newFile };
      setFiles(prev => [finalData, ...prev]);
      setActiveUploads(prev => prev.filter(u => u.id !== uploadId));

      return { success: true, data: finalData };
    } catch (error) {
      console.error('Upload failed:', error);
      setActiveUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, state: 'error', errorMessage: error.message || 'Firestore chunking error' } : u
      ));
      return { success: false, error };
    }
  };

  const pauseUpload = (uploadId) => {
    // Pausing is disabled for chunked firestore uploads to keep implementation simple,
    // you can safely ignore this function or remove its UI later.
  };

  const resumeUpload = (uploadId) => {};

  const cancelUpload = (uploadId) => {
    setActiveUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const downloadFile = async (file) => {
    try {
      const q = query(collection(db, 'file_chunks'), where('file_id', '==', file.id));
      const snapshot = await getDocs(q);
      
      const chunks = snapshot.docs.map(doc => doc.data());
      // Re-order chunks since getDocs does not guarantee order
      chunks.sort((a, b) => a.index - b.index);
      
      const dataUrl = chunks.map(c => c.data).join('');
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading file:', error);
      return { success: false, error };
    }
  };

  const deleteFile = async (fileData) => {
    if (!user || fileData.owner_id !== user.id) return { success: false, error: 'Unauthorized' };

    try {
      // Delete chunks from Firestore instead of Storage
      const chunksRef = collection(db, 'file_chunks');
      const q = query(chunksRef, where('file_id', '==', fileData.id));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();

      // Delete metadata from Firestore
      await deleteDoc(doc(db, 'drive_files', fileData.id));
      
      setFiles(prev => prev.filter(f => f.id !== fileData.id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error };
    }
  };

  // target can be 'all' or an email string
  const shareFile = async (fileId, target) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const currentFile = files.find(f => f.id === fileId);
      if (!currentFile || currentFile.owner_id !== user.id) {
        return { success: false, error: 'Unauthorized or file not found' };
      }

      let targetId = target;
      
      if (target !== 'all') {
        // Find user by email
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('email', '==', target.toLowerCase().trim()));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          return { success: false, error: 'User with this email not found in database.' };
        }
        
        targetId = snapshot.docs[0].id;
        
        if (targetId === user.id) {
          return { success: false, error: 'You cannot share a file with yourself.' };
        }
      }

      const updatedSharedWith = [...new Set([...(currentFile.shared_with || []), targetId])];

      const docRef = doc(db, 'drive_files', fileId);
      await updateDoc(docRef, { shared_with: updatedSharedWith });

      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, shared_with: updatedSharedWith } : f));
      
      return { success: true, targetId };
    } catch (error) {
      console.error('Error sharing file:', error);
      return { success: false, error };
    }
  };
  
  const revokeShare = async (fileId, targetId) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const currentFile = files.find(f => f.id === fileId);
      if (!currentFile || currentFile.owner_id !== user.id) {
        return { success: false, error: 'Unauthorized or file not found' };
      }

      const updatedSharedWith = (currentFile.shared_with || []).filter(id => id !== targetId);

      const docRef = doc(db, 'drive_files', fileId);
      await updateDoc(docRef, { shared_with: updatedSharedWith });

      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, shared_with: updatedSharedWith } : f));
      
      return { success: true };
    } catch (error) {
      console.error('Error revoking share:', error);
      return { success: false, error };
    }
  };

  return {
    files,
    loading,
    uploading,
    activeUploads,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    deleteFile,
    shareFile,
    revokeShare,
    fetchFiles,
    downloadFile
  };
}
