import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import ProfileClient from "./ProfileClient";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/login");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // Profile doesn't exist - create a basic one
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'User',
        } as any)
        .select()
        .single();
      
      if (newProfile) {
        return <ProfileClient profile={newProfile as any} />;
      }
      redirect("/login");
    }

    return <ProfileClient profile={profile as any} />;
  } catch (error) {
    console.error('Profile page error:', error);
    redirect("/login");
  }
}
