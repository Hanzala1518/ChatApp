import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import SidebarClientWrapper from '@/components/layout/SidebarClientWrapper';
import { PresenceProvider } from '@/components/providers/presence-provider';

export const dynamic = 'force-dynamic';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/login');
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If no profile, create one
    let userProfile = profile;
    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'User',
        } as any)
        .select()
        .single();
      userProfile = newProfile;
    }

    if (!userProfile) {
      redirect('/login');
    }

    // Fetch all channels
    const { data: channels } = await supabase
      .from('channels')
      .select('*')
      .order('name');

    // Fetch user's channel memberships
    const { data: memberships } = await supabase
      .from('channel_members')
      .select('channel_id')
      .eq('user_id', user.id);

    const memberChannelIds = new Set((memberships || []).map((m: any) => m.channel_id));

    // Mark channels with membership status
    const channelsWithMembership = (channels || []).map((channel: any) => ({
      ...channel,
      isMember: memberChannelIds.has(channel.id),
    }));

    return (
      <PresenceProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <SidebarClientWrapper 
            initialChannels={channelsWithMembership as any} 
            currentUser={userProfile as any} 
          />
          <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        </div>
      </PresenceProvider>
    );
  } catch (error) {
    console.error('Layout error:', error);
    redirect('/login');
  }
}
