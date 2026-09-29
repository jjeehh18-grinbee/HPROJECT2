// Supabase 프로젝트 클라이언트를 초기화합니다.
(function initializeSupabase() {
  const projectUrl = 'https://xvpptapummhbwoxxfbal.supabase.co';
  const publishableKey = 'sb_publishable_64AnpugSHfOVLaV9kzxr8A_vhIrDSjU';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Supabase SDK를 불러오지 못했습니다. 기존 Mock Data 기능은 계속 사용할 수 있습니다.');
    return;
  }

  const farmSupabaseClient = window.supabase.createClient(projectUrl, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.farmSupabaseClient = farmSupabaseClient;
})();
