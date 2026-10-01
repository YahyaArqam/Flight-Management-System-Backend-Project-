'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Plane,
    Users,
    BookOpen,
    Clock,
    Headphones,
    ScrollText,
} from 'lucide-react'

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/flights', icon: Plane, label: 'Flights' },
    { href: '/passengers', icon: Users, label: 'Passengers' },
    { href: '/bookings', icon: BookOpen, label: 'Bookings' },
    { href: '/waitlist', icon: Clock, label: 'Waitlist' },
    { href: '/support', icon: Headphones, label: 'Support' },
    { href: '/audit', icon: ScrollText, label: 'Audit Logs' },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <div style={{
            width: '240px',
            minHeight: '100vh',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: '0',
            flexShrink: 0
        }}>

            {/* Logo */}
            <div style={{
                padding: '28px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(59,130,246,0.4)'
                    }}>
                        <Plane size={18} color="white" />
                    </div>
                    <div>
                        <p style={{ color: 'white', fontWeight: '700', fontSize: '16px', letterSpacing: '-0.3px' }}>SkyOps</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Flight Management</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '16px 12px' }}>
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                marginBottom: '4px',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: isActive ? '600' : '400',
                                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                                background: isActive
                                    ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
                                    : 'transparent',
                                boxShadow: isActive
                                    ? '0 4px 15px rgba(59,130,246,0.3)'
                                    : 'none',
                            }}
                        >
                            <Icon size={16} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div style={{
                padding: '20px 24px',
                borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#10B981',
                        borderRadius: '50%',
                        boxShadow: '0 0 8px #10B981'
                    }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                        All systems operational
                    </p>
                </div>
            </div>

        </div>
    )
}