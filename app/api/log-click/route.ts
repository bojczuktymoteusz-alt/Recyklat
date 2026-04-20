import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { ofertaId, userType } = await req.json();
        if (!ofertaId) return NextResponse.json({ error: 'Brak ofertaId' }, { status: 400 });

        // Zapisz klikniecie w tabeli phone_clicks
        const { error } = await supabase.from('phone_clicks').insert([{
            oferta_id: ofertaId,
            user_type: userType || 'gosc', // 'firma' | 'gosc'
            clicked_at: new Date().toISOString(),
        }]);

        if (error) {
            console.error('log-click error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: 'Blad serwera' }, { status: 500 });
    }
}
