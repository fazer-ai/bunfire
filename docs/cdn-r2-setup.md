# CDN Setup with Cloudflare R2

This guide covers setting up a CDN using Cloudflare R2 storage and a Cloudflare Worker to serve your frontend assets (JS, CSS, images) from a global edge network.

## Architecture

```
Build → Upload to R2 → Worker serves assets → Browser
                           ↓
                     Custom domain (e.g. cdn.myapp.com)
```

- **R2 Bucket**: Stores all built assets (hashed JS/CSS, static images, fonts)
- **Cloudflare Worker**: Serves assets from R2 with proper caching headers, CORS, and content types
- **Build process**: Rewrites asset URLs to point to the CDN via `BUN_PUBLIC_CDN_URL`

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed (`bun add -g wrangler`)
- A custom domain configured in Cloudflare (optional but recommended)

## Step 1: Create the R2 Bucket

```bash
wrangler r2 bucket create my-app-assets
```

Replace `my-app-assets` with your desired bucket name.

## Step 2: Configure the Worker

Edit `workers/cdn/wrangler.toml`:

```toml
name = "my-app-cdn"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[vars]
ALLOWED_ORIGINS = "https://myapp.com,http://localhost:3000"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "my-app-assets"
```

Update:

- `name` — your worker name
- `ALLOWED_ORIGINS` — comma-separated list of allowed origins for CORS
- `bucket_name` — must match the bucket created in Step 1

## Step 3: Deploy the Worker

```bash
cd workers/cdn
bunx wrangler deploy
```

The worker will be available at `https://my-app-cdn.<your-account>.workers.dev`.

### Custom Domain (recommended)

1. Go to **Cloudflare Dashboard → Workers & Pages → your worker → Settings → Domains & Routes**
2. Add a custom domain (e.g. `cdn.myapp.com`)
3. Cloudflare will automatically configure the DNS

## Step 4: Set Environment Variables

### Local Development

Add to your `.env` file:

```env
BUN_PUBLIC_CDN_URL=https://cdn.myapp.com
```

> **Note**: Leave `BUN_PUBLIC_CDN_URL` empty for local development to serve assets from the app server directly.

### Docker / Production

Pass the build arg to Docker:

```bash
docker build --build-arg BUN_PUBLIC_CDN_URL=https://cdn.myapp.com .
```

For Coolify, set the `CDN_URL` environment variable in your service configuration.

## Step 5: Upload Assets

After building, upload the `dist/` directory to R2:

```bash
bun run build

cd dist
find . -type f | while IFS= read -r file; do
  key="${file#./}"
  echo "Uploading $key"
  bunx wrangler r2 object put "my-app-assets/$key" --file "$file" --remote
done
```

## CI/CD Integration

Here's a GitHub Actions job to automate asset upload and worker deployment:

```yaml
upload-assets:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest

    - run: bun install --frozen-lockfile

    - name: Build frontend assets
      run: bun run build
      env:
        BUN_PUBLIC_CDN_URL: ${{ secrets.BUN_PUBLIC_CDN_URL }}

    - name: Upload assets to R2
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: |
        cd dist
        find . -type f | while IFS= read -r file; do
          key="${file#./}"
          echo "Uploading $key"
          bunx wrangler r2 object put "my-app-assets/$key" --file "$file" --remote
        done

    - name: Deploy CDN Worker
      run: bunx wrangler deploy
      working-directory: workers/cdn
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Required GitHub Secrets

| Secret                  | Description                                 |
| ----------------------- | ------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | API token with Workers and R2 permissions   |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                  |
| `BUN_PUBLIC_CDN_URL`    | Your CDN URL (e.g. `https://cdn.myapp.com`) |

### Creating the Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template
4. Add **R2 Storage → Edit** permission
5. Create and copy the token

## How It Works

### Build Time

When `BUN_PUBLIC_CDN_URL` is set, the build process (`build.ts`) rewrites all asset URLs to point to the CDN:

```
/index-a1b2c3d4.css → https://cdn.myapp.com/index-a1b2c3d4.css
```

The `getAssetUrl()` utility in `src/client/lib/utils.ts` handles runtime asset URL resolution for static assets like logos.

### Worker Behavior

The CDN worker (`workers/cdn/src/index.ts`):

- Serves files from the R2 bucket
- Sets proper `Content-Type` headers based on file extension
- Applies **immutable caching** (1 year) for hashed assets (e.g. `index-a1b2c3d4.css`)
- Applies **24-hour caching** for non-hashed assets (e.g. `assets/logo.png`)
- Handles CORS with configurable allowed origins
- Supports `ETag` / `If-None-Match` for conditional requests
- Handles `HEAD` and `OPTIONS` requests
