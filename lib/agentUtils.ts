import type { SupabaseClient } from '@supabase/supabase-js';

type AnySupabaseClient = SupabaseClient<any, 'public', any>;

export async function generateFingerprintHash(): Promise<string> {
    const fingerprint = `${navigator.userAgent}||${navigator.language}||${screen.width}x${screen.height}`;

    if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    // Fallback: prosty deterministyczny hash, gdy crypto.subtle nie jest dostępny
    let hash = 5381;
    for (let i = 0; i < fingerprint.length; i += 1) {
        hash = ((hash << 5) + hash) + fingerprint.charCodeAt(i);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

export async function getOrCreateAgent(supabase: AnySupabaseClient): Promise<number | null> {
    const fingerprint_hash = await generateFingerprintHash();
    const { data: existingAgent, error: selectError } = await supabase
        .from('agents')
        .select('id')
        .eq('fingerprint_hash', fingerprint_hash)
        .maybeSingle();

    if (selectError) {
        console.error('Agent select error', selectError);
    }
    if (existingAgent?.id) {
        return existingAgent.id;
    }

    const { data: insertedAgent, error: insertError } = await supabase
        .from('agents')
        .insert({ fingerprint_hash, created_at: new Date().toISOString() })
        .select('id')
        .maybeSingle();

    if (insertError) {
        console.error('Agent insert error', insertError);
        const { data: retryAgent } = await supabase
            .from('agents')
            .select('id')
            .eq('fingerprint_hash', fingerprint_hash)
            .maybeSingle();
        return retryAgent?.id ?? null;
    }

    return insertedAgent?.id ?? null;
}
