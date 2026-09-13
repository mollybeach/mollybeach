# Supabase: Palais saved looks

The catalogue's **Saved looks** page keeps arrangements of the room in the
`palais_layouts` table (project `palais`, ref `qducnvdzikeyitzjcpmp`).
Anyone can read them. Only editors can save.

## Setup (once)

1. **Create the tables.** Paste
   `migrations/20260913120000_palais_layouts.sql` into the dashboard's SQL
   editor and run it. It's safe to run again.
2. **Connect the site.** In `.env.local` at the repo root:
   ```
   REACT_APP_SUPABASE_URL=https://qducnvdzikeyitzjcpmp.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=<Settings → API Keys → publishable key>
   ```
   Restart `npm start`. `npm run deploy` builds with the same file.
3. **Make your login.** Go to Authentication → Users → Add user, enter your
   email and a password, and tick "Auto confirm". Then in Authentication →
   Sign In / Providers, turn off "Allow new users to sign up".
4. **Make yourself an editor.** In the SQL editor:
   ```sql
   insert into public.palais_editors (user_id)
   select id from auth.users where email = '<your email>';
   ```
5. On the site, open Catalogue → Saved looks → "Sign in to save looks".
