-- Drop all RLS policies first
DROP POLICY IF EXISTS "Company admins can create companies" ON public.companies;
DROP POLICY IF EXISTS "Company admins can update companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view accessible companies" ON public.companies;

DROP POLICY IF EXISTS "Company admins can delete company access" ON public.company_access;
DROP POLICY IF EXISTS "Company admins can insert company access" ON public.company_access;
DROP POLICY IF EXISTS "Company admins can view company access" ON public.company_access;
DROP POLICY IF EXISTS "Users can view own company access" ON public.company_access;

DROP POLICY IF EXISTS "Company admins can insert company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Company admins can update company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can view accessible company profiles" ON public.company_profiles;

DROP POLICY IF EXISTS "Authenticated users can view grants" ON public.grants;
DROP POLICY IF EXISTS "Platform admins can delete grants" ON public.grants;
DROP POLICY IF EXISTS "Platform admins can insert grants" ON public.grants;
DROP POLICY IF EXISTS "Platform admins can update grants" ON public.grants;

DROP POLICY IF EXISTS "Allow insert for new profiles" ON public.profiles;
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Drop trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.company_access CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.grants CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_grants_updated_at();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.is_platform_admin(uuid);
DROP FUNCTION IF EXISTS public.has_company_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_company_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop enums
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.company_access_role CASCADE;
DROP TYPE IF EXISTS public.profile_status CASCADE;