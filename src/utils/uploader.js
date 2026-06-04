import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Ngarkon një skedar ose foto lokale direkt në Firebase Cloud Storage Bucket
 * Përshtatur plotësisht për të punuar si në Google Chrome ashtu edhe në Celular!
 */
export const uploadFileToCloud = async (localUri, storageFolder) => {
    if (!localUri) return null;
    try {
        let cleanUri = localUri;

        // KONTROLLI I PLATFORMËS: Nëse jemi në mjedisin e telefonit (jo në Chrome Web)
        if (typeof window === 'undefined' || !window.confirm) {
            cleanUri = localUri.startsWith('file://') ? localUri : `file://${localUri}`;
        } else {
            // Në mjedisin Web, nëse adresa fillon me 'file://' gabimisht, e heqim
            if (cleanUri.startsWith('file://')) {
                cleanUri = cleanUri.replace('file://', '');
            }
        }

        // Shndërrimi i adresës në Blob (Tani funksionon saktë në Chrome!)
        const response = await fetch(cleanUri);
        const blob = await response.blob();

        // Përcaktimi i prapashtesës së saktë (Extension) që të mos korruptohen PDF/Word
        let extension = 'jpg'; // Vlera rezervë për foto
        if (localUri.includes('.')) {
            const parts = localUri.split('.');
            const ext = parts[parts.length - 1].toLowerCase().split('?')[0];
            if (['pdf', 'doc', 'docx', 'png', 'jpeg', 'gif', 'jpg'].includes(ext)) {
                extension = ext;
            }
        }

        // Gjenerimi i një emri plotësisht unik
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`;
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
