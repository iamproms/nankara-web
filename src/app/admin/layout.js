// Admin surface — separate from the editorial storefront. No Navbar/Footer, no
// indexing. Screens: /admin (dashboard), /admin/orders[/id], /admin/shipping,
// /admin/login. Still to build: the product-management screens
// (/admin/products, /admin/products/new, /admin/products/[id]) — the backend
// API for them already exists (/api/v1/admin/products + /api/v1/admin/media).
export const metadata = {
  title: 'Nankara Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <div>{children}</div>;
}
