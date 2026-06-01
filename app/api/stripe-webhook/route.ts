import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'Brak podpisu Stripe' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const oferta_id = session.metadata?.oferta_id;

        if (!oferta_id) {
            return NextResponse.json({ error: 'Brak oferta_id w metadata' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const premium_do = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabaseAdmin
            .from('oferty')
            .update({ is_premium: true, premium_do })
            .eq('id', oferta_id);

        if (error) {
            console.error('Błąd ustawiania premium:', error.message);
            return NextResponse.json({ error: 'Błąd bazy danych' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
