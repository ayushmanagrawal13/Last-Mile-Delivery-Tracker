import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function AdminDashboard(){
  const { user, logout }=useAuth();
  const [zones,setZones]=useState<any[]>([]);
  const [areas,setAreas]=useState<any[]>([]);
  const [rateCards,setRateCards]=useState<any[]>([]);
  const [cod,setCod]=useState<any[]>([]);
  const [agents,setAgents]=useState<any[]>([]);
  const [orders,setOrders]=useState<any[]>([]);
  const [stats,setStats]=useState<any>(null);
  const [zoneForm,setZoneForm]=useState({name:''});
  const [areaForm,setAreaForm]=useState({zoneId:'',areas:''});
  const [rateForm,setRateForm]=useState({orderType:'B2C',zoneRel:'INTRA',rate:50});
  const [codForm,setCodForm]=useState({orderType:'B2C',surchargeType:'PERCENT',value:10});
  const [agentForm,setAgentForm]=useState({name:'',email:'',password:'',currentZoneId:''});
  const [filter,setFilter]=useState({status:'',zone:'',agent:''});
  const load=async()=>{
    const z=await api.get('/api/v1/zones'); setZones(z.data.data);
    const a=await api.get('/api/v1/zones/areas'); setAreas(a.data.data);
    const rc=await api.get('/api/v1/rate-cards'); setRateCards(rc.data.data);
    const cc=await api.get('/api/v1/cod-config'); setCod(cc.data.data);
    const ag=await api.get('/api/v1/agents'); setAgents(ag.data.data);
    const o=await api.get('/api/v1/orders'); setOrders(o.data.data);
    setStats({zones: z.data.data.length, rateCards: rc.data.data.length, agents: ag.data.data.length, orders: o.data.data.length});
    if(z.data.data[0] && !areaForm.zoneId) setAreaForm(f=>({...f,zoneId:z.data.data[0].id}));
    if(z.data.data[0] && !agentForm.currentZoneId) setAgentForm(f=>({...f,currentZoneId:z.data.data[0].id}));
  };
  useEffect(()=>{ load(); },[]);
  const createZone=async()=>{ await api.post('/api/v1/zones',zoneForm); setZoneForm({name:''}); load(); };
  const addAreas=async()=>{ const arr=areaForm.areas.split(',').map(s=>s.trim()).filter(Boolean); await api.post('/api/v1/zones/areas',{zoneId:areaForm.zoneId, areas:arr}); setAreaForm({...areaForm,areas:''}); load(); };
  const saveRate=async()=>{ await api.post('/api/v1/rate-cards',rateForm); load(); };
  const saveCod=async()=>{ await api.post('/api/v1/cod-config',codForm); load(); };
  const createAgent=async()=>{ await api.post('/api/v1/agents',agentForm); setAgentForm({name:'',email:'',password:'',currentZoneId:areaForm.zoneId}); load(); };
  const assign=async(orderId:string, agentId:string)=>{ await api.post(`/api/v1/orders/${orderId}/assign`,{agentId}); load(); };
  const autoAssign=async(orderId:string)=>{ const r=await api.post(`/api/v1/orders/${orderId}/auto-assign`,{}); alert(r.data.data?.reason || JSON.stringify(r.data.data)); load(); };
  const override=async(orderId:string, to:string)=>{ const notes=prompt('Override reason?'); if(notes===null) return; await api.post(`/api/v1/orders/${orderId}/override`,{toStatus:to, notes}); load(); };
  const filtered=orders.filter(o=>{
    if(filter.status && o.currentStatus!==filter.status) return false;
    if(filter.zone && o.pickupZoneId!==filter.zone && o.dropZoneId!==filter.zone) return false;
    if(filter.agent && o.assignedAgentId!==filter.agent) return false;
    return true;
  });
  return <div className="container">
    <div className="nav"><h3>Admin — {user?.name}</h3><button className="btn-secondary btn" onClick={logout}>Logout</button></div>
    <div className="hero" style={{padding:24}}><h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:20}}>Command Center</h2><p style={{opacity:0.9}}>Zones, rate cards, agents, orders — all zero-hardcode.</p></div>
    {stats && <div className="grid grid-4"><div className="card">Zones: <b>{stats.zones}</b></div><div className="card">Rate Cards: <b>{stats.rateCards}</b></div><div className="card">Agents: <b>{stats.agents}</b></div><div className="card">Orders: <b>{stats.orders}</b></div></div>}
    <div className="grid grid-2">
      <div className="card"><h3>Zones</h3>
        <div style={{display:'flex',gap:6,marginTop:8}}><input className="input" placeholder="Zone name (e.g. North)" value={zoneForm.name} onChange={e=>setZoneForm({name:e.target.value})} style={{flex:1}} /><button className="btn" onClick={createZone}>Create</button></div>
        <table className="table" style={{marginTop:12}}><thead><tr><th>Name</th><th>Areas (pincodes)</th></tr></thead><tbody>{zones.map((z:any)=><tr key={z.id}><td><b>{z.name}</b></td><td style={{fontSize:11}}>{(z.areas||areas.filter((a:any)=>a.zoneId===z.id)).map((a:any)=>a.area).join(', ')||'—'}</td></tr>)}</tbody></table>
        <div style={{marginTop:12,padding:12,background:'#f8fafc',borderRadius:10,border:'1px solid #e2e8f0'}}>
          <h4 style={{fontSize:13}}>Map Areas → Zone</h4>
          <select className="input" value={areaForm.zoneId} onChange={e=>setAreaForm({...areaForm,zoneId:e.target.value})}>{zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}</select>
          <input className="input" placeholder="Areas comma separated (e.g. 100001,100002)" value={areaForm.areas} onChange={e=>setAreaForm({...areaForm,areas:e.target.value})} />
          <button className="btn" style={{marginTop:8}} onClick={addAreas}>Add Areas</button>
        </div>
      </div>
      <div className="card"><h3>Rate Cards (per kg) — Zero Hardcode</h3>
        <table className="table"><thead><tr><th>Type</th><th>Rel</th><th>Rate</th></tr></thead><tbody>{rateCards.map((r:any)=><tr key={r.id}><td>{r.orderType}</td><td>{r.zoneRel}</td><td>₹{r.rate}</td></tr>)}</tbody></table>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:10}}>
          <select className="input" value={rateForm.orderType} onChange={e=>setRateForm({...rateForm,orderType:e.target.value})}><option>B2B</option><option>B2C</option></select>
          <select className="input" value={rateForm.zoneRel} onChange={e=>setRateForm({...rateForm,zoneRel:e.target.value})}><option>INTRA</option><option>INTER</option></select>
          <input className="input" type="number" value={rateForm.rate} onChange={e=>setRateForm({...rateForm,rate:parseFloat(e.target.value)||0})} placeholder="Rate" />
        </div>
        <button className="btn" style={{marginTop:8}} onClick={saveRate}>Save Rate Card</button>
        <h4 style={{marginTop:14}}>COD Surcharge</h4>
        <table className="table"><thead><tr><th>Type</th><th>Kind</th><th>Value</th></tr></thead><tbody>{cod.map((c:any)=><tr key={c.id}><td>{c.orderType}</td><td>{c.surchargeType}</td><td>{c.surchargeType==='PERCENT'?c.value+'%':'₹'+c.value}</td></tr>)}</tbody></table>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:8}}>
          <select className="input" value={codForm.orderType} onChange={e=>setCodForm({...codForm,orderType:e.target.value})}><option>B2B</option><option>B2C</option></select>
          <select className="input" value={codForm.surchargeType} onChange={e=>setCodForm({...codForm,surchargeType:e.target.value})}><option>FLAT</option><option>PERCENT</option></select>
          <input className="input" type="number" value={codForm.value} onChange={e=>setCodForm({...codForm,value:parseFloat(e.target.value)||0})} />
        </div>
        <button className="btn" style={{marginTop:8}} onClick={saveCod}>Save COD</button>
      </div>
    </div>
    <div className="card"><h3>Delivery Agents</h3>
      <table className="table"><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Zone</th><th>Load</th></tr></thead><tbody>{agents.map((a:any)=><tr key={a.id}><td>{a.user?.name}</td><td style={{fontSize:11}}>{a.user?.email}</td><td><span className={`badge badge-${a.status==='AVAILABLE'?'assigned':'created'}`}>{a.status}</span></td><td>{a.currentZone?.name || a.currentZoneId||'—'}</td><td>{a.activeOrderCount}</td></tr>)}</tbody></table>
      <div style={{marginTop:12,padding:12,background:'#f8fafc',borderRadius:10}}>
        <h4 style={{fontSize:13}}>Create Agent</h4>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
          <input className="input" placeholder="Name" value={agentForm.name} onChange={e=>setAgentForm({...agentForm,name:e.target.value})} />
          <input className="input" placeholder="Email" value={agentForm.email} onChange={e=>setAgentForm({...agentForm,email:e.target.value})} />
          <input className="input" placeholder="Password" type="password" value={agentForm.password} onChange={e=>setAgentForm({...agentForm,password:e.target.value})} />
          <select className="input" value={agentForm.currentZoneId} onChange={e=>setAgentForm({...agentForm,currentZoneId:e.target.value})}><option value="">No zone</option>{zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}</select>
        </div>
        <button className="btn" style={{marginTop:8}} onClick={createAgent}>Create Agent</button>
      </div>
    </div>
    <div className="card"><h3>All Orders — Filter, Assign, Override</h3>
      <div className="grid grid-3"><select className="input" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}><option value="">All status</option>{['CREATED','CONFIRMED','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RESCHEDULED'].map(s=><option key={s} value={s}>{s}</option>)}</select><select className="input" value={filter.zone} onChange={e=>setFilter({...filter,zone:e.target.value})}><option value="">All zones</option>{zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}</select><select className="input" value={filter.agent} onChange={e=>setFilter({...filter,agent:e.target.value})}><option value="">All agents</option>{agents.map(a=><option key={a.id} value={a.id}>{a.user?.name}</option>)}</select></div>
      <table className="table" style={{marginTop:12}}><thead><tr><th>ID</th><th>Route</th><th>Type</th><th>Status</th><th>Agent</th><th>Actions</th></tr></thead><tbody>{filtered.slice(0,50).map((o:any)=><tr key={o.id}><td style={{fontSize:11}}>{o.id.slice(0,8)}</td><td style={{fontSize:11}}>{o.pickupAddress}→{o.dropAddress}<br/><span style={{color:'#64748b'}}>{o.pickupZoneId}→{o.dropZoneId} • ₹{o.totalCharge}</span></td><td style={{fontSize:11}}>{o.orderType}/{o.paymentType}</td><td><span className="badge badge-created">{o.currentStatus}</span></td><td style={{fontSize:11}}>{o.assignedAgentId? agents.find((a:any)=>a.id===o.assignedAgentId)?.user?.name||o.assignedAgentId.slice(0,6):'—'}</td><td><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
        <select className="input" style={{width:110,padding:'6px'}} defaultValue="" onChange={e=>{ if(e.target.value) assign(o.id,e.target.value); }}>
          <option value="">Assign…</option>{agents.map(a=><option key={a.id} value={a.id}>{a.user?.name}</option>)}
        </select>
        <button className="btn-secondary btn" style={{padding:'6px 8px',fontSize:11}} onClick={()=>autoAssign(o.id)}>Auto-Assign</button>
        <select className="input" style={{width:110,padding:'6px'}} defaultValue="" onChange={e=>{ if(e.target.value) override(o.id,e.target.value); }}>
          <option value="">Override…</option>{['ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div></td></tr>)}</tbody></table>
    </div>
  </div>
}
