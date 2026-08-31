// The cart page itself is a client component (needs cart context) and can't export
// metadata, so this thin server layout supplies it.
export const metadata = {
  title: 'Your Bag | Nankara',
  robots: { index: false },
};

export default function CartLayout({ children }) {
  return children;
}
