import { createHash, timingSafeEqual, randomBytes } from 'node:crypto';

const fail = (message, status = 409) => { throw Object.assign(new Error(message), { status }); };
export function authorized(header, access, now = Date.now()) {
  if (now >= Date.parse(access.expires)) return false;
  const token = String(header || '').replace(/^Bearer /, '');
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const hash = createHash('sha256').update(token).digest();
  return timingSafeEqual(hash, Buffer.from(access.sha256, 'hex'));
}

export function validateRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 100) fail('Source must contain between 1 and 100 household records.');
  let bytes = 0;
  const seen = new Set();
  return rows.map(row => {
    if (!/^together:house:[a-f0-9]{32}$/.test(row.key) || typeof row.value !== 'string' || seen.has(row.key)) fail('Invalid source household record.');
    seen.add(row.key);
    bytes += Buffer.byteLength(row.value);
    if (bytes > 50 * 1024 * 1024) fail('Source is too large for this transfer.');
    let h;
    try { h = JSON.parse(row.value); } catch { fail('Invalid source household JSON.'); }
    if (row.key !== `together:house:${h.id}` || !Array.isArray(h.keys) || h.keys.length !== 4 ||
      !h.keys.every(k => k === null || /^[a-f0-9]{64}$/.test(k)) ||
      !Array.isArray(h.names) || h.names.length !== 4 || !Array.isArray(h.expenses) ||
      !Array.isArray(h.sheets) || !Array.isArray(h.settlements) || !Number.isInteger(h.rev)) fail('Source household is incomplete.');
    return { ...row, household: h };
  });
}

// Insert-only: keep the exact original JSON, including receipts, creator IDs,
// access-key hashes, revisions, catalogs and settled records. Never overwrite.
export async function transfer(rows, redis, apply = false) {
  const records = validateRows(rows);
  for (const row of records) {
    const existing = await redis('GET', row.key);
    if (existing !== null && existing !== row.value) fail('Destination contains a different version of a household. Nothing will be overwritten.');
  }
  let inserted = 0;
  for (const row of records) {
    if (apply) {
      if (await redis('SET', row.key, row.value, 'NX') === 'OK') inserted++;
      if (await redis('GET', row.key) !== row.value) fail('Destination changed during transfer. Source data remains untouched.');
    }
  }
  return {
    mode: apply ? 'copied-and-verified' : 'checked-only',
    households: records.length, inserted,
    expenses: records.reduce((n, r) => n + r.household.expenses.length, 0),
    sheets: records.reduce((n, r) => n + r.household.sheets.length, 0),
    settlements: records.reduce((n, r) => n + r.household.settlements.length, 0),
    claimedMembers: records.reduce((n, r) => n + r.household.keys.filter(Boolean).length, 0),
  };
}

export function makeMigrationHandler({ access, source, redis }) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    if (!authorized(req.headers.authorization, access)) return res.status(401).json({ error: 'Migration access required.' });
    let locked = false;
    const lease = randomBytes(16).toString('hex');
    const lock = 'together:migration:netlify:lock';
    const complete = 'together:migration:netlify:complete';
    try {
      if (await redis('GET', complete)) return res.status(200).json({ state: 'already-completed' });
      locked = await redis('SET', lock, lease, 'NX', 'EX', 180) === 'OK';
      if (!locked) fail('Another transfer is in progress.');
      const rows = await source();
      const apply = req.body?.apply === true;
      const result = await transfer(rows, redis, apply);
      if (apply) {
        const latest = await source();
        const snapshot = list => JSON.stringify(list.map(r => [r.key, r.value]).sort((a,b) => a[0].localeCompare(b[0])));
        if (snapshot(rows) !== snapshot(latest)) fail('The source changed during transfer. Keep using the old app until the difference is resolved.');
        await redis('SET', complete, JSON.stringify(result), 'NX');
      }
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 503).json({ error: error.status ? error.message : 'Transfer could not connect. Check the production source connection setting; no source records were modified.' });
    } finally {
      // Remove only our lock; a timed-out request must not release a newer lock.
      if (locked) await redis('EVAL', "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", 1, lock, lease).catch(() => {});
    }
  };
}
