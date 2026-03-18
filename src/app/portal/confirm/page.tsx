"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("id");
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");

  useEffect(() => {
    if (!registrationId) {
      setStatus("error");
      return;
    }

    async function confirm() {
      try {
        const res = await fetch("/api/confirm-tryout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registration_id: registrationId }),
        });

        if (res.ok) {
          const data = await res.json();
          setStatus(data.status === "confirmed" ? "success" : "already");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    }

    confirm();
  }, [registrationId]);

  return (
    <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div>
            <p className="font-display text-xl font-bold uppercase tracking-wide text-flag-blue mb-2">
              Confirming...
            </p>
            <p className="text-gray-400 text-sm">One moment please.</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-white rounded-xl border border-green-200 p-8">
            <div className="text-5xl mb-4">&#9733;</div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-flag-blue mb-3">
              You&apos;re Confirmed!
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Thank you for confirming attendance. We look forward to seeing your player at tryouts!
              Check your Parent Portal for all the details.
            </p>
            <Link
              href="/portal"
              className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              Go to Parent Portal
            </Link>
          </div>
        )}

        {status === "already" && (
          <div className="bg-white rounded-xl border border-blue-200 p-8">
            <div className="text-5xl mb-4">&#10003;</div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-flag-blue mb-3">
              Already Confirmed
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Your attendance has already been confirmed. No further action needed!
            </p>
            <Link
              href="/portal"
              className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              Go to Parent Portal
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-xl border border-red-200 p-8">
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-flag-red mb-3">
              Something Went Wrong
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              We couldn&apos;t confirm your attendance. Please try again from your Parent Portal
              or contact us at AllStars@irvinepony.com.
            </p>
            <Link
              href="/portal"
              className="inline-block bg-flag-red hover:bg-flag-red-dark text-white px-6 py-3 rounded font-display text-sm font-semibold uppercase tracking-widest transition-colors"
            >
              Go to Parent Portal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-off-white pt-16 flex items-center justify-center">
          <p className="text-gray-400 font-display uppercase tracking-wider text-sm">Loading...</p>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
