# Feature-Based Structure

Setiap feature dalam aplikasi ini diorganisir dalam folder terpisah dengan struktur berikut:

```
features/
  ├── auth/
  │   ├── components/
  │   ├── hooks/
  │   ├── services/
  │   ├── types/
  │   ├── utils/
  │   └── index.ts
  ├── dashboard/
  │   ├── components/
  │   ├── hooks/
  │   ├── services/
  │   ├── types/
  │   ├── utils/
  │   └── index.ts
  └── ...
```

## Cara Membuat Feature Baru

1. Buat folder baru di `src/features/[feature-name]`
2. Buat sub-folder yang diperlukan:
   - `components/` - Komponen React khusus untuk feature ini
   - `hooks/` - Custom hooks khusus untuk feature ini
   - `services/` - API calls dan business logic
   - `types/` - TypeScript types/interfaces
   - `utils/` - Helper functions
3. Buat file `index.ts` untuk export semua yang perlu diakses dari luar feature

## Contoh Feature

```typescript
// features/auth/index.ts
export { LoginForm } from "./components/LoginForm";
export { useAuth } from "./hooks/useAuth";
export type { AuthUser, LoginCredentials } from "./types";
```
