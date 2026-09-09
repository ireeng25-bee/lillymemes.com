/**
 * ============================================================================
 * LILLY MEMES — Core Application Controller & UI Logic
 * Brand: LILLY MEMES ("Your Daily Dose of Laughter 😂🔥")
 * Architecture: Vanilla JavaScript (ES6+), Event-driven, Cloudflare & PWA ready
 * ============================================================================
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentUser: null,
    currentProfile: null,
    isAdmin: false,
    currentCategory: 'all',
    activePostId: null,
    feedOffset: 0,
    feedLimit: 12,
    isLoadingFeed: false,
    hasMoreFeed: true,
    notifications: [],
    savedPostIds: new Set()
  };

  // DOM Elements Cache
  const DOM = {};

  /**
   * Safe Element Query
   */
  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  /**
   * Initialize DOM References
   */
  function initDOMElements() {
    // Header & Global
    DOM.appHeader = $('#appHeader');
    DOM.brandHomeLink = $('#brandHomeLink');
    DOM.globalSearchInput = $('#globalSearchInput');
    DOM.searchClearBtn = $('#searchClearBtn');
    DOM.searchDropdown = $('#searchDropdown');
    DOM.searchResultsList = $('#searchResultsList');
    DOM.notifBellBtn = $('#notifBellBtn');
    DOM.headerNotifBadge = $('#headerNotifBadge');
    DOM.notifDropdown = $('#notifDropdown');
    DOM.notifListContainer = $('#notifListContainer');
    DOM.notifEmptyState = $('#notifEmptyState');
    DOM.markAllNotifsReadBtn = $('#markAllNotifsReadBtn');

    // Auth & User Menu
    DOM.guestActions = $('#guestActions');
    DOM.userMenuWrapper = $('#userMenuWrapper');
    DOM.openLoginBtn = $('#openLoginBtn');
    DOM.openSignUpBtn = $('#openSignUpBtn');
    DOM.userMenuBtn = $('#userMenuBtn');
    DOM.headerUserAvatar = $('#headerUserAvatar');
    DOM.headerUserName = $('#headerUserName');
    DOM.userDropdown = $('#userDropdown');
    DOM.menuFullName = $('#menuFullName');
    DOM.menuUserRole = $('#menuUserRole');
    DOM.menuMyProfileBtn = $('#menuMyProfileBtn');
    DOM.menuSavedMemesBtn = $('#menuSavedMemesBtn');
    DOM.menuNotifSettingsBtn = $('#menuNotifSettingsBtn');
    DOM.adminMenuLi = $('#adminMenuLi');
    DOM.menuAdminDashboardBtn = $('#menuAdminDashboardBtn');
    DOM.logoutBtn = $('#logoutBtn');

    // Navigation Links
    DOM.navLinks = $$('.sidebar-nav .nav-link, .mobile-bottom-nav .mobile-nav-link');
    DOM.sidebarSurpriseBtn = $('#sidebarSurpriseBtn');
    DOM.sidebarCategoryLinks = $$('.cat-menu-link');

    // Greeting Banner
    DOM.greetingBanner = $('#greetingBanner');
    DOM.greetingHeading = $('#greetingHeading');
    DOM.greetingSubtext = $('#greetingSubtext');
    DOM.greetingIcon = $('#greetingIcon');

    // Feeds & Grids
    DOM.quickCatCards = $$('.quick-cat-card');
    DOM.trendingCardsContainer = $('#trendingCardsContainer');
    DOM.trendingLoading = $('#trendingLoading');
    DOM.memesFeedContainer = $('#memesFeedContainer');
    DOM.feedLoading = $('#feedLoading');
    DOM.loadMoreMemesBtn = $('#loadMoreMemesBtn');
    DOM.feedEndMessage = $('#feedEndMessage');
    DOM.forYouCardsContainer = $('#forYouCardsContainer');
    DOM.surpriseMeCenterBtn = $('#surpriseMeCenterBtn');

    // Meme of the Day Spotlight
    DOM.motdCard = $('#motdCard');
    DOM.motdImage = $('#motdImage');
    DOM.motdTitle = $('#motdTitle');
    DOM.motdViews = $('#motdViews');
    DOM.motdLikes = $('#motdLikes');
    DOM.motdComments = $('#motdComments');

    // Right Sidebar Panels & Quick Actions
    DOM.qaBrowseCategories = $('#qaBrowseCategories');
    DOM.qaViewTrending = $('#qaViewTrending');
    DOM.qaSavedMemes = $('#qaSavedMemes');
    DOM.qaSurpriseMe = $('#qaSurpriseMe');
    DOM.qaAdminCreatePost = $('#qaAdminCreatePost');
    DOM.recentActivityList = $('#recentActivityList');
    DOM.popularCatChips = $$('.cat-chip');

    // Mobile FAB
    DOM.mobileActionFab = $('#mobileActionFab');
    DOM.mobNavProfile = $('#mobNavProfile');
    DOM.mobileMenuBtn = $('#mobileMenuBtn');
    DOM.mobileMenuBackdrop = $('#mobileMenuBackdrop');
    DOM.sidebarLeft = $('#sidebarLeft');

    // Auth Modal
    DOM.authModal = $('#authModal');
    DOM.closeAuthModalBtn = $('#closeAuthModalBtn');
    DOM.tabLoginBtn = $('#tabLoginBtn');
    DOM.tabRegisterBtn = $('#tabRegisterBtn');
    DOM.loginTabPanel = $('#loginTabPanel');
    DOM.registerTabPanel = $('#registerTabPanel');
    DOM.loginForm = $('#loginForm');
    DOM.registerForm = $('#registerForm');
    DOM.loginEmail = $('#loginEmail');
    DOM.loginPassword = $('#loginPassword');
    DOM.loginEmailError = $('#loginEmailError');
    DOM.loginPasswordError = $('#loginPasswordError');
    DOM.regUsername = $('#regUsername');
    DOM.regDisplayName = $('#regDisplayName');
    DOM.regEmail = $('#regEmail');
    DOM.regPassword = $('#regPassword');
    DOM.regUsernameError = $('#regUsernameError');
    DOM.regDisplayNameError = $('#regDisplayNameError');
    DOM.regEmailError = $('#regEmailError');
    DOM.regPasswordError = $('#regPasswordError');

    // Meme Detail Modal
    DOM.memeModal = $('#memeModal');
    DOM.closeMemeModalBtn = $('#closeMemeModalBtn');
    DOM.modalMemeImg = $('#modalMemeImg');
    DOM.modalAuthorAvatar = $('#modalAuthorAvatar');
    DOM.modalAuthorName = $('#modalAuthorName');
    DOM.modalOfficialBadge = $('#modalOfficialBadge');
    DOM.modalPostTime = $('#modalPostTime');
    DOM.modalSaveBtn = $('#modalSaveBtn');
    DOM.modalCategoryBadge = $('#modalCategoryBadge');
    DOM.modalMemeCaption = $('#modalMemeCaption');
    DOM.modalTagsRow = $('#modalTagsRow');
    DOM.modalViewCount = $('#modalViewCount');
    DOM.modalReactionCount = $('#modalReactionCount');
    DOM.modalCommentCount = $('#modalCommentCount');
    DOM.modalShareCount = $('#modalShareCount');
    DOM.reactionsPicker = $('#reactionsPicker');
    DOM.rxnButtons = $$('.rxn-btn');
    DOM.shareWaBtn = $('#shareWaBtn');
    DOM.shareFbBtn = $('#shareFbBtn');
    DOM.shareCopyBtn = $('#shareCopyBtn');
    DOM.shareNativeBtn = $('#shareNativeBtn');
    DOM.modalCommentsList = $('#modalCommentsList');
    DOM.emptyCommentsState = $('#emptyCommentsState');
    DOM.commentsHeaderCount = $('#commentsHeaderCount');
    DOM.commentSubmitForm = $('#commentSubmitForm');
    DOM.commentInputField = $('#commentInputField');
    DOM.refreshReminderModal = $('#refreshReminderModal');
    DOM.closeRefreshReminderBtn = $('#closeRefreshReminderBtn');
    DOM.laterRefreshBtn = $('#laterRefreshBtn');
    DOM.refreshAppBtn = $('#refreshAppBtn');

    // Admin Post Creation Modal
    DOM.adminPostModal = $('#adminPostModal');
    DOM.closeAdminPostModalBtn = $('#closeAdminPostModalBtn');
    DOM.cancelAdminPostBtn = $('#cancelAdminPostBtn');
    DOM.adminCreatePostForm = $('#adminCreatePostForm');
    DOM.memeImageFileInput = $('#memeImageFileInput');
    DOM.memeFileDropZone = $('#memeFileDropZone');
    if (DOM.memeImageFileInput) {
      DOM.memeImageFileInput.setAttribute('accept', MEME_FILE_ACCEPT);
      DOM.memeImageFileInput.disabled = false;
    }
    DOM.dropZonePrompt = $('#dropZonePrompt');
    DOM.imagePreviewWrap = $('#imagePreviewWrap');
    DOM.memeUploadPreview = $('#memeUploadPreview');
    DOM.removeUploadFileBtn = $('#removeUploadFileBtn');
    DOM.postCaption = $('#postCaption');
    DOM.postCategorySelect = $('#postCategorySelect');
    DOM.postHashtags = $('#postHashtags');
    DOM.postIsFeatured = $('#postIsFeatured');
    DOM.postIsMotd = $('#postIsMotd');
    DOM.postSendNotification = $('#postSendNotification');
    DOM.postImageError = $('#postImageError');

    // Profile Modal
    DOM.profileModal = $('#profileModal');
    DOM.closeProfileModalBtn = $('#closeProfileModalBtn');
    DOM.profileAvatarLarge = $('#profileAvatarLarge');
    DOM.avatarUploadInput = $('#avatarUploadInput');
    DOM.profileDisplayName = $('#profileDisplayName');
    DOM.profileUsernameTag = $('#profileUsernameTag');
    DOM.userFollowersCount = $('#userFollowersCount');
    DOM.userFollowingCount = $('#userFollowingCount');
    DOM.userReactionsGivenCount = $('#userReactionsGivenCount');
    DOM.saveProfileSettingsBtn = $('#saveProfileSettingsBtn');
    DOM.prefNewMeme = $('#prefNewMeme');

    // Toast Container
    DOM.toastContainer = $('#toastContainer');
  }

  // =========================================================================
  // UTILITY & FEEDBACK FUNCTIONS
  // =========================================================================

  /**
   * Format numbers into compact units (e.g., 14.5K, 1.2M)
   */
  function formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(num);
  }

  /**
   * Relative time formatter
   */
  function timeAgo(dateString) {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /**
   * Show Toast Notification
   */
  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'fire') icon = '🔥';

    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * Basic HTML sanitizer
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // =========================================================================
  // TIME-AWARE PERSONALIZED GREETING BANNER (Rule 17)
  // =========================================================================

  function updateGreetingBanner() {
    if (!DOM.greetingHeading || !DOM.greetingIcon || !DOM.greetingSubtext) return;

    const hour = new Date().getHours();
    let greetingWord = 'Good Morning';
    let icon = '☀️';
    let subtext = 'Hope your day is full of smiles and good vibes!';

    if (hour >= 12 && hour < 17) {
      greetingWord = 'Good Afternoon';
      icon = '🌤️';
      subtext = 'Take a laughter break with fresh trending memes!';
    } else if (hour >= 17 && hour < 21) {
      greetingWord = 'Good Evening';
      icon = '🌅';
      subtext = 'Wind down and enjoy the funniest community highlights!';
    } else if (hour >= 21 || hour < 5) {
      greetingWord = 'Good Night';
      icon = '🌙';
      subtext = 'Late night giggles before bed. Keep smiling!';
    }

    const userName = state.currentProfile 
      ? (state.currentProfile.display_name || state.currentProfile.username)
      : 'Friend';

    DOM.greetingIcon.textContent = icon;
    DOM.greetingHeading.textContent = `${greetingWord}, ${userName}! 👋`;
    DOM.greetingSubtext.textContent = subtext;
  }

  // =========================================================================
  // AUTHENTICATION CONTROLLER & STATE
  // =========================================================================

  async function checkAuthSession() {
    if (!window.LillyDB) return;

    const { data } = await window.LillyDB.getCurrentUser();
    const user = data ? data.user : null;
    await handleUserSession(user);

    // Subscribe to Auth State Changes
    window.LillyDB.onAuthStateChange(async (event, session) => {
      const authUser = session ? session.user : null;
      await handleUserSession(authUser);
    });
  }

  let appWasBackgrounded = false;

  function handleAppVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      appWasBackgrounded = true;
      return;
    }
    if (document.visibilityState === 'visible' && appWasBackgrounded && DOM.refreshReminderModal && !DOM.refreshReminderModal.open) {
      appWasBackgrounded = false;
      openModal(DOM.refreshReminderModal);
    }
  }

  async function handleUserSession(user) {
    state.currentUser = user;

    if (user) {
      // Fetch Real Profile & Admin status from Supabase
      const { data: profile } = await window.LillyDB.getProfile(user.id);
      state.currentProfile = profile;
      state.isAdmin = profile ? (profile.role === 'ADMIN') : false;

      // Update Header UI for Logged-In State
      if (DOM.guestActions) DOM.guestActions.hidden = true;
      if (DOM.userMenuWrapper) DOM.userMenuWrapper.hidden = false;
      if (DOM.headerUserName) DOM.headerUserName.textContent = profile ? (profile.display_name || profile.username) : 'Member';
      if (DOM.headerUserAvatar && profile && profile.avatar_url) DOM.headerUserAvatar.src = profile.avatar_url;
      if (DOM.menuFullName) DOM.menuFullName.textContent = profile ? (profile.display_name || profile.username) : 'Member';
      if (DOM.menuUserRole) DOM.menuUserRole.textContent = state.isAdmin ? '👑 Official Admin' : 'Active Member';

      // Show Admin Tools if Authorized (Rule 10 & 20)
      if (DOM.adminMenuLi) DOM.adminMenuLi.hidden = !state.isAdmin;
      if (DOM.qaAdminCreatePost) DOM.qaAdminCreatePost.hidden = !state.isAdmin;

      // Load Saved Post IDs for User
      loadUserSavedMemes();
      // Load Notifications
      loadNotifications();
      restoreNewMemeNotificationPreference(user);
    } else {
      state.currentProfile = null;
      state.isAdmin = false;
      state.savedPostIds.clear();

      if (DOM.guestActions) DOM.guestActions.hidden = false;
      if (DOM.userMenuWrapper) DOM.userMenuWrapper.hidden = true;
      if (DOM.adminMenuLi) DOM.adminMenuLi.hidden = true;
      if (DOM.qaAdminCreatePost) DOM.qaAdminCreatePost.hidden = true;
      if (DOM.headerNotifBadge) DOM.headerNotifBadge.hidden = true;
    }

    updateGreetingBanner();
  }

  /**
   * Sign In Form Submission
   */
  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;

    DOM.loginEmailError.textContent = '';
    DOM.loginPasswordError.textContent = '';
    DOM.loginEmailError.classList.remove('visible');
    DOM.loginPasswordError.classList.remove('visible');

    if (!email) {
      DOM.loginEmailError.textContent = 'Please enter your email.';
      DOM.loginEmailError.classList.add('visible');
      return;
    }
    if (!password) {
      DOM.loginPasswordError.textContent = 'Please enter your password.';
      DOM.loginPasswordError.classList.add('visible');
      return;
    }

    const submitBtn = $('#submitLoginBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">Signing in...</span>';

    const { data, error } = await window.LillyDB.signIn(email, password);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-text">Sign In & Enjoy Memes 😂</span>';

    if (error) {
      showToast(error.message || 'Login failed. Please check credentials.', 'error');
    } else {
      showToast('Welcome back to LILLY MEMES! 🔥', 'success');
      closeModal(DOM.authModal);
      DOM.loginForm.reset();
    }
  }

  /**
   * Sign Up Form Submission (Rule 9: Normal registration ALWAYS USER role)
   */
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    const username = DOM.regUsername.value.trim();
    const displayName = DOM.regDisplayName.value.trim();
    const email = DOM.regEmail.value.trim();
    const password = DOM.regPassword.value;

    DOM.regUsernameError.classList.remove('visible');
    DOM.regDisplayNameError.classList.remove('visible');
    DOM.regEmailError.classList.remove('visible');
    DOM.regPasswordError.classList.remove('visible');

    if (!username || username.length < 3) {
      DOM.regUsernameError.textContent = 'Username must be at least 3 characters.';
      DOM.regUsernameError.classList.add('visible');
      return;
    }
    if (!displayName) {
      DOM.regDisplayNameError.textContent = 'Please enter your display name.';
      DOM.regDisplayNameError.classList.add('visible');
      return;
    }
    if (!email) {
      DOM.regEmailError.textContent = 'Please enter a valid email.';
      DOM.regEmailError.classList.add('visible');
      return;
    }
    if (!password || password.length < 6) {
      DOM.regPasswordError.textContent = 'Password must be at least 6 characters.';
      DOM.regPasswordError.classList.add('visible');
      return;
    }

    const submitBtn = $('#submitRegisterBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">Creating account...</span>';

    const { data, error } = await window.LillyDB.signUp(email, password, username, displayName);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-text">Create Account & Join 🔥</span>';

    if (error) {
      showToast(error.message || 'Registration error. Try again.', 'error');
    } else {
      showToast('Account created successfully! Welcome to LILLY MEMES 😂', 'success');
      closeModal(DOM.authModal);
      DOM.registerForm.reset();
    }
  }

  /**
   * Log Out Handler
   */
  async function handleLogout() {
    await window.LillyDB.signOut();
    DOM.userDropdown.hidden = true;
    showToast('Logged out successfully. See you soon!', 'info');
  }

  async function getPushVapidPublicKey() {
    if (window.LILLY_ENV && window.LILLY_ENV.PUSH_VAPID_PUBLIC_KEY) {
      return window.LILLY_ENV.PUSH_VAPID_PUBLIC_KEY;
    }

    try {
      const response = await fetch('/api/push-config', { headers: { Accept: 'application/json' } });
      if (!response.ok) return '';
      const config = await response.json();
      return config.publicKey || '';
    } catch (error) {
      return '';
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(character => character.charCodeAt(0)));
  }

  async function enableNewMemeNotifications() {
    if (!state.currentUser || !DOM.prefNewMeme) return false;

    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      DOM.prefNewMeme.checked = false;
      showToast('Push notifications are not supported in this browser.', 'info');
      return false;
    }

    const vapidPublicKey = await getPushVapidPublicKey();
    if (!vapidPublicKey) {
      DOM.prefNewMeme.checked = false;
      showToast('Notifications are not configured for this deployment yet.', 'info');
      return false;
    }

    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;

    if (permission !== 'granted') {
      DOM.prefNewMeme.checked = false;
      showToast(permission === 'denied'
        ? 'Notifications are blocked in this browser.'
        : 'Notification permission was not granted.', 'info');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      const { error } = await window.LillyDB.savePushSubscription(
        state.currentUser.id,
        subscription,
        navigator.userAgent
      );
      if (error) throw error;

      showToast('New meme notifications enabled.', 'success');
      return true;
    } catch (error) {
      DOM.prefNewMeme.checked = false;
      console.warn('[PWA] Push subscription failed:', error);
      showToast('Could not enable notifications. Please try again later.', 'error');
      return false;
    }
  }

  async function disableNewMemeNotifications() {
    if (!state.currentUser || !DOM.prefNewMeme || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await window.LillyDB.setPushPreference(state.currentUser.id, subscription.endpoint, false);
      }
      showToast('New meme notifications disabled.', 'info');
    } catch (error) {
      DOM.prefNewMeme.checked = true;
      showToast('Could not update notification preferences.', 'error');
    }
  }

  async function restoreNewMemeNotificationPreference(user) {
    if (!DOM.prefNewMeme) return;
    DOM.prefNewMeme.checked = false;
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;
      const { data } = await window.LillyDB.getPushPreference(user.id, subscription.endpoint);
      DOM.prefNewMeme.checked = Boolean(data && data.enabled && data.new_meme_notifications);
    } catch (error) {
      DOM.prefNewMeme.checked = false;
    }
  }

  async function dispatchNewMemePushNotification(postId) {
    if (!postId || !DOM.postSendNotification || !DOM.postSendNotification.checked) return;

    const { data: sessionData, error: sessionError } = await window.LillyDB.getSession();
    const accessToken = sessionData && sessionData.session ? sessionData.session.access_token : '';
    if (sessionError || !accessToken) {
      showToast('Meme published, but notification dispatch could not be authorized.', 'info');
      return;
    }

    try {
      const response = await fetch('/api/notify-new-meme', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId })
      });

      if (!response.ok) {
        throw new Error(`Notification endpoint returned ${response.status}`);
      }
    } catch (error) {
      console.warn('[PWA] New meme push dispatch failed:', error);
      showToast('Meme published, but push notifications could not be sent.', 'info');
    }
  }

  // =========================================================================
  // MEME FEED RENDERING & CONTENT CONTROLLER
  // =========================================================================

  function getMemeDownloadFilename(imageUrl, postId) {
    try {
      const pathname = new URL(imageUrl, window.location.href).pathname;
      const extensionMatch = pathname.match(/\.([a-z0-9]+)$/i);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
      return `lilly-memes-meme-${postId}.${extension}`;
    } catch (error) {
      return `lilly-memes-meme-${postId}.jpg`;
    }
  }

  function handleMemeDownload(event, imageUrl, postId) {
    event.preventDefault();
    event.stopPropagation();

    if (!imageUrl) {
      showToast('Meme image is unavailable.', 'error');
      return;
    }

    if (isIOSDevice()) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
      showToast('Image opened. Use your browser Share menu to save it.', 'info');
      return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;
    downloadLink.download = getMemeDownloadFilename(imageUrl, postId);
    downloadLink.rel = 'noopener';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  }

  function appendMemeDownloadButton(container, post) {
    if (!container || !post || !post.image_url || !post.id) return;

    const actions = document.createElement('div');
    actions.className = 'meme-card-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'meme-download-btn';
    button.title = 'Download meme';
    button.setAttribute('aria-label', 'Download meme');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `;
    button.addEventListener('click', (event) => handleMemeDownload(event, post.image_url, post.id));
    actions.appendChild(button);
    container.appendChild(actions);
  }

  /**
   * Load Trending Memes (Numbered Badges 1-4, Reference Design)
   */
  async function loadTrendingMemes() {
    if (!DOM.trendingCardsContainer) return;

    const { data: trending, error } = await window.LillyDB.getTrendingPosts(4);

    if (DOM.trendingLoading) DOM.trendingLoading.remove();

    if (error || !trending || trending.length === 0) {
      DOM.trendingCardsContainer.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted);">
          🔥 Fresh trending memes are loading up! Check back shortly.
        </div>`;
      return;
    }

    DOM.trendingCardsContainer.innerHTML = '';

    trending.forEach((post, index) => {
      const card = document.createElement('article');
      card.className = 'trending-meme-card';
      card.dataset.postId = post.id;

      card.innerHTML = `
        <div class="rank-badge rank-badge-${index + 1}">${index + 1}</div>
        <div class="meme-card-thumb-wrap">
          <img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.caption)}" class="meme-card-thumb" loading="lazy">
        </div>
        <div class="meme-card-info">
          <h4 class="meme-card-caption">${escapeHtml(post.caption)}</h4>
          <div class="card-stats-footer">
            <span class="card-stat" title="Views">👁️ ${formatNumber(post.views_count)}</span>
            <span class="card-stat" title="Reactions">❤️ ${formatNumber(post.reactions_count)}</span>
            <span class="card-stat" title="Comments">💬 ${formatNumber(post.comments_count)}</span>
          </div>
        </div>
      `;
      appendMemeDownloadButton(card.querySelector('.meme-card-info'), post);

      card.addEventListener('click', () => openMemeDetail(post.id));
      DOM.trendingCardsContainer.appendChild(card);
    });
  }

  /**
   * Load Latest Memes Feed with Filtering & Pagination
   */
  async function loadFeedMemes(reset = false) {
    if (state.isLoadingFeed || (!state.hasMoreFeed && !reset)) return;

    state.isLoadingFeed = true;
    if (reset) {
      state.feedOffset = 0;
      state.hasMoreFeed = true;
      if (DOM.memesFeedContainer) DOM.memesFeedContainer.innerHTML = '';
      if (DOM.feedEndMessage) DOM.feedEndMessage.hidden = true;
    }

    const { data: posts, error, count } = await window.LillyDB.getFeedPosts({
      category: state.currentCategory,
      limit: state.feedLimit,
      offset: state.feedOffset
    });

    if (DOM.feedLoading) DOM.feedLoading.remove();
    state.isLoadingFeed = false;

    if (error || !posts || posts.length === 0) {
      if (state.feedOffset === 0) {
        DOM.memesFeedContainer.innerHTML = `
          <div class="empty-state-card" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
            <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">😂</span>
            <strong>No memes found in "${escapeHtml(state.currentCategory)}" yet!</strong>
            <p style="font-size: 0.85rem; margin-top: 4px;">Be ready, hilarious content drops daily on LILLY MEMES.</p>
          </div>`;
      }
      state.hasMoreFeed = false;
      if (DOM.loadMoreMemesBtn) DOM.loadMoreMemesBtn.hidden = true;
      if (DOM.feedEndMessage && state.feedOffset > 0) DOM.feedEndMessage.hidden = false;
      return;
    }

    posts.forEach((post) => {
      const card = document.createElement('article');
      card.className = 'meme-feed-card';
      card.dataset.postId = post.id;

      card.innerHTML = `
        <div class="meme-card-thumb-wrap">
          <img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.caption)}" class="meme-card-thumb" loading="lazy">
        </div>
        <div class="meme-card-info">
          <div style="font-size: 0.74rem; font-weight: 700; color: var(--primary-purple);">${escapeHtml(post.category || 'Meme')}</div>
          <h4 class="meme-card-caption">${escapeHtml(post.caption)}</h4>
          <div class="card-stats-footer">
            <span class="card-stat" title="Views">👁️ ${formatNumber(post.views_count)}</span>
            <span class="card-stat" title="Reactions">❤️ ${formatNumber(post.reactions_count)}</span>
            <span class="card-stat" title="Comments">💬 ${formatNumber(post.comments_count)}</span>
          </div>
        </div>
      `;
      appendMemeDownloadButton(card.querySelector('.meme-card-info'), post);

      card.addEventListener('click', () => openMemeDetail(post.id));
      DOM.memesFeedContainer.appendChild(card);
    });

    state.feedOffset += posts.length;

    if (posts.length < state.feedLimit) {
      state.hasMoreFeed = false;
      if (DOM.loadMoreMemesBtn) DOM.loadMoreMemesBtn.hidden = true;
      if (DOM.feedEndMessage) DOM.feedEndMessage.hidden = false;
    } else {
      if (DOM.loadMoreMemesBtn) DOM.loadMoreMemesBtn.hidden = false;
    }
  }

  /**
   * Load Meme of the Day Spotlight Card
   */
  async function loadMemeOfTheDay() {
    if (!DOM.motdCard) return;

    const { data: motd } = await window.LillyDB.getMemeOfTheDay();

    if (!motd) {
      if (DOM.motdTitle) DOM.motdTitle.textContent = 'Meme of the Day dropping soon!';
      return;
    }

    if (DOM.motdImage) DOM.motdImage.src = motd.image_url;
    if (DOM.motdTitle) DOM.motdTitle.textContent = motd.caption;
    if (DOM.motdViews) DOM.motdViews.textContent = formatNumber(motd.views_count);
    if (DOM.motdLikes) DOM.motdLikes.textContent = formatNumber(motd.reactions_count);
    if (DOM.motdComments) DOM.motdComments.textContent = formatNumber(motd.comments_count);

    const existingMotdDownload = DOM.motdCard.querySelector('.meme-card-actions');
    if (existingMotdDownload) existingMotdDownload.remove();
    appendMemeDownloadButton(DOM.motdCard.querySelector('.motd-body'), motd);

    DOM.motdCard.onclick = () => openMemeDetail(motd.id);
  }

  /**
   * Load "For You" Curated Section
   */
  async function loadForYouSection() {
    if (!DOM.forYouCardsContainer) return;

    const { data: forYou } = await window.LillyDB.getFeedPosts({ limit: 4, sort: 'reactions_count' });

    if (!forYou || forYou.length === 0) return;

    DOM.forYouCardsContainer.innerHTML = '';
    forYou.forEach(post => {
      const card = document.createElement('div');
      card.className = 'trending-meme-card';
      card.innerHTML = `
        <div class="meme-card-thumb-wrap">
          <img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.caption)}" class="meme-card-thumb" loading="lazy">
        </div>
        <div class="meme-card-info">
          <h4 class="meme-card-caption">${escapeHtml(post.caption)}</h4>
        </div>
      `;
      appendMemeDownloadButton(card.querySelector('.meme-card-info'), post);
      card.addEventListener('click', () => openMemeDetail(post.id));
      DOM.forYouCardsContainer.appendChild(card);
    });
  }

  // =========================================================================
  // MEME DETAIL MODAL, REACTIONS & COMMENTS CONTROLLER
  // =========================================================================

  /**
   * Open full meme modal, record view, and fetch reactions/comments
   */
  async function openMemeDetail(postId) {
    state.activePostId = postId;

    // Fetch full post record from database
    const { data: post, error } = await window.LillyDB.getPostById(postId);
    if (error || !post) {
      showToast('Could not load meme details.', 'error');
      return;
    }

    // Populate modal views
    DOM.modalMemeImg.src = post.image_url;
    DOM.modalAuthorAvatar.src = (post.profiles && post.profiles.avatar_url) ? post.profiles.avatar_url : 'assets/icon.png';
    DOM.modalAuthorName.textContent = (post.profiles && post.profiles.display_name) ? post.profiles.display_name : 'LILLY MEMES';
    DOM.modalPostTime.textContent = timeAgo(post.created_at);
    DOM.modalCategoryBadge.textContent = post.category || 'Meme';
    DOM.modalMemeCaption.textContent = post.caption;

    // Render hashtags if present
    DOM.modalTagsRow.innerHTML = '';
    if (post.hashtags) {
      const tags = post.hashtags.split(/[\s,]+/);
      tags.forEach(tag => {
        if (!tag) return;
        const span = document.createElement('span');
        span.className = 'tag-badge';
        span.textContent = tag.startsWith('#') ? tag : `#${tag}`;
        DOM.modalTagsRow.appendChild(span);
      });
    }

    // Live engagement metrics
    DOM.modalViewCount.textContent = formatNumber(post.views_count);
    DOM.modalReactionCount.textContent = formatNumber(post.reactions_count);
    DOM.modalCommentCount.textContent = formatNumber(post.comments_count);
    DOM.modalShareCount.textContent = formatNumber(post.shares_count);

    // Save Button state
    updateSaveButtonState(postId);

    // Record View (Rule 16: session deduplication handled in LillyDB)
    window.LillyDB.recordView(postId, state.currentUser ? state.currentUser.id : null);

    // Load active user's reaction state
    loadUserReactionState(postId);

    // Load comments
    loadPostComments(postId);

    // Open Modal
    openModal(DOM.memeModal);
  }

  /**
   * Load User's Reaction State for Active Meme
   */
  async function loadUserReactionState(postId) {
    DOM.rxnButtons.forEach(btn => btn.classList.remove('user-reacted'));

    if (!state.currentUser) return;

    const { data } = await window.LillyDB.getUserPostReaction(postId, state.currentUser.id);
    if (data && data.reaction_type) {
      const activeBtn = $(`[data-reaction="${data.reaction_type}"]`);
      if (activeBtn) activeBtn.classList.add('user-reacted');
    }
  }

  /**
   * Handle Reaction Click (Love ❤️, Funny 😂, Fire 🔥, Wow 😮, Dead 💀)
   */
  async function handleReactionClick(e) {
    const btn = e.target.closest('.rxn-btn');
    if (!btn) return;

    if (!state.currentUser) {
      showToast('Please sign in to react to memes! 😂', 'info');
      openModal(DOM.authModal);
      return;
    }

    const rxnType = btn.dataset.reaction;
    const postId = state.activePostId;
    if (!postId) return;

    // Visual feedback
    btn.classList.toggle('user-reacted');

    const { data, error } = await window.LillyDB.setReaction(postId, state.currentUser.id, rxnType);

    if (error) {
      showToast('Could not save reaction.', 'error');
      btn.classList.toggle('user-reacted'); // revert
    } else {
      // Reload reaction state
      loadUserReactionState(postId);
      // Increment/Decrement modal counter visually
      const currentCount = parseInt(DOM.modalReactionCount.textContent) || 0;
      if (data.action === 'added') {
        DOM.modalReactionCount.textContent = currentCount + 1;
      } else if (data.action === 'removed') {
        DOM.modalReactionCount.textContent = Math.max(0, currentCount - 1);
      }
    }
  }

  /**
   * Load Real Comments for Active Meme (Rule 14)
   */
  async function loadPostComments(postId) {
    if (!DOM.modalCommentsList) return;

    const { data: comments, error } = await window.LillyDB.getComments(postId);

    if (error || !comments || comments.length === 0) {
      DOM.modalCommentsList.innerHTML = `
        <div class="empty-state-comments" id="emptyCommentsState">
          Be the first to leave a comment! 😂👇
        </div>`;
      if (DOM.commentsHeaderCount) DOM.commentsHeaderCount.textContent = '0';
      return;
    }

    if (DOM.commentsHeaderCount) DOM.commentsHeaderCount.textContent = String(comments.length);
    DOM.modalCommentsList.innerHTML = '';

    const renderComment = (comment, isReply = false) => {
      const row = document.createElement('div');
      row.className = isReply ? 'comment-row comment-reply' : 'comment-row';

      const avatar = (comment.profiles && comment.profiles.avatar_url) ? comment.profiles.avatar_url : 'assets/icon.png';
      const name = (comment.profiles && comment.profiles.display_name) ? comment.profiles.display_name : 'Member';
      const isPinned = comment.is_pinned;

      row.innerHTML = `
        <img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}" class="comment-avatar">
        <div class="comment-body">
          ${isPinned ? '<div class="pinned-badge">📌 Pinned by LILLY MEMES</div>' : ''}
          <div class="comment-author">${escapeHtml(name)}</div>
          <div class="comment-text">${escapeHtml(comment.content)}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">${timeAgo(comment.created_at)}</div>
          <button type="button" class="comment-reply-btn" data-reply-comment="${escapeHtml(comment.id)}">Reply</button>
        </div>
      `;
      DOM.modalCommentsList.appendChild(row);
      return row;
    };

    comments.filter(comment => !comment.parent_comment_id).forEach(comment => {
      renderComment(comment);
      comments.filter(reply => reply.parent_comment_id === comment.id).forEach(reply => renderComment(reply, true));
    });
  }

  /**
   * Submit New Comment
   */
  async function handleCommentSubmit(e) {
    e.preventDefault();

    if (!state.currentUser) {
      showToast('Please sign in to join the conversation! 💬', 'info');
      openModal(DOM.authModal);
      return;
    }

    const content = DOM.commentInputField.value.trim();
    if (!content) return;

    const postBtn = $('#postCommentBtn');
    postBtn.disabled = true;

    const { data, error } = await window.LillyDB.addComment(state.activePostId, state.currentUser.id, content);

    postBtn.disabled = false;

    if (error) {
      showToast(error.message || 'Could not post comment.', 'error');
    } else {
      DOM.commentInputField.value = '';
      loadPostComments(state.activePostId);
      showToast('Comment posted! 😂', 'success');
    }
  }

  async function handleCommentReplyClick(event) {
    const button = event.target.closest('[data-reply-comment]');
    if (!button || !DOM.modalCommentsList) return;
    if (!state.currentUser) {
      showToast('Please sign in to reply! 💬', 'info');
      openModal(DOM.authModal);
      return;
    }

    const existingForm = DOM.modalCommentsList.querySelector('.reply-input-form');
    if (existingForm) existingForm.remove();
    const form = document.createElement('form');
    form.className = 'comment-input-form reply-input-form';
    form.innerHTML = `<input class="comment-input" maxlength="500" placeholder="Write a reply..." required><button type="submit" class="btn btn-purple btn-sm">Reply</button>`;
    button.closest('.comment-body').appendChild(form);
    form.querySelector('input').focus();
    form.addEventListener('submit', async (submitEvent) => {
      submitEvent.preventDefault();
      const input = form.querySelector('input');
      const content = input.value.trim();
      if (!content) return;
      const submitButton = form.querySelector('button');
      submitButton.disabled = true;
      const { error } = await window.LillyDB.addComment(state.activePostId, state.currentUser.id, content, button.dataset.replyComment);
      if (error) {
        submitButton.disabled = false;
        showToast(error.message || 'Could not post reply.', 'error');
        return;
      }
      await loadPostComments(state.activePostId);
      showToast('Reply posted! 💬', 'success');
    });
  }

  /**
   * Sharing Logic (Rule 15: WhatsApp, Facebook, Copy Link, Web Share API)
   */
  function handleShare(platform) {
    if (!state.activePostId) return;

    const url = `${window.location.origin}${window.location.pathname}#meme-${state.activePostId}`;
    const text = `Check out this hilarious meme on LILLY MEMES! 😂🔥`;

    window.LillyDB.recordShare(state.activePostId);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard! 📋', 'success');
      }).catch(() => {
        showToast('Could not copy link automatically.', 'error');
      });
    } else if (platform === 'native') {
      if (navigator.share) {
        navigator.share({ title: 'LILLY MEMES', text, url }).catch(() => {});
      } else {
        handleShare('copy');
      }
    }
  }

  /**
   * Save / Bookmark Post Handler
   */
  async function handleToggleSave() {
    if (!state.currentUser) {
      showToast('Please sign in to save memes! 🔖', 'info');
      openModal(DOM.authModal);
      return;
    }

    const postId = state.activePostId;
    if (!postId) return;

    const { error } = await window.LillyDB.toggleSavePost(state.currentUser.id, postId);

    if (!error) {
      if (state.savedPostIds.has(postId)) {
        state.savedPostIds.delete(postId);
        showToast('Removed from saved memes.', 'info');
      } else {
        state.savedPostIds.add(postId);
        showToast('Saved to your collection! 🔖', 'success');
      }
      updateSaveButtonState(postId);
    }
  }

  function updateSaveButtonState(postId) {
    if (!DOM.modalSaveBtn) return;
    if (state.savedPostIds.has(postId)) {
      DOM.modalSaveBtn.classList.add('saved');
    } else {
      DOM.modalSaveBtn.classList.remove('saved');
    }
  }

  async function loadUserSavedMemes() {
    if (!state.currentUser) return;
    const { data: saved } = await window.LillyDB.getSavedPosts(state.currentUser.id);
    state.savedPostIds.clear();
    if (saved) {
      saved.forEach(item => {
        if (item.post_id) state.savedPostIds.add(item.post_id);
      });
    }
  }

  // =========================================================================
  // ADMIN POST PUBLISHING (Rule 11: Real post creation and image upload)
  // =========================================================================

  let selectedPostFile = null;
  let selectedPostPreviewUrl = null;
  const MAX_MEME_FILE_SIZE = 10 * 1024 * 1024;
  const SUPPORTED_MEME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  const MEME_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

  function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileType(file) {
    if (file.type) return file.type;
    const extension = file.name.split('.').pop().toLowerCase();
    const extensionTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif'
    };
    return extensionTypes[extension] || '';
  }

  function setPostImageError(message) {
    if (!DOM.postImageError) return;
    DOM.postImageError.textContent = message;
    DOM.postImageError.classList.toggle('visible', Boolean(message));
  }

  function updateMemePreviewDetails(file) {
    let details = DOM.imagePreviewWrap.querySelector('.upload-preview-details');
    if (!details) {
      details = document.createElement('div');
      details.className = 'upload-preview-details';
      DOM.imagePreviewWrap.appendChild(details);
    }

    const typeLabel = getFileType(file).replace('image/', '').toUpperCase();
    details.innerHTML = `
      <strong class="upload-preview-name"></strong>
      <span class="upload-preview-meta"></span>
      <span class="upload-preview-ready">✓ Image selected and ready to publish.</span>
    `;
    details.querySelector('.upload-preview-name').textContent = file.name;
    details.querySelector('.upload-preview-meta').textContent = `${typeLabel} • ${formatFileSize(file.size)}`;
  }

  function handleMemeFileSelect(file) {
    if (!file) return;

    const fileType = getFileType(file);
    if (!SUPPORTED_MEME_TYPES.has(fileType)) {
      selectedPostFile = null;
      if (DOM.memeImageFileInput) DOM.memeImageFileInput.value = '';
      setPostImageError('Please select a supported image format.');
      return;
    }

    if (file.size > MAX_MEME_FILE_SIZE) {
      selectedPostFile = null;
      if (DOM.memeImageFileInput) DOM.memeImageFileInput.value = '';
      setPostImageError('Image is too large. Please choose a smaller image.');
      return;
    }

    if (selectedPostPreviewUrl) URL.revokeObjectURL(selectedPostPreviewUrl);
    selectedPostFile = file;
    selectedPostPreviewUrl = URL.createObjectURL(file);
    setPostImageError('');
    updateMemePreviewDetails(file);
    DOM.memeUploadPreview.alt = `Preview of ${file.name}`;
    DOM.memeUploadPreview.onload = () => {
      DOM.imagePreviewWrap.hidden = false;
      DOM.dropZonePrompt.hidden = true;
    };
    DOM.memeUploadPreview.onerror = () => {
      setPostImageError('Unable to preview this image. Please choose another file.');
      clearPostFileSelection();
    };
    DOM.memeUploadPreview.src = selectedPostPreviewUrl;
  }

  function clearPostFileSelection() {
    selectedPostFile = null;
    if (selectedPostPreviewUrl) {
      URL.revokeObjectURL(selectedPostPreviewUrl);
      selectedPostPreviewUrl = null;
    }
    DOM.memeImageFileInput.value = '';
    DOM.memeUploadPreview.onload = null;
    DOM.memeUploadPreview.onerror = null;
    DOM.memeUploadPreview.src = '';
    DOM.imagePreviewWrap.hidden = true;
    DOM.dropZonePrompt.hidden = false;
  }

  async function handleAdminPublishPost(e) {
    e.preventDefault();

    if (!state.isAdmin) {
      showToast('Unauthorized: Only official administrators can publish.', 'error');
      return;
    }

    const { data: sessionData } = await window.LillyDB.getSession();
    if (!sessionData || !sessionData.session || !state.currentUser) {
      showToast('Your session expired. Please sign in again.', 'error');
      return;
    }

    if (!selectedPostFile) {
      setPostImageError('Please select a meme image.');
      return;
    }

    const caption = DOM.postCaption.value.trim();
    if (!caption) {
      showToast('Please enter a caption for the meme.', 'error');
      return;
    }

    const category = DOM.postCategorySelect.value;
    const hashtags = DOM.postHashtags.value.trim();
    const isFeatured = DOM.postIsFeatured.checked;
    const isMotd = DOM.postIsMotd.checked;

    const submitBtn = $('#submitPublishMemeBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">Uploading meme... 🔥</span>';
    setPostImageError('');

    // 1. Real Upload to Supabase Storage Bucket 'memes'
    const { data: uploadData, error: uploadError } = await window.LillyDB.uploadMemeImage(
      selectedPostFile,
      state.currentUser.id
    );

    if (uploadError || !uploadData) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-text">Publish Meme Now 🔥</span>';
      showToast(uploadError ? uploadError.message : 'Image upload failed.', 'error');
      return;
    }

    submitBtn.innerHTML = '<span class="btn-text">Publishing meme... 🔥</span>';

    // 2. Real Record Insert to Supabase Database 'posts'
    const { data: postRecord, error: postError } = await window.LillyDB.createPost({
      caption,
      imageUrl: uploadData.publicUrl,
      category,
      hashtags,
      isMotd,
      isFeatured,
      userId: state.currentUser.id
    });

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-text">Publish Meme Now 🔥</span>';

    if (postError) {
      showToast(postError.message || 'Failed to save post.', 'error');
    } else {
      showToast('Meme published successfully! 😂🔥', 'success');
      await dispatchNewMemePushNotification(postRecord && postRecord.id);
      closeModal(DOM.adminPostModal);
      DOM.adminCreatePostForm.reset();
      clearPostFileSelection();

      // Refresh feeds after the database record already exists.
      await Promise.allSettled([
        loadFeedMemes(true),
        loadTrendingMemes(),
        loadForYouSection(),
        isMotd ? loadMemeOfTheDay() : Promise.resolve()
      ]);
    }
  }

  // =========================================================================
  // NOTIFICATIONS SYSTEM (Rule 21)
  // =========================================================================

  async function loadNotifications() {
    if (!state.currentUser) return;

    const { data: notifs } = await window.LillyDB.getNotifications(state.currentUser.id);
    state.notifications = notifs || [];

    const unreadCount = state.notifications.filter(n => !n.is_read).length;

    if (DOM.headerNotifBadge) {
      if (unreadCount > 0) {
        DOM.headerNotifBadge.textContent = String(unreadCount);
        DOM.headerNotifBadge.hidden = false;
      } else {
        DOM.headerNotifBadge.hidden = true;
      }
    }

    renderNotificationsList();
  }

  function renderNotificationsList() {
    if (!DOM.notifListContainer) return;

    if (state.notifications.length === 0) {
      DOM.notifListContainer.innerHTML = `
        <div class="empty-state-small" id="notifEmptyState">
          <span>🔔 No new notifications</span>
        </div>`;
      return;
    }

    DOM.notifListContainer.innerHTML = '';
    state.notifications.forEach(n => {
      const item = document.createElement('div');
      item.className = `notif-item ${n.is_read ? '' : 'unread'}`;
      item.innerHTML = `
        <div style="font-size: 1.2rem;">${n.type === 'reaction' ? '❤️' : '💬'}</div>
        <div style="flex: 1;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">${escapeHtml(n.title)}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(n.message)}</div>
          <div style="font-size: 0.7rem; color: var(--text-light); margin-top: 2px;">${timeAgo(n.created_at)}</div>
        </div>
      `;
      item.onclick = async () => {
        if (!n.is_read) {
          await window.LillyDB.markNotificationRead(n.id);
          n.is_read = true;
          renderNotificationsList();
        }
      };
      DOM.notifListContainer.appendChild(item);
    });
  }

  // =========================================================================
  // LIVE SEARCH CONTROLLER (Rule 30)
  // =========================================================================

  let searchDebounceTimer = null;

  function handleSearchInput(e) {
    const query = e.target.value.trim();

    if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = !query;

    clearTimeout(searchDebounceTimer);

    if (!query) {
      if (DOM.searchDropdown) DOM.searchDropdown.hidden = true;
      return;
    }

    searchDebounceTimer = setTimeout(async () => {
      const { data: results } = await window.LillyDB.searchMemes(query);

      if (!DOM.searchResultsList) return;
      DOM.searchResultsList.innerHTML = '';

      if (!results || results.length === 0) {
        DOM.searchResultsList.innerHTML = '<div style="padding: 12px; font-size: 0.82rem; color: #94A3B8; text-align: center;">No memes found matching your search.</div>';
      } else {
        results.forEach(item => {
          const div = document.createElement('div');
          div.className = 'search-item';
          div.innerHTML = `
            <img src="${escapeHtml(item.image_url)}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover;">
            <div style="flex: 1; overflow: hidden;">
              <div style="font-size: 0.84rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.caption)}</div>
              <div style="font-size: 0.72rem; color: #94A3B8;">${escapeHtml(item.category)} • 👁️ ${formatNumber(item.views_count)}</div>
            </div>
          `;
          div.onclick = () => {
            DOM.searchDropdown.hidden = true;
            openMemeDetail(item.id);
          };
          DOM.searchResultsList.appendChild(div);
        });
      }

      DOM.searchDropdown.hidden = false;
    }, 280);
  }

  // =========================================================================
  // MODAL CONTROLS & ROUTING
  // =========================================================================

  function openModal(modal) {
    if (!modal) return;
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    if (typeof modal.close === 'function') {
      modal.close();
    } else {
      modal.removeAttribute('open');
    }
  }

  function openMemeFromUrl() {
    const match = window.location.hash.match(/^#meme-(.+)$/);
    if (match) openMemeDetail(decodeURIComponent(match[1]));
  }

  /**
   * Random Meme Surprise Me Action
   */
  async function triggerSurpriseMe() {
    showToast('Picking a hilarious meme for you... 🎁', 'fire');
    const { data: meme, error } = await window.LillyDB.getRandomPost();
    if (meme) {
      openMemeDetail(meme.id);
    } else {
      showToast('Could not load random meme. Try again!', 'info');
    }
  }

  function setMobileMenuOpen(isOpen) {
    if (!DOM.sidebarLeft || !DOM.mobileMenuBtn || !DOM.mobileMenuBackdrop) return;

    DOM.sidebarLeft.classList.toggle('mobile-menu-open', isOpen);
    DOM.mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    DOM.mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    DOM.mobileMenuBackdrop.hidden = !isOpen;
    document.body.classList.toggle('mobile-menu-is-open', isOpen);
  }

  // =========================================================================
  // EVENT LISTENERS BINDING
  // =========================================================================

  function attachEventListeners() {
    document.addEventListener('visibilitychange', handleAppVisibilityChange);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) handleAppVisibilityChange();
    });
    if (DOM.closeRefreshReminderBtn) DOM.closeRefreshReminderBtn.addEventListener('click', () => closeModal(DOM.refreshReminderModal));
    if (DOM.laterRefreshBtn) DOM.laterRefreshBtn.addEventListener('click', () => closeModal(DOM.refreshReminderModal));
    if (DOM.refreshAppBtn) DOM.refreshAppBtn.addEventListener('click', () => window.location.reload());

    if (DOM.mobileMenuBtn) {
      DOM.mobileMenuBtn.addEventListener('click', () => {
        setMobileMenuOpen(!DOM.sidebarLeft.classList.contains('mobile-menu-open'));
      });
    }

    if (DOM.mobileMenuBackdrop) {
      DOM.mobileMenuBackdrop.addEventListener('click', () => setMobileMenuOpen(false));
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    });

    DOM.navLinks.forEach(link => {
      link.addEventListener('click', () => setMobileMenuOpen(false));
    });

    // Auth Modal Triggers
    if (DOM.openLoginBtn) {
      DOM.openLoginBtn.addEventListener('click', () => {
        DOM.tabLoginBtn.click();
        openModal(DOM.authModal);
      });
    }

    if (DOM.openSignUpBtn) {
      DOM.openSignUpBtn.addEventListener('click', () => {
        DOM.tabRegisterBtn.click();
        openModal(DOM.authModal);
      });
    }

    if (DOM.closeAuthModalBtn) {
      DOM.closeAuthModalBtn.addEventListener('click', () => closeModal(DOM.authModal));
    }

    // Auth Tabs Switch
    if (DOM.tabLoginBtn && DOM.tabRegisterBtn) {
      DOM.tabLoginBtn.addEventListener('click', () => {
        DOM.tabLoginBtn.classList.add('active');
        DOM.tabRegisterBtn.classList.remove('active');
        DOM.loginTabPanel.hidden = false;
        DOM.registerTabPanel.hidden = true;
      });

      DOM.tabRegisterBtn.addEventListener('click', () => {
        DOM.tabRegisterBtn.classList.add('active');
        DOM.tabLoginBtn.classList.remove('active');
        DOM.registerTabPanel.hidden = false;
        DOM.loginTabPanel.hidden = true;
      });
    }

    // Forms
    if (DOM.loginForm) DOM.loginForm.addEventListener('submit', handleLoginSubmit);
    if (DOM.registerForm) DOM.registerForm.addEventListener('submit', handleRegisterSubmit);
    if (DOM.logoutBtn) DOM.logoutBtn.addEventListener('click', handleLogout);

    if (DOM.prefNewMeme) {
      DOM.prefNewMeme.checked = false;
      DOM.prefNewMeme.addEventListener('change', async () => {
        if (DOM.prefNewMeme.checked) {
          await enableNewMemeNotifications();
        } else {
          await disableNewMemeNotifications();
        }
      });
    }

    // User Menu Toggle
    if (DOM.userMenuBtn) {
      DOM.userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.userDropdown.hidden = !DOM.userDropdown.hidden;
      });
    }

    // Notification Dropdown Toggle
    if (DOM.notifBellBtn) {
      DOM.notifBellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.notifDropdown.hidden = !DOM.notifDropdown.hidden;
      });
    }

    if (DOM.markAllNotifsReadBtn) {
      DOM.markAllNotifsReadBtn.addEventListener('click', async () => {
        if (state.currentUser) {
          await window.LillyDB.markAllNotificationsRead(state.currentUser.id);
          loadNotifications();
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (DOM.userDropdown && !DOM.userDropdown.contains(e.target) && !DOM.userMenuBtn.contains(e.target)) {
        DOM.userDropdown.hidden = true;
      }
      if (DOM.notifDropdown && !DOM.notifDropdown.contains(e.target) && !DOM.notifBellBtn.contains(e.target)) {
        DOM.notifDropdown.hidden = true;
      }
      if (DOM.searchDropdown && !DOM.searchDropdown.contains(e.target) && !DOM.globalSearchInput.contains(e.target)) {
        DOM.searchDropdown.hidden = true;
      }
    });

    // Quick Categories Selector
    DOM.quickCatCards.forEach(card => {
      card.addEventListener('click', () => {
        DOM.quickCatCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.currentCategory = card.dataset.category || 'all';
        loadFeedMemes(true);
      });
    });

    // Left Sidebar Category Links
    DOM.sidebarCategoryLinks.forEach(link => {
      link.addEventListener('click', () => {
        setMobileMenuOpen(false);
        const cat = link.dataset.category;
        state.currentCategory = cat;
        // Update quick cat card active state if matches
        DOM.quickCatCards.forEach(c => {
          if (c.dataset.category === cat) c.classList.add('active');
          else c.classList.remove('active');
        });
        loadFeedMemes(true);
      });
    });

    // Popular Category Chips in Right Sidebar
    DOM.popularCatChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cat = chip.dataset.category;
        state.currentCategory = cat;
        loadFeedMemes(true);
      });
    });

    // Meme Modal Closes
    if (DOM.closeMemeModalBtn) {
      DOM.closeMemeModalBtn.addEventListener('click', () => closeModal(DOM.memeModal));
    }

    // Reactions & Comments Handlers
    if (DOM.reactionsPicker) DOM.reactionsPicker.addEventListener('click', handleReactionClick);
    if (DOM.commentSubmitForm) DOM.commentSubmitForm.addEventListener('submit', handleCommentSubmit);
    if (DOM.modalCommentsList) DOM.modalCommentsList.addEventListener('click', handleCommentReplyClick);
    if (DOM.modalSaveBtn) DOM.modalSaveBtn.addEventListener('click', handleToggleSave);

    // Share Buttons
    if (DOM.shareWaBtn) DOM.shareWaBtn.addEventListener('click', () => handleShare('whatsapp'));
    if (DOM.shareFbBtn) DOM.shareFbBtn.addEventListener('click', () => handleShare('facebook'));
    if (DOM.shareCopyBtn) DOM.shareCopyBtn.addEventListener('click', () => handleShare('copy'));
    if (DOM.shareNativeBtn) DOM.shareNativeBtn.addEventListener('click', () => handleShare('native'));

    // Surprise Me Handlers
    if (DOM.sidebarSurpriseBtn) DOM.sidebarSurpriseBtn.addEventListener('click', triggerSurpriseMe);
    if (DOM.surpriseMeCenterBtn) DOM.surpriseMeCenterBtn.addEventListener('click', triggerSurpriseMe);
    if (DOM.qaSurpriseMe) DOM.qaSurpriseMe.addEventListener('click', triggerSurpriseMe);

    // Quick Action Triggers
    if (DOM.qaBrowseCategories) {
      DOM.qaBrowseCategories.addEventListener('click', () => {
        window.location.hash = '#categories';
      });
    }
    if (DOM.qaViewTrending) {
      DOM.qaViewTrending.addEventListener('click', () => {
        const section = $('#trendingSection');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (DOM.qaSavedMemes) {
      DOM.qaSavedMemes.addEventListener('click', () => {
        if (!state.currentUser) {
          showToast('Please log in to see your saved memes 🔖', 'info');
          openModal(DOM.authModal);
        } else {
          showToast('Loading saved memes...', 'info');
        }
      });
    }

    // Admin Create Post Modal Triggers
    const openAdminPostAction = () => {
      if (!state.isAdmin) {
        showToast('Unauthorized: Admin account required.', 'error');
        return;
      }
      openModal(DOM.adminPostModal);
    };

    if (DOM.qaAdminCreatePost) DOM.qaAdminCreatePost.addEventListener('click', openAdminPostAction);
    if (DOM.menuAdminDashboardBtn) DOM.menuAdminDashboardBtn.addEventListener('click', openAdminPostAction);
    if (DOM.closeAdminPostModalBtn) DOM.closeAdminPostModalBtn.addEventListener('click', () => closeModal(DOM.adminPostModal));
    if (DOM.cancelAdminPostBtn) DOM.cancelAdminPostBtn.addEventListener('click', () => closeModal(DOM.adminPostModal));

    // Admin Image Drop Zone & Picker
    function triggerMemeFilePicker(event) {
      const input = DOM.memeImageFileInput;
      if (!input || input.disabled) return;
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      input.setAttribute('accept', MEME_FILE_ACCEPT);
      input.setAttribute('aria-label', 'Choose a meme image');
      input.click();
    }

    if (DOM.memeImageFileInput) {
      DOM.memeImageFileInput.addEventListener('change', (e) => {
        const file = e.target && e.target.files && e.target.files[0];
        if (file) {
          handleMemeFileSelect(file);
        }
      });
    }

    if (DOM.memeFileDropZone) {
      DOM.memeFileDropZone.setAttribute('role', 'button');
      DOM.memeFileDropZone.setAttribute('tabindex', '0');
      DOM.memeFileDropZone.setAttribute('aria-label', 'Select a meme image');

      DOM.memeFileDropZone.addEventListener('click', (event) => {
        if (event.target && event.target.closest('.remove-file-btn')) return;
        const clickedInput = event.target && event.target.closest('.file-input');
        if (clickedInput) return;
        triggerMemeFilePicker(event);
      });

      DOM.memeFileDropZone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          triggerMemeFilePicker(event);
        }
      });

      DOM.memeFileDropZone.addEventListener('dragenter', (event) => {
        event.preventDefault();
        event.stopPropagation();
        DOM.memeFileDropZone.classList.add('drag-active');
      });

      DOM.memeFileDropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
        DOM.memeFileDropZone.classList.add('drag-active');
      });

      DOM.memeFileDropZone.addEventListener('dragleave', (event) => {
        if (!DOM.memeFileDropZone.contains(event.relatedTarget)) {
          DOM.memeFileDropZone.classList.remove('drag-active');
        }
      });

      DOM.memeFileDropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        DOM.memeFileDropZone.classList.remove('drag-active');

        const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
        if (file) {
          handleMemeFileSelect(file);
        }
      });
    }

    if (DOM.removeUploadFileBtn) {
      DOM.removeUploadFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearPostFileSelection();
      });
    }

    if (DOM.adminCreatePostForm) {
      DOM.adminCreatePostForm.addEventListener('submit', handleAdminPublishPost);
    }

    // Profile Modal
    if (DOM.menuMyProfileBtn) {
      DOM.menuMyProfileBtn.addEventListener('click', () => {
        DOM.userDropdown.hidden = true;
        if (state.currentProfile) {
          DOM.profileDisplayName.textContent = state.currentProfile.display_name || state.currentProfile.username;
          DOM.profileUsernameTag.textContent = `@${state.currentProfile.username}`;
          if (state.currentProfile.avatar_url) DOM.profileAvatarLarge.src = state.currentProfile.avatar_url;
          DOM.userFollowersCount.textContent = formatNumber(state.currentProfile.followers_count || 0);
          DOM.userFollowingCount.textContent = formatNumber(state.currentProfile.following_count || 0);
          openModal(DOM.profileModal);
        }
      });
    }

    if (DOM.closeProfileModalBtn) {
      DOM.closeProfileModalBtn.addEventListener('click', () => closeModal(DOM.profileModal));
    }

    // Avatar Upload in Profile Modal
    if (DOM.avatarUploadInput) {
      DOM.avatarUploadInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0] && state.currentUser) {
          showToast('Uploading profile photo...', 'info');
          const { data, error } = await window.LillyDB.uploadAvatar(state.currentUser.id, e.target.files[0]);
          if (!error && data) {
            DOM.profileAvatarLarge.src = data.publicUrl;
            if (DOM.headerUserAvatar) DOM.headerUserAvatar.src = data.publicUrl;
            showToast('Profile photo updated! 📸', 'success');
          } else {
            showToast('Failed to upload profile photo.', 'error');
          }
        }
      });
    }

    // Search Input
    if (DOM.globalSearchInput) DOM.globalSearchInput.addEventListener('input', handleSearchInput);
    if (DOM.searchClearBtn) {
      DOM.searchClearBtn.addEventListener('click', () => {
        DOM.globalSearchInput.value = '';
        DOM.searchClearBtn.hidden = true;
        DOM.searchDropdown.hidden = true;
      });
    }

    // Load More Feed
    if (DOM.loadMoreMemesBtn) {
      DOM.loadMoreMemesBtn.addEventListener('click', () => loadFeedMemes(false));
    }

    // Mobile FAB Trigger
    if (DOM.mobileActionFab) {
      DOM.mobileActionFab.addEventListener('click', () => {
        if (state.isAdmin) {
          openAdminPostAction();
        } else {
          triggerSurpriseMe();
        }
      });
    }

    if (DOM.mobNavProfile) {
      DOM.mobNavProfile.addEventListener('click', () => {
        if (state.currentUser) {
          DOM.menuMyProfileBtn.click();
        } else {
          openModal(DOM.authModal);
        }
      });
    }
  }

  // =========================================================================
  // PWA INSTALLATION CONTROLLER
  // =========================================================================

  let deferredInstallPrompt = null;
  let installButton = null;
  let iosInstallDialog = null;
  let installConfirmationShown = false;

  function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(window.navigator.userAgent)
      || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  }

  function createIOSInstallDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-modal pwa-install-dialog';
    dialog.setAttribute('aria-labelledby', 'pwaInstallTitle');
    dialog.innerHTML = `
      <div class="modal-dialog pwa-install-card">
        <div class="modal-header">
          <h2 class="modal-title" id="pwaInstallTitle">📲 Install LILLY MEMES</h2>
          <button type="button" class="modal-close-btn" data-pwa-close aria-label="Close installation instructions">&times;</button>
        </div>
        <div class="pwa-install-content">
          <p>Install LILLY MEMES on your iPhone or iPad:</p>
          <ol>
            <li>Tap the browser <strong>Share</strong> button.</li>
            <li>Choose <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong>.</li>
          </ol>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('[data-pwa-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  function updateInstallButton() {
    if (!installButton) return;

    if (isAppInstalled()) {
      installButton.hidden = true;
      return;
    }

    const canUseNativePrompt = Boolean(deferredInstallPrompt);
    const canUseIOSInstructions = isIOSDevice();
    installButton.hidden = !canUseNativePrompt && !canUseIOSInstructions;
    installButton.textContent = '📲 Install App';
    installButton.disabled = false;
  }

  async function handleInstallButtonClick() {
    if (isAppInstalled()) {
      installButton.hidden = true;
      return;
    }

    if (deferredInstallPrompt) {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        installConfirmationShown = true;
        showToast('🎉 LILLY MEMES has been installed!', 'success');
      } else {
        showToast('Installation was dismissed. You can try again whenever you are ready.', 'info');
      }
      updateInstallButton();
      return;
    }

    if (isIOSDevice() && iosInstallDialog) {
      iosInstallDialog.showModal();
      return;
    }

    showToast('App installation is not currently available in this browser.', 'info');
  }

  function initPwaInstallUI() {
    if (isAppInstalled()) return;

    const headerActions = document.querySelector('.header-actions');
    if (!headerActions || document.getElementById('installAppBtn')) return;

    installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.id = 'installAppBtn';
    installButton.className = 'btn btn-sm btn-pink pwa-install-btn';
    installButton.textContent = '📲 Install App';
    installButton.setAttribute('aria-label', 'Install LILLY MEMES as an app');
    installButton.addEventListener('click', handleInstallButtonClick);
    headerActions.insertBefore(installButton, headerActions.firstElementChild);

    iosInstallDialog = createIOSInstallDialog();
    updateInstallButton();

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      updateInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      if (installButton) installButton.hidden = true;
      if (!installConfirmationShown) {
        showToast('🎉 LILLY MEMES has been installed!', 'success');
      }
      installConfirmationShown = false;
    });
  }

  // =========================================================================
  // SERVICE WORKER & PWA REGISTRATION (Rule 22)
  // =========================================================================

  let serviceWorkerRegistrationAttempted = false;

  function registerServiceWorker() {
    if (serviceWorkerRegistrationAttempted) return;
    if (!('serviceWorker' in navigator) || !window.location.protocol.startsWith('http')) return;

    serviceWorkerRegistrationAttempted = true;

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('sw.js', {
          updateViaCache: 'none'
        });
        console.log('[PWA] Service Worker active with scope:', registration.scope);

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (err) {
        console.warn('[PWA] Service Worker registration failed:', err);
      }
    });
  }

  // =========================================================================
  // INITIALIZATION LIFECYCLE
  // =========================================================================

  function initApp() {
    initDOMElements();
    initPwaInstallUI();
    updateGreetingBanner();
    attachEventListeners();
    checkAuthSession();

    // Fetch initial feeds
    loadTrendingMemes();
    loadFeedMemes(true);
    loadMemeOfTheDay();
    loadForYouSection();
    openMemeFromUrl();

    // Register Progressive Web App service worker
    registerServiceWorker();

    // Refresh greeting periodically
    setInterval(updateGreetingBanner, 60000);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})()