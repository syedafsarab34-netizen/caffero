# Caffero

Caffero is a coffee education site for curious home brewers. The project includes a responsive editorial website, interactive brewing tools, user accounts, saved guides, a private content editor, contact inbox, and a SQLite-backed JSON API.

## Run Caffero

**Requirements:** Node.js 22.13 or newer. There are no package downloads or build steps.

    node server.mjs

Open http://localhost:4173. The SQLite file is created in data/caffero.sqlite on first run. Seed guides and recipes are added automatically without replacing later edits.

## Set up the content editor

Copy .env.example to .env, then set an owner email, a password of at least 12 characters, and a unique session secret with at least 32 characters. Caffero reads .env directly with Node’s built-in environment loader; .env is ignored by Git.

PowerShell example:

    $env:CAFFERO_ADMIN_EMAIL = "you@example.com"
    $env:CAFFERO_ADMIN_PASSWORD = "use-a-unique-password-of-at-least-12-characters"
    $env:CAFFERO_SESSION_SECRET = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
    node server.mjs

Open /admin and sign in with those credentials. If an owner account already exists, the configured email keeps its role and password; startup does not silently reset an existing password. The site owner can edit guides and articles, manage FAQs, upload a JPEG, PNG or WebP cover image, moderate contact messages, and review the limited user information needed to run the site. Content drafts stay out of public pages and search.

## Production notes

- Run Node behind a TLS-terminating reverse proxy, set NODE_ENV to production, set a unique CAFFERO_SESSION_SECRET, set CAFFERO_ORIGIN to the site's HTTPS origin, and configure an appropriate host and port. Set CAFFERO_TRUST_PROXY=true only when the trusted proxy overwrites X-Forwarded-For.
- The default bind address is loopback. Only expose the Node port directly on a trusted private network; prefer a reverse proxy with TLS and request limits.
- SQLite stores content, profiles, password hashes, revocable sessions, favorites, and contact messages. Database access uses prepared statements and foreign-key constraints. Change the SQLite file with CAFFERO_DATABASE if needed.
- Passwords use per-account salts and scrypt hashes. Sessions use signed, HTTP-only, same-site cookies. Changing a password revokes all previous sessions. Rate limits protect registration, sign-in, password changes, and the public contact form.
- User passwords and session records are not returned by the API. Administrative endpoints require an editor session; the inbox and member directory are never sent to public visitors.
- Uploaded images are limited to 5 MB, checked against their JPEG, PNG or WebP file signatures, and served under content-hash filenames. Keep a regular backup of the SQLite file and image uploads.
- The contact form writes to the database. A real deployment should connect a mail provider or inbox worker for notifications.
- The current project uses SQLite to stay easy to run without a dependency install. A future hosted deployment that outgrows a single-node SQLite writer can move its database behind the same API using a managed PostgreSQL service.

## Publish with Render

The checked-in `render.yaml` and `Dockerfile` define a public Node web service, HTTPS health checks, an automatically generated session secret, private owner credentials, and a 1 GB persistent disk for SQLite plus uploaded images. To publish, push this project to a GitHub repository, create a Render account, choose **New → Blueprint**, connect the repository and apply the Blueprint. Enter the admin email and a new, unique admin password when prompted. Render supplies the public `onrender.com` URL; a custom domain is optional. The app uses that URL for canonical URLs and same-origin security checks.

Render's free web services do not retain local files, so this configuration uses its smallest paid web service and a persistent disk. At current listed rates that starts around $7/month for the service plus $0.25/month for 1 GB of disk, before taxes or an optional domain. A disk-backed SQLite service runs as one instance and can have a brief pause during deployment. Keep backups of the database and uploaded images. See the official [Render disk documentation](https://render.com/docs/disks) and [pricing](https://render.com/pricing).

## Main routes

| Route | Page |
| --- | --- |
| / | Editorial home and interactive tools |
| /brewing | Method directory and coffee ratio calculator |
| /brew/french-press | Brewing guide with an interactive step runner and timer |
| /brew/moka-pot | Moka pot guide |
| /brew/aeropress | AeroPress guide with an interactive recipe and timer |
| /brew/espresso | Espresso guide |
| /brew-guide | Personalized recipe builder |
| /coffee and /coffee/:slug | Coffee 101 notebook |
| /coffee-types and /coffee-types/:slug | Coffee menu |
| /faq | Coffee FAQ |
| /account and /saved | Account, profile, password, and saved guides |
| /contact | Contact form and persistent editor inbox |
| /admin | Private content and message editor |

## API overview

Public read endpoints: /api/health, /api/content, /api/content/:collection/:slug, and /api/search?q=...

Account endpoints: /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/change-password, /api/auth/session, /api/me, and /api/favorites.

Editor endpoints: /api/admin/content, /api/admin/content/:collection, /api/admin/content/:collection/:id, /api/admin/images, and /api/admin/messages/:id. Mutations are same-origin checked, validated and authorization-gated.

## Checks

    node --check server.mjs
    node --check content.mjs
    node --check public/app.js
    node --test

The Node test suite uses an isolated temporary database and upload directory. It exercises the public routes, metadata, FTS search, account and profile flows, favorite save/remove, password rotation and session revocation, CSRF checks, contact messages, editor access, draft publishing, search indexing, image upload, and content deletion.

## Images and licenses

Photography is served from optimized Pexels image URLs. Individual source pages and license notes are listed in IMAGE-CREDITS.md. Pexels describes its images as free to use for personal and commercial purposes under the [Pexels License](https://www.pexels.com/legal-pages/license/). We keep source pages here for contributor credit and attribution.

- Espresso being poured — [Franco Monsalvo, Pexels](https://www.pexels.com/photo/coffee-machine-pouring-cafe-16466219/) (16466219)
- Coffee being poured at a cafe — [Alexander Sampietro, Pexels](https://www.pexels.com/photo/pouring-coffee-in-cafe-22230650/) (22884699)
- Moka pot, grounds and cup — [Wallace Chuck, Pexels](https://www.pexels.com/photo/coffee-in-moka-pot-14792389/) (14792389)
- French press / home brewing selections — [Pexels French press coffee collection](https://www.pexels.com/search/french%20press%20coffee/) (22608922, 2748538, 22129725, 7488694)
- Latte art — [Franco Monsalvo, Pexels](https://www.pexels.com/photo/barista-creating-coffee-art-17506073/) (17506073)
- Barista making latte art — [Tim Douglas, Pexels](https://www.pexels.com/photo/barista-making-latte-art-in-coffee-6205646/) (6205646)

The home hero uses the coffee-pour image (22884699). Brewing-method, Coffee 101 and drink cards use images that match their subject. Photography remains hosted by Pexels, and local editor uploads live in the ignored public/uploads directory by default.
