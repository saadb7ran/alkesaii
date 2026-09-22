// firebase-db.js - منظومة ثانوية الكسائي السحابية الرسمية

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc 
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

// تهيئة تطبيق Firebase وخدمة قاعدة البيانات Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * دالة مساعدة لتطوير وتحويل ملفات الـ PDF إلى صيغة Base64 للحفظ السريع
 * @param {File} file - ملف المستند المرفوع من المستخدم
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
}

// ==========================================
// 1. إدارة الوثائق والمستندات (Documents)
// ==========================================

/**
 * رفع وتوثيق مستند جديد بالسحابة
 */
export async function uploadCloudDocument(file, docMeta) {
  try {
    const fileDataUrl = await fileToBase64(file);
    const docRef = await addDoc(collection(db, "documents"), {
      name: docMeta.name || file.name,
      folderId: docMeta.folderId || 'planning',
      subfolderId: docMeta.subfolderId || '',
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
      gregDate: docMeta.gregDate || new Date().toLocaleDateString('en-GB'),
      description: docMeta.description || '',
      createdAt: Date.now()
    });

    return { id: docRef.id, success: true };
  } catch (err) {
    console.error("خطأ رفع المستند السحابي:", err);
    throw err;
  }
}

/**
 * جلب جميع الوثائق المودعة بالسحابة (مرتبة حسب الأحدث)
 */
export async function getCloudDocuments() {
  try {
    const querySnapshot = await getDocs(collection(db, "documents"));
    const docs = [];
    querySnapshot.forEach((d) => {
      docs.push({ id: d.id, ...d.data() });
    });
    return docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error("خطأ جلب المستندات:", err);
    return [];
  }
}

/**
 * حذف وثيقة محددة من السحابة
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

// ==========================================
// 2. إدارة المجلدات (Folders)
// ==========================================

/**
 * جلب قائمة المجلدات السحابية
 */
export async function getCloudFolders() {
  try {
    const querySnapshot = await getDocs(collection(db, "folders"));
    const folders = [];
    querySnapshot.forEach((d) => {
      folders.push({ id: d.id, ...d.data() });
    });
    return folders;
  } catch (err) {
    console.error("خطأ جلب المجلدات:", err);
    return [];
  }
}

/**
 * إنشاء مجلد فرعي سحابي جديد
 */
export async function addCloudFolder(folderData) {
  try {
    const docRef = await addDoc(collection(db, "folders"), {
      ...folderData,
      createdAt: Date.now()
    });
    return { id: docRef.id, ...folderData };
  } catch (err) {
    console.error("خطأ إضافة مجلد:", err);
    throw err;
  }
}

/**
 * حذف مجلد سحابي
 */
export async function deleteCloudFolder(folderId) {
  try {
    await deleteDoc(doc(db, "folders", folderId));
    return true;
  } catch (err) {
    console.error("خطأ حذف المجلد:", err);
    throw err;
  }
}