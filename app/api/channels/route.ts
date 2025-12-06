import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createChannelSchema } from '@/lib/validators';
import { generateSlug } from '@/lib/utils';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: channels, error } = await supabase
      .from('channels')
      .select('*, member_count:channel_members(count)')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ channels });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const parseResult = createChannelSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }
    
    const validatedData = parseResult.data;
    const slug = generateSlug(validatedData.name);

    // Create channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      // @ts-ignore - Supabase type inference issue with insert
      .insert({
        name: validatedData.name,
        slug,
        is_private: validatedData.is_private || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (channelError) {
      console.error('Channel creation error:', channelError);
      return NextResponse.json({ error: channelError.message }, { status: 400 });
    }
    
    if (!channel) {
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 400 });
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('channel_members')
      // @ts-ignore - Supabase type inference issue with insert
      .insert({
        channel_id: (channel as any).id,
        user_id: user.id,
        role: 'admin',
      });

    if (memberError) {
      console.error('Channel member error:', memberError);
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error('Channel POST error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
