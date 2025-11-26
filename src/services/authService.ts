import { supabase } from '@/lib/supabaseClient'

/**
 * AuthService - wraps Supabase Auth for admin login while keeping
 * a local fallback session in localStorage for synchronous checks.
 *
 * Notes:
 * - Creating users must be done via Supabase Dashboard or a secure server-side
 *   endpoint using the service_role key. Do NOT create users from frontend
 *   using service_role key.
 * - The local fallback session exists for quick UI checks; the canonical
 *   session is the Supabase session.
 */

const LOCAL_SESSION_KEY = 'admin_local_session_v1'

export class AuthService {
  // no-op initialization on frontend (creating users requires server privileges)
  async initializeAdminUser(email: string, _password: string): Promise<void> {
    // intentionally left blank for frontend safety.
    return
  }

  // Sign in with Supabase Auth (email + password)
  async signInAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // if sign-in OK, persist a local fallback session
    if (data?.user) {
      this.setLocalAdminSession(email)
    }
    return data
  }

  // Sign out (Supabase + local fallback)
  async signOut() {
    await supabase.auth.signOut()
    this.clearLocalAdminSession()
  }

  // Local session helpers (synchronous)
  setLocalAdminSession(email: string) {
    try {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ email, ts: Date.now() }))
    } catch {
      // ignore
    }
  }

  clearLocalAdminSession() {
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY)
    } catch {
      // ignore
    }
  }

  getLocalAdminSession(): { email: string; ts: number } | null {
    try {
      const raw = localStorage.getItem(LOCAL_SESSION_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  // synchronous check used by your components on first render
  isAuthenticated(): boolean {
    // prefer local fallback for sync checks (will be re-validated by syncAuth)
    return this.getLocalAdminSession() !== null
  }

  // Sync with Supabase session (async). Returns true if authenticated.
  async syncAuth(): Promise<boolean> {
    try {
      const sessionResp = await supabase.auth.getSession()
      // sessionResp.data.session may be null if not signed in
      const supabaseSession = sessionResp?.data?.session ?? null
      if (supabaseSession?.user) {
        // ensure local fallback exists
        const email = supabaseSession.user.email ?? ''
        if (email) this.setLocalAdminSession(email)
        return true
      }

      // If Supabase has no session but local fallback exists, consider it not-authenticated
      // and clear local session to avoid false positives. (You can change this behavior if desired.)
      this.clearLocalAdminSession()
      return false
    } catch (err) {
      console.error('Failed to sync auth with Supabase:', err)
      // on error, don't falsely mark as authenticated
      this.clearLocalAdminSession()
      return false
    }
  }

  // Listen for auth state changes and call callback with boolean auth state.
  // Returns an unsubscribe function.
  onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuth = !!session?.user
      if (!isAuth) {
        this.clearLocalAdminSession()
      } else {
        const email = session?.user?.email ?? ''
        if (email) this.setLocalAdminSession(email)
      }
      callback(isAuth)
    })
    return () => sub.subscription?.unsubscribe?.()
  }

  // Old authenticateAdmin kept for backward compatibility (uses local stored hash)
  // but we strongly recommend using signInAdmin above.
  async authenticateAdmin(email: string, password: string): Promise<boolean> {
    // Fallback behavior: check admin_users table using the same SHA-256 approach
    // that your previous frontend implementation used. This function is provided
    // only for backward compatibility in case any code still calls it.
    try {
      // fetch the stored hash
      const { data, error } = await supabase.from('admin_users').select('password_hash').eq('email', email).maybeSingle()
      if (error) {
        console.error('Error reading admin_users for authenticateAdmin:', error)
        return false
      }
      if (!data) return false
      // compute SHA-256 of password in browser (same algorithm as previous file)
      const passwordHash = await this.hashPassword(password)
      return passwordHash === data.password_hash
    } catch (err) {
      console.error('authenticateAdmin error:', err)
      return false
    }
  }

  // helper to compute SHA-256 hash (kept for backward compatibility)
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
}

export const authService = new AuthService()
