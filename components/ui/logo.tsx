import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    variant?: 'default' | 'white' | 'icon';
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className, variant = 'default', size = 'md' }: LogoProps) {
    const sizeClasses = {
        sm: { height: 45, width: 105 },
        md: { height: 60, width: 135 },
        lg: { height: 80, width: 180 },
        xl: { height: 120, width: 270 }
    };

    const dimensions = sizeClasses[size];

    return (
        <div
            className={cn("relative", className)}
            style={{ width: dimensions.width, height: dimensions.height }}
        >
            <Image
                src="/logo-final.png"
                alt="Al Thawaq"
                fill
                priority
                className="object-contain transition-all duration-300 dark:brightness-0 dark:invert"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
    );
}

