import React from 'react';

const footerItems = [
    { label: 'Info', key: 'info' },
    { label: 'Burns', key: 'burns' },
    { label: 'Chart', key: 'chart' },
];

interface FooterProps {
    onTabChange: (tab: string) => void;
    activeTab: string;
}

const Footer: React.FC<FooterProps> = ({ onTabChange, activeTab }) => (
    <footer className="flex w-full border-t border-gray-200 bg-neutral-900 fixed bottom-0 left-0 h-14 z-50">
        {footerItems.map((item) => (
            <div
                key={item.key}
                className={`flex-1 flex items-center justify-center font-medium text-base cursor-pointer h-full ${
                    activeTab === item.key ? 'bg-orange-500 text-white' : 'text-gray-400'
                }`}
                onClick={() => onTabChange(item.key)}
            >
                {item.label}
            </div>
        ))}
    </footer>
);

export default Footer;
