import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center flex-col p-10">
      <SignIn routing="path" path="/sign-in" forceRedirectUrl="/dashboard" />
    </div>
  );
}
