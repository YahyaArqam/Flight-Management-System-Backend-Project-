'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Plus, Pencil, Trash2, X, Check, Mail } from 'lucide-react'

const emptyForm = {
    first_name: '',
    last_name: '',
    email: '',
    loyalty_tier: '0'
}

export default function PassengersPage() {
    const [passengers, setPassengers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editPassenger, setEditPassenger] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState(null)

    useEffect(() => { fetchPassengers() }, [])

    async function fetchPassengers() {
        const { data } = await supabase
            .from('passengers')
            .select('*')
            .order('created_at', { ascending: false })
        setPassengers(data || [])
        setLoading(false)
    }

    function openCreate() {
        setForm(emptyForm)
        setEditPassenger(null)
        setShowModal(true)
    }

    function openEdit(p) {
        setForm({
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email,
            loyalty_tier: p.loyalty_tier?.toString() || '0'
        })
        setEditPassenger(p)
        setShowModal(true)
    }

    async function savePassenger() {
        setSaving(true)
        const payload = {
            ...form,
            loyalty_tier: parseInt(form.loyalty_tier)
        }
        if (editPassenger) {
            await supabase.from('passengers').update(payload).eq('id', editPassenger.id)
        } else {
            await supabase.from('passengers').insert(payload)
        }
        setSaving(false)
        setShowModal(false)
        fetchPassengers()
    }

    async function deletePassenger(id) {
        await supabase.from('passengers').delete().eq('id', id)
        setDeleteId(null)
        fetchPassengers()
    }

    const tierConfig = {
        0: { label: 'Standard', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
        1: { label: 'Silver', color: '#CBD5E1', bg: 'rgba(203,213,225,0.12)' },
        2: { label: 'Gold', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)' },
        3: { label: 'Platinum', color: '#93C5FD', bg: 'rgba(147,197,253,0.12)' },
    }

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
    }

    const labelStyle = {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '12px',
        fontWeight: '600' as const,
        letterSpacing: '1px',
        textTransform: 'uppercase' as const,
        marginBottom: '6px',
        display: 'block'
    }

    const cols = '1.5fr 1.8fr 0.8fr 100px'

    return (
        <div style={{ padding: '40px 48px', minHeight: '100vh', position: 'relative' }}>

            {/* Background */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                pointerEvents: 'none', zIndex: 0, overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
                    backgroundSize: '64px 64px'
                }} />
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%',
                    width: '500px', height: '500px',
                    background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)',
                    borderRadius: '50%'
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '20%',
                    width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)',
                    borderRadius: '50%'
                }} />
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '32px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: '#10B981', boxShadow: '0 0 10px #10B981'
                            }} />
                            <span style={{
                                color: '#10B981', fontSize: '11px', fontWeight: '700',
                                letterSpacing: '2.5px', textTransform: 'uppercase'
                            }}>Passenger Management</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>
                            Passengers
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '4px' }}>
                            {passengers.length} passengers registered
                        </p>
                    </div>

                    <button
                        onClick={openCreate}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'linear-gradient(135deg, #065F46, #10B981)',
                            border: 'none', borderRadius: '12px',
                            padding: '12px 20px', color: 'white',
                            fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(16,185,129,0.4)'
                        }}
                    >
                        <Plus size={16} />
                        Add Passenger
                    </button>
                </div>

                {/* Table */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', overflow: 'hidden'
                }}>
                    {/* Column headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: cols,
                        padding: '14px 28px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)'
                    }}>
                        {['Passenger', 'Email', 'Loyalty Tier', 'Actions'].map(h => (
                            <p key={h} style={{
                                color: 'rgba(255,255,255,0.25)', fontSize: '11px',
                                fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase'
                            }}>{h}</p>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
                        </div>
                    ) : passengers.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <Users size={28} color="rgba(255,255,255,0.1)"
                                style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                                No passengers found
                            </p>
                        </div>
                    ) : (
                        passengers.map((p, i) => {
                            const tier = tierConfig[p.loyalty_tier] || tierConfig[0]
                            return (
                                <div
                                    key={p.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: cols,
                                        padding: '16px 28px',
                                        borderBottom: i < passengers.length - 1
                                            ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        transition: 'background 0.15s',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px', height: '36px',
                                            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>
                                                {p.first_name?.[0]}{p.last_name?.[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                                                {p.first_name} {p.last_name}
                                            </p>
                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                                                ID: {p.id?.slice(0, 8)}...
                                            </p>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={12} color="rgba(255,255,255,0.3)" />
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                                            {p.email}
                                        </span>
                                    </div>

                                    {/* Loyalty Tier */}
                                    <div>
                                        <span style={{
                                            background: tier.bg,
                                            color: tier.color,
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '5px 12px',
                                            borderRadius: '20px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            whiteSpace: 'nowrap' as const
                                        }}>
                                            ★ {tier.label}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => openEdit(p)}
                                            style={{
                                                width: '32px', height: '32px',
                                                background: 'rgba(59,130,246,0.1)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                borderRadius: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <Pencil size={12} color="#3B82F6" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(p.id)}
                                            style={{
                                                width: '32px', height: '32px',
                                                background: 'rgba(239,68,68,0.1)',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                borderRadius: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={12} color="#EF4444" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D1B4B, #0A2463)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '24px', padding: '32px',
                        width: '480px'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '28px'
                        }}>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>
                                {editPassenger ? 'Edit Passenger' : 'Add Passenger'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: 'none', borderRadius: '8px',
                                    width: '32px', height: '32px',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={16} color="white" />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>First Name</label>
                                <input
                                    type="text" placeholder="John"
                                    value={form.first_name}
                                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name</label>
                                <input
                                    type="text" placeholder="Doe"
                                    value={form.last_name}
                                    onChange={e => setForm({ ...form, last_name: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email" placeholder="john@example.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Loyalty Tier</label>
                                <select
                                    value={form.loyalty_tier}
                                    onChange={e => setForm({ ...form, loyalty_tier: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="0" style={{ background: '#0D1B4B' }}>0 — Standard</option>
                                    <option value="1" style={{ background: '#0D1B4B' }}>1 — Silver</option>
                                    <option value="2" style={{ background: '#0D1B4B' }}>2 — Gold</option>
                                    <option value="3" style={{ background: '#0D1B4B' }}>3 — Platinum</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', color: 'rgba(255,255,255,0.6)',
                                    fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePassenger}
                                disabled={saving}
                                style={{
                                    flex: 2, padding: '12px',
                                    background: 'linear-gradient(135deg, #065F46, #10B981)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontSize: '14px',
                                    fontWeight: '600', cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Check size={16} />
                                {saving ? 'Saving...' : editPassenger ? 'Update Passenger' : 'Add Passenger'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D1B4B, #0A2463)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '24px', padding: '32px', width: '400px'
                    }}>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                            Delete Passenger?
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setDeleteId(null)}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', color: 'rgba(255,255,255,0.6)',
                                    fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deletePassenger(deleteId)}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'linear-gradient(135deg, #991B1B, #EF4444)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontSize: '14px',
                                    fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}