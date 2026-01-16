import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Create company first
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: validatedData.companyName,
        slug: validatedData.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      })
      .select()
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      return NextResponse.json(
        { error: 'Error al crear la empresa', details: companyError.message },
        { status: 400 }
      );
    }

    // 2. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        full_name: validatedData.fullName,
        company_id: company.id,
      },
    });

    if (authError) {
      // Rollback company creation
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      
      console.error('Auth error:', authError);
      
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error al crear el usuario', details: authError.message },
        { status: 400 }
      );
    }

    if (authData.user) {
      // 3. Create user profile with admin role
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          company_id: company.id,
          email: validatedData.email,
          full_name: validatedData.fullName,
          role: 'admin',
          status: 'active',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the whole registration, the user can still log in
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos de registro inválidos' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
