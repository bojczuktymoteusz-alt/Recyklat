import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    const { token, email } = await req.json();

    if (!token) {
        return NextResponse.json({ error: 'Brak tokena' }, { status: 400 });
    }

    const { data: oferta, error } = await supabase
        .from('oferty')
        .select('id, email, email_platnosci')
        .eq('manage_token', token)
        .single();

    if (error || !oferta) {
        return NextResponse.json({ error: 'Nie znaleziono ogłoszenia' }, { status: 404 });
    }

    if (!oferta.email && email) {
        await supabase
            .from('oferty')
            .update({ email_platnosci: email })
            .eq('manage_token', token);
    }

    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'blik'],
        mode: 'payment',
        line_items: [{
            price_data: {
                currency: 'pln',
                unit_amount: 1900,
                product_data: {
                    name: 'Wyróżnienie ogłoszenia — 30 dni',
                    description: 'Ogłoszenie pojawia się zawsze na górze listy przez 30 dni',
                },
            },
            quantity: 1,
        }],
        success_url: `${origin}/zarzadzaj/${token}?success=1`,
        cancel_url: `${origin}/zarzadzaj/${token}`,
        metadata: {
            oferta_id: String(oferta.id),
            token,
        },
    });

    return NextResponse.json({ url: session.url });
}
