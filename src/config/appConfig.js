// AI-assisted: see docs/AI_LOG.md #6

/**
 * When `true`, photos are uploaded to Firebase Storage and Firestore keeps the
 * download URL. Firebase Storage must be enabled in the Firebase console
 * (new buckets `*.firebasestorage.app` require the Blaze plan).
 * When `false`, Firestore keeps the local URI of the photo (useful for demos).
 */
export const USE_FIREBASE_STORAGE = false;

