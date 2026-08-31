import AccountShell from '../../components/AccountShell/AccountShell';

export const metadata = {
  title: 'My Account | Nankara',
  robots: { index: false },
};

export default function AccountLayout({ children }) {
  return <AccountShell>{children}</AccountShell>;
}
