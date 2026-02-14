# PrinPOS

## End-to-End Printing Order Management System

---

## 1. System Overview

**PrinPOS** adalah sistem manajemen pesanan percetakan berbasis web yang dirancang untuk menangani seluruh siklus operasional bisnis percetakan digital.

Sistem mencakup:

Inquiry → Order Configuration → Payment (DP/Full) → Production → Settlement → Delivery

PrinPOS bukan POS retail generik. Sistem ini berorientasi pada **order-driven workflow** dengan flexible pricing dan kontrol produksi.

Mendukung:

- Multi-tenant (multi bisnis)
- Multi-branch (multi cabang)
- Role-based access control
- Flexible pricing engine
- Down payment & installment tracking
- Production workflow (Kanban)

---

## 2. Role & Responsibility Structure

### 2.1 OWNER — Business Controller

Fungsi:

- Monitoring seluruh cabang
- Kontrol master produk & pricing
- Override status order
- Monitoring omzet & pembayaran
- Kelola user & role

Akses:

- Dashboard global
- Semua order semua cabang
- Semua pembayaran
- Master produk
- Laporan & statistik
- Manajemen cabang
- Subscription

Owner tidak terlibat operasional harian kecuali override.

---

### 2.2 DESIGNER / CS — Order Creator

Fungsi utama:

- Input dan konfigurasi pesanan
- Menentukan spesifikasi teknis
- Mengatur harga dalam batas kontrol
- Menambahkan finishing & material
- Submit order ke tahap pembayaran

Akses:

- Daftar order (cabang sendiri)
- Buat order baru
- Edit order sebelum pembayaran
- Lihat status pembayaran
- Tidak bisa menerima pembayaran

Designer adalah entry point order.

---

### 2.3 KASIR — Payment Gatekeeper

Fungsi utama:

- Menerima pembayaran (DP / cicilan / pelunasan)
- Hitung kembalian (cash)
- Cetak nota / kirim invoice
- Validasi sebelum barang keluar

Akses:

- Daftar order cabang sendiri
- Detail pembayaran
- Terima pembayaran
- Tidak bisa ubah spesifikasi teknis
- Tidak bisa ubah harga tanpa otorisasi

Kasir fokus pada kontrol keuangan, bukan konfigurasi order.

---

### 2.4 PRODUKSI — Production Operator

Fungsi utama:

- Mengelola workflow produksi
- Update status produksi
- Tidak dapat memulai jika DP belum memenuhi minimum

Akses:

- Kanban board:
  - Ready
  - In Progress
  - Completed
- Lihat spesifikasi teknis
- Tidak bisa ubah pembayaran

---

## 3. End-to-End Order Lifecycle

### 3.1 Order Creation (Designer)

Designer membuat order:

- Pilih produk
- Pilih tipe harga (fixed / area / tiered)
- Input ukuran (jika area-based)
- Tambah material
- Tambah finishing modular
- Tambah catatan teknis
- Tentukan deadline
- Submit order

Status awal:
`draft`

---

### 3.2 Payment Stage

Setelah submit:

Status menjadi:
`awaiting_payment`

Kasir menerima pembayaran:

- Full Payment → `ready_production`
- DP ≥ minimum threshold → `ready_production`
- DP < minimum → `pending_dp`

Jika `pending_dp` > 48 jam → `expired`

---

### 3.3 Production Stage

Status:

`ready_production`  
→ Produksi dapat dimulai

`in_progress`  
→ Sedang dikerjakan

`completed`  
→ Produksi selesai

Produksi diblokir jika:
`paidAmount < minimumDP`

---

### 3.4 Settlement & Delivery

Jika produksi selesai:

- Jika belum lunas → tetap `completed`
- Jika lunas → `settled`

Barang tidak boleh keluar sebelum status `settled`.

---

### 3.5 Cancellation & Expiry

- Owner/Kasir dapat membatalkan → `cancelled`
- Soft delete (audit trail tetap ada)
- `expired` dapat diaktifkan kembali jika pembayaran cukup

---

## 4. Order Status Definition

| Status           | Deskripsi                                 |
| ---------------- | ----------------------------------------- |
| draft            | Order dibuat, belum dikirim ke pembayaran |
| awaiting_payment | Menunggu pembayaran awal                  |
| pending_dp       | DP kurang dari minimum                    |
| ready_production | Siap masuk produksi                       |
| in_progress      | Sedang diproduksi                         |
| completed        | Produksi selesai                          |
| settled          | Lunas & selesai                           |
| cancelled        | Dibatalkan                                |
| expired          | DP tidak dibayar > 48 jam                 |

---

## 5. Flexible Pricing Engine

Sistem mendukung:

### 5.1 Pricing Types

1. Fixed Price (per pcs)
2. Area-Based (per m² / cm²)
3. Tiered Pricing (bertingkat berdasarkan kuantitas)

### 5.2 Pricing Components

- Base price
- Material selector
- Finishing modular (per unit / per area / flat)
- Setup fee
- Minimum order
- Maximum discount control
- Manual price override (dengan audit log)

Formula harga akhir:

Final Price =  
Base Price

- Material
- Finishing
- Setup Fee  
  − Discount

Semua perubahan harga tercatat (siapa & kapan).

---

## 6. Payment System

Fitur:

- Full payment
- Down payment configurable (default 50%)
- Multi-payment (cicilan)
- Payment history log
- Metode pembayaran:
  - Cash
  - Transfer
  - QRIS
  - E-wallet
- Auto status update berdasarkan pembayaran

---

## 7. Production Guard Logic

Produksi hanya bisa dimulai jika:

`paidAmount ≥ minimumDP`

Jika tidak:

- Tombol disabled
- Warning ditampilkan

---

## 8. Core System Modules

1. Order Engine
2. Pricing Engine
3. Payment Engine
4. Production Workflow Engine
5. Role-Based Access Control
6. Multi-Branch Controller
7. Reporting & Analytics

POS hanyalah bagian dari Payment Engine.

---

## 9. Product Positioning

PrinPOS adalah:

End-to-End Printing Order Management System  
dengan Flexible Pricing & Production Control.

Target market:

- Percetakan digital
- Custom printing
- Advertising & signage
- Print-on-demand business

---

## 10. Conceptual Shift

Versi lama:
POS-centric

Versi sekarang:
Order-centric

Perubahan utama:

- Designer sebagai entry point order
- Kasir fokus pada pembayaran
- Produksi memiliki DP guard
- Status lifecycle lebih jelas
- Pricing engine menjadi core value proposition
