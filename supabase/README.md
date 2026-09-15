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

## Closet arrangement

The Wardrobe Wing's default arrangement of clothes lives in
`palais_closet_racks`: one row for computers (`wide`) and one for phones
(`tall`). Run `migrations/20260914120000_palais_closet_racks.sql` once in the
SQL editor. After that, sign in on the Wardrobe catalogue's Racks page,
rearrange the clothes, and click **Done**. That arrangement becomes the one
everyone sees.

Where clothes have been dragged, how big they've been made (the catalogue's −
and +) and which have been unhearted are saved in that same row, inside
`racks`, so they need nothing more. Change the closet while signed in and click
**Save**.

## Layouts for every room

Each room on the map has its own layout for each season, on a computer and on
a phone (8 per room). Run `migrations/20260914130000_palais_layouts_places.sql`
once, which adds a `place` column. Signed in, clicking **Done** in the
catalogue saves the room as its layout for the current season on that device.
The catalogue's Seasons page shows all eight.
