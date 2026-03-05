import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.firebaseUid;
      if (uid) {
        await adminDb.collection('users').doc(uid).set(
          { plan: 'premium', stripeCustomerId: session.customer as string },
          { merge: true }
        );
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      // customerIdからFirebaseユーザーを検索
      const usersSnap = await adminDb
        .collection('users')
        .where('stripeCustomerId', '==', customerId)
        .get();
      usersSnap.forEach(async (doc) => {
        const data = doc.data();
        if (data.plan !== 'admin') {
          await doc.ref.set({ plan: 'free' }, { merge: true });
        }
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      console.warn('Payment failed for customer:', customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

// Stripe Webhookはbody parsingを無効化する必要がある
export const config = {
  api: { bodyParser: false },
};
