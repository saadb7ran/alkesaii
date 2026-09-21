// firebase-db.js - منظومة ثانوية الكسائي السحابية المعتمدة

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

// تهيئة الخدمة
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// المجلدات الرئيسية المعتمدة لثانوية الكسائي
export const DEFAULT_FOLDERS = [
  { id: 'planning', name: 'التنظيم والتخطيط' },
  { id: 'circulars', name: 'الوثائق والتعاميم' },
  { id: 'academic', name: 'الشؤون التعليمية والمتابعة' },
  { id: 'students', name: 'شؤون الطلاب' },
  { id: 'committees', name: 'الاجتماعات واللجان' }
];

/**
 * تحويل ملف PDF إلى بيانات سريعة وموثقة (Base64)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
  });
}

/**
 * 1. رفع وتوثيق المستند سحابياً (في أقل من ثانية)
 */
export async function uploadCloudDocument(file, docMeta) {
  try {
    const fileDataUrl = await fileToBase64(file);

    const docRef = await addDoc(collection(db, "documents"), {
      name: docMeta.name || file.name,
      folderId: docMeta.folderId || 'planning',
      folderName: docMeta.folderName || 'التنظيم والتخطيط',
      code: docMeta.code || '',
      fileUrl: fileDataUrl,
      sizeBytes: file.size,
      sizeText: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      date: docMeta.hijriDate || new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
      }).format(new Date()),
      createdAt: Date.now()
    });

    return { id: docRef.id, fileUrl: fileDataUrl };
  } catch (err) {
    console.error("خطأ الحفظ السحابي:", err);
    throw err;
  }
}

/**
 * 2. جلب المجلدات المعتمدة
 */
export async function getCloudFolders() {
  return DEFAULT_FOLDERS;
}

/**
 * 3. جلب جميع الوثائق السحابية مرتبة حسب الأحدث
 */
export async function getCloudDocuments() {
  try {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    let docs = [];
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    return docs;
  } catch (err) {
    console.error("خطأ جلب المستندات:", err);
    return [];
  }
}

/**
 * 4. حذف وثيقة من السحابة
 */
export async function deleteCloudDocument(docId) {
  try {
    await deleteDoc(doc(db, "documents", docId));
    return true;
  } catch (err) {
    console.error("خطأ حذف المستند:", err);
    throw err;
  }
}