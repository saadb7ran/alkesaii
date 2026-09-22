// firebase-db.js - منظومة ثانوية الكسائي الرسمية
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ==========================================
// 1. إعدادات Firebase الخاصة بالمشروع
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAhwcbBVFr1i0mLOw5iKdVRS9_EZeJrvbg",
  authDomain: "alkisaee-portal.firebaseapp.com",
  projectId: "alkisaee-portal",
  storageBucket: "alkisaee-portal.firebasestorage.app",
  messagingSenderId: "392452923966",
  appId: "1:392452923966:web:62a9c1a89df26e7b78276f",
  measurementId: "G-001J0DY6QZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ==========================================
// 2. إدارة الوثائق والمستندات السحابية
// ==========================================

/**
 * رفع وتوثيق مستند PDF سحابياً في Firebase Storage و Firestore
 */
export async function uploadCloudDocument(file, docMeta) {
  try {
    // اسم فريد للملف في التخزين السحابي
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const filePath = `documents/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, filePath);

    // رفع الملف الفعلي إلى Firebase Storage
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(uploadResult.ref);

    // حفظ بيانات الفهرسة والتوثيق في Firestore
    const docRef = await addDoc(collection(db, "documents"), {
      name: docMeta.name || file.name,
      folderId: docMeta.folderId || 'planning',
      subfolderId: docMeta.subfolderId || '',
      subfolderName: docMeta.subfolderName || '',
      folderName: docMeta.folderName || 'التنظيم والتخطيط',
      code: docMeta.code || '',
      fileUrl: downloadUrl,
      storagePath: filePath,
      sizeBytes: file.size,
      sizeText: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      date: docMeta.hijriDate || new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(new Date()),
      gregDate: docMeta.gregDate || new Date().toLocaleDateString('en-GB'),
      createdAt: Date.now()
    });

    return { id: docRef.id, fileUrl: downloadUrl, success: true };
  } catch (err) {
    console.error("خطأ رفع المستند السحابي:", err);
    throw err;
  }
}

/**
 * جلب جميع الوثائق المودعة مرتبة حسب تاريخ الإنشاء
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
 * حذف وثيقة من السحابة (من Firestore و Firebase Storage معاً)
 */
export async function deleteCloudDocument(docId, storagePath) {
  try {
    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch(e) {
        console.warn("تنفيذي: تحذير أثناء حذف الملف من Storage:", e);
      }
    }
    await deleteDoc(doc(db, "documents", docId));
    return true;
  } catch (err) {
    console.error("خطأ حذف المستند:", err);
    throw err;
  }
}

// ==========================================
// 3. إدارة المجلدات والمجلدات الفرعية
// ==========================================

/**
 * جلب قائمة المجلدات
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
 * إضافة مجلد جديد
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
 * حذف مجلد
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