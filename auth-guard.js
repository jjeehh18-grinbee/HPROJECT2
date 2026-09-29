// 로그인 세션이 필요한 기존 서비스 화면을 보호하고 로그아웃 UI를 연결합니다.
(function protectFarmPages() {
  const root = document.documentElement;

  function showGuardError(message) {
    root.classList.remove('auth-checking');
    const main = document.getElementById('main');
    if (!main || document.querySelector('.auth-guard-error')) return;
    const notice = document.createElement('p');
    notice.className = 'notice auth-guard-error';
    notice.setAttribute('role', 'alert');
    notice.textContent = message;
    main.prepend(notice);
  }

  function showUserControls(user) {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    let controls = topbar.querySelector('.auth-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'auth-controls';
      controls.innerHTML = `
        <span class="auth-email"></span>
        <button class="logout-button" type="button">로그아웃</button>
        <span class="auth-control-error" role="alert"></span>`;
      topbar.append(controls);

      controls.querySelector('.logout-button').addEventListener('click', async event => {
        const button = event.currentTarget;
        const errorMessage = controls.querySelector('.auth-control-error');
        button.disabled = true;
        button.textContent = '로그아웃 중…';
        errorMessage.textContent = '';

        const { error } = await window.farmSupabaseClient.auth.signOut();
        if (error) {
          errorMessage.textContent = '로그아웃하지 못했습니다. 잠시 후 다시 시도해주세요.';
          button.disabled = false;
          button.textContent = '로그아웃';
        }
      });
    }

    controls.querySelector('.auth-email').textContent = user.email || '로그인 사용자';
  }

  async function checkSession() {
    if (!window.farmSupabaseClient) {
      showGuardError('인증 서비스를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침해주세요.');
      return;
    }

    const { data, error } = await window.farmSupabaseClient.auth.getSession();
    if (error) {
      showGuardError('로그인 상태를 확인하지 못했습니다. 잠시 후 새로고침해주세요.');
      return;
    }

    if (!data.session) {
      location.replace('auth.html');
      return;
    }

    showUserControls(data.session.user);
    root.classList.remove('auth-checking');

    window.farmSupabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        location.replace('auth.html');
        return;
      }

      if (session) {
        showUserControls(session.user);
        root.classList.remove('auth-checking');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkSession, { once: true });
  } else {
    checkSession();
  }
})();
