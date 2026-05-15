"use client";

import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { useRouter } from "next-nprogress-bar";
import { SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const TopBar = () => {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  return (
    <div className="flex w-full justify-between items-center py-3 px-5 shadow-md">
      <Link href="/" className="flex gap-2 items-center">
        <Image src="/icons/logo.svg" alt="logo" width={58} height={58} />
        <p className="text-4xl font-nunito font-extrabold text-slate-800">
          ResumeAI
        </p>
      </Link>

      {isLoaded && isSignedIn ? (
        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            onClick={() => {
              router.push("/dashboard");
            }}
          >
            Dashboard
          </Button>
          <UserButton />
        </div>
      ) : isLoaded ? (
        <SignUpButton mode="redirect">
          <Button className="btn btn-primary">Get Started</Button>
        </SignUpButton>
      ) : null}
    </div>
  );
};

export default TopBar;
