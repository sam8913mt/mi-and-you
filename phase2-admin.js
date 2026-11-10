/* Admin CRUD for Phase 2. Every operation is guarded by the existing admin allowlist + RLS. */
(async()=>{
 const cfg=window.SUPABASE_CONFIG||{};if(!window.supabase?.createClient||!cfg.url||!cfg.anonKey)return;
 const client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{storage:window.sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 let initialized=false;
 async function init(){
 const {data:{session}}=await client.auth.getSession();if(!session)return;
 const {data:admin,error:authErr}=await client.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();if(authErr||!admin||initialized)return;initialized=true;
 const app=document.getElementById('app');if(!app)return;
 async function uploadWithProgress(bucket,path,file,onProgress){const {data:{session:active}}=await client.auth.getSession();if(!active?.access_token)throw Error('نشست مدیر منقضی شده است.');return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();const encoded=path.split('/').map(encodeURIComponent).join('/');xhr.open('POST',`${cfg.url.replace(/\/$/,'')}/storage/v1/object/${bucket}/${encoded}`);xhr.setRequestHeader('apikey',cfg.anonKey);xhr.setRequestHeader('Authorization','Bearer '+active.access_token);xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');xhr.setRequestHeader('x-upsert','false');xhr.upload.onprogress=e=>{if(e.lengthComputable&&onProgress)onProgress(Math.round(e.loaded/e.total*100));};xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300)resolve();else reject(Error(`Storage HTTP ${xhr.status}: ${xhr.responseText.slice(0,300)}`));};xhr.onerror=()=>reject(Error('خطای شبکه هنگام بارگذاری فایل.'));xhr.onabort=()=>reject(Error('بارگذاری لغو شد.'));xhr.send(file);});}
 const css=document.createElement('style');

 const tabs=[['videos','🎬 ویدئوها'],['letters','💌 نامه‌ها'],['messages','🤫 پیام‌های خصوصی'],['quiz','💗 آزمون'],['meeting','⏳ تاریخ دیدار'],['route','🗺️ نقشه و فاصله']];const secs={};tabs.forEach(([id])=>{secs[id]=document.getElementById('sec-'+id);});let work=null,status=null,active='videos';const pick=()=>{const sc=secs[active];work=sc.querySelector('.p2w');status=sc.querySelector('.p2-status');};const say=t=>{if(status)status.textContent=t||'';};const esc=s=>String(s??'');

 const field=(placeholder,value='',type='text')=>{const x=document.createElement(type==='textarea'?'textarea':'input');if(type!=='textarea')x.type=type;x.placeholder=placeholder;x.value=value;return x;};
 async function list(table){const {data,error}=await client.from(table).select('*').order('created_at',{ascending:false});if(error)throw error;return data||[];}
 async function remove(table,id){if(!confirm('این مورد برای همیشه حذف شود؟'))return;const {error}=await client.from(table).delete().eq('id',id);if(error)throw error;say('حذف شد.');render();}
 async function save(table,id,payload){const q=id?client.from(table).update(payload).eq('id',id):client.from(table).insert(payload);const {error}=await q;if(error)throw error;say('ذخیره شد.');render();}
 function itemCard(title,body,buttons){const d=document.createElement('div');d.className='p2-admin-item';const h=document.createElement('b');h.textContent=title;const p=document.createElement('p');p.textContent=body;d.append(h,p,...buttons);return d;}
 async function renderMeeting(){
  const JD=window.JDate;
  if(!JD){say('فایل jdate.js بارگذاری نشده است.');return;}
  const TZ=3.5*3600000,fa=JD.faNum,p2=n=>String(n).padStart(2,'0');
  const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
  const fromIso=(iso)=>{const ts=Date.parse(iso);if(Number.isNaN(ts))return null;const t=new Date(ts+TZ);const j=JD.toJalali(t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate());return{jy:j.jy,jm:j.jm,jd:j.jd,hh:t.getUTCHours(),mi:t.getUTCMinutes()};};
  const {data,error}=await client.from('site_content').select('value').eq('key','meeting_date').maybeSingle();
  if(error)throw error;
  const nowT=new Date(Date.now()+TZ),nj=JD.toJalali(nowT.getUTCFullYear(),nowT.getUTCMonth()+1,nowT.getUTCDate());
  const cur=data?.value?fromIso(data.value):null;
  const init=cur||{jy:nj.jy,jm:nj.jm,jd:nj.jd,hh:18,mi:0};

  const card=el('div','mt-card');
  card.append(el('div','mt-head',''),el('p','hint','تاریخ و ساعت دیدار را به وقت تهران و با تقویم شمسی انتخاب کن؛ در پایگاه داده به‌صورت استاندارد ذخیره می‌شود.'));
  card.firstChild.append(el('span','mt-ico','💞'),el('div','',''));
  card.firstChild.lastChild.append(el('b','','دیدار بعدی'),el('small','','به وقت تهران (UTC+۰۳:۳۰)'));

  const mkSel=(id,label,opts,val)=>{const w=el('div','mt-f');const l=el('label','',label);l.htmlFor=id;const s=document.createElement('select');s.id=id;opts.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);});s.value=String(val);w.append(l,s);return[w,s];};
  const years=[];for(let y=Math.min(nj.jy,init.jy)-1;y<=Math.max(nj.jy,init.jy)+5;y++)years.push([y,fa(y)]);
  const months=JD.monthNames.map((n,i)=>[i+1,n]);
  const [wy,sy]=mkSel('mt-y','سال',years,init.jy);
  const [wm,sm]=mkSel('mt-m','ماه',months,init.jm);
  const [wd,sd]=mkSel('mt-d','روز',[[1,'۱']],init.jd);
  const hours=[...Array(24).keys()].map(h=>[h,fa(p2(h))]);
  const mins=[...Array(12).keys()].map(i=>[i*5,fa(p2(i*5))]);
  if(init.mi%5)mins.push([init.mi,fa(p2(init.mi))]),mins.sort((a,b)=>a[0]-b[0]);
  const [wh,sh]=mkSel('mt-h','ساعت',hours,init.hh);
  const [wi,si]=mkSel('mt-i','دقیقه',mins,init.mi);

  const dateRow=el('div','mt-row3');dateRow.append(wd,wm,wy);
  const timeRow=el('div','mt-row2');timeRow.append(wh,wi);
  const fillDays=(keep)=>{const jy=+sy.value,jm=+sm.value,len=JD.jalaliMonthLength(jy,jm);const old=keep??+sd.value;sd.innerHTML='';for(let d=1;d<=len;d++){const o=document.createElement('option');o.value=d;o.textContent=fa(d);sd.append(o);}sd.value=String(Math.min(old||1,len));};
  fillDays(init.jd);

  const preview=el('div','mt-preview');
  const big=el('div','mt-big'),sub=el('div','mt-sub'),greg=el('div','mt-greg');
  preview.append(big,sub,greg);
  const getIso=()=>{const jy=+sy.value,jm=+sm.value,jd=+sd.value;if(!JD.isValidJalali(jy,jm,jd))return null;return`${JD.jalaliToIso(jy,jm,jd)}T${p2(sh.value)}:${p2(si.value)}:00+03:30`;};
  const upd=()=>{
   const iso=getIso();if(!iso){big.textContent='تاریخ معتبر نیست';return null;}
   const jy=+sy.value,jm=+sm.value,jd=+sd.value;
   big.textContent=`${fa(jd)} ${JD.monthNames[jm-1]} ${fa(jy)}`;
   const ts=Date.parse(iso),ms=ts-Date.now();
   if(ms<=0){sub.textContent=`ساعت ${fa(p2(sh.value))}:${fa(p2(si.value))} · این زمان گذشته است`;}
   else{const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);sub.textContent=`ساعت ${fa(p2(sh.value))}:${fa(p2(si.value))} · ${d?fa(d)+' روز و ':''}${fa(h)} ساعت دیگر`;}
   greg.textContent=`معادل میلادی: ${iso.slice(0,16).replace('T',' ')} (تهران)`;
   return iso;};
  [sy,sm].forEach(s=>s.addEventListener('change',()=>{fillDays();upd();}));
  [sd,sh,si].forEach(s=>s.addEventListener('change',upd));
  upd();

  const saveBtn=el('button','','💾 ذخیره تاریخ دیدار');saveBtn.type='button';
  saveBtn.onclick=async()=>{const iso=upd();if(!iso){say('تاریخ معتبر وارد کن.');return;}saveBtn.disabled=true;try{const {error:e}=await client.from('site_content').upsert({key:'meeting_date',value:iso},{onConflict:'key'});if(e)throw e;say('تاریخ دیدار ذخیره شد 💞');}catch(e){say('خطا: '+e.message);}finally{saveBtn.disabled=false;}};
  const bar=el('div','savebar');bar.append(saveBtn);
  card.append(dateRow,timeRow,preview,bar);
  work.append(card);
 }

 async function renderRoute(){
  const fa=(window.JDate&&window.JDate.faNum)||(x=>x);
  const el=(tg,c,x)=>{const e=document.createElement(tg);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
  const {data,error}=await client.from('site_content').select('key,value').in('key',['road_distance_km','road_duration_text']);
  if(error)throw error;
  const m=Object.fromEntries((data||[]).map(r=>[r.key,r.value]));
  const card=el('div','mt-card');
  const head=el('div','mt-head');head.append(el('span','mt-ico','🛣️'));const hd=el('div');hd.append(el('b','','تهران ← گرگان'),el('small','','فاصلهٔ جاده‌ای ثبت‌شده'));head.append(hd);
  const wk=el('div','mt-f'),lk=el('label','','فاصلهٔ جاده‌ای (کیلومتر)');lk.htmlFor='rt-km';const km=document.createElement('input');km.id='rt-km';km.type='number';km.min='1';km.max='3000';km.inputMode='numeric';km.value=m.road_distance_km||'387';wk.append(lk,km);
  const wd=el('div','mt-f'),ld=el('label','','مدت سفر (اختیاری، مثلاً ۶ تا ۷ ساعت)');ld.htmlFor='rt-dur';const dur=document.createElement('input');dur.id='rt-dur';dur.type='text';dur.value=m.road_duration_text||'';wd.append(ld,dur);
  const pv=el('div','mt-preview'),big=el('div','mt-big'),sub=el('div','mt-sub');pv.append(big,sub);
  const upd=()=>{const v=Number(km.value);if(!Number.isFinite(v)||v<=0){big.textContent='عدد معتبر وارد کن';sub.textContent='';return null;}big.textContent=`${fa(Math.round(v))} کیلومتر`;sub.textContent=dur.value.trim()?`مدت سفر: ${dur.value.trim()}`:'فاصلهٔ جاده‌ای';return Math.round(v);};
  km.addEventListener('input',upd);dur.addEventListener('input',upd);upd();
  const btn=el('button','','💾 ذخیره فاصله');btn.type='button';
  btn.onclick=async()=>{const v=upd();if(!v){say('فاصلهٔ معتبر وارد کن.');return;}btn.disabled=true;try{const {error:e}=await client.from('site_content').upsert([{key:'road_distance_km',value:String(v)},{key:'road_duration_text',value:dur.value.trim()}],{onConflict:'key'});if(e)throw e;say('فاصلهٔ جاده‌ای ذخیره شد 🛣️');}catch(e){say('خطا: '+e.message);}finally{btn.disabled=false;}};
  const bar=el('div','savebar');bar.append(btn);
  card.append(head,el('p','hint','عدد پیش‌فرض ۳۸۷ کیلومتر است (مسیر معمول از منابع سفر). اگر مسیر شما فرق دارد، همین‌جا اصلاحش کن.'),wk,wd,pv,bar);
  work.append(card);
 }
 async function render(){pick();work.innerHTML='';say('');try{
 if(active==='meeting'){await renderMeeting();return;}
 if(active==='route'){await renderRoute();return;}
 if(active==='videos'){const title=field('عنوان ویدئو'),desc=field('توضیحات','', 'textarea'),file=field('انتخاب ویدئو','','file'),thumb=field('تصویر بندانگشتی (اختیاری)','','file'),btn=document.createElement('button');file.accept='video/mp4,video/webm,video/ogg';thumb.accept='image/jpeg,image/png,image/webp';btn.textContent='بارگذاری ویدئو';btn.onclick=async()=>{const f=file.files[0];if(!f||!title.value.trim()){say('عنوان ویدئو و فایل را انتخاب کن.');return;}if(!/^video\/(mp4|webm|ogg)$/.test(f.type)){say('فرمت مجاز: MP4، WebM یا OGG.');return;}if(f.size>100*1024*1024){say('حداکثر حجم ویدئو ۱۰۰ مگابایت است.');return;}btn.disabled=true;try{say('در حال بارگذاری ویدئو…');const path=crypto.randomUUID()+'.'+(f.name.split('.').pop()||'mp4').toLowerCase();await uploadWithProgress('videos',path,f,p=>say(`در حال بارگذاری ویدئو… ${p}٪`));let thumbPath=null;if(thumb.files[0]){const tf=thumb.files[0];if(!tf.type.startsWith('image/')||tf.size>8*1024*1024)throw Error('تصویر بندانگشتی باید تصویر و حداکثر ۸ مگابایت باشد.');thumbPath='thumb-'+crypto.randomUUID()+'.'+(tf.name.split('.').pop()||'jpg');await uploadWithProgress('videos',thumbPath,tf,p=>say(`در حال بارگذاری تصویر بندانگشتی… ${p}٪`));}const {error}=await client.from('gallery_videos').insert({title:title.value.trim(),description:desc.value.trim(),storage_path:path,thumbnail_path:thumbPath});if(error){await client.storage.from('videos').remove([path,...(thumbPath?[thumbPath]:[])]);throw error;}say('ویدئو بارگذاری و ثبت شد.');render();}catch(e){say('بارگذاری ناموفق: '+e.message);}finally{btn.disabled=false;}};work.append(title,desc,file,thumb,btn);
 const rows=await list('gallery_videos');for(const r of rows){const edit=document.createElement('button');edit.textContent='ویرایش عنوان/توضیح';edit.onclick=async()=>{const t=prompt('عنوان',r.title);if(t===null)return;const d=prompt('توضیحات',r.description||'');if(d===null)return;try{await save('gallery_videos',r.id,{title:t,description:d});}catch(e){say(e.message);}};const replace=document.createElement('button');replace.textContent='تعویض فایل ویدئو';const replacement=document.createElement('input');replacement.type='file';replacement.accept='video/mp4,video/webm,video/ogg';replacement.hidden=true;replace.onclick=()=>replacement.click();replacement.onchange=async()=>{const f=replacement.files[0];if(!f)return;if(!/^video\/(mp4|webm|ogg)$/.test(f.type)||f.size>100*1024*1024){say('فایل باید MP4/WebM/OGG و حداکثر ۱۰۰ مگابایت باشد.');return;}replace.disabled=true;try{say('در حال بارگذاری فایل جایگزین…');const path=crypto.randomUUID()+'.'+(f.name.split('.').pop()||'mp4');await uploadWithProgress('videos',path,f,p=>say(`در حال تعویض ویدئو… ${p}٪`));const {error}=await client.from('gallery_videos').update({storage_path:path,updated_at:new Date().toISOString()}).eq('id',r.id);if(error){await client.storage.from('videos').remove([path]);throw error;}const rm=await client.storage.from('videos').remove([r.storage_path]);if(rm.error)say('فایل جایگزین شد، اما پاک‌سازی فایل قدیمی ناموفق بود: '+rm.error.message);render();}catch(e){say('تعویض ناموفق: '+e.message);}finally{replace.disabled=false;}};const del=document.createElement('button');del.className='danger';del.textContent='حذف';del.onclick=async()=>{if(!confirm('ویدئو حذف شود؟'))return;try{const {error}=await client.from('gallery_videos').delete().eq('id',r.id);if(error)throw error;const paths=[r.storage_path,r.thumbnail_path].filter(Boolean);const rm=await client.storage.from('videos').remove(paths);if(rm.error)throw rm.error;render();}catch(e){say(e.message);}};work.append(itemCard(r.title,r.description,[edit,replace,del,replacement]));}return;}
 if(active==='letters'){const title=field('عنوان نامه'),body=field('متن نامه','', 'textarea'),btn=document.createElement('button');btn.textContent='افزودن نامه';btn.onclick=async()=>{if(!title.value.trim()||!body.value.trim()){say('عنوان و متن نامه الزامی است.');return;}btn.disabled=true;try{await save('love_letters',null,{title:title.value.trim(),body:body.value.trim()});}catch(e){say(e.message);}finally{btn.disabled=false;}};work.append(title,body,btn);for(const r of await list('love_letters')){const edit=document.createElement('button');edit.textContent='ویرایش';edit.onclick=async()=>{const t=prompt('عنوان',r.title);if(t===null)return;const b=prompt('متن نامه',r.body);if(b===null)return;try{await save('love_letters',r.id,{title:t,body:b,updated_at:new Date().toISOString()});}catch(e){say(e.message);}};const del=document.createElement('button');del.className='danger';del.textContent='حذف';del.onclick=()=>remove('love_letters',r.id).catch(e=>say(e.message));work.append(itemCard(r.title,r.body,[edit,del]));}return;}
 if(active==='messages'){const title=field('عنوان پیام'),body=field('متن پیام','', 'textarea'),secret=document.createElement('input');secret.type='checkbox';const label=document.createElement('label');label.textContent='پیام غافلگیرکننده (فقط مدیر می‌تواند محتوایش را بخواند)';label.prepend(secret);const btn=document.createElement('button');btn.textContent='ثبت پیام';btn.onclick=async()=>{if(!title.value.trim()||!body.value.trim()){say('عنوان و متن الزامی است.');return;}try{await save('private_messages',null,{title:title.value.trim(),body:body.value.trim(),is_surprise:secret.checked});}catch(e){say(e.message);}};const pass=field('تنظیم/تغییر رمز مشترک (حداقل ۸ نویسه)');pass.type='password';const passBtn=document.createElement('button');passBtn.textContent='ذخیره رمز مشترک';passBtn.onclick=async()=>{if(pass.value.length<8){say('رمز باید حداقل ۸ نویسه باشد.');return;}passBtn.disabled=true;try{const {error}=await client.rpc('set_private_message_password',{p_password:pass.value});if(error)throw error;pass.value='';say('رمز مشترک به‌صورت امن ذخیره شد.');}catch(e){say('تنظیم رمز ناموفق: '+e.message);}finally{passBtn.disabled=false;}};work.append(title,body,label,btn,pass,passBtn);for(const r of await list('private_messages')){const edit=document.createElement('button');edit.textContent='ویرایش';edit.onclick=async()=>{const t=prompt('عنوان',r.title);if(t===null)return;const b=prompt('متن',r.body);if(b===null)return;try{await save('private_messages',r.id,{title:t,body:b});}catch(e){say(e.message);}};const del=document.createElement('button');del.className='danger';del.textContent='حذف';del.onclick=()=>remove('private_messages',r.id).catch(e=>say(e.message));work.append(itemCard(r.title,r.is_surprise?'پیام غافلگیرکننده':r.body,[edit,del]));}return;}
 if(active==='quiz'){const question=field('متن سوال'),options=field('گزینه‌ها (هر گزینه در یک خط)','', 'textarea'),correct=field('شماره پاسخ صحیح (از ۰ شروع می‌شود)','0','number'),btn=document.createElement('button');btn.textContent='افزودن سوال';btn.onclick=async()=>{const opts=options.value.split('\n').map(x=>x.trim()).filter(Boolean),idx=Number(correct.value);if(!question.value.trim()||opts.length<2||!Number.isInteger(idx)||idx<0||idx>=opts.length){say('سوال، حداقل دو گزینه و شماره پاسخ صحیح معتبر لازم است.');return;}try{await save('quiz_questions',null,{question:question.value.trim(),options:opts,correct_index:idx,active:true,sort_order:Date.now()});}catch(e){say(e.message);}};work.append(question,options,correct,btn);for(const r of await list('quiz_questions')){const edit=document.createElement('button');edit.textContent='ویرایش';edit.onclick=async()=>{const q=prompt('سوال',r.question);if(q===null)return;const opts=prompt('گزینه‌ها با | جدا شوند',(r.options||[]).join('|'));if(opts===null)return;const arr=opts.split('|').map(x=>x.trim()).filter(Boolean);const idx=Number(prompt('شماره پاسخ صحیح از صفر',r.correct_index));if(arr.length<2||!Number.isInteger(idx)||idx<0||idx>=arr.length){say('اطلاعات معتبر نیست.');return;}try{await save('quiz_questions',r.id,{question:q,options:arr,correct_index:idx});}catch(e){say(e.message);}};const del=document.createElement('button');del.className='danger';del.textContent='حذف';del.onclick=()=>remove('quiz_questions',r.id).catch(e=>say(e.message));work.append(itemCard(r.question,(r.options||[]).join(' · '),[edit,del]));}return;}
 }catch(e){say('خطا در بارگذاری: '+e.message+' — مطمئن شو supabase-migration.sql را اجرا کرده‌ای.');}}
 const navEl=document.getElementById('mainNav');if(navEl)navEl.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&secs[b.dataset.sec]){active=b.dataset.sec;render();}});
 {let cur='';try{cur=sessionStorage.getItem('adm_sec')||'';}catch(e){}if(secs[cur]){active=cur;render();}}
 }
 window.addEventListener('meandyou-admin-ready',()=>setTimeout(init,0));
 client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN')setTimeout(init,0);});
 await init();
})();
