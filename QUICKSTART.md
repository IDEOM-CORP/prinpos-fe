# 🚀 Quick Start Guide - PrinPOS

## Step 1: Install Dependencies

**IMPORTANT**: Run this command first before doing anything else:

\`\`\`bash
npm install @mantine/core@7.14.7 @mantine/hooks@7.14.7 @mantine/notifications@7.14.7 @mantine/modals@7.14.7 @mantine/form@7.14.7 @mantine/dates@7.14.7 @tabler/icons-react@3.24.0 react-router-dom@7.1.1 zustand@5.0.2 dayjs@1.11.13 axios@1.7.9
\`\`\`

## Step 2: Run Development Server

\`\`\`bash
npm run dev
\`\`\`

## Step 3: Open Browser

Navigate to: **http://localhost:5173**

## Step 4: Login

Use one of these demo accounts:

### 👔 Owner Account

\`\`\`
Email: owner@prinpos.com
Password: password123
\`\`\`
**Access**: Full system access

### 💰 Kasir Account

\`\`\`
Email: kasir@prinpos.com
Password: password123
\`\`\`
**Access**: Cashier POS, Orders, Items

### 🔧 Produksi Account

\`\`\`
Email: produksi@prinpos.com
Password: password123
\`\`\`
**Access**: Production management

---

## 🎯 Try These Workflows

### 1️⃣ Create an Order (As Kasir)

1. Login with kasir@prinpos.com
2. Click "Kasir" in sidebar
3. Click any product to add to cart
4. Click "Keranjang" button (top right)
5. Fill customer name
6. Click "Checkout"

### 2️⃣ Process Order (As Produksi)

1. Login with produksi@prinpos.com
2. Click "Produksi" in sidebar
3. You'll see the order you just created
4. Assign it to yourself in the dropdown
5. Click "Mulai Kerjakan"
6. Click "Selesai" when done

### 3️⃣ View Reports (As Owner)

1. Login with owner@prinpos.com
2. Click "Laporan" in sidebar
3. See statistics, top products, and recent orders

---

## 📱 Features to Explore

✅ **Dashboard** - System overview and statistics
✅ **Kasir** - POS interface with cart and checkout
✅ **Produksi** - Production management with status tracking
✅ **Orders** - Complete order history with details
✅ **Barang** - Product inventory management
✅ **Users** - User account management (Owner only)
✅ **Organisasi** - Company management (Owner only)
✅ **Cabang** - Branch management (Owner only)
✅ **Laporan** - Analytics and reports (Owner only)

---

## 💡 Tips

- All data is saved in your browser's localStorage
- Orders automatically update stock
- Each role has different menu access
- Search and filter available on most pages
- Click on order numbers to see details

---

## 🐛 Troubleshooting

### "Cannot find module 'zustand'" error?

→ Make sure you ran the npm install command from Step 1

### Blank page or errors?

→ Check browser console (F12) for errors
→ Make sure all dependencies are installed

### Data not persisting?

→ Data is saved in localStorage
→ Clear cache if experiencing issues

---

## 📞 Need Help?

Check the detailed documentation:

- [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) - Complete setup guide
- [PROJECT_README.md](./PROJECT_README.md) - Full project documentation

---

**Happy Testing! 🎉**
