# PrinPOS - Aplikasi Point of Sale Percetakan

Aplikasi Point of Sale untuk bisnis percetakan digital dengan fitur lengkap untuk manajemen order, produksi, dan pelaporan.

## 🚀 Fitur Utama

### Authentication & Authorization

- Login dengan email dan password
- Role-based access control (Owner, Kasir, Produksi)
- Protected routes berdasarkan role

### Manajemen Organisasi & Cabang

- CRUD Organisasi
- CRUD Cabang (Outlet & Produksi)
- Relasi organisasi dengan cabang

### Manajemen User

- CRUD User dengan role assignment
- Assign user ke cabang tertentu
- Validasi email dan password

### Halaman Kasir (POS Interface)

- Grid produk dengan gambar dari Unsplash
- Filter produk berdasarkan kategori
- Search produk
- Shopping cart dengan quantity management
- Checkout dengan informasi pelanggan
- Perhitungan otomatis subtotal, pajak (11%), dan total
- Mobile-responsive design

### Halaman Produksi

- Melihat incoming orders dari kasir
- Assign order ke staff produksi
- Update status produksi (Pending → In Progress → Completed)
- Filter orders berdasarkan status

### Manajemen Order

- List semua orders dengan filter dan search
- Detail order lengkap
- Tracking status order
- Informasi pelanggan dan items

### Manajemen Barang

- CRUD Barang/Produk
- Kategori produk (Banner, Spanduk, Stiker, dll)
- Manajemen stok
- Upload gambar produk
- Update stok otomatis saat checkout

### Laporan & Statistik

- Total orders dan breakdown berdasarkan status
- Total omzet dari completed orders
- Pending revenue
- Rata-rata nilai order
- Top 10 produk terlaris
- Alert stok rendah
- Recent orders

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Mantine UI v7
- **Routing**: React Router v7
- **State Management**: Zustand (dengan persist middleware)
- **Form Handling**: Mantine Form
- **Icons**: Tabler Icons
- **Date Handling**: Day.js
- **Styling**: Mantine Core Styles + Custom CSS

## 📦 Instalasi

### Prerequisites

- Node.js 18+
- npm atau yarn

### Steps

1. Clone repository
   \`\`\`bash
   git clone <repository-url>
   cd prinpos-fe
   \`\`\`

2. Install dependencies
   \`\`\`bash
   npm install
   \`\`\`

3. Run development server
   \`\`\`bash
   npm run dev
   \`\`\`

4. Build untuk production
   \`\`\`bash
   npm run build
   \`\`\`

## 🔐 Demo Credentials

### Owner (Full Access)

- Email: `owner@prinpos.com`
- Password: `password123`

### Kasir (Cashier Access)

- Email: `kasir@prinpos.com`
- Password: `password123`

### Produksi (Production Access)

- Email: `produksi@prinpos.com`
- Password: `password123`

## 📂 Struktur Project

\`\`\`
src/
├── core/ # Core aplikasi
│ ├── App.tsx # Root component dengan routing
│ ├── config/ # Konfigurasi (theme, dll)
│ └── routes/ # Route definitions
│
├── features/ # Feature modules
│ ├── auth/ # Login & Authentication
│ ├── dashboard/ # Dashboard page
│ ├── cashier/ # Kasir POS interface
│ ├── production/ # Production management
│ ├── orders/ # Order management
│ ├── items/ # Item CRUD
│ ├── users/ # User management
│ ├── organizations/ # Organization & Branch CRUD
│ └── reports/ # Reports & Analytics
│
├── layouts/ # Layout components
│ └── MainLayout.tsx # Main app layout dengan sidebar
│
├── shared/ # Shared resources
│ ├── components/ # Reusable components
│ ├── stores/ # Zustand stores
│ ├── types/ # TypeScript types
│ ├── constants/ # Constants
│ ├── utils/ # Utility functions
│ ├── data/ # Dummy data
│ ├── styles/ # Global styles
│ └── assets/ # Images, icons
│
└── main.tsx # Entry point
\`\`\`

## 🎨 Design Principles

- **Sederhana**: UI clean dan mudah digunakan
- **Profesional**: Color scheme blue/gray yang professional
- **Responsive**: Mobile-friendly design
- **Consistent**: Menggunakan Mantine component library untuk konsistensi

## 📊 Data Management

### Zustand Stores

- **authStore**: Authentication state
- **orderStore**: Order management
- **cartStore**: Shopping cart
- **itemStore**: Product inventory
- **userStore**: User management
- **organizationStore**: Organization & Branch data

### Data Persistence

Semua store menggunakan Zustand persist middleware untuk menyimpan data di localStorage.

### Relational Data

- Organizations → Branches (1:N)
- Organizations → Items (1:N)
- Branches → Users (1:N)
- Orders → Items (M:N through OrderItems)
- Users → Orders (1:N as creator)
- Users → Orders (1:N as assignee)

## 🔄 Workflow

### Workflow Kasir

1. Login sebagai kasir
2. Buka halaman Kasir
3. Browse produk
4. Tambah produk ke keranjang
5. Checkout dengan data pelanggan
6. Order dibuat dengan status "pending"
7. Stok otomatis dikurangi

### Workflow Produksi

1. Login sebagai staff produksi
2. Buka halaman Produksi
3. Lihat orders yang masuk
4. Assign order ke diri sendiri
5. Mulai kerjakan (status → "in-progress")
6. Selesai (status → "completed")

### Workflow Owner

1. Login sebagai owner
2. Akses semua menu
3. Monitoring dashboard
4. Manage users, branches, items
5. Lihat laporan lengkap

## 🚧 Future Improvements

- [ ] Filter orders by date range
- [ ] Export laporan ke PDF/Excel
- [ ] Notifikasi real-time
- [ ] Upload gambar custom
- [ ] Barcode scanning
- [ ] Invoice printing
- [ ] Multi-currency support
- [ ] Advanced analytics & charts

## 📝 License

MIT License

## 👥 Contributors

Developed by [Your Name]
