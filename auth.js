// 이메일 회원가입과 로그인 화면 전용 동작입니다.
(function initializeAuthPage() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const message = document.getElementById('auth-message');
  const tabs = document.querySelectorAll('[data-auth-tab]');

  function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = `auth-message ${type}`;
  }

  function clearMessage() {
    message.textContent = '';
    message.className = 'auth-message';
  }

  function friendlyError(error) {
    const text = (error && error.message) || '';
    if (/invalid login credentials/i.test(text)) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (/email not confirmed/i.test(text)) return '이메일 인증이 필요합니다. 받은 편지함의 인증 메일을 확인해주세요.';
    if (/user already registered/i.test(text)) return '이미 가입된 이메일입니다. 로그인해주세요.';
    if (/password should be at least/i.test(text)) return '비밀번호는 6자 이상 입력해주세요.';
    if (/invalid.*email|valid email/i.test(text)) return '올바른 이메일 주소를 입력해주세요.';
    if (/rate limit/i.test(text)) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    if (/fetch|network/i.test(text)) return '인증 서버에 연결하지 못했습니다. 인터넷 연결을 확인해주세요.';
    return text || '인증 처리 중 문제가 발생했습니다. 다시 시도해주세요.';
  }

  function selectTab(name, keepMessage = false) {
    tabs.forEach(tab => {
      const selected = tab.dataset.authTab === name;
      tab.classList.toggle('selected', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
    loginForm.hidden = name !== 'login';
    signupForm.hidden = name !== 'signup';
    if (!keepMessage) clearMessage();
    const activeForm = name === 'login' ? loginForm : signupForm;
    activeForm.querySelector('input').focus();
  }

  function setSubmitting(form, submitting, label) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = submitting;
    button.textContent = submitting ? '처리 중…' : label;
  }

  tabs.forEach(tab => tab.addEventListener('click', () => selectTab(tab.dataset.authTab)));

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearMessage();
    setSubmitting(loginForm, true, '로그인');

    const formData = new FormData(loginForm);
    const { data, error } = await window.farmSupabaseClient.auth.signInWithPassword({
      email: String(formData.get('email')).trim(),
      password: String(formData.get('password'))
    });

    if (error) {
      showMessage(friendlyError(error));
      setSubmitting(loginForm, false, '로그인');
      return;
    }

    if (data.session) location.replace('index.html');
  });

  signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearMessage();
    setSubmitting(signupForm, true, '회원가입');

    const formData = new FormData(signupForm);
    const email = String(formData.get('email')).trim();
    const password = String(formData.get('password'));
    const { data, error } = await window.farmSupabaseClient.auth.signUp({ email, password });

    if (error) {
      showMessage(friendlyError(error));
      setSubmitting(signupForm, false, '회원가입');
      return;
    }

    if (data.session) {
      location.replace('index.html');
      return;
    }

    loginForm.elements.email.value = email;
    signupForm.reset();
    setSubmitting(signupForm, false, '회원가입');
    selectTab('login', true);
    showMessage('회원가입이 완료되었습니다. 받은 편지함의 인증 메일을 확인한 뒤 로그인해주세요.', 'success');
  });

  async function start() {
    if (!window.farmSupabaseClient) {
      showMessage('인증 서비스를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침해주세요.');
      loginForm.querySelector('button').disabled = true;
      signupForm.querySelector('button').disabled = true;
      return;
    }

    const { data, error } = await window.farmSupabaseClient.auth.getSession();
    if (error) {
      showMessage('로그인 상태를 확인하지 못했습니다. 잠시 후 새로고침해주세요.');
      return;
    }
    if (data.session) location.replace('index.html');

    window.farmSupabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) location.replace('index.html');
    });
  }

  start();
})();
