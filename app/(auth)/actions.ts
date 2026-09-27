'use server';

import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import { redirect } from 'next/navigation';

export async function registerAction(_prevState: { error?: string }, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!name || !email || password.length < 8) {
    return { error: 'Please fill in every field. Password needs at least 8 characters.' };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });
  if (signUpError || !signUpData.user) {
    return { error: signUpError?.message ?? 'Could not create your account.' };
  }

  // Slug uniqueness: append a short suffix if it's already taken.
  let slug = slugify(name);
  const { data: existing } = await supabase.from('businesses').select('slug').eq('slug', slug);
  if (existing && existing.length > 0) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({ owner_id: signUpData.user.id, name, slug })
    .select()
    .single();

  if (businessError || !business) {
    return { error: businessError?.message ?? 'Account created, but the business record failed.' };
  }

  const { error: memberError } = await supabase
    .from('business_members')
    .insert({ business_id: business.id, user_id: signUpData.user.id, role: 'owner' });

  if (memberError) {
    return { error: memberError.message };
  }

  redirect('/dashboard');
}

export async function completeOnboardingAction(_prevState: { error?: string }, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();

  if (!name) {
    return { error: 'Please enter your business name.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Please log in again to continue.' };
  }

  let slug = slugify(name);
  const { data: existing } = await supabase.from('businesses').select('slug').eq('slug', slug);

  if (existing && existing.length > 0) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({ owner_id: user.id, name, slug })
    .select()
    .single();

  if (businessError || !business) {
    return { error: businessError?.message ?? 'Could not create your business.' };
  }

  const { error: memberError } = await supabase
    .from('business_members')
    .insert({ business_id: business.id, user_id: user.id, role: 'owner' });

  if (memberError) {
    return { error: memberError.message };
  }

  redirect('/dashboard');
}

export async function loginAction(_prevState: { error?: string }, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Wrong email or password.' };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
