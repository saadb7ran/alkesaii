// firebase-db.js - منظومة ثانوية الكسائي الرسمية المعتمدة
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

// مفتاح التخزين المتزامن للمجلدات
const LOCAL_FOLDERS_KEY = 'alkisaee_custom_folders';

function getLocalFolders() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_FOLDERS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveLocalFolders(folders) {
  try {
    localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {}
}

// 1. إدارة المجلدات مع مزامنة سحابية ومحلية فورية
export async function getCloudFolders() {
  let localList = getLocalFolders();
  try {
    const querySnapshot = await getDocs(collection(db, "folders"));
    const cloudList = [];
    querySnapshot.forEach((d) => {
      cloudList.push({ id: d.id, ...d.data() });
    });
    
    // دمج السحابي مع المحلي بدون تكرار
    const map = new Map();
    [...localList, ...cloudList].forEach(f => map.set(f.id || f.name, f));
    const merged = Array.from(map.values());
    saveLocalFolders(merged);
    return merged;
  } catch (err) {
    console.warn("جلب المجلدات من الذاكرة المتزامنة:", err);
    return localList;
  }
}

export async function addCloudFolder(folderData) {
  const newFolder = {
    ...folderData,
    id: 'f_' + Date.now(),
    createdAt: Date.now()
  };

  // حفظ فوري في الذاكرة المتزامنة ليظهر في نفس اللحظة
  const current = getLocalFolders();
  current.push(newFolder);
  saveLocalFolders(current);

  // حفظ سحابي في Firestore
  try {
    const docRef = await addDoc(collection(db, "folders"), newFolder);
    newFolder.id = docRef.id;
  } catch (err) {
    console.warn("حفظ المجلد سحابياً سيتم إعادة محاولته:", err);
  }

  return newFolder;
}

export async function deleteCloudFolder(folderId) {
  const current = getLocalFolders().filter(f => f.id !== folderId && f.name !== folderId);
  saveLocalFolders(current);

  try {
    await deleteDoc(doc(db, "folders", folderId));
  } catch (err) {
    console.warn(err);
  }
  return true;
}

// 2. رفع وتوثيق مستند PDF سحابياً في Firebase Storage
export async function uploadCloudDocument(file, docMeta) {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const filePath = `documents/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, filePath);

    const uploadResult = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(uploadResult.ref);

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
      date: docMeta.hijriDate || new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
      createdAt: Date.now()
    });

    return { id: docRef.id, fileUrl: downloadUrl, success: true };
  } catch (err) {
    console.error("خطأ رفع المستند السحابي:", err);
    throw err;
  }
}

// 3. جلب جميع الوثائق المودعة
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

// 4. حذف وثيقة
export async function deleteCloudDocument(docId, storagePath) {
  try {
    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (e) {}
    }
    await deleteDoc(doc(db, "documents", docId));
    return true;
  } catch (err) {
    console.error("خطأ حذف المستند:", err);
    throw err;
  }
}