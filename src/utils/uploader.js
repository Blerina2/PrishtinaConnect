import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Ngarkon një skedar ose foto lokale direkt në Firebase Cloud Storage Bucket
 * @param {string} localUri - Rruga e përkohshme e skedarit në memorien e telefonit
 * @param {string} storageFolder - Dosja ku do të ruhet ('avatars', 'posts_media', 'chat_media')
 * @returns {Promise<string>} Linku i sigurt dhe publik i skedarit të ngarkuar (HTTPS download URL)
 */
export const uploadFileToCloud = async (localUri, storageFolder) => {
    if (!localUri) return null;
    try {
        // FIX EXPO BLOB: Siguron që rruga e skedarit të lexohet saktë në të gjitha pajisjet celulare
        const cleanUri = localUri.startsWith('file://') ? localUri : `file://${localUri}`;
        const response = await fetch(cleanUri);
        const blob = await response.blob();

        // Gjenerimi i një emri unik të skedarit për të shmangur mbishkrimin
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
        const fileRef = ref(storage, `${storageFolder}/${fileName}`);

        // Ngarkimi i binarëve në Firebase Storage
        await uploadBytes(fileRef, blob);

        // Marrja e linkut publik të skedarit
        const downloadUrl = await getDownloadURL(fileRef);
        return downloadUrl;
    } catch (e) {
        console.error("Gabim kritik gjatë konvertimit ose ngarkimit në Storage:", e);
        throw e;
    }
};
