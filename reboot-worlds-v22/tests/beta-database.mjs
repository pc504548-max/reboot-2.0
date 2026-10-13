import {PGlite} from '@electric-sql/pglite'
import fs from 'node:fs'
import assert from 'node:assert/strict'
const db=new PGlite(),repo=process.env.REBOOT_APP_ROOT
if(!repo)throw new Error('Set REBOOT_APP_ROOT to the reboot-worlds-v22 directory')
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT COALESCE(current_setting('request.jwt.claims',true),'{}')::jsonb $$; GRANT USAGE ON SCHEMA auth TO anon,authenticated;`)
for(const f of fs.readdirSync(repo+'/supabase/migrations').sort())await db.exec(fs.readFileSync(repo+'/supabase/migrations/'+f,'utf8'))
await db.exec(`GRANT SELECT,INSERT,UPDATE,DELETE ON projects TO anon,authenticated; UPDATE beta_config SET owner_uid='owner',member_limit=2,member_project_limit=1,owner_project_limit=2,project_limit=3;`)
const as=async (uid,email)=>{await db.exec('RESET ROLE');await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({firebase_uid:uid,...(email?{email}:{})})]);await db.exec('SET ROLE authenticated')}
const query=(s,p)=>db.query(s,p),reject=async(s,p)=>assert.rejects(query(s,p))
await as('visitor')
await reject('SELECT admin_beta_overview()');await reject('SELECT admin_set_limits(9999,99999,9999,9999)');await reject("SELECT admin_review_beta('visitor',true)");await reject('SELECT * FROM beta_requests');await reject("INSERT INTO projects(name,category,firebase_uid)VALUES('Pending','AI','visitor')")
await query("SELECT request_beta('visitor@example.invalid','hello')");await query("SELECT request_beta('duplicate@example.invalid','duplicate')")
assert.equal((await query('SELECT beta_status() s')).rows[0].s.status,'pending')
await as('owner');assert.equal((await query('SELECT admin_beta_overview() o')).rows[0].o.requests[0].email,'Unverified Firebase identity');await query("SELECT admin_review_beta('visitor',true)");await as('second','verified@example.invalid');await query("SELECT request_beta('second@example.invalid','')");await as('owner');assert.equal((await query('SELECT admin_beta_overview() o')).rows[0].o.requests[0].email,'verified@example.invalid');await query("SELECT admin_review_beta('second',true)")
await as('third');await query("SELECT request_beta('third@example.invalid','')");await as('owner');await reject("SELECT admin_review_beta('third',true)");await reject('SELECT admin_set_limits(1,3,1,2)')
await query('SELECT admin_set_limits(102,120,1,2)');await query("SELECT admin_review_beta('third',true)")
const id='c0448750-9dfd-4c1f-9a80-2787ca352d98'
await as('visitor');await query('INSERT INTO projects(id,name,category,firebase_uid)VALUES($1,$2,$3,$4)',[id,'Test idea','AI','visitor']);await reject("INSERT INTO projects(name,category,firebase_uid)VALUES('Over quota','AI','visitor')");await reject("INSERT INTO projects(name,category,firebase_uid)VALUES('Forged','AI','second')")
await query('INSERT INTO projects(id,name,category,firebase_uid)VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET name=excluded.name',[id,'Retry','AI','visitor'])
assert.equal((await query('SELECT record_project_view($1) n',[id])).rows[0].n,0)
await as('second');assert.equal((await query('SELECT record_project_view($1) n',[id])).rows[0].n,1);assert.equal((await query('SELECT record_project_view($1) n',[id])).rows[0].n,1)
await reject('INSERT INTO project_metrics(project_id,view_count)VALUES($1,100000)',[id]);await reject('SELECT * FROM project_views');await reject('UPDATE project_metrics SET view_count=100000')
await query("SELECT submit_feedback('Useful beta feedback')");await reject('SELECT * FROM beta_feedback')
for(let i=0;i<4;i++)await query("SELECT submit_feedback('More useful feedback')")
await reject("SELECT submit_feedback('Sixth message forbidden')")
await as('owner');const o=(await query('SELECT admin_beta_overview() o')).rows[0].o;assert.equal(o.feedback.length,5);assert.equal(o.approved,3);assert.equal(o.requests.length,0)
// Synthetic accepted readers exercise the exact 99 -> 100 boundary with genuine RPC inserts.
await db.exec('RESET ROLE');for(let i=0;i<99;i++)await query("INSERT INTO beta_requests(uid,email,status)VALUES($1,'fixture@example.invalid','approved')",['reader'+i])
for(let i=0;i<99;i++){await as('reader'+i);const count=(await query('SELECT record_project_view($1) n',[id])).rows[0].n;assert.equal(count,i+2);if(i===97)assert.equal(count,99)}
assert.equal((await query('SELECT record_project_view($1) n',[id])).rows[0].n,100)
await db.exec('SET ROLE anon');await reject('SELECT record_project_view($1)',[id]);await reject("SELECT request_beta('anon@example.invalid','')");assert.equal((await query('SELECT view_count FROM project_metrics WHERE project_id=$1',[id])).rows[0].view_count,100)
await as('owner');await query("SELECT admin_review_beta('visitor',false)");await as('visitor');assert.equal((await query("UPDATE projects SET name='Denied' WHERE id=$1 RETURNING id",[id])).rows.length,0)
await db.close();console.log('PASS: three migrations; owner isolation, private requests/feedback, approval cap, adjustable quotas, project retry/forgery guards, daily feedback limit, unique views and exact 100-view threshold, anonymous denial, revoked access')
