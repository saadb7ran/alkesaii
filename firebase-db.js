// تحويل الملف إلى بيانات سريعة (Base64)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
  });
}

// دالة الرفع السحابي الفوري
export async function uploadCloudDocument(file, docMeta) {
  try {
    const fileDataUrl = await fileToBase64(file);

    const docRef = await addDoc(collection(db, "documents"), {
      name: docMeta.name || file.name,
      folderId: docMeta.folderId || 'planning',
      folderName: docMeta.folderName || 'التنظيم والتخطيط',
      fileUrl: fileDataUrl,
      sizeBytes: file.size,
      sizeText: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      date: new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
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