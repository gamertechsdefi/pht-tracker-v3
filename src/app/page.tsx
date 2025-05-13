'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Home: React.FC = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(5); // Add type for state

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timer = setTimeout(() => {
      router.push('/bsc/pht');
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Redirecting to PHT in {countdown}...</h1>
      <p className="mt-2">Please wait while we load the data.</p>
    </div>
  );
};

export default Home;
