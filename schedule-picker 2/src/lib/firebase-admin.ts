import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (getApps().length === 0) {
  const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SDK_KEY;
  if (serviceAccountBase64) {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
    );
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // Fallback: GOOGLE_APPLICATION_CREDENTIALS環境変数を使用
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
