// firebase-db.js - الربط السحابي لمنظومة ثانوية الكسائي (نظام التخزين الفوري Firestore Base64)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// إعدادات Firebase الخاصة بمشروع ثانوية الكسائي
const firebaseConfig = {
  apiKey: "AIzaSyAhwcbBVFr1i0mLOw5iKdVRS9_EZeJrvbg",
  authDomain: "alkisaee-portal.firebaseapp.com",
  projectId: "alkisaee-portal",
  storageBucket: "alkisaee-portal.firebasestorage.app",
  messagingSenderId: "392452923966",
  appId: "1:392452923966:web:62a9c1a89df26e7b78276f",
  measurementId: "G-001J0DY6QZ"
};

// تهيئة خدمات Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * تحويل الملف إلى Base64 لرفعه بسرعة البرق بدون قيود Storage أو CORS
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 1. رفع وتوثيق الملف سحابياً في أقل من ثانية
 */
export async function uploadCloudDocument(file, docMeta) {
  try {
    const base64Data = await fileToBase64(file);
    
    const docRef = await addDoc(collection(db, "documents"), {
      name: docMeta.name || file.name,
      folderId: docMeta.folderId || 'planning',
      folderName: docMeta.folderName || 'التنظيم والتخطيط',
      code: docMeta.code || '',
      fileUrl: base64Data, // ترميز الملف الفوري
      sizeBytes: file.size,
      sizeText: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      date: docMeta.hijriDate || new Date().toLocaleDateString('ar-SA'),
      createdAt: Date.now()
    });

    return { id: docRef.id };
  } catch (error) {
    console.error("خطأ في الرفع السحابي:", error);
    throw error;
  }
}

/**
 * 2. جلب جميع الوثائق السحابية
 */
export async function getCloudDocuments() {
  try {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    let docs = [];
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    return docs;
  } catch (err) {
    console.error("خطأ في استرجاع الوثائق:", err);
    return [];
  }
}

/**
 * 3. حذف وثيقة من السحابة
 */
export async function deleteCloudDocument(docId) {
  try {
    await deleteDoc(doc(db, "documents", docId));
    return true;
  } catch (err) {
    console.error("خطأ في حذف المستند:", err);
    throw err;
  }
}