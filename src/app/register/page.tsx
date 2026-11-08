import { Suspense } from "react";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F6EE]" />}>
      <RegisterForm />
    </Suspense>
  );
}