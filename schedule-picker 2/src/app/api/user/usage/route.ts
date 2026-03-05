import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userRef = adminDb.collection('users').doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = snap.data()!;

    // Admin/Premiumは無制限
    if (data.plan === 'admin' || data.plan === 'premium') {
      return NextResponse.json({ allowed: true, usage: data.monthlyUsage || 0 });
    }

    // 月初リセットチェック
    const now = new Date();
    const resetDate = new Date(data.usageResetDate || now.toISOString());
    let currentUsage = data.monthlyUsage || 0;

    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      currentUsage = 0;
      await userRef.set({ monthlyUsage: 0, usageResetDate: now.toISOString() }, { merge: true });
    }

    const FREE_LIMIT = 5;
    if (currentUsage >= FREE_LIMIT) {
      return NextResponse.json({ allowed: false, usage: currentUsage, limit: FREE_LIMIT });
    }

    // 使用回数をインクリメント
    await userRef.set({ monthlyUsage: currentUsage + 1 }, { merge: true });

    return NextResponse.json({ allowed: true, usage: currentUsage + 1, limit: FREE_LIMIT });
  } catch (error: any) {
    console.error('Usage error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
