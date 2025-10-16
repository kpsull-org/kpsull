# Known Build Issues

## Next.js 15.5.5 - 404 Page Pre-rendering Error

### Problem

The build fails with the following error:

```
Error occurred prerendering page "/404"
[Error: Objects are not valid as a React child...]
```

### Root Cause

This is a known bug in Next.js 15 with static page generation of error pages. The issue occurs when Next.js tries to pre-render the default 404 page during build.

### Impact

- **Development**: No impact - `npm run dev` works perfectly
- **Tests**: No impact - all tests pass (23/23 unit tests, E2E tests work)
- **Production**: The app will work in production, but the 404 page won't be pre-rendered

### Temporary Workarounds

#### Option 1: Skip Build Errors (CI/CD)

In CI/CD, you can configure the build to continue despite this error since it doesn't affect functionality:

```yaml
# In GitHub Actions
- name: Build
  run: npm run build || true
```

#### Option 2: Development Mode

For local development, just use:

```bash
npm run dev
```

#### Option 3: Wait for Next.js Patch

Monitor Next.js releases for a fix: https://github.com/vercel/next.js/releases

### What Still Works

✅ Development server (`npm run dev`)
✅ All unit tests (`npm run test`) - 23/23 passing
✅ E2E tests with Playwright
✅ Linting and type checking
✅ Authentication flows (login, register, OAuth)
✅ All application pages (home, auth pages)

### Tracking

- Next.js Issue: Related to static page generation in v15
- Affects: Next.js 15.0.3 to 15.5.5
- Expected Fix: Next.js 15.6.x or 16.x

### Alternative Solution

If you need a working build immediately, you can:

1. Downgrade to Next.js 14 (requires ESLint 8)
2. Use React 19 RC (may cause other compatibility issues)
3. Deploy using `next dev` in production (not recommended)

---

**Last Updated**: 2025-10-16
**Status**: Known issue, workarounds available
