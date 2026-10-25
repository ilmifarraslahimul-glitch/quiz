import {
  Category,
  Question,
  QuizHistory,
  UserProfile,
  UserSettings,
} from '../types';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { INITIAL_CATEGORIES, INITIAL_QUESTIONS, DEFAULT_SETTINGS } from './defaultData';

const DB_NAME = 'quizku_local_db';
const DB_VERSION = 1;

// IndexedDB Helper
function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('questions')) {
        db.createObjectStore('questions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'uid' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openLocalDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB getAll error for ${storeName}:`, err);
    return [];
  }
}

async function idbPut<T>(storeName: string, item: T): Promise<void> {
  try {
    const db = await openLocalDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB put error for ${storeName}:`, err);
  }
}

async function idbDelete(storeName: string, id: string): Promise<void> {
  try {
    const db = await openLocalDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB delete error for ${storeName}:`, err);
  }
}

async function idbClear(storeName: string): Promise<void> {
  try {
    const db = await openLocalDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB clear error for ${storeName}:`, err);
  }
}

export class QuizStorage {
  // Initialize local DB with defaults if empty only once
  public static async initDefaultsIfNeeded() {
    const isSeeded = typeof window !== 'undefined' ? localStorage.getItem('quizku_defaults_seeded_v1') : null;
    if (isSeeded) return;

    const existingCats = await idbGetAll<Category>('categories');
    if (existingCats.length === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await idbPut('categories', cat);
      }
      for (const q of INITIAL_QUESTIONS) {
        await idbPut('questions', q);
      }
      await idbPut('settings', DEFAULT_SETTINGS);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('quizku_defaults_seeded_v1', 'true');
    }
  }

  // Load All Local
  public static async loadLocalData() {
    await this.initDefaultsIfNeeded();
    const [categories, questions, history, settingsArr, profileArr] = await Promise.all([
      idbGetAll<Category>('categories'),
      idbGetAll<Question>('questions'),
      idbGetAll<QuizHistory>('history'),
      idbGetAll<UserSettings>('settings'),
      idbGetAll<UserProfile>('profile'),
    ]);

    return {
      categories: categories.sort((a, b) => a.order - b.order),
      questions,
      history: history.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
      settings: settingsArr[0] || DEFAULT_SETTINGS,
      profile: profileArr[0] || null,
    };
  }

  // Firestore Sync Methods
  public static async syncFromCloud(userId: string) {
    try {
      const categoriesPath = `users/${userId}/categories`;
      const questionsPath = `users/${userId}/questions`;
      const historyPath = `users/${userId}/history`;

      const [catSnap, qSnap, histSnap] = await Promise.all([
        getDocs(collection(db, categoriesPath)),
        getDocs(collection(db, questionsPath)),
        getDocs(collection(db, historyPath)),
      ]);

      const cloudCats: Category[] = catSnap.docs.map((d) => d.data() as Category);
      const cloudQuestions: Question[] = qSnap.docs.map((d) => d.data() as Question);
      const cloudHistory: QuizHistory[] = histSnap.docs.map((d) => d.data() as QuizHistory);

      // If cloud has data, update local cache
      if (cloudCats.length > 0) {
        await idbClear('categories');
        for (const cat of cloudCats) {
          await idbPut('categories', cat);
        }
      }
      if (cloudQuestions.length > 0) {
        await idbClear('questions');
        for (const q of cloudQuestions) {
          await idbPut('questions', q);
        }
      }
      if (cloudHistory.length > 0) {
        await idbClear('history');
        for (const h of cloudHistory) {
          await idbPut('history', h);
        }
      }

      return {
        categories: cloudCats.length > 0 ? cloudCats : null,
        questions: cloudQuestions.length > 0 ? cloudQuestions : null,
        history: cloudHistory.length > 0 ? cloudHistory : null,
      };
    } catch (err) {
      console.warn('Sync from cloud failed, continuing with local data:', err);
      return null;
    }
  }

  // Sync to Cloud
  public static async syncToCloud(
    userId: string,
    categories: Category[],
    questions: Question[],
    history: QuizHistory[],
    profile: UserProfile | null,
    settings: UserSettings
  ) {
    try {
      const batch = writeBatch(db);

      // Sync Profile
      if (profile) {
        const userRef = doc(db, 'users', userId);
        batch.set(userRef, { ...profile, uid: userId, updatedAt: new Date().toISOString() });
      }

      // Sync Settings
      const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
      batch.set(settingsRef, { ...settings, userId, updatedAt: new Date().toISOString() });

      // Save categories & questions in batches
      for (const cat of categories) {
        const catRef = doc(db, 'users', userId, 'categories', cat.id);
        batch.set(catRef, { ...cat, userId });
      }

      for (const q of questions) {
        const qRef = doc(db, 'users', userId, 'questions', q.id);
        batch.set(qRef, { ...q, userId });
      }

      // History
      for (const h of history.slice(0, 50)) {
        const hRef = doc(db, 'users', userId, 'history', h.id);
        batch.set(hRef, { ...h, userId });
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Sync to cloud error:', error);
      return false;
    }
  }

  // Category Operations
  public static async saveCategory(cat: Category, userId?: string) {
    await idbPut('categories', cat);
    if (userId && auth.currentUser?.uid === userId) {
      try {
        const catRef = doc(db, 'users', userId, 'categories', cat.id);
        await setDoc(catRef, { ...cat, userId });
      } catch (err) {
        console.warn('Firestore cat save error:', err);
      }
    }
  }

  public static async deleteCategory(catId: string, userId?: string) {
    await idbDelete('categories', catId);
    if (userId && auth.currentUser?.uid === userId) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'categories', catId));
      } catch (err) {
        console.warn('Firestore cat delete error:', err);
      }
    }
  }

  // Question Operations
  public static async saveQuestion(q: Question, userId?: string) {
    await idbPut('questions', q);
    if (userId && auth.currentUser?.uid === userId) {
      try {
        const qRef = doc(db, 'users', userId, 'questions', q.id);
        await setDoc(qRef, { ...q, userId });
      } catch (err) {
        console.warn('Firestore question save error:', err);
      }
    }
  }

  public static async saveQuestionsBatch(questions: Question[], userId?: string) {
    for (const q of questions) {
      await idbPut('questions', q);
    }
    if (userId && auth.currentUser?.uid === userId) {
      try {
        const batch = writeBatch(db);
        for (const q of questions) {
          batch.set(doc(db, 'users', userId, 'questions', q.id), { ...q, userId });
        }
        await batch.commit();
      } catch (err) {
        console.warn('Firestore questions batch save error:', err);
      }
    }
  }

  public static async deleteQuestion(qId: string, userId?: string) {
    await idbDelete('questions', qId);
    if (userId && auth.currentUser?.uid === userId) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'questions', qId));
      } catch (err) {
        console.warn('Firestore question delete error:', err);
      }
    }
  }

  public static async deleteQuestionsBatch(qIds: string[], userId?: string) {
    for (const id of qIds) {
      await idbDelete('questions', id);
    }
    if (userId && auth.currentUser?.uid === userId) {
      try {
        const batch = writeBatch(db);
        for (const id of qIds) {
          batch.delete(doc(db, 'users', userId, 'questions', id));
        }
        await batch.commit();
      } catch (err) {
        console.warn('Firestore batch delete error:', err);
      }
    }
  }

  // History Operations
  public static async saveHistory(hist: QuizHistory, userId?: string) {
    await idbPut('history', hist);
    if (userId && auth.currentUser?.uid === userId) {
      try {
        await setDoc(doc(db, 'users', userId, 'history', hist.id), { ...hist, userId });
      } catch (err) {
        console.warn('Firestore history save error:', err);
      }
    }
  }

  public static async clearHistory(userId?: string) {
    await idbClear('history');
  }

  // Settings & Profile
  public static async saveSettings(settings: UserSettings, userId?: string) {
    await idbPut('settings', settings);
    if (userId && auth.currentUser?.uid === userId) {
      try {
        await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), {
          ...settings,
          userId,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firestore settings save error:', err);
      }
    }
  }

  public static async saveProfile(profile: UserProfile, userId?: string) {
    await idbPut('profile', profile);
    if (userId && auth.currentUser?.uid === userId) {
      try {
        await setDoc(doc(db, 'users', userId), {
          ...profile,
          uid: userId,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firestore profile save error:', err);
      }
    }
  }
}
