import { createClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // If no profile exists, create one for Google OAuth users
      if (!existingProfile) {
        const email = user.email || '';
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || `user_${Date.now()}`;
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || username;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        
        // @ts-ignore - Supabase type inference issue
        await supabase.from('profiles').insert({
          id: user.id,
          email: email,
          username: username,
          display_name: displayName,
          avatar_url: avatarUrl,
        });

        // Add new user to default public channels (general, random)
        const { data: defaultChannels } = await supabase
          .from('channels')
          .select('id')
          .in('slug', ['general', 'random'])
          .eq('is_private', false);

        if (defaultChannels && defaultChannels.length > 0) {
          const memberships = defaultChannels.map((channel: any) => ({
            channel_id: channel.id,
            user_id: user.id,
            role: 'member',
          }));

          // @ts-ignore
          await supabase.from('channel_members').insert(memberships);
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`);
}
