import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

let cachedUsers = null;

export function useUsers() {
  const [users, setUsers] = useState(cachedUsers || []);
  const [loading, setLoading] = useState(!cachedUsers);

  useEffect(() => {
    if (!cachedUsers) {
      getDocs(collection(db, 'profiles'))
        .then(snap => {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          cachedUsers = list;
          setUsers(list);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching users for mentions:", err);
          setLoading(false);
        });
    }
  }, []);

  return { users, loading };
}
