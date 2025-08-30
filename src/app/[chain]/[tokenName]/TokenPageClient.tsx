'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { FaGlobe, FaTelegramPlane, FaCopy } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
import styles from './styles.module.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DataCard } from '@/components/DataCard';
import { BurnIntervals } from '@/components/BurnIntervals';
import { BurnsDisplay } from '@/components/BurnHistory';
import { CurrencyConverter } from '@/components/Converter';
import { useTokenData } from '@/hooks/useTokenData';

interface TokenPageClientProps {
    chain: string;
    tokenName: string;
}

export default function TokenPageClient({ chain, tokenName }: TokenPageClientProps) {
    const router = useRouter();
    const { tokenData, socialLinks, loading, error } = useTokenData(chain, tokenName);
    const [activeTab, setActiveTab] = useState<string>("info");

    // Rest of your component logic here...
    // Copy all the formatting functions and JSX from the original component
}
