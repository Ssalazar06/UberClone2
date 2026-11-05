// AI-assisted: see docs/AI_LOG.md #3

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '../config/firebaseConfig';

const isRemoteUri = (uri) => /^https?:\/\//i.test(uri);

/**
 * Uploads a local image (file:// or content://) to Firebase Storage and
 * returns its public download URL. Remote URLs are returned untouched,
 * so saving the same registration twice does not upload again.
 */
export const uploadImage = async (localUri, storagePath) => {
  if (!localUri || isRemoteUri(localUri)) return localUri;

  const response = await fetch(localUri);
  const blob = await response.blob();
  const imageRef = ref(storage, storagePath);

  await uploadBytes(imageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(imageRef);
};

/** Builds the Storage path used for every driver photo. */
export const getDriverImagePath = (driverId, fileName) => `drivers/${driverId}/${fileName}.jpg`;

