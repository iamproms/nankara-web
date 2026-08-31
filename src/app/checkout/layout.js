// The checkout page is a client component (form state, cart hooks), so its
// metadata lives here in a server layout — same pattern as src/app/cart/layout.js.
export const metadata = {
  title: 'Checkout | Nankara',
  robots: { index: false },
};

export default function CheckoutLayout({ children }) {
  return children;
}
