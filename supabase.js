/**
 * ============================================================================
 * LILLY MEMES — Supabase Database Gateway & API Service
 * Architecture: Supabase Client SDK v2 (PostgreSQL + RLS + Auth + Storage)
 * Deployment Target: Cloudflare Pages & Workers compatible
 * 
 * Rules Enforced:
 * - Real database queries (NO fake records or mock counters)
 * - Public Anon Key only (NO service-role secret exposure)
 * - RLS enforcement verification (Admin role backend verification)
 * - Real Storage uploads (Post images & user profile avatars)
 * ============================================================================
 */

(function (window) {
  'use strict';

  // Public Supabase Configuration
  // Keys can be overridden via window.LILLY_ENV before script execution or set here
  const SUPABASE_CONFIG = {
    url: (window.LILLY_ENV && window.LILLY_ENV.SUPABASE_URL) || 'https://zpqsyupeqqvanrinchvn.supabase.co',
    anonKey: (window.LILLY_ENV && window.LILLY_ENV.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcXN5dXBlcXF2YW5yaW5jaHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NzY0MjEsImV4cCI6MjEwNDM1MjQyMX0.0OMiSrdBH99u_KVmZPH8FOYVxqM2o9XrOOnCXazEau0'
  };

  // Check if Supabase JS SDK is loaded
  if (!window.supabase) {
    console.error('[LillyDB] Supabase JavaScript SDK is not loaded. Please verify the CDN script tag in index.html.');
  }

  // Initialize official Supabase client instance
  let client = null;
  try {
    if (window.supabase && SUPABASE_CONFIG.url) {
      client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
    }
  } catch (initErr) {
    console.warn('[LillyDB] Notice initializing client with current config:', initErr.message);
  }

  /**
   * Safe execution wrapper for all Supabase API operations
   */
  async function safeExecute(promise) {
    try {
      if (!client) {
        return { data: null, error: new Error('Supabase client is not initialized.') };
      }
      const response = await promise;
      return { data: response.data, error: response.error, count: response.count };
    } catch (err) {
      console.error('[LillyDB Exception]', err);
      return { data: null, error: err };
    }
  }

  // Gateway Interface
  const LillyDB = {
    get client() {
      return client;
    },
    set client(newClient) {
      client = newClient;
    },

    /**
     * Update runtime connection settings (useful for dynamic config or settings modal)
     */
    configure(url, anonKey) {
      if (!url || !anonKey) return false;
      try {
        client = window.supabase.createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
          }
        });
        return true;
      } catch (e) {
        console.error('[LillyDB] Failed to reconfigure client:', e);
        return false;
      }
    },

    // =========================================================================
    // 1. AUTHENTICATION & SESSION MANAGEMENT
    // =========================================================================

    /**
     * Register a new user (Strictly assigns role 'USER', Rule 9)
     */
    async signUp(email, password, username, displayName) {
      const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      const { data, error } = await safeExecute(
        client.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              username: sanitizedUsername,
              display_name: displayName.trim(),
              role: 'USER' // Forced client-side; RLS and DB defaults guarantee USER role
            }
          }
        })
      );

      // If user successfully created, ensure profile record exists
      if (data && data.user && !error) {
        await this.upsertProfile({
          id: data.user.id,
          username: sanitizedUsername,
          display_name: displayName.trim(),
          email: email.trim(),
          role: 'USER',
          avatar_url: 'assets/icon.png',
          created_at: new Date().toISOString()
        });
      }

      return { data, error };
    },

    /**
     * Sign in existing user
     */
    async signIn(email, password) {
      return safeExecute(
        client.auth.signInWithPassword({
          email: email.trim(),
          password: password
        })
      );
    },

    /**
     * Sign out current user
     */
    async signOut() {
      if (!client) return { data: null, error: null };
      return safeExecute(client.auth.signOut());
    },

    /**
     * Retrieve active session from storage
     */
    async getSession() {
      if (!client) return { data: { session: null }, error: null };
      return safeExecute(client.auth.getSession());
    },

    /**
     * Retrieve currently logged in user safely without triggering 403 on unauthenticated visitors
     */
    async getCurrentUser() {
      if (!client) return { data: { user: null }, error: null };

      // 1. Check local session state first to prevent unneeded or invalid requests to /auth/v1/user
      const { data: sessionData, error: sessionErr } = await safeExecute(client.auth.getSession());

      if (sessionErr || !sessionData || !sessionData.session) {
        // No active session present in local storage — user is cleanly a guest
        return { data: { user: null }, error: null };
      }

      // 2. Validate active session token against Supabase
      const userRes = await safeExecute(client.auth.getUser());

      // 3. If token is rejected (403 / 401 / expired), purge stale storage credentials
      if (userRes.error) {
        const statusCode = userRes.error.status || (userRes.error.cause && userRes.error.cause.status);
        if (statusCode === 401 || statusCode === 403 || userRes.error.message.includes('Forbidden')) {
          console.warn('[LillyDB] Stale or invalid session detected. Clearing storage.');
          try {
            await client.auth.signOut({ scope: 'local' });
          } catch (e) {
            window.localStorage.removeItem('sb-' + new URL(SUPABASE_CONFIG.url).hostname.split('.')[0] + '-auth-token');
          }
          return { data: { user: null }, error: null };
        }
      }

      return userRes;
    },

    /**
     * Listen to authentication state transitions
     */
    onAuthStateChange(callback) {
      if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
      return client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
    },

    // =========================================================================
    // 2. USER PROFILES & ROLES
    // =========================================================================

    /**
     * Fetch user profile record
     */
    async getProfile(userId) {
      if (!userId || !client) return { data: null, error: null };
      return safeExecute(
        client
          .from('profiles')
          .select('id, username, display_name, avatar_url, role, bio, followers_count, following_count, created_at')
          .eq('id', userId)
          .single()
      );
    },

    /**
     * Upsert profile data
     */
    async upsertProfile(profileData) {
      if (!client) return { data: null, error: null };
      return safeExecute(
        client
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' })
      );
    },

    /**
     * Update existing profile details
     */
    async updateProfile(userId, updates) {
      if (!client) return { data: null, error: null };
      return safeExecute(
        client
          .from('profiles')
          .update(updates)
          .eq('id', userId)
      );
    },

    /**
     * Check if user possesses ADMIN permissions (Backend verification, Rule 10 & 20)
     */
    async verifyAdminStatus(userId) {
      if (!userId || !client) return false;
      const { data, error } = await safeExecute(
        client
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()
      );
      if (error || !data) return false;
      return data.role === 'ADMIN';
    },

    /**
     * Upload user avatar to 'avatars' storage bucket
     */
    async uploadAvatar(userId, file) {
      if (!client) return { data: null, error: new Error('Client offline') };
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `user-avatars/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) return { data: null, error: uploadError };

      const { data: publicUrlData } = client.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Persist url to profile record
      await this.updateProfile(userId, { avatar_url: publicUrlData.publicUrl });

      return { data: { publicUrl: publicUrlData.publicUrl }, error: null };
    },

    // =========================================================================
    // 3. POSTS & MEME CONTENT
    // =========================================================================

    /**
     * Fetch feed memes with filtering, pagination, and category criteria
     */
    async getFeedPosts({ category = 'all', limit = 12, offset = 0, sort = 'created_at' } = {}) {
      if (!client) return { data: [], error: null, count: 0 };
      let query = client
        .from('posts')
        .select(`
          id,
          caption,
          image_url,
          category,
          hashtags,
          is_motd,
          is_featured,
          views_count,
          reactions_count,
          comments_count,
          shares_count,
          created_at,
          user_id,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            role
          )
        `, { count: 'exact' })
        .order(sort, { ascending: false })
        .range(offset, offset + limit - 1);

      if (category && category.toLowerCase() !== 'all') {
        query = query.ilike('category', category);
      }

      return safeExecute(query);
    },

    /**
     * Fetch trending memes ordered by total engagement (views + reactions + comments)
     */
    async getTrendingPosts(limit = 4) {
      if (!client) return { data: [], error: null };
      return safeExecute(
        client
          .from('posts')
          .select(`
            id,
            caption,
            image_url,
            category,
            views_count,
            reactions_count,
            comments_count,
            created_at,
            profiles:user_id (
              username,
              display_name,
              avatar_url,
              role
            )
          `)
          .order('reactions_count', { ascending: false })
          .order('views_count', { ascending: false })
          .limit(limit)
      );
    },

    /**
     * Fetch official Meme of the Day
     */
    async getMemeOfTheDay() {
      if (!client) return { data: null, error: null };
      // First try to find explicit is_motd post, fallback to top post of the last 24h
      let { data, error } = await safeExecute(
        client
          .from('posts')
          .select(`
            id,
            caption,
            image_url,
            category,
            views_count,
            reactions_count,
            comments_count,
            created_at,
            profiles:user_id (
              username,
              display_name,
              avatar_url,
              role
            )
          `)
          .eq('is_motd', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      if (!data) {
        // Fallback to highest rated meme
        return safeExecute(
          client
            .from('posts')
            .select(`
              id,
              caption,
              image_url,
              category,
              views_count,
              reactions_count,
              comments_count,
              created_at,
              profiles:user_id (
                username,
                display_name,
                avatar_url,
                role
              )
            `)
            .order('reactions_count', { ascending: false })
            .limit(1)
            .maybeSingle()
        );
      }

      return { data, error };
    },

    /**
     * Fetch a single meme post by ID
     */
    async getPostById(postId) {
      if (!client) return { data: null, error: null };
      return safeExecute(
        client
          .from('posts')
          .select(`
            id,
            caption,
            image_url,
            category,
            hashtags,
            is_motd,
            is_featured,
            views_count,
            reactions_count,
            comments_count,
            shares_count,
            created_at,
            user_id,
            profiles:user_id (
              username,
              display_name,
              avatar_url,
              role
            )
          `)
          .eq('id', postId)
          .single()
      );
    },

    /**
     * Pick a random meme ("Surprise Me" functionality)
     */
    async getRandomPost() {
      if (!client) return { data: null, error: null };
      // Fetch total count to select random index offset
      const { count, error: countErr } = await client
        .from('posts')
        .select('id', { count: 'exact', head: true });

      if (countErr || !count) return { data: null, error: countErr || new Error('No posts available') };

      const randomIndex = Math.floor(Math.random() * count);
      return safeExecute(
        client
          .from('posts')
          .select(`
            id,
            caption,
            image_url,
            category,
            views_count,
            reactions_count,
            comments_count,
            created_at,
            profiles:user_id (
              username,
              display_name,
              avatar_url,
              role
            )
          `)
          .range(randomIndex, randomIndex)
          .single()
      );
    },

    /**
     * Upload meme file to 'memes' storage bucket (Admin only)
     */
    async uploadMemeImage(file, userId) {
      if (!client) return { data: null, error: new Error('Client offline') };

      const fileExt = file.name.split('.').pop();
      const fileName = `meme-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('memes')
        .upload(filePath, file);

      if (uploadError) return { data: null, error: uploadError };

      const { data: publicUrlData } = client.storage
        .from('memes')
        .getPublicUrl(filePath);

      return { data: { publicUrl: publicUrlData.publicUrl }, error: null };
    },

    /**
     * Create and publish official meme post (Admin only, Rule 11)
     */
    async createPost({ caption, imageUrl, category, hashtags, isMotd = false, isFeatured = false, userId }) {
      if (!client) return { data: null, error: new Error('Client offline') };

      // Verify Admin permissions before attempting insert
      const isAdmin = await this.verifyAdminStatus(userId);
      if (!isAdmin) {
        return { data: null, error: new Error('Unauthorized: Only official administrators can publish memes.') };
      }

      // If marked as Meme of the Day, reset any previous MOTD flags
      if (isMotd) {
        await safeExecute(
          client
            .from('posts')
            .update({ is_motd: false })
            .eq('is_motd', true)
        );
      }

      return safeExecute(
        client
          .from('posts')
          .insert([{
            caption: caption.trim(),
            image_url: imageUrl,
            category: category,
            hashtags: hashtags ? hashtags.trim() : null,
            is_motd: isMotd,
            is_featured: isFeatured,
            user_id: userId,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()
      );
    },

    // =========================================================================
    // 4. REACTIONS SYSTEM (❤️ Love, 😂 Funny, 🔥 Fire, 😮 Wow, 💀 Dead)
    // =========================================================================

    /**
     * Fetch breakdown of reactions for a specific post
     */
    async getPostReactionsBreakdown(postId) {
      if (!client) return { data: [], error: null };
      return safeExecute(
        client
          .from('reactions')
          .select('reaction_type')
          .eq('post_id', postId)
      );
    },

    /**
     * Get user's current reaction on a post
     */
    async getUserPostReaction(postId, userId) {
      if (!userId || !client) return { data: null, error: null };
      return safeExecute(
        client
          .from('reactions')
          .select('reaction_type')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle()
      );
    },

    /**
     * Toggle or update user reaction on a post (Rule 13)
     */
    async setReaction(postId, userId, reactionType) {
      if (!client) return { data: null, error: new Error('Client offline') };

      // Check existing reaction
      const { data: existing } = await this.getUserPostReaction(postId, userId);

      if (existing && existing.reaction_type === reactionType) {
        // Remove reaction (toggle off)
        const res = await safeExecute(
          client
            .from('reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
        );
        // Decrement reaction counter
        await this.adjustCounter('posts', postId, 'reactions_count', -1);
        return { data: { action: 'removed' }, error: res.error };
      } else if (existing) {
        // Update reaction type
        const res = await safeExecute(
          client
            .from('reactions')
            .update({ reaction_type: reactionType })
            .eq('post_id', postId)
            .eq('user_id', userId)
        );
        return { data: { action: 'updated', reaction: reactionType }, error: res.error };
      } else {
        // Insert fresh reaction
        const res = await safeExecute(
          client
            .from('reactions')
            .insert([{
              post_id: postId,
              user_id: userId,
              reaction_type: reactionType,
              created_at: new Date().toISOString()
            }])
        );
        // Increment reaction counter
        await this.adjustCounter('posts', postId, 'reactions_count', 1);
        return { data: { action: 'added', reaction: reactionType }, error: res.error };
      }
    },

    // =========================================================================
    // 5. COMMENTS SYSTEM (Real database records, Rule 14)
    // =========================================================================

    /**
     * Fetch comments for a post
     */
    async getComments(postId) {
      if (!client) return { data: [], error: null };
      return safeExecute(
        client
          .from('comments')
          .select(`
            id,
            post_id,
            user_id,
            parent_comment_id,
            content,
            is_pinned,
            likes_count,
            created_at,
            profiles:user_id (
              username,
              display_name,
              avatar_url,
              role
            )
          `)
          .eq('post_id', postId)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: true })
      );
    },

    /**
     * Add a comment to a post
     */
    async addComment(postId, userId, content, parentCommentId = null) {
      if (!client) return { data: null, error: new Error('Client offline') };

      const trimmed = content.trim();
      if (!trimmed) return { data: null, error: new Error('Comment cannot be empty') };

      const res = await safeExecute(
        client
          .from('comments')
          .insert([{
            post_id: postId,
            user_id: userId,
            parent_comment_id: parentCommentId,
            content: trimmed,
            is_pinned: false,
            likes_count: 0,
            created_at: new Date().toISOString()
          }])
          .select(`
            id,
            post_id,
            user_id,
            parent_comment_id,
            content,
            is_pinned,
            likes_count,
            created_at,
            profiles:user_id (
              username,
              display_name,
              avatar_url,
              role
            )
          `)
          .single()
      );

      if (!res.error) {
        await this.adjustCounter('posts', postId, 'comments_count', 1);
      }

      return res;
    },

    /**
     * Pin comment (Admin only)
     */
    async togglePinComment(commentId, isPinned, adminUserId) {
      if (!client) return { data: null, error: new Error('Client offline') };

      const isAdmin = await this.verifyAdminStatus(adminUserId);
      if (!isAdmin) return { data: null, error: new Error('Unauthorized') };

      return safeExecute(
        client
          .from('comments')
          .update({ is_pinned: isPinned })
          .eq('id', commentId)
      );
    },

    /**
     * Delete comment (Author or Admin)
     */
    async deleteComment(commentId, postId, userId) {
      if (!client) return { data: null, error: new Error('Client offline') };

      const res = await safeExecute(
        client
          .from('comments')
          .delete()
          .eq('id', commentId)
      );

      if (!res.error) {
        await this.adjustCounter('posts', postId, 'comments_count', -1);
      }

      return res;
    },

    // =========================================================================
    // 6. SAVED MEMES / BOOKMARKS
    // =========================================================================

    /**
     * Fetch user's saved memes
     */
    async getSavedPosts(userId) {
      if (!userId || !client) return { data: [], error: null };
      return safeExecute(
        client
          .from('saved_posts')
          .select(`
            post_id,
            created_at,
            posts:post_id (
              id,
              caption,
              image_url,
              category,
              reactions_count,
              comments_count,
              views_count,
              created_at,
              profiles:user_id (
                username,
                display_name,
                avatar_url,
                role
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      );
    },

    /**
     * Check if post is saved by user
     */
    async isPostSaved(userId, postId) {
      if (!userId || !client) return false;
      const { data } = await safeExecute(
        client
          .from('saved_posts')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .maybeSingle()
      );
      return !!data;
    },

    /**
     * Toggle save state for a meme
     */
    async toggleSavePost(userId, postId) {
      if (!client) return { data: null, error: new Error('Client offline') };
      const isSaved = await this.isPostSaved(userId, postId);

      if (isSaved) {
        return safeExecute(
          client
            .from('saved_posts')
            .delete()
            .eq('user_id', userId)
            .eq('post_id', postId)
        );
      } else {
        return safeExecute(
          client
            .from('saved_posts')
            .insert([{
              user_id: userId,
              post_id: postId,
              created_at: new Date().toISOString()
            }])
        );
      }
    },

    // =========================================================================
    // 7. VIEWS & SHARE TRACKING (Rule 15 & 16)
    // =========================================================================

    /**
     * Record a unique meme view with sensible session deduplication
     */
    async recordView(postId, userId = null) {
      const sessionKey = `viewed_post_${postId}`;
      if (sessionStorage.getItem(sessionKey)) {
        return { data: null, error: null };
      }
      sessionStorage.setItem(sessionKey, '1');

      return this.adjustCounter('posts', postId, 'views_count', 1);
    },

    /**
     * Record share event
     */
    async recordShare(postId) {
      return this.adjustCounter('posts', postId, 'shares_count', 1);
    },

    // =========================================================================
    // 8. NOTIFICATIONS & COMMUNITY ACTIVITY
    // =========================================================================

    /**
     * Fetch user notifications
     */
    async getNotifications(userId, limit = 20) {
      if (!userId || !client) return { data: [], error: null };
      return safeExecute(
        client
          .from('notifications')
          .select('id, type, title, message, link, is_read, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    },

    /**
     * Mark single notification as read
     */
    async markNotificationRead(notifId) {
      if (!client) return { data: null, error: null };
      return safeExecute(
        client
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notifId)
      );
    },

    /**
     * Mark all user notifications as read
     */
    async markAllNotificationsRead(userId) {
      if (!userId || !client) return { data: null, error: null };
      return safeExecute(
        client
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
      );
    },

    /**
     * Register or refresh one browser/device Web Push subscription.
     */
    async savePushSubscription(userId, subscription, userAgent = '') {
      if (!userId || !subscription || !client) return { data: null, error: null };
      const subscriptionJson = subscription.toJSON();
      return safeExecute(
        client
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys && subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys && subscriptionJson.keys.auth,
            user_agent: userAgent,
            enabled: true,
            new_meme_notifications: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'endpoint' })
          .select()
          .single()
      );
    },

    /**
     * Disable one device subscription without affecting other devices.
     */
    async disablePushSubscription(userId, endpoint) {
      if (!userId || !endpoint || !client) return { data: null, error: null };
      return safeExecute(
        client
          .from('push_subscriptions')
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('endpoint', endpoint)
      );
    },

    /**
     * Persist the user's new-meme notification preference for one device.
     */
    async setPushPreference(userId, endpoint, enabled) {
      if (!userId || !endpoint || !client) return { data: null, error: null };
      return safeExecute(
        client
          .from('push_subscriptions')
          .update({
            enabled,
            new_meme_notifications: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('endpoint', endpoint)
      );
    },

    /**
     * Read this browser/device's stored notification preference.
     */
    async getPushPreference(userId, endpoint) {
      if (!userId || !endpoint || !client) return { data: null, error: null };
      return safeExecute(
        client
          .from('push_subscriptions')
          .select('enabled, new_meme_notifications')
          .eq('user_id', userId)
          .eq('endpoint', endpoint)
          .maybeSingle()
      );
    },

    /**
     * Fetch public community activity feed
     */
    async getRecentActivity(limit = 6) {
      if (!client) return { data: [], error: null };
      return safeExecute(
        client
          .from('activity_log')
          .select('id, actor_name, action_text, target_title, created_at')
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    },

    // =========================================================================
    // 9. SEARCH & DISCOVERY
    // =========================================================================

    /**
     * Live search memes and categories (Rule 30)
     */
    async searchMemes(queryText, limit = 8) {
      if (!client) return { data: [], error: null };
      const sanitized = queryText.trim();
      if (!sanitized) return { data: [], error: null };

      return safeExecute(
        client
          .from('posts')
          .select(`
            id,
            caption,
            category,
            image_url,
            views_count,
            reactions_count
          `)
          .or(`caption.ilike.%${sanitized}%,category.ilike.%${sanitized}%,hashtags.ilike.%${sanitized}%`)
          .limit(limit)
      );
    },

    // =========================================================================
    // 10. STORIES, QUOTES & CHALLENGES (Rules 23, 24, 27)
    // =========================================================================

    /**
     * Fetch active Daily Meme Challenge
     */
    async getActiveChallenge() {
      if (!client) return { data: null, error: null };
      return safeExecute(
        client
          .from('challenges')
          .select('id, title, prompt, image_url, entries_count, is_active, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );
    },

    /**
     * Submit challenge entry caption
     */
    async submitChallengeEntry(challengeId, userId, caption) {
      if (!client) return { data: null, error: new Error('Client offline') };
      const res = await safeExecute(
        client
          .from('challenge_entries')
          .insert([{
            challenge_id: challengeId,
            user_id: userId,
            caption: caption.trim(),
            created_at: new Date().toISOString()
          }])
      );

      if (!res.error) {
        await this.adjustCounter('challenges', challengeId, 'entries_count', 1);
      }

      return res;
    },

    /**
     * Fetch stories list
     */
    async getStories(limit = 6) {
      if (!client) return { data: [], error: null };
      return safeExecute(
        client
          .from('stories')
          .select('id, title, category, summary, cover_image, views_count, created_at')
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    },

    /**
     * Fetch quotes list
     */
    async getQuotes(limit = 6) {
      if (!client) return { data: [], error: null };
      return safeExecute(
        client
          .from('quotes')
          .select('id, quote, author, category, likes_count, created_at')
          .order('created_at', { ascending: false })
          .limit(limit)
      );
    },

    // =========================================================================
    // 11. HELPER / ATOMIC COUNTER UPDATE
    // =========================================================================

    /**
     * Atomic or direct counter adjustment helper
     */
    async adjustCounter(table, recordId, column, delta) {
      if (!client) return;
      try {
        const { error: rpcErr } = await client.rpc('increment_counter', {
          row_table: table,
          row_id: recordId,
          col_name: column,
          amount: delta
        });

        if (rpcErr) {
          const { data: current } = await client
            .from(table)
            .select(column)
            .eq('id', recordId)
            .single();

          if (current) {
            const nextVal = Math.max(0, (current[column] || 0) + delta);
            const updates = {};
            updates[column] = nextVal;
            await client.from(table).update(updates).eq('id', recordId);
          }
        }
      } catch (e) {
        console.warn(`[LillyDB] Notice adjusting counter ${column} on ${table}:`, e);
      }
    }
  };

  // Expose to window namespace
  window.LillyDB = LillyDB;

})(window);