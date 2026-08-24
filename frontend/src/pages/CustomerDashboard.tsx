import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function CustomerDashboard(){
  const { user, logout }=useAuth();
  const [form,setForm]=useState({ pickupAddress:'100001', dropAddress:'200001', l:20, b:15, h:20, actualWeight:2, orderType:'B2C', paymentType:'PREPAID' });
  const [preview,setPreview]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [orders,setOrders]=useState<any[]>([]);
  const [reschedule,setReschedule]=useState<{[k:string]:string}>({});
  const loadOrders=async()=>{ const r=await api.get('/api/v1/orders'); setOrders(r.data.data); };
  useEffect(()=>{ loadOrders(); },[]);
  const doPreview=async()=>{
    try{ const r=await api.post('/api/v1/orders/preview', form); setPreview(r.data.data); setMsg(`Preview: ${r.data.data.zoneRel} • Rate ₹${r.data.data.rateApplied}/kg • Total ₹${r.data.data.total}`); }catch(e:any){ setMsg(e.response?.data?.error||e.message); }
  };
  const createOrder=async()=>{
    try{ const r=await api.post('/api/v1/orders', form); setMsg(`Order ${r.data.data.id} created • ${r.data.data.currentStatus} • ₹${r.data.data.totalCharge}`); loadOrders(); setPreview(null); }catch(e:any){ setMsg(e.response?.data?.error||e.message); }
  };
  const doReschedule=async(id:string)=>{
    const date=reschedule[id];
    if(!date) return setMsg('Pick a date');
    try{ const r=await api.post(`/api/v1/orders/${id}/reschedule`,{ rescheduleDate:date }); setMsg(`Rescheduled ${id} → ${r.data.data.currentStatus}`); loadOrders(); }catch(e:any){ setMsg(e.response?.data?.error||e.message); }
  };
  return <div className="container">
    <div className="nav"><h3>Customer — {user?.name}</h3><button className="btn-secondary btn" onClick={logout}>Logout</button></div>
    {msg && <div className="card" style={{background:'#fffbeb',border:'1px solid #fde68a'}}>{msg}</div>}
    <div className="hero" style={{padding:24}}><h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:20}}>Ship a parcel</h2><p style={{opacity:0.9,marginTop:6}}>Preview shows pickup/drop zone, volumetric vs actual, rate, COD surcharge, total — before confirm.</p></div>
    <div className="grid grid-2">
      <div className="card">
        <h3>📦 Create Order</h3>
        <div className="grid grid-2" style={{marginTop:10}}>
          <label>Pickup (area/pincode)<input className="input" value={form.pickupAddress} onChange={e=>setForm({...form,pickupAddress:e.target.value})} placeholder="100001" /></label>
          <label>Drop<input className="input" value={form.dropAddress} onChange={e=>setForm({...form,dropAddress:e.target.value})} placeholder="200001" /></label>
          <label>L (cm)<input className="input" type="number" value={form.l} onChange={e=>setForm({...form,l:parseFloat(e.target.value)||0})} /></label>
          <label>B<input className="input" type="number" value={form.b} onChange={e=>setForm({...form,b:parseFloat(e.target.value)||0})} /></label>
          <label>H<input className="input" type="number" value={form.h} onChange={e=>setForm({...form,h:parseFloat(e.target.value)||0})} /></label>
          <label>Actual Weight kg<input className="input" type="number" value={form.actualWeight} onChange={e=>setForm({...form,actualWeight:parseFloat(e.target.value)||0})} /></label>
          <label>Order Type<select className="input" value={form.orderType} onChange={e=>setForm({...form,orderType:e.target.value})}><option value="B2C">B2C</option><option value="B2B">B2B</option></select></label>
          <label>Payment<select className="input" value={form.paymentType} onChange={e=>setForm({...form,paymentType:e.target.value})}><option value="PREPAID">Prepaid</option><option value="COD">COD</option></select></label>
        </div>
        <div style={{display:'flex',gap:8,marginTop:12}}><button className="btn-secondary btn" onClick={doPreview}>Preview Charge</button><button className="btn" onClick={createOrder}>Confirm & Create</button></div>
        {preview && <div style={{marginTop:12,padding:14,background:'#f8fafc',borderRadius:12,border:'1px solid #e2e8f0',fontSize:12,lineHeight:1.7}}>
          <b>Breakdown (shown before confirm):</b><br/>
          Pickup Zone: <b>{preview.pickupZone}</b> → Drop Zone: <b>{preview.dropZone}</b> ({preview.zoneRel})<br/>
          Volumetric: {preview.volumetricWeight} kg • Actual: {preview.actualWeight} kg • Billable: <b>{preview.billableWeight} kg</b><br/>
          Rate: ₹{preview.rateApplied}/kg • Base: ₹{preview.baseCharge} • COD Surcharge: ₹{preview.codSurcharge} • <b>Total: ₹{preview.total}</b>
        </div>}
        <p style={{marginTop:8,fontSize:11,color:'#64748b'}}>Uses admin-configured rate cards (B2B/B2C intra/inter) + COD config — zero hardcode. Unmapped area → 400 error.</p>
      </div>
      <div className="card">
        <h3>📋 My Orders — Live Status & Timeline</h3>
        {orders.length===0 && <p style={{color:'#64748b',fontSize:13}}>No orders yet — create one.</p>}
        {orders.map(o=><div key={o.id} className="card" style={{padding:14,marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><b>{o.id.slice(0,8)}</b><span className={`badge badge-${o.currentStatus==='DELIVERED'?'delivered':o.currentStatus==='FAILED'?'failed':o.currentStatus==='ASSIGNED'?'assigned':'created'}`}>{o.currentStatus}</span></div>
          <div style={{fontSize:12,marginTop:6}}>{o.pickupAddress} → {o.dropAddress} • {o.orderType}/{o.paymentType} • {o.l}×{o.b}×{o.h} • ₹{o.totalCharge}</div>
          {o.chargeBreakdown && <div style={{fontSize:11,marginTop:6,background:'#f8fafc',padding:8,borderRadius:8}}>Billable {o.chargeBreakdown.billableWeight}kg • Rate ₹{o.chargeBreakdown.rateApplied} • {o.chargeBreakdown.zoneRel} • COD ₹{o.chargeBreakdown.codSurcharge}</div>}
          {o.assignedAgent && <div style={{fontSize:11,marginTop:4}}>Agent: {o.assignedAgent.user?.name || o.assignedAgentId}</div>}
          <div className="timeline" style={{marginTop:10}}>
            {(o.tracking||[]).map((t:any,i:number)=><div key={i} className="timeline-item" style={{fontSize:11}}><b>{t.fromStatus||'—'} → {t.toStatus}</b> by {t.actorRole} <span style={{color:'#64748b'}}>{new Date(t.createdAt).toLocaleString()}</span>{t.notes && <div style={{color:'#475569'}}>{t.notes}</div>}</div>)}
          </div>
          {o.currentStatus==='FAILED' && <div style={{marginTop:10,display:'flex',gap:6}}><input className="input" type="date" value={reschedule[o.id]||''} onChange={e=>setReschedule({...reschedule,[o.id]:e.target.value})} style={{flex:1}} /><button className="btn" style={{padding:'8px 12px',fontSize:12}} onClick={()=>doReschedule(o.id)}>Reschedule</button></div>}
          {o.currentStatus==='FAILED' && <p style={{fontSize:11,marginTop:6,color:'#d97706'}}>Failed — you were notified by email. Pick a date to reassign.</p>}
        </div>)}
      </div>
    </div>
  </div>
}
