# 🚀 Panduan Fix untuk Cloudflare Workers Deployment

Jika website menampilkan error `3390417109` atau React error `#441` (Hydration mismatch) saat deploy ke Cloudflare Workers, ikuti panduan ini.

---

## 🔴 Error yang Terjadi

### Error 1: Hydration Mismatch (React #441)
```
Uncaught Error: Minified React error #441
```

**Penyebab**: VotingCard component tidak properly handle hydration antara server dan client di edge runtime.

**Solusi**: ✅ **SUDAH FIXED** di update terbaru

---

### Error 2: Cloudflare Worker Error 3390417109
```
ERROR 3390417109 from Cloudflare
```

**Penyebab**: Prisma client configuration untuk edge runtime

**Solusi**: ✅ **SUDAH FIXED** - Updated `src/lib/prisma.ts`

---

## ✅ Fixes Applied

### 1. VotingCard Component Hydration Fix

**File**: `src/components/VotingCard.tsx`

**Changes**:
- Added `suppressHydrationWarning` untuk placeholder skeleton
- Improved localStorage safety dengan `safeStorage` object
- Added proper error boundaries
- Used `useCallback` untuk stable function references
- Proper null-coalescing operators (`??`)

**Key Update**:
```typescript
// Sebelum: Bisa cause hydration mismatch
if (!mounted) {
  return null; // Mismatch!
}

// Sesudah: Render placeholder yang konsisten
if (!mounted) {
  return (
    <div className="w-full" suppressHydrationWarning>
      {/* Skeleton loader - consistent di server & client */}
    </div>
  );
}
```

### 2. Safe localStorage Access

**Changes**:
- Implemented `safeStorage` helper
- Catch errors dari localStorage access
- Support untuk environment tanpa localStorage (edge runtime)

```typescript
const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch (e) {
      // Silently fail
    }
  },
};
```

### 3. Prisma Edge Runtime Support

**File**: `src/lib/prisma.ts`

**Changes**:
- Better error handling untuk Cloudflare context
- Proper fallback untuk non-Cloudflare environment
- Improved logging untuk debugging

```typescript
try {
  const ctx = getCloudflareContext();
  const env = ctx?.env as CloudflareEnv | undefined;
  if (env?.DB) {
    const adapter = new PrismaD1(env.DB);
    cachedPrisma = new PrismaClient({ adapter }) as unknown as PrismaClient;
    return cachedPrisma;
  }
} catch (err) {
  console.warn("Cloudflare context not available, using default Prisma:", err instanceof Error ? err.message : String(err));
}

// Fallback
cachedPrisma = new PrismaClient();
return cachedPrisma;
```

---

## 🔧 Deployment Checklist

### Sebelum Deploy:

- [x] Jalankan `npm run build` - pastikan no errors
- [x] Test di localhost `/dashboard` dan `/laporan/[kode]` - voting buttons harus work
- [x] Test localStorage persistence - vote harus tersimpan di localStorage
- [x] Test dark mode compatibility - voting card harus render dengan benar

### Steps untuk Deploy ke Cloudflare:

1. **Build project**:
   ```bash
   npm run build
   ```

2. **Deploy ke Cloudflare Workers**:
   ```bash
   npm run deploy
   ```

3. **Verify deployment**:
   - Buka website di domain Cloudflare
   - Navigate ke `/dashboard`
   - Lihat voting cards harus visible
   - Klik vote button - harus bisa vote tanpa error

---

## 🐛 Debugging Tips

### Jika masih error di Cloudflare:

1. **Check Cloudflare Logs**:
   ```bash
   # View live logs
   wrangler tail
   ```

2. **Inspect Browser Console**:
   - Open DevTools → Console
   - Lihat error messages detail
   - Check Network tab untuk API calls

3. **Enable Non-Minified React** (untuk full error messages):
   - Set `NODE_ENV=development` di development
   - Akan show full error messages bukan minified #441

4. **Check Database Connection**:
   - Pastikan `wrangler.jsonc` punya D1 database binding
   - Verify `DATABASE_URL` di `.env` correct

### Common Issues & Solutions:

#### Issue 1: "localStorage is not defined"
**Solution**: Already handled by `safeStorage` helper. Component akan gracefully degrade jika localStorage tidak tersedia.

#### Issue 2: "Cannot read properties of undefined"
**Solution**: Added null-coalescing dengan `?? 0` di vote counts

#### Issue 3: Hydration Mismatch Still Happening
**Solution**: 
- Clear browser cache (`Ctrl+Shift+Delete` atau Cmd+Shift+Delete)
- Hard refresh website (`Ctrl+F5` atau Cmd+Shift+R)
- Try different browser

---

## 📝 Changes Made Summary

### Files Modified:
1. `src/components/VotingCard.tsx` - Enhanced hydration safety
2. `src/lib/prisma.ts` - Better edge runtime support

### Build Status:
- ✅ TypeScript: No errors
- ✅ Compilation: Successful
- ✅ Build output: Ready for Cloudflare Workers

---

## ✨ Testing di Local Dev

Sebelum deploy ulang ke production:

```bash
# 1. Build locally
npm run build

# 2. Start dev server
npm run dev

# 3. Test voting di browser
# - Go to http://localhost:3000/dashboard
# - Click vote buttons - should work instantly
# - Refresh page - vote pilihan Anda harus persisted di localStorage
# - Check browser console - no errors

# 4. Test dark mode
# - Toggle dark mode
# - Voting cards harus render dengan benar

# 5. Test di different browsers
# - Chrome, Firefox, Safari, Edge
# - All harus work the same
```

---

## 🚀 Deploy to Production

Setelah local testing lulus:

```bash
# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy

# Verify live
# - Go to your Cloudflare domain
# - Test voting feature end-to-end
# - Monitor error logs di Cloudflare dashboard
```

---

## 📞 Support

Jika masih error setelah mengikuti panduan ini:

1. **Check error code**:
   - Error 3390417109 → Cloudflare Worker issue
   - React #441 → Hydration mismatch
   - 500 error → Server-side error (check logs)

2. **Enable debug mode**:
   ```typescript
   // Di src/lib/prisma.ts
   console.warn("Debug: Prisma context:", { hasDB: !!env?.DB, env: env ? "available" : "missing" });
   ```

3. **Check Wrangler logs**:
   ```bash
   wrangler tail --format pretty
   ```

4. **Verify Database**:
   ```bash
   # Check D1 database status
   wrangler d1 info lapor_rtrw
   ```

---

## ✅ All Fixes Applied!

Semua fixes sudah diapply ke code. Sekarang Anda bisa langsung:

1. **Build & deploy**: `npm run deploy`
2. **Test di production**: Verify voting feature working
3. **Monitor**: Watch Cloudflare logs untuk any issues

**Status: READY FOR CLOUDFLARE DEPLOYMENT** 🚀
