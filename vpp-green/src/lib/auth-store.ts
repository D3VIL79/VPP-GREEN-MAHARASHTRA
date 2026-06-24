// ═══════════════════════════════════════════════════════════════════
// VPP Green Maharashtra — Auth Store (Zustand + Supabase)
// Manages User Session via Supabase Auth (Phone OTP)
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { supabase } from './supabase';

interface UserResponse {
  id: string;
  name: string;
  phone: string;
  role: string;
  institutionId?: string;
  departmentId?: string;
  avatarUrl?: string;
}

interface AuthState {
  // State
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  // Actions
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, token: string) => Promise<boolean>;
  login: (phone: string, password: string) => Promise<boolean>;
  loadSession: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  otpSent: false,

  sendOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      const formattedPhone = phone.startsWith('+') ? phone : '+91' + phone;
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) throw error;
      set({ otpSent: true, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  verifyOtp: async (phone: string, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const formattedPhone = phone.startsWith('+') ? phone : '+91' + phone;
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
      });
      if (error) throw error;

      if (data.user) {
        // Fetch custom user profile from public.users
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: profile ? {
            id: profile.id,
            name: profile.full_name,
            phone: profile.mobile,
            role: profile.role,
            institutionId: profile.institution_id,
            departmentId: profile.department,
            avatarUrl: profile.profile_photo || undefined
          } : {
            id: data.user.id,
            name: 'New User',
            phone: formattedPhone,
            role: 'student'
          },
          isAuthenticated: true,
          isLoading: false,
          otpSent: false,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  login: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[Auth] Login attempt - identifier:', identifier);
      
      let attempts: string[] = [];
      
      // 1. Try to resolve the user's login email via RPC database lookup
      try {
        const { data: resolvedEmail, error: rpcErr } = await supabase.rpc('get_user_login_email', { p_identifier: identifier });
        if (!rpcErr && resolvedEmail) {
          console.log('[Auth] Resolved identifier via RPC:', resolvedEmail);
          attempts.push(resolvedEmail);
        }
      } catch (rpcEx) {
        console.warn('[Auth] RPC email lookup failed, falling back to heuristics:', rpcEx);
      }

      // 2. Fallback heuristics if RPC did not resolve anything
      if (attempts.length === 0) {
        const isEmail = identifier.includes('@');
        if (isEmail) {
          attempts.push(identifier);
        } else {
          const cleanPhone = identifier.replace(/\D/g, '');
          if (cleanPhone.length >= 10) {
            const tenDigit = cleanPhone.slice(-10);
            attempts.push(`${tenDigit}@vppgreen.com`);
            attempts.push(`91${tenDigit}@vppgreen.com`);
            attempts.push(`+91${tenDigit}@vppgreen.com`);
          } else {
            // Check if it looks like a name and convert to email format (first.last@vppgreen.com)
            const nameEmail = `${identifier.toLowerCase().trim().replace(/\s+/g, ".")}`;
            if (nameEmail) {
              attempts.push(`${nameEmail}@vppgreen.com`);
            }
            attempts.push(`${identifier}@vppgreen.com`);
          }
        }
      }

      console.log('[Auth] Will attempt these emails:', attempts);

      let lastError: any = null;
      let sessionData: any = null;

      for (const emailAttempt of attempts) {
        console.log('[Auth] Trying:', emailAttempt);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailAttempt,
          password
        });
        if (!error && data.session) {
          console.log('[Auth] ✅ Success with:', emailAttempt);
          sessionData = data;
          lastError = null;
          break;
        } else {
          console.log('[Auth] ❌ Failed with:', emailAttempt, '- Error:', error?.message);
          lastError = error;
        }
      }

      if (lastError) {
        console.error('[Auth] All attempts failed. Last error:', lastError.message);
        throw lastError;
      }

      if (sessionData && sessionData.session) {
        console.log('[Auth] Session established, loading profile...');
        await get().loadSession();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[Auth] Login error:', err.message);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }

      // Fetch custom user profile
      let { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        // --- SYNC METADATA FIX ---
        // If the profile is fresh from the trigger (missing details or default name), update it!
        const meta = session.user.user_metadata || {};
        const needsSync = 
          (!profile.institution_id && meta.institution_id) ||
          (profile.full_name === 'New User' && meta.full_name) ||
          (profile.role !== meta.role && meta.role) ||
          (!profile.department && meta.department) ||
          (!profile.class_year && meta.class_year) ||
          !profile.mobile;

        if (needsSync) {
          const { data: updatedProfile } = await supabase.from('users').update({
            full_name: meta.full_name || profile.full_name,
            mobile: meta.mobile || profile.mobile || session.user.phone,
            email: meta.real_email || profile.email,
            role: meta.role || profile.role,
            institution_id: meta.institution_id || profile.institution_id,
            department: meta.department || profile.department,
            class_year: meta.class_year || profile.class_year,
          }).eq('id', session.user.id).select().single();
          
          if (updatedProfile) {
            profile = updatedProfile;
          }
        }
        // -------------------------

        // --- HARD AUTHENTIC RBAC MOCK FOR DEMO ---
        const phoneKey = session.user.phone || '';
        if (phoneKey.includes('9910000001')) profile.institution_id = '00000000-0000-0000-0000-000000000001';
        if (phoneKey.includes('9910000002')) profile.institution_id = '00000000-0000-0000-0000-000000000002';
        if (phoneKey.includes('9910000003')) profile.institution_id = '00000000-0000-0000-0000-000000000003';
        // ------------------------------------------

        set({
          user: {
            id: profile.id,
            name: profile.full_name || session.user.user_metadata?.full_name || 'User',
            phone: profile.mobile || session.user.phone,
            role: profile.role || session.user.user_metadata?.role || 'student',
            institutionId: profile.institution_id || session.user.user_metadata?.institution_id,
            departmentId: profile.department,
            avatarUrl: profile.profile_photo || undefined
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Fallback for demo users that don't exist in DB
        const phoneKey = session.user.phone || '';
        let role = 'student';
        let institutionId = '00000000-0000-0000-0000-000000000001';
        let name = 'Demo User';

        let departmentId: string | undefined;

        if (phoneKey.includes('9910000000')) { role = 'super_admin'; name = 'Super Admin'; }
        else if (phoneKey.includes('9910000001')) { role = 'institution_admin'; institutionId = '00000000-0000-0000-0000-000000000001'; name = 'VVPCOE & VA Admin'; }
        else if (phoneKey.includes('9910000002')) { role = 'institution_admin'; institutionId = '00000000-0000-0000-0000-000000000002'; name = 'VPP Law Admin'; }
        else if (phoneKey.includes('9910000003')) { role = 'institution_admin'; institutionId = '00000000-0000-0000-0000-000000000003'; name = 'Manohar Phalke Architecture Admin'; }
        // Department HODs
        else if (phoneKey.includes('9920000001')) { role = 'department_hod'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Computer Engineering'; name = 'HOD - Computer Engineering'; }
        else if (phoneKey.includes('9920000002')) { role = 'department_hod'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Information Technology'; name = 'HOD - Information Technology'; }
        else if (phoneKey.includes('9920000003')) { role = 'department_hod'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Computer Science & Engineering (AI & ML, Data Science)'; name = 'HOD - CSE (AI & ML, DS)'; }
        else if (phoneKey.includes('9920000004')) { role = 'department_hod'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Electronics & Computer Science'; name = 'HOD - Electronics & CS'; }
        else if (phoneKey.includes('9920000005')) { role = 'department_hod'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Mechatronics Engineering'; name = 'HOD - Mechatronics Eng'; }
        else if (phoneKey.includes('9920000006')) { role = 'department_hod'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Fine Art'; name = 'HOD - Fine Art'; }
        else if (phoneKey.includes('9920000007')) { role = 'department_hod'; institutionId = '00000000-0000-0000-0000-000000000003'; departmentId = 'Department of Architecture'; name = 'HOD - Department of Architecture'; }
        else if (phoneKey.includes('9920000008')) { role = 'department_hod'; institutionId = '00000000-0000-0000-0000-000000000002'; departmentId = 'Department of Law'; name = 'HOD - Department of Law'; }
        // CSR Partner
        else if (phoneKey.includes('9930000001')) { role = 'csr_partner'; institutionId = undefined; name = 'CSR Partner Sponsor'; }
        // Faculty mock profiles (3 per department, suffixes 04 to 27)
        else if (Number(phoneKey.slice(-2)) >= 4 && Number(phoneKey.slice(-2)) <= 6) {
          role = 'faculty'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Computer Engineering';
          const names = ['Dr. M. Kadam', 'Prof. A. Sawant', 'Prof. S. Rane'];
          name = names[Number(phoneKey.slice(-2)) - 4];
        }
        else if (Number(phoneKey.slice(-2)) >= 7 && Number(phoneKey.slice(-2)) <= 9) {
          role = 'faculty'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Information Technology';
          const names = ['Prof. S. Patil', 'Dr. R. Naik', 'Prof. J. Mehta'];
          name = names[Number(phoneKey.slice(-2)) - 7];
        }
        else if (Number(phoneKey.slice(-2)) >= 10 && Number(phoneKey.slice(-2)) <= 12) {
          role = 'faculty'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Computer Science & Engineering (AI & ML, Data Science)';
          const names = ['Dr. A. Joshi', 'Prof. K. Shah', 'Dr. S. Shinde'];
          name = names[Number(phoneKey.slice(-2)) - 10];
        }
        else if (Number(phoneKey.slice(-2)) >= 13 && Number(phoneKey.slice(-2)) <= 15) {
          role = 'faculty'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Electronics & Computer Science';
          const names = ['Prof. S. Deshpande', 'Dr. M. Rao', 'Prof. N. Kadam'];
          name = names[Number(phoneKey.slice(-2)) - 13];
        }
        else if (Number(phoneKey.slice(-2)) >= 16 && Number(phoneKey.slice(-2)) <= 18) {
          role = 'faculty'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Mechatronics Engineering';
          const names = ['Dr. N. Rane', 'Prof. P. Shinde', 'Prof. D. Pawar'];
          name = names[Number(phoneKey.slice(-2)) - 16];
        }
        else if (Number(phoneKey.slice(-2)) >= 19 && Number(phoneKey.slice(-2)) <= 21) {
          role = 'faculty'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Fine Art';
          const names = ['Prof. S. Mehta', 'Dr. V. Gawde', 'Prof. R. Patil'];
          name = names[Number(phoneKey.slice(-2)) - 19];
        }
        else if (Number(phoneKey.slice(-2)) >= 22 && Number(phoneKey.slice(-2)) <= 24) {
          role = 'faculty'; institutionId = '00000000-0000-0000-0000-000000000003'; departmentId = 'Department of Architecture';
          const names = ['Prof. K. Shinde', 'Dr. P. Sawant', 'Prof. A. Kulkarni'];
          name = names[Number(phoneKey.slice(-2)) - 22];
        }
        else if (Number(phoneKey.slice(-2)) >= 25 && Number(phoneKey.slice(-2)) <= 27) {
          role = 'faculty'; institutionId = '00000000-0000-0000-0000-000000000002'; departmentId = 'Department of Law';
          const names = ['Dr. A. Naik', 'Prof. V. Thorat', 'Prof. G. Bhosle'];
          name = names[Number(phoneKey.slice(-2)) - 25];
        }
        // Students (7 per department, suffixes 30 to 85)
        else if (Number(phoneKey.slice(-2)) >= 30 && Number(phoneKey.slice(-2)) <= 36) {
          role = 'student'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Computer Engineering';
          const names = ['Amit Sharma', 'Yash Shinde', 'Sneha Reddy', 'Aditya Kulkarni', 'Neha Gokhale', 'Yuvraj Patil', 'Tanvi Mehta'];
          name = names[Number(phoneKey.slice(-2)) - 30];
        }
        else if (Number(phoneKey.slice(-2)) >= 37 && Number(phoneKey.slice(-2)) <= 43) {
          role = 'student'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Information Technology';
          const names = ['Priya Patel', 'Abhishek Rane', 'Komal Thorat', 'Rohit Pawar', 'Divya Salve', 'Rahul Deshmukh', 'Vikram Singh'];
          name = names[Number(phoneKey.slice(-2)) - 37];
        }
        else if (Number(phoneKey.slice(-2)) >= 44 && Number(phoneKey.slice(-2)) <= 50) {
          role = 'student'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Computer Science & Engineering (AI & ML, Data Science)';
          const names = ['Riya Sawant', 'Siddharth Patil', 'Pranav Raje', 'Shreya Kale', 'Sneha Joshi', 'Ananya Rane', 'Ishita Verma'];
          name = names[Number(phoneKey.slice(-2)) - 44];
        }
        else if (Number(phoneKey.slice(-2)) >= 51 && Number(phoneKey.slice(-2)) <= 57) {
          role = 'student'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Electronics & Computer Science';
          const names = ['Dev Thakkar', 'Pooja Nair', 'Gaurav Kadam', 'Tanmay Joshi', 'Nidhi Desai', 'Sanket Patil', 'Tejaswini Rane'];
          name = names[Number(phoneKey.slice(-2)) - 51];
        }
        else if (Number(phoneKey.slice(-2)) >= 58 && Number(phoneKey.slice(-2)) <= 64) {
          role = 'student'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Mechatronics Engineering';
          const names = ['Aryan Sawant', 'Kiran Shinde', 'Sameer Gawde', 'Asha Pawar', 'Nitin Kadam', 'Radhika Patil', 'Kunal Sawant'];
          name = names[Number(phoneKey.slice(-2)) - 58];
        }
        else if (Number(phoneKey.slice(-2)) >= 65 && Number(phoneKey.slice(-2)) <= 71) {
          role = 'student'; institutionId = '00000000-0000-0000-0000-000000000001'; departmentId = 'Fine Art';
          const names = ['Ketan Sawant', 'Mansi Patil', 'Aniket Rane', 'Arjun Naik', 'Kavita Bhosle', 'Manish Gaikwad', 'Sachin Kadam'];
          name = names[Number(phoneKey.slice(-2)) - 65];
        }
        else if (Number(phoneKey.slice(-2)) >= 72 && Number(phoneKey.slice(-2)) <= 78) {
          role = 'student'; institutionId = '00000000-0000-0000-0000-000000000003'; departmentId = 'Department of Architecture';
          const names = ['Priyanka Patil', 'Rahul Sawant', 'Siddharth Rane', 'Prisha Gokhale', 'Neel Shinde', 'Gauri Sawant', 'Jayesh Patil'];
          name = names[Number(phoneKey.slice(-2)) - 72];
        }
        else if (Number(phoneKey.slice(-2)) >= 79 && Number(phoneKey.slice(-2)) <= 85) {
          role = 'student'; institutionId = '00000000-0000-0000-0000-000000000002'; departmentId = 'Department of Law';
          const names = ['Kunal More', 'Divya Joshi', 'Aakash Salvi', 'Deepa Kulkarni', 'Harsh Rane', 'Shruti Pawar', 'Mayur Kadam'];
          name = names[Number(phoneKey.slice(-2)) - 79];
        }

        if (phoneKey.includes('99100000') || phoneKey.includes('99200000') || phoneKey.includes('99300000')) {
          set({
            user: {
              id: session.user.id,
              name: name,
              phone: phoneKey,
              role: role,
              institutionId: institutionId,
              departmentId: departmentId,
            },
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }

        // If not a demo user, log them in using their Auth Metadata!
        const meta = session.user.user_metadata || {};
        set({
          user: {
            id: session.user.id,
            name: meta.full_name || name,
            phone: session.user.phone || phoneKey,
            role: meta.role || role,
            institutionId: meta.institution_id || institutionId,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }

    } catch {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  logout: async () => {
    set({ user: null, isAuthenticated: false, error: null, otpSent: false });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
  },

  clearError: () => set({ error: null }),
}));
