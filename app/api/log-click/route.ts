import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SERVICE_ROLE_KEY — omija RLS, gwarantuje zapis anonimowych klikniec
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { ofertaId, userType } = await req.json();
        if (!ofertaId) return NextResponse.json({ error: 'Brak ofertaId' }, { status: 400 });

        const { error } = await supabase.from('phone_clicks').insert([{
            oferta_id: Number(ofertaId),
            user_type: userType || 'gosc',
            clicked_at: new Date().toISOString(),
        }]);

        if (error) {
            console.error('log-click error:', error.message, error.code);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('log-click exception:', err);
        return NextResponse.json({ error: 'Blad serwera' }, { status: 500 });
    }
}
