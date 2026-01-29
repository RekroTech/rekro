import { createClient } from '@/lib/supabase/server';

export interface User {
  id: string;
  email: string;
  name: string;
}

// Get current session from Supabase
export async function getSession(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  };
}

// Login with Supabase
export async function login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (!data.user) {
    return { user: null, error: 'Login failed' };
  }

  const user: User = {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
  };

  return { user, error: null };
}

// Logout from Supabase
export async function logout(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Sign up new user
export async function signup(email: string, password: string, name?: string): Promise<{ user: User | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
      },
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (!data.user) {
    return { user: null, error: 'Signup failed' };
  }

  const user: User = {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata?.name || email.split('@')[0],
  };

  return { user, error: null };
}

export function isAuthenticated(user: User | null): boolean {
  return user !== null;
}
