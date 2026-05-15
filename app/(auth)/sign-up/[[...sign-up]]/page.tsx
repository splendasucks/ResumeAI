import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex h-screen items-center justify-center flex-col p-10">
      <SignUp routing="path" path="/sign-up" forceRedirectUrl="/dashboard" />
    </div>
  );
}
