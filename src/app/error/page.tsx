"use client";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-red-500 text-2xl font-bold">Oops! Something went wrong.</h1>
      <p className="mt-2 text-gray-700">The token or chain you requested is invalid or unavailable.</p>
      <button
        onClick={() => router.push("/bsc/pht")}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
      >
        Go to PHT (Default Token)
      </button>
      <button
        onClick={() => router.back()}
        className="mt-2 text-orange-600 underline"
      >
        Go Back
      </button>
    </div>
  );
}