// The order confirmation page is a client component (polls the API, clears the
// cart), so its metadata lives here — same pattern as src/app/cart/layout.js.
export const metadata = {
  title: 'Your Order | Nankara',
  robots: { index: false },
};

export default function OrderLayout({ children }) {
  return children;
}
