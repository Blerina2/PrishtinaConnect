import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a local file blob up to the Firebase Cloud buckets natively
 * @param {string} localUri - Local filepath location matching temporary device cache
 * @param {string} storageFolder - Remote directory token path ('avatars', 'chat_media', 'materials')
 * @returns {Promise<string>} Secure cloud accessible HTTPS download URL link string
 */
export const uploadFileToCloud = async (localUri, storageFolder) => {
    if (!localUri) return null;
    try {
        const response = await fetch(localUri);
        const blob = await response.blob();

        const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const fileRef = ref(storage, `${storageFolder}/${fileName}`);

        await uploadBytes(fileRef, blob);
        const downloadUrl = await getDownloadURL(fileRef);
        return downloadUrl;
    } catch (e) {
        console.error("Cloud file upload structural fault triggered:", e);
        throw e;
    }
};
