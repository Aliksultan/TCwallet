'use client'

import { useApp } from '@/lib/app-context'
import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Package } from 'lucide-react'

interface Order {
  id: string
  status: string
  created_at: string
  product: { id: string; name: string; price: number; image_url: string | null }
  user: { id: string; display_name: string; username: string | null }
}

interface Product {
  id: string
  name: string
  price: number
  image_url: string | null
  internal_link: string | null
  is_active: boolean
  description: string | null
}

const STATUS_PILL: Record<string, string> = {
  PENDING: 'pill-pending', ACCEPTED: 'pill-accepted',
  DECLINED: 'pill-declined', COMPLETED: 'pill-completed'
}

export function ManagerView({ isEmbedded }: { isEmbedded?: boolean }) {
  const { user, t } = useApp()
  const [tab, setTab] = useState<'orders' | 'products'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', image_url: '', internal_link: '' })
  const [savingProduct, setSavingProduct] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders?all=true'),
        fetch('/api/products?all=true'),
      ])
      if (ordersRes.ok) { const d = await ordersRes.json(); setOrders(d.orders) }
      if (productsRes.ok) { const d = await productsRes.json(); setProducts(d.products) }
    } finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOrderAction = async (orderId: string, status: string) => {
    setProcessing(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, actor_id: user?.id }),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error || t('errors.generic'), 'error') }
      else { showToast(`Статус обновлён: ${status}`, 'success'); fetchData() }
    } catch { showToast(t('errors.network'), 'error') }
    finally { setProcessing(null) }
  }

  const handleToggleProduct = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    })
    fetchData()
  }

  const handleAddProduct = async () => {
    if (!user || !newProduct.name || !newProduct.price) return
    setSavingProduct(true)
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProduct, price: parseInt(newProduct.price), created_by: user.id }),
    })
    if (res.ok) {
      showToast('Товар добавлен!', 'success')
      setShowAddProduct(false)
      setNewProduct({ name: '', price: '', description: '', image_url: '', internal_link: '' })
      fetchData()
    } else {
      showToast(t('errors.generic'), 'error')
    }
    setSavingProduct(false)
  }

  const pendingOrders = orders.filter((o) => o.status === 'PENDING')
  const otherOrders = orders.filter((o) => o.status !== 'PENDING')
  const statusLabel: Record<string,string> = { PENDING: t('orders.status_pending'), ACCEPTED: t('orders.status_accepted'), DECLINED: t('orders.status_declined'), COMPLETED: t('orders.status_completed') }

  const content = (
    <>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}

      {!isEmbedded && (
        <>
          <h1 className="page-title">{t('manager.title')}</h1>
          <p className="page-subtitle" style={{ marginBottom: 16 }}>{t('common.app_name')}</p>
        </>
      )}

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <span className="pill pill-pending">{pendingOrders.length} ожидает</span>
        <span className="pill pill-accepted">{orders.filter((o) => o.status === 'ACCEPTED').length} принято</span>
        <span className="pill pill-completed">{orders.filter((o) => o.status === 'COMPLETED').length} выполнено</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`chip ${tab === 'orders' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setTab('orders')}>
          📦 {t('manager.orders_inbox')} ({pendingOrders.length})
        </button>
        <button className={`chip ${tab === 'products' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setTab('products')}>
          🛍️ {t('manager.products_title')}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : tab === 'orders' ? (
        <>
          {/* Pending Orders */}
          {pendingOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">{t('manager.no_pending')}</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ожидают решения
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {pendingOrders.map((order) => (
                  <div key={order.id} className="glass-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      {order.product.image_url
                        ? <img src={order.product.image_url} alt="" style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'var(--glass-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={24} style={{ color: 'var(--text-muted)' }} /></div>
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{order.product.name}</div>
                        <div className="coin-badge" style={{ fontSize: 13 }}>{order.product.price}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {t('manager.order_from')}: <strong>{order.user.display_name}</strong>
                          {order.user.username && ` (@${order.user.username})`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-success" style={{ flex: 1, fontFamily: 'inherit' }} onClick={() => handleOrderAction(order.id, 'ACCEPTED')} disabled={processing === order.id}>
                        {processing === order.id ? '⏳' : `✅ ${t('manager.accept_order')}`}
                      </button>
                      <button className="btn-danger" style={{ flex: 1, fontFamily: 'inherit' }} onClick={() => handleOrderAction(order.id, 'DECLINED')} disabled={processing === order.id}>
                        {processing === order.id ? '⏳' : `❌ ${t('manager.decline_order')}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Other orders */}
          {otherOrders.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Прочие заказы
              </div>
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                {otherOrders.map((order, idx) => (
                  <div key={order.id}>
                    <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{order.product.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.user.display_name}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <span className={`pill ${STATUS_PILL[order.status]}`}>{statusLabel[order.status]}</span>
                        {order.status === 'ACCEPTED' && (
                          <button className="btn-success" style={{ padding: '6px 12px', fontSize: 12, fontFamily: 'inherit' }} onClick={() => handleOrderAction(order.id, 'COMPLETED')}>
                            {t('manager.complete_order')}
                          </button>
                        )}
                      </div>
                    </div>
                    {idx < otherOrders.length - 1 && <div className="divider" style={{ margin: 0 }} />}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Add product button */}
          <button className="btn-primary" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => setShowAddProduct(true)}>
            <Plus size={18} /> {t('manager.add_product')}
          </button>

          {/* Products list */}
          {products.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">🏪</div><div className="empty-state-text">{t('market.empty')}</div></div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.map((p) => (
                  <div key={p.id} className="glass-card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', opacity: p.is_active ? 1 : 0.5 }}>
                    {p.image_url
                      ? <img src={p.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                      : <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--glass-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} /></div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                      <div className="coin-badge" style={{ fontSize: 13 }}>{p.price}</div>
                      {p.internal_link && (
                        <div style={{ fontSize: 11, color: 'var(--accent-primary)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🔗 <a href={p.internal_link} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{p.internal_link}</a>
                        </div>
                      )}
                    </div>
                    <button
                      className={p.is_active ? 'btn-danger' : 'btn-success'}
                      style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'inherit', flexShrink: 0 }}
                      onClick={() => handleToggleProduct(p)}
                    >
                      {p.is_active ? t('manager.archive_product') : t('manager.activate_product')}
                    </button>
                  </div>
                ))}
              </div>
            )
          }

          {/* Add Product Modal */}
          {showAddProduct && (
            <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
              <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-handle" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>{t('manager.add_product')}</h2>
                  <button onClick={() => setShowAddProduct(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                {[
                  { key: 'name', label: t('manager.product_name'), placeholder: 'Стакан Tulga' },
                  { key: 'price', label: t('manager.product_price'), placeholder: '100', type: 'number' },
                  { key: 'description', label: t('manager.product_description'), placeholder: 'Описание...' },
                  { key: 'image_url', label: t('manager.product_image'), placeholder: 'https://...' },
                  { key: 'internal_link', label: 'Внутренняя ссылка (где купить/заказать)', placeholder: 'https://aliexpress.com/...' },
                ].map((field) => (
                  <div key={field.key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input
                      className="input-glass"
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={newProduct[field.key as keyof typeof newProduct]}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                  </div>
                ))}
                <button className="btn-primary" style={{ marginTop: 8, fontFamily: 'inherit' }} onClick={handleAddProduct} disabled={savingProduct || !newProduct.name || !newProduct.price}>
                  {savingProduct ? '⏳...' : `✅ ${t('common.save')}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )

  if (isEmbedded) return content
  return <div className="page">{content}</div>
}
