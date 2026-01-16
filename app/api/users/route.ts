import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated and is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get admin profile
    const { data: adminProfile } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'supervisor')) {
      return NextResponse.json({ error: 'No tienes permisos para crear usuarios' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, fullName, areaId, role } = body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Use service client to create user (doesn't affect current session)
    const serviceClient = await createServiceClient();

    // Create auth user with admin API
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        company_id: adminProfile.company_id,
      },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 400 });
      }
      throw authError;
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 });
    }

    // Create user profile
    const { error: profileError } = await serviceClient.from('users').insert({
      id: authData.user.id,
      company_id: adminProfile.company_id,
      email,
      full_name: fullName,
      area_id: areaId || null,
      role,
      status: 'active',
    });

    if (profileError) {
      // Try to delete the auth user if profile creation fails
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error al crear el usuario' },
      { status: 500 }
    );
  }
}
