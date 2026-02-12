# Setup Instructions

## ⚠️ Important: Install Dependencies First

Before running the application, you **MUST** install the required dependencies:

\`\`\`bash
npm install @mantine/core@7.14.7 @mantine/hooks@7.14.7 @mantine/notifications@7.14.7 @mantine/modals@7.14.7 @mantine/form@7.14.7 @mantine/dates@7.14.7 @tabler/icons-react@3.24.0 react-router-dom@7.1.1 zustand@5.0.2 dayjs@1.11.13 axios@1.7.9
\`\`\`

Or if using yarn:

\`\`\`bash
yarn add @mantine/core@7.14.7 @mantine/hooks@7.14.7 @mantine/notifications@7.14.7 @mantine/modals@7.14.7 @mantine/form@7.14.7 @mantine/dates@7.14.7 @tabler/icons-react@3.24.0 react-router-dom@7.1.1 zustand@5.0.2 dayjs@1.11.13 axios@1.7.9
\`\`\`

## 🚀 Running the Application

After installing dependencies:

\`\`\`bash
npm run dev
\`\`\`

The application will be available at http://localhost:5173 (or another port if 5173 is in use).

## 📝 Implementation Summary

### ✅ Completed Features

1. **Project Structure**
   - Feature-based folder structure
   - Proper separation of concerns
   - Barrel exports for clean imports

2. **Type System**
   - Complete TypeScript interfaces
   - Type-safe state management
   - Shared types across features

3. **State Management (Zustand)**
   - authStore: Authentication & user session
   - orderStore: Order management with full CRUD
   - cartStore: Shopping cart with localStorage persistence
   - itemStore: Product inventory management
   - userStore: User management
   - organizationStore: Organization & Branch management

4. **Authentication System**
   - Login page with validation
   - Protected routes
   - Role-based access control (Owner, Kasir, Produksi)
   - Persistent authentication state

5. **Main Layout**
   - Responsive sidebar navigation
   - Role-based menu visibility
   - User profile menu
   - Clean and professional design

6. **Dashboard**
   - Statistics cards (Total Orders, Revenue, etc.)
   - Overview of system status
   - Role-specific information

7. **Cashier POS Interface**
   - Grid layout for products with images
   - Category filter
   - Search functionality
   - Shopping cart with drawer
   - Quantity management
   - Customer information form
   - Tax calculation (11%)
   - Checkout process
   - Stock management

8. **Production Page**
   - View incoming orders
   - Assign orders to production staff
   - Status updates (Pending → In Progress → Completed)
   - Filter by status
   - Order details with items

9. **Order Management**
   - List all orders with search and filters
   - Order detail page
   - Status tracking
   - Customer information
   - Items breakdown

10. **Items CRUD**
    - Full CRUD operations
    - Category management
    - Stock tracking
    - Image assignment (Unsplash)
    - Low stock alerts

11. **User Management**
    - CRUD operations
    - Role assignment
    - Branch assignment
    - Password management

12. **Organization & Branch Management**
    - CRUD for organizations
    - CRUD for branches (Outlet & Produksi)
    - Relational data management

13. **Reports & Analytics**
    - Total orders breakdown
    - Revenue statistics
    - Top selling products
    - Low stock alerts
    - Recent orders list

### 🎨 UI/UX Features

- Professional blue/gray color scheme
- Responsive design (mobile-friendly)
- Mantine UI components
- Tabler Icons
- Loading states
- Error handling
- Toast notifications
- Confirmation modals
- Form validation

### 💾 Data Structure

- **Relational dummy data** with proper foreign keys
- **LocalStorage persistence** for all stores
- **Automatic data initialization** on first load
- **Hardcoded Unsplash images** for products

## 🔐 Test Accounts

### Owner Account (Full Access)

- Email: `owner@prinpos.com`
- Password: `password123`
- Access: All features including user management, reports, and settings

### Kasir Account (Cashier)

- Email: `kasir@prinpos.com`
- Password: `password123`
- Access: Dashboard, Cashier POS, Orders, Items

### Produksi Account (Production)

- Email: `produksi@prinpos.com`
- Password: `password123`
- Access: Dashboard, Production page, Orders

## 📋 Feature Access Matrix

| Feature     | Owner | Kasir | Produksi |
| ----------- | ----- | ----- | -------- |
| Dashboard   | ✅    | ✅    | ✅       |
| Kasir (POS) | ✅    | ✅    | ❌       |
| Produksi    | ✅    | ❌    | ✅       |
| Orders      | ✅    | ✅    | ✅       |
| Barang      | ✅    | ✅    | ❌       |
| Users       | ✅    | ❌    | ❌       |
| Organisasi  | ✅    | ❌    | ❌       |
| Cabang      | ✅    | ❌    | ❌       |
| Laporan     | ✅    | ❌    | ❌       |

## 🔄 Typical Workflow

### Creating an Order (Kasir Flow)

1. Login as kasir
2. Go to "Kasir" page
3. Browse products or use search/filter
4. Add products to cart
5. Click "Keranjang" button
6. Fill customer information
7. Click "Checkout"
8. Order created with status "pending"

### Processing Order (Produksi Flow)

1. Login as produksi staff
2. Go to "Produksi" page
3. See new orders with "pending" status
4. Assign order to yourself
5. Click "Mulai Kerjakan" (status → in-progress)
6. Complete the work
7. Click "Selesai" (status → completed)

### Monitoring (Owner Flow)

1. Login as owner
2. View Dashboard for overview
3. Check Orders page for all orders
4. View Reports for analytics
5. Manage Users, Items, Branches as needed

## 🛠️ Technical Notes

- All data is stored in **localStorage** (no backend required)
- **Dummy data** is automatically loaded on first app load
- **Stock management** is automatic when orders are created
- **Order numbers** are auto-generated with format: ORD-YYMMDD-XXXX
- **Tax rate** is set to 11% (configurable in constants)

## 📦 Build & Deploy

### Build for production

\`\`\`bash
npm run build
\`\`\`

The build output will be in the \`dist/\` folder, ready to deploy to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

### Preview production build

\`\`\`bash
npm run preview
\`\`\`

## 🎯 Next Steps (Optional Enhancements)

1. Add date range filters for orders and reports
2. Implement print invoice functionality
3. Add export to Excel/PDF for reports
4. Implement real-time notifications
5. Add customer management module
6. Implement barcode scanning
7. Add multi-language support
8. Integrate with backend API
9. Add payment method tracking
10. Implement advanced analytics with charts

---

**Note**: This is a complete frontend application with dummy data. For production use, you would need to integrate with a backend API and implement proper authentication, database, and security measures.
