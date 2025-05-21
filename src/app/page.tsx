
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Automatically redirect users from the root to the login page
  redirect('/login');
  // This return is technically unreachable due to redirect, but good practice for completeness
  return null; 
}
