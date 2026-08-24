const { calculateRate, resolveZone } = require('../dist/services/rateEngine.js');
// Note: after build, dist available. For direct ts, use tsx.
// Run via node with tsx: npx tsx tests/rateEngine.test.js
async function run(){
  console.log('=== Rate Engine Unit Tests ===');
  const rateCards=[
    { orderType:'B2C', zoneRel:'INTRA', rate:50 },
    { orderType:'B2C', zoneRel:'INTER', rate:80 },
    { orderType:'B2B', zoneRel:'INTRA', rate:40 },
    { orderType:'B2B', zoneRel:'INTER', rate:70 },
  ];
  const codConfigs=[
    { orderType:'B2C', surchargeType:'PERCENT', value:10 },
    { orderType:'B2B', surchargeType:'FLAT', value:50 },
  ];
  const zoneAreas=[
    { area:'100001', zoneId:'zone_a' },
    { area:'100002', zoneId:'zone_a' },
    { area:'200001', zoneId:'zone_b' },
  ];
  function assert(cond, msg){
    if(!cond) throw new Error('FAIL: '+msg);
    console.log('PASS:',msg);
  }
  // 1 intra vs inter
  let r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_a', l:10,b:10,h:10, actualWeight:2, orderType:'B2C', paymentType:'PREPAID', rateCards, codConfigs });
  assert(r.zoneRel==='INTRA' && r.rateApplied===50 && r.total===100, 'intra B2C 2kg*50=100');
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_b', l:10,b:10,h:10, actualWeight:2, orderType:'B2C', paymentType:'PREPAID', rateCards, codConfigs });
  assert(r.zoneRel==='INTER' && r.rateApplied===80 && r.total===160, 'inter B2C 2*80=160');
  // 2 actual > vol vs vol > actual
  // volumetric 1.2 (20*15*20/5000)
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_b', l:20,b:15,h:20, actualWeight:0.5, orderType:'B2C', paymentType:'PREPAID', rateCards, codConfigs });
  assert(r.volumetricWeight===1.2 && r.billableWeight===1.2 && r.total===96, 'vol > actual 1.2*80=96');
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_b', l:10,b:10,h:10, actualWeight:5, orderType:'B2C', paymentType:'PREPAID', rateCards, codConfigs });
  assert(r.billableWeight===5 && r.total===400, 'actual 5 > vol 0.2 => 5*80=400');
  // 3 B2B vs B2C
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_a', l:10,b:10,h:10, actualWeight:2, orderType:'B2B', paymentType:'PREPAID', rateCards, codConfigs });
  assert(r.rateApplied===40 && r.total===80, 'B2B intra 2*40=80 vs B2C 100');
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_b', l:10,b:10,h:10, actualWeight:2, orderType:'B2B', paymentType:'PREPAID', rateCards, codConfigs });
  assert(r.rateApplied===70 && r.total===140, 'B2B inter 2*70=140 vs B2C 160');
  // 4 COD vs Prepaid
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_b', l:10,b:10,h:10, actualWeight:2, orderType:'B2C', paymentType:'COD', rateCards, codConfigs });
  assert(r.codSurcharge===16 && r.total===176, 'B2C COD 10% 160+16=176');
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_b', l:10,b:10,h:10, actualWeight:2, orderType:'B2B', paymentType:'COD', rateCards, codConfigs });
  assert(r.codSurcharge===50 && r.total===190, 'B2B COD flat 50 140+50=190');
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_b', l:10,b:10,h:10, actualWeight:2, orderType:'B2C', paymentType:'PREPAID', rateCards, codConfigs });
  assert(r.codSurcharge===0 && r.total===160, 'Prepaid 0 COD');
  // 5 unmapped
  try{ resolveZone('999999', zoneAreas); assert(false,'unmapped should throw'); }catch(e){ assert(e.message.includes('not mapped'), 'unmapped area fails clearly'); }
  // 6 worked example from README: 20x15x20 2kg B2C inter COD => 176
  r=calculateRate({ pickupZone:'zone_a', dropZone:'zone_b', l:20,b:15,h:20, actualWeight:2, orderType:'B2C', paymentType:'COD', rateCards, codConfigs });
  assert(r.volumetricWeight===1.2 && r.billableWeight===2 && r.baseCharge===160 && r.codSurcharge===16 && r.total===176, 'worked example 20x15x20 B2C inter COD 176');
  console.log('=== ALL RATE TESTS PASS ===');
}
run().catch(e=>{ console.error(e); process.exit(1); });
