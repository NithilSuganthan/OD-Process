import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the service role key for admin operations (user creation)
// Falls back to anon key if service role isn't set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEMO_PASSWORD = 'demo1234';

const demoAccounts = [
  {
    role: 'student',
    table: 'students',
    email: 'demo.student@smartod.dev',
    password: 'demo1234',
    record: {
      register_no: 'RA2411008020146',
      name: 'Nithil Suganthan',
      department: 'Computer Science',
      year_of_study: 3,
    },
  },
  {
    role: 'faculty',
    table: 'faculty',
    email: 'demo.faculty@smartod.dev',
    password: 'demo1234',
    record: {
      name: 'Prof. Turing',
      email: 'demo.faculty@smartod.dev',
      department: 'Computer Science',
      is_hod: false,
    },
  },
  {
    role: 'hod',
    table: 'faculty',
    email: 'demo.hod@smartod.dev',
    password: 'demo1234',
    record: {
      name: 'Dr. Ramesh Kumar',
      email: 'demo.hod@smartod.dev',
      department: 'Computer Science',
      is_hod: true,
    },
  },
  {
    role: 'admin',
    table: 'none',
    email: 'admin@srm.edu',
    password: 'superadmin',
    record: {
      name: 'System Admin',
    },
  },
];

export async function POST() {
  const results: any[] = [];

  for (const account of demoAccounts) {
    try {
      let record: any = null;
      if (account.table === 'students') {
        const { data: existing } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('register_no', (account.record as any).register_no)
          .maybeSingle();

        if (existing) {
          record = existing;
        } else {
          const { data, error } = await supabaseAdmin
            .from('students')
            .insert(account.record)
            .select()
            .single();
          if (error) throw error;
          record = data;
        }
      } else if (account.table === 'faculty') {
        const { data: existing } = await supabaseAdmin
          .from('faculty')
          .select('id')
          .eq('email', account.email)
          .maybeSingle();

        if (existing) {
          record = existing;
          await supabaseAdmin.from('faculty').update({
            name: (account.record as any).name,
            is_hod: (account.record as any).is_hod,
            department: (account.record as any).department,
          }).eq('id', existing.id);
        } else {
          const { data, error } = await supabaseAdmin
            .from('faculty')
            .insert(account.record)
            .select()
            .single();
          if (error) throw error;
          record = data;
        }

        if (account.role === 'hod') {
          const { data: hodExisting } = await supabaseAdmin
            .from('hod')
            .select('id')
            .eq('faculty_id', record.id)
            .maybeSingle();
          
          if (!hodExisting) {
            await supabaseAdmin.from('hod').insert({
              faculty_id: record.id,
              department: account.record.department
            });
          }
        }
      }

      const pass = account.password || DEMO_PASSWORD;
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userList?.users.find(u => u.email === account.email);

      if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: pass,
          user_metadata: {
            full_name: (account.record as any).name,
            role: account.role,
            internal_id: record?.id || existingUser.id,
          }
        });

        results.push({
          email: account.email,
          role: account.role,
          status: 'updated',
          password: pass,
          name: (account.record as any).name,
        });
        continue;
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: pass,
        email_confirm: true,
        user_metadata: {
          full_name: (account.record as any).name,
          role: account.role,
          internal_id: record?.id,
        },
      });

      if (authError) throw authError;

      results.push({
        email: account.email,
        role: account.role,
        status: 'created',
        password: pass,
        name: (account.record as any).name,
      });
    } catch (err: any) {
      results.push({
        email: account.email,
        role: account.role,
        status: 'error',
        error: err.message,
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Demo accounts seeded!',
    accounts: results,
    loginCredentials: {
      student: { email: 'demo.student@smartod.dev', password: DEMO_PASSWORD },
      faculty: { email: 'demo.faculty@smartod.dev', password: DEMO_PASSWORD },
      hod: { email: 'demo.hod@smartod.dev', password: DEMO_PASSWORD },
    },
  });
}
