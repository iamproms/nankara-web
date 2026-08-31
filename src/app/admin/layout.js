// Admin surface — separate from the editorial storefront. No Navbar/Footer, no
// indexing. Milestone 3 ships /admin/login + /admin/shipping; Milestone 4 adds
// /admin, /admin/orders on the same shell.
export const metadata = {
  title: 'Nankara Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <div>{children}</div>;
}
