import { Suspense } from "react";
import { AuthForm } from "./auth-form";
import "./auth.css";
export const metadata = {
  title: "Sign in | Dialife Medical VA",
  robots: { index: false, follow: false },
};
export default function Login() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
