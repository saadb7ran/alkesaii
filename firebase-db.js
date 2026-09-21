// firebase-db.js - الربط السحابي لمنظومة ثانوية الكسائي

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
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
export const storage = getStorage(app);

// المجلدات الرئيسية المعتمدة
export const DEFAULT_FOLDERS = [
  { id: 'planning', name: 'التنظيم والتخطيط', parentId: 'root' },
  { id: 'circulars', name: 'الوثائق والتعاميم', parentId: 'root' },
  { id: 'academic', name: 'الشؤون التعليمية والمتابعة', parentId: 'root' },
  { id: 'students', name: 'شؤون الطلاب', parentId: 'root' },
  { id: 'committees', name: 'الاجتماعات واللجان', parentId: 'root' }
];

/**
 * 1. جلب شجرة المجلدات سحابياً
 */
export async function getCloudFolders() {
  try {
    const snap = await getDocs(collection(db, "folders"));
    let folders = [];
    snap.forEach((d) => folders.push({ id: d.id, ...d.data() }));
    return folders.length > 0 ? folders : DEFAULT_FOLDERS;
  } catch (err) {
    console.warn("استرجاع المجلدات الافتراضية:", err);
    return DEFAULT_FOLDERS;
  }
}

/**
 * 2. إضافة مجلد جديد سحابياً
 */
export async function addCloudFolder(folderName, parentId = 'root') {
  const docRef = await addDoc(collection(db, "folders"), {
    name: folderName,
    parentId: parentId,
    createdAt: Date.now()
  });
  return { id: docRef.id, name: folderName, parentId };
}

/**
 * 3. رفع ملف PDF إلى Storage وحفظ بياناته في Firestore
 */
export async function uploadCloudDocument(file, docMeta) {
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storageRef = ref(storage, `documents/${safeName}`);
  
  // رفع الملف إلى Storage
  const uploadSnap = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(uploadSnap.ref);

  // تخزين البيانات والرابط في Firestore
  const docRef = await addDoc(collection(db, "documents"), {
    name: docMeta.name || file.name,
    folderId: docMeta.folderId || 'planning',
    folderName: docMeta.folderName || 'التنظيم والتخطيط',
    fileUrl: downloadUrl,
    storagePath: uploadSnap.ref.fullPath,
    sizeBytes: file.size,
    sizeText: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
    date: new Date().toLocaleDateString('ar-SA'),
    createdAt: Date.now()
  });

  return { id: docRef.id, fileUrl: downloadUrl };
}

/**
 * 4. جلب جميع الوثائق سحابياً
 */
export async function getCloudDocuments() {
  try {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    let docs = [];
    snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
    return docs;
  } catch (err) {
    console.error("خطأ في جلب المستندات:", err);
    return [];
  }
}

/**
 * 5. حذف وثيقة من السحابة (الملف وبياناته)
 */
export async function deleteCloudDocument(docId, storagePath) {
  if (storagePath) {
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch(e) {
      console.warn("حذف الملف من Storage:", e);
    }
  }
  await deleteDoc(doc(db, "documents", docId));
  return true;
}