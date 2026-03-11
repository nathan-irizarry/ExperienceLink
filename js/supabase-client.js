/**
 * Supabase Client Initialization
 * Initializes the Supabase client for ExperienceLink
 */

(function() {
    'use strict';

    // Supabase configuration
    const SUPABASE_URL = 'https://ngoyrjedzohwzygisrin.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nb3lyamVkem9od3p5Z2lzcmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTI4MTMsImV4cCI6MjA4ODc2ODgxM30.R032rfkIRmDWkvISOFkV7fToB1nws1jjvdPneuHZgKI';

    // Initialize the ExperienceLink namespace
    window.ExperienceLink = window.ExperienceLink || {};

    // Wait for Supabase to be available
    function initSupabase() {
        if (typeof supabase === 'undefined' || !supabase.createClient) {
            console.error('Supabase library not loaded. Make sure to include the Supabase CDN script before this file.');
            return null;
        }

        // Create and export the Supabase client
        const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });

        return client;
    }

    // Initialize client
    window.ExperienceLink.supabase = initSupabase();

    // Export configuration for reference
    window.ExperienceLink.config = {
        supabaseUrl: SUPABASE_URL,
        redirectUrl: window.location.origin + '/auth-callback.html'
    };

})();
