"use client";
import Image from 'next/image';
import { useState } from 'react';

interface DataCardProps {
  title: string;
  value: string | { display: string; isExponential: boolean };
  bg?: string;
  image?: string;
}

export default function DataCard({ title, value, bg = "", image = "" }: DataCardProps) {
  const displayValue = typeof value === "string" ? value : value.display;
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative flex items-center justify-center px-8 py-4 h-32 mb-4 rounded-lg shadow-lg ${bg}`}
    >
      {/* Background Image with Error Handling */}
      {image && !imageError ? (
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={image}
            alt="Background"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            onError={() => {
              console.error(`Failed to load image: ${image}`);
              setImageError(true);
            }}
          />
        </div>
      ) : null}

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-red-800/40 rounded-lg"></div>

      {/* Content */}
      <div className="relative z-10 text-white text-center">
        <h1 className="text-2xl font-bold">{displayValue}</h1>
        <p className="text-sm">{title}</p>
      </div>
    </div>
  );
}