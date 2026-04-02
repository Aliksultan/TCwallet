'use client'

import { useApp } from '@/lib/app-context'
import { useEffect, useState, useCallback } from 'react'
import { Search, SlidersHorizontal, X, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
}

interface Order {
  id: string
  product_id: string
  status: string
  created_at: string
  product: Product
}

type SortType = 'newest' | 'cheapest' | 'expensive'

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'pill-pending',
  ACCEPTED: 'pill-accepted',
  DECLINED: 'pill-declined',
  COMPLETED: 'pill-completed',
}

export function MarketView() {
  const { user, t } = useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortType>('newest')
  const [priceMax, setPriceMax] = useState(500)
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [buying, setBuying] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [tab, setTab] = useState<'market' | 'orders'>('market')

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [prodRes, walletRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch(`/api/wallet?userId=${user.id}`),
        fetch(`/api/orders?userId=${user.id}`),
      ])
      if (prodRes.ok) { const d = await prodRes.json(); setProducts(d.products) }
      if (walletRes.ok) { const d = await walletRes.json(); setBalance(d.balance) }
      if (orderRes.ok) { const d = await orderRes.json(); setOrders(d.orders) }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const maxPrice = products.length ? Math.max(...products.map((p) => p.price), 100) : 500

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchPrice = p.price <= priceMax
      return matchSearch && matchPrice
    })
    .sort((a, b) => {
      if (sort === 'cheapest') return a.price - b.price
      if (sort === 'expensive') return b.price - a.price
      return 0 // newest = API default
    })

  const handleBuy = async () => {
    if (!selected || !user || buying) return
    if (balance < selected.price) {
      showToast(t('market.insufficient_funds_detail', { balance, price: selected.price }), 'error')
      return
    }
    setBuying(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, product_id: selected.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error || t('errors.generic'), 'error')
      } else {
        setBalance(json.newBalance)
        setSelected(null)
        showToast(t('market.purchase_success'), 'success')
        fetchData()
      }
    } catch {
      showToast(t('errors.network'), 'error')
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <p className="page-subtitle">{t('market.subtitle')}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="page-title">{t('market.title')}</h1>
          <div className="coin-badge" style={{ fontSize: 18, marginBottom: 4 }}>{balance} TC</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'market', label: t('market.all_products') },
          { key: 'orders', label: `${t('market.my_orders')} (${orders.length})` }
        ].map((tb) => (
          <button
            key={tb.key}
            className={`chip ${tab === tb.key ? 'active' : ''}`}
            onClick={() => setTab(tb.key as 'market' | 'orders')}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        <OrdersList orders={orders} t={t} loading={loading} />
      ) : (
        <>
          {/* Search + Filter bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input-glass"
                style={{ paddingLeft: 38 }}
                placeholder={t('common.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn-icon" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
              {/* Sort */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Сортировка</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['newest', 'cheapest', 'expensive'] as SortType[]).map((s) => (
                    <button key={s} className={`chip ${sort === s ? 'active' : ''}`} onClick={() => setSort(s)}>
                      {t(`market.sort_${s}`)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Price range */}
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {t('market.filter_price')}: <strong style={{ color: 'var(--text-primary)' }}>до {priceMax} TC</strong>
                </div>
                <input
                  type="range"
                  min={10}
                  max={maxPrice}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[1,2,3,4].map((i) => (
                <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏪</div>
              <div className="empty-state-text">{t('market.empty')}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {filtered.map((product) => (
                <div key={product.id} className="product-card" onClick={() => setSelected(product)} role="button" tabIndex={0}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="product-card-img"
                      style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }}
                      onError={(e) => { 
                        const target = e.target as HTMLImageElement
                        target.onerror = null // prevent infinite loops
                        target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22xMidYMid%20slice%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231a1b26%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-size%3D%2230%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3E%F0%9F%93%A6%3C%2Ftext%3E%3C%2Fsvg%3E'
                      }}
                    />
                  ) : (
                    <div className="product-card-img" style={{ aspectRatio: '1/1', fontSize: 32 }}>
                      <Package size={40} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
                      {product.name}
                    </div>
                    <div className="coin-badge" style={{ fontSize: 14 }}>{product.price}</div>
                    {balance < product.price && (
                      <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>
                        Не хватает {product.price - balance} TC
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Purchase Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => !buying && setSelected(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <button
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </button>

            {selected.image_url && (
              <img
                src={selected.image_url}
                alt={selected.name}
                style={{ width: '100%', borderRadius: 'var(--radius-lg)', aspectRatio: '16/9', objectFit: 'cover', marginBottom: 16 }}
              />
            )}

            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{selected.name}</h2>
            {selected.description && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{selected.description}</p>
            )}

            <div className="glass-card" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Стоимость</div>
                <div className="coin-badge" style={{ fontSize: 22 }}>{selected.price}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ваш баланс</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: balance >= selected.price ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {balance} TC
                </div>
              </div>
            </div>

            {balance < selected.price ? (
              <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--accent-red)', fontSize: 14, marginBottom: 12 }}>
                ❌ {t('market.insufficient_funds')}
              </div>
            ) : null}

            <button
              id="btn-confirm-purchase"
              className="btn-primary"
              onClick={handleBuy}
              disabled={buying || balance < selected.price}
            >
              {buying ? '⏳ Обработка...' : t('market.buy_button', { amount: selected.price })}
            </button>
            <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => setSelected(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersList({ orders, t, loading }: { orders: Order[]; t: (k: string, v?: Record<string,string|number>) => string; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
      </div>
    )
  }
  if (!orders.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <div className="empty-state-text">{t('market.no_orders')}</div>
      </div>
    )
  }
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {orders.map((order, idx) => (
        <div key={order.id}>
          <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
            {order.product.image_url
              ? <img src={order.product.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--glass-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{order.product.name}</div>
              <div className="coin-badge" style={{ fontSize: 13, marginTop: 2 }}>{order.product.price}</div>
            </div>
            <span className={`pill ${STATUS_CLASS[order.status]}`}>{t(`orders.status_${order.status.toLowerCase()}`)}</span>
          </div>
          {idx < orders.length - 1 && <div className="divider" style={{ margin: 0 }} />}
        </div>
      ))}
    </div>
  )
}
