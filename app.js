const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='cfp_ndoulo_manager_v2';
let db=JSON.parse(localStorage.getItem(KEY)||'{"mails":[],"journal":[],"staff":[],"enrollments":[],"ped":[],"events":[],"meal":{},"report":"","budgets":[],"finance":[]}');
let currentFilter='all';
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const frDate=d=>d?new Date(d+'T12:00:00').toLocaleDateString('fr-FR'):'Non précisée';
const toast=m=>{let t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function show(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));$$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#pageTitle').textContent=({dashboard:'Tableau de bord',courriers:'Courriers & instructions',journal:'Journal de direction',personnel:'Personnel',effectifs:'Effectifs apprenants',pedagogie:'Suivi pédagogique',agenda:'Agenda & rappels',rapports:'Rapports',finances:'Finances'})[view];render();}
$$('.nav').forEach(b=>b.onclick=()=>show(b.dataset.view));$$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
$('#today').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
$('#briefDate').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
function modal(title,html,onSave){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;const d=$('#modal');d.showModal();$('#modalSave').onclick=e=>{e.preventDefault();if(onSave()!==false)d.close();};}
const field=(label,id,placeholder='',type='text',value='')=>`<label class="field">${label}<input id="${id}" type="${type}" placeholder="${placeholder}" value="${esc(value)}"></label>`;
const selectField=(label,id,opts)=>`<label class="field">${label}<select id="${id}">${opts.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label>`;
const area=(label,id,ph='')=>`<label class="field">${label}<textarea id="${id}" placeholder="${ph}" rows="3"></textarea></label>`;
function render(){renderDashboard();renderMails();renderJournal();renderStaff();renderEnrollments();renderPed();renderAgenda();renderFinance();$('#navPending').textContent=db.mails.filter(m=>!['Traité','Archivé'].includes(m.status)).length;}
function renderDashboard(){
 const urgent=db.mails.filter(m=>m.priority==='Urgent'&&!['Traité','Archivé'].includes(m.status));
 const late=db.mails.filter(m=>m.due&&m.due<today()&&!['Traité','Archivé'].includes(m.status));
 const due=db.mails.filter(m=>m.due===today()&&!['Traité','Archivé'].includes(m.status));
 const events=db.events.filter(e=>e.date===today());
 const cards=[['Courriers à traiter',db.mails.filter(m=>!['Traité','Archivé'].includes(m.status)).length,'Dossiers non clôturés'],['Urgences',urgent.length+late.length,'Urgentes ou en retard'],['Personnel enregistré',db.staff.length,'Agents renseignés'],['Effectif apprenants',db.enrollments.reduce((a,e)=>a+Number(e.girls||0)+Number(e.boys||0),0),'Total saisi']];
 $('#stats').innerHTML=cards.map(c=>`<div class="stat"><label>${c[0]}</label><strong>${c[1]}</strong><small>${c[2]}</small></div>`).join('');
 const tasks=[...urgent.map(m=>({title:m.subject,desc:`Courrier urgent · ${m.sender||'Expéditeur non précisé'} · ${m.status}`,icon:'!',red:true})),...late.map(m=>({title:m.subject,desc:`Délai dépassé depuis le ${frDate(m.due)} · ${m.assignee||'Responsable à désigner'}`,icon:'◷',red:true})),...due.map(m=>({title:m.subject,desc:`Échéance aujourd'hui · ${m.assignee||'Responsable à désigner'}`,icon:'◷'}))];
 $('#urgentList').innerHTML=tasks.length?tasks.slice(0,6).map(x=>`<div class="list-item"><div class="list-icon">${x.icon}</div><div class="list-content"><b>${esc(x.title)}</b><p>${esc(x.desc)}</p></div>${x.red?'<span class="tag red">Prioritaire</span>':''}</div>`).join(''):'<div class="empty">Aucune urgence enregistrée. Continuez à surveiller les échéances.</div>';
 $('#todayList').innerHTML=events.length?events.map(e=>`<div class="list-item"><div class="list-icon">◷</div><div class="list-content"><b>${esc(e.title)}</b><p>${esc(e.time||'')} ${esc(e.note||'')}</p></div></div>`).join(''):'<div class="empty">Aucun rendez-vous enregistré pour aujourd’hui.</div>';
 const recent=db.journal.slice().sort((a,b)=>b.created.localeCompare(a.created)).slice(0,4);
 $('#activityList').innerHTML=recent.length?recent.map(j=>`<div class="list-item"><div class="list-icon">✎</div><div class="list-content"><b>${esc(j.type)} · ${esc(j.text)}</b><p>${frDate(j.date)} ${j.person?'· '+esc(j.person):''}</p></div></div>`).join(''):'<div class="empty">Votre journal est encore vide.</div>';
 const meal=db.meal[today()];$('#mealStatus').textContent=meal==='yes'?'Merci de prendre soin de vous. Déjeuner confirmé.':meal==='no'?'Pensez à prendre une pause dès que possible.':'Un rappel bienveillant, sans jugement.';
}
function renderMails(){let list=db.mails.filter(m=>currentFilter==='all'||(currentFilter==='urgent'&&m.priority==='Urgent'&&!['Traité','Archivé'].includes(m.status))||(currentFilter==='pending'&&!['Traité','Archivé'].includes(m.status))||(currentFilter==='done'&&['Traité','Archivé'].includes(m.status)));$('#mailList').innerHTML=list.length?list.slice().sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).map(m=>`<article class="mail-card"><div><h3>${esc(m.subject)}</h3><div class="mail-meta">${esc(m.kind)} · ${esc(m.sender||'Expéditeur non précisé')} · Reçu le ${frDate(m.date)}<br>Responsable : ${esc(m.assignee||'À désigner')} · Échéance : ${frDate(m.due)}<br>${esc(m.analysis||'Analyse à compléter')}</div><p><span class="tag ${m.priority==='Urgent'?'red':m.priority==='Important'?'gold':''}">${esc(m.priority)}</span> <span class="tag">${esc(m.status)}</span> ${m.fileName?`<span class="tag">Pièce : ${esc(m.fileName)}</span>`:''}</p></div><div class="mail-actions"><button class="btn btn-light" onclick="editMail('${m.id}')">Ouvrir / traiter</button><button class="btn btn-outline" onclick="prepareEmail('${m.id}')">Préparer mail</button></div></article>`).join(''):'<div class="panel empty">Aucun courrier dans cette catégorie.</div>';}
$$('.filter').forEach(b=>b.onclick=()=>{$$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;renderMails();});
$('#newMail').onclick=()=>mailModal();
function mailModal(m=null){modal(m?'Modifier le courrier':'Enregistrer un courrier',`<div class="form-grid">${selectField('Type de courrier','mKind',['Entrant','Sortant','Note / instruction'])}${field('Date de réception / émission','mDate','', 'date',m?.date||today())}<label class="field span2">Objet du courrier<input id="mSubject" required value="${esc(m?.subject||'')}"></label>${field('Expéditeur / destinataire','mSender','Service, autorité, partenaire...', 'text',m?.sender||'')}${field('Référence','mRef','Référence du courrier','text',m?.ref||'')}${selectField('Niveau de priorité','mPriority',['Normal','Important','Urgent'])}${selectField('Statut',['mStatus'][0],['Reçu','À analyser','Assigné','En cours','Réponse à valider','Traité','Archivé'])}${field('Responsable proposé','mAssignee','Nom ou fonction','text',m?.assignee||'')}${field('Échéance','mDue','','date',m?.due||'')}<label class="field span2">Document original (PDF, Word ou photo)<input id="mFile" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"></label><label class="field span2">Analyse / résumé du courrier<textarea id="mAnalysis" placeholder="Objet, demande, pièces, actions attendues...">${esc(m?.analysis||'')}</textarea></label><label class="field span2">Instruction du directeur<textarea id="mInstruction" placeholder="Instruction validée par le directeur">${esc(m?.instruction||'')}</textarea></label></div>`,()=>{
 let subject=$('#mSubject').value.trim();if(!subject){toast('Veuillez renseigner l’objet du courrier.');return false;}
 const file=$('#mFile').files[0];const obj={id:m?.id||uid(),kind:$('#mKind').value,date:$('#mDate').value,subject,sender:$('#mSender').value,ref:$('#mRef').value,priority:$('#mPriority').value,status:$('#mStatus').value,assignee:$('#mAssignee').value,due:$('#mDue').value,analysis:$('#mAnalysis').value,instruction:$('#mInstruction').value,fileName:file?.name||m?.fileName||'',updated:new Date().toISOString()};
 if(m){Object.assign(m,obj);if(file)storeFile(m.id,file);}else{db.mails.push(obj);if(file)storeFile(obj.id,file);}
 save();render();toast('Courrier enregistré. Vérifiez les propositions avant toute instruction.');return true;});if(m){$('#mPriority').value=m.priority;$('#mStatus').value=m.status;}}
function storeFile(id,file){const r=new FileReader();r.onload=()=>{let docs=JSON.parse(localStorage.getItem('cfp_docs')||'{}');docs[id]={name:file.name,type:file.type,data:r.result};try{localStorage.setItem('cfp_docs',JSON.stringify(docs));}catch(e){toast('Fichier trop volumineux pour le stockage local. Conservez l’original séparément.');}};r.readAsDataURL(file);}
window.editMail=id=>{let m=db.mails.find(x=>x.id===id);if(m)mailModal(m);};
window.prepareEmail=id=>{let m=db.mails.find(x=>x.id===id);if(!m)return;const subject='Suivi – '+m.subject;const body=`Bonjour ${m.assignee||'Madame, Monsieur'},\n\nDans le cadre du suivi du dossier « ${m.subject} », je vous prie de bien vouloir me transmettre les informations / éléments nécessaires.\n\nÉchéance souhaitée : ${frDate(m.due)}.\n\nJe vous remercie de votre diligence.\n\nLe Directeur\nCFP de Ndoulo`;modal('Courriel à vérifier avant envoi',`<div class="form-grid">${field('Destinataire (adresse à compléter)','emailTo','adresse@exemple.sn')}${field('Objet','emailSubject','', 'text',subject)}<label class="field span2">Message<textarea id="emailBody" rows="9">${esc(body)}</textarea></label></div><p class="tiny">L’application prépare le texte ; elle ne l’envoie pas. Copiez-le dans votre messagerie après vérification.</p>`,()=>{const txt=$('#emailSubject').value+'\n\n'+$('#emailBody').value;navigator.clipboard?.writeText(txt).then(()=>toast('Objet et message copiés. Collez-les dans votre messagerie.')).catch(()=>toast('Sélectionnez et copiez le message.'));return true;});};
$('#journalForm').onsubmit=e=>{e.preventDefault();db.journal.push({id:uid(),date:today(),created:new Date().toISOString(),text:$('#journalText').value.trim(),type:$('#journalType').value,person:$('#journalPerson').value,due:$('#journalDue').value});save();e.target.reset();render();toast('Activité ajoutée au journal.');};
function renderJournal(){const a=db.journal.slice().sort((x,y)=>y.created.localeCompare(x.created));$('#journalList').innerHTML=a.length?a.map(j=>`<div class="list-item"><div class="list-icon">✎</div><div class="list-content"><b>${esc(j.type)} · ${esc(j.text)}</b><p>${frDate(j.date)} ${j.person?'· '+esc(j.person):''} ${j.due?'· Échéance '+frDate(j.due):''}</p></div></div>`).join(''):'<div class="empty">Aucune activité enregistrée.</div>';}
$('#exportJournal').onclick=()=>download('journal_direction.txt',db.journal.map(j=>`${frDate(j.date)} | ${j.type}\n${j.text}\nResponsable : ${j.person||'-'} | Échéance : ${frDate(j.due)}\n`).join('\n'));
$('#addStaff').onclick=()=>modal('Ajouter un agent',`<div class="form-grid">${field('Nom et prénom','sName','Nom complet')}${selectField('Sexe','sSex',['Femme','Homme','Non renseigné'])}${field('Fonction','sRole','Ex. : Formateur, chef des travaux')}${field('Spécialité / filière','sSpec','Ex. : Électricité')}${field('Corps','sBody','Corps / statut')}${field('Grade','sGrade','Grade / classe')}${field('Diplôme / qualification','sQual','Diplôme principal')}${field('Date de prise de service','sDate','','date')}${field('Téléphone professionnel','sPhone','77...','tel')}${field('Matricule','sMat','Matricule administratif')}</div>`,()=>{if(!$('#sName').value.trim())return false;db.staff.push({id:uid(),name:$('#sName').value,sex:$('#sSex').value,role:$('#sRole').value,spec:$('#sSpec').value,body:$('#sBody').value,grade:$('#sGrade').value,qual:$('#sQual').value,date:$('#sDate').value,phone:$('#sPhone').value,mat:$('#sMat').value});save();render();return true;});
function renderStaff(){$('#staffStats').innerHTML=[['Agents enregistrés',db.staff.length],['Formateurs',db.staff.filter(s=>(s.role||'').toLowerCase().includes('formateur')).length],['Femmes',db.staff.filter(s=>s.sex==='Femme').length]].map(x=>`<div class="stat"><label>${x[0]}</label><strong>${x[1]}</strong></div>`).join('');$('#staffTable').innerHTML=db.staff.map(s=>`<tr><td><b>${esc(s.name)}</b><br><span class="badge-status">${esc(s.sex)}</span></td><td>${esc(s.role)}<br><span class="badge-status">${esc(s.spec)}</span></td><td>${esc(s.body)}<br>${esc(s.grade)}</td><td>${esc(s.phone)}<br><span class="badge-status">${esc(s.mat)}</span></td><td><button onclick="delItem('staff','${s.id}')">Supprimer</button></td></tr>`).join('')||'<tr><td colspan="5">Aucun agent saisi. Ajoutez le personnel pour construire votre répertoire.</td></tr>';}
$('#addEnrollment').onclick=()=>modal('Saisir un effectif',`<div class="form-grid">${selectField('Filière','eField',['Habillement','Coiffure','Restauration / Cuisine','Électricité','Agri-élevage','Autre'])}${selectField('Niveau','eLevel',['CAP 1','CAP 2','CAP 3','BEP 1','BEP 2','Attestée','Autre'])}${field('Filles / femmes','eGirls','0','number','0')}${field('Garçons / hommes','eBoys','0','number','0')}</div>`,()=>{db.enrollments.push({id:uid(),field:$('#eField').value,level:$('#eLevel').value,girls:+$('#eGirls').value||0,boys:+$('#eBoys').value||0});save();render();return true;});
function renderEnrollments(){let total=db.enrollments.reduce((a,e)=>a+e.girls+e.boys,0),f=db.enrollments.reduce((a,e)=>a+e.girls,0),h=db.enrollments.reduce((a,e)=>a+e.boys,0);$('#learnerStats').innerHTML=[['Effectif total',total],['Filles / femmes',f],['Garçons / hommes',h]].map(x=>`<div class="stat"><label>${x[0]}</label><strong>${x[1]}</strong></div>`).join('');$('#enrollmentTable').innerHTML=db.enrollments.map(e=>`<tr><td>${esc(e.field)}</td><td>${esc(e.level)}</td><td>${e.girls}</td><td>${e.boys}</td><td><b>${e.girls+e.boys}</b></td><td><button onclick="delItem('enrollments','${e.id}')">Supprimer</button></td></tr>`).join('')||'<tr><td colspan="6">Aucun effectif saisi.</td></tr>';}
$('#addPed').onclick=()=>modal('Ajouter un suivi pédagogique',`<div class="form-grid">${field('Filière','pField','Filière')}${field('Classe / niveau','pLevel','CAP 1...')}${field('Formateur','pTeacher','Nom du formateur')}${selectField('État de progression','pStatus',['À jour','À surveiller','En retard','Non renseigné'])}<label class="field span2">Observations<textarea id="pNote"></textarea></label></div>`,()=>{db.ped.push({id:uid(),field:$('#pField').value,level:$('#pLevel').value,teacher:$('#pTeacher').value,status:$('#pStatus').value,note:$('#pNote').value});save();render();return true;});
function renderPed(){$('#pedList').innerHTML=db.ped.map(p=>`<article class="mail-card"><div><h3>${esc(p.field)} · ${esc(p.level)}</h3><div class="mail-meta">Formateur : ${esc(p.teacher)}<br>${esc(p.note)}</div></div><span class="tag ${p.status==='En retard'?'red':p.status==='À surveiller'?'gold':''}">${esc(p.status)}</span></article>`).join('')||'<div class="panel empty">Aucun suivi pédagogique saisi. Vous pourrez compléter les progressions à partir des documents de chaque filière.</div>';}
$('#addEvent').onclick=()=>modal('Ajouter un rappel',`<div class="form-grid">${field('Intitulé','aTitle','Objet du rappel')}${field('Date','aDate','','date',today())}${field('Heure','aTime','','time')}${selectField('Catégorie','aCat',['Professionnel','Réunion','Échéance','Personnel'])}<label class="field span2">Note<textarea id="aNote"></textarea></label></div>`,()=>{db.events.push({id:uid(),title:$('#aTitle').value,date:$('#aDate').value,time:$('#aTime').value,cat:$('#aCat').value,note:$('#aNote').value});save();render();return true;});
function renderAgenda(){$('#agendaList').innerHTML=db.events.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(e=>`<div class="mail-card"><div><h3>${esc(e.title)}</h3><div class="mail-meta">${frDate(e.date)} · ${esc(e.time)} · ${esc(e.cat)}<br>${esc(e.note)}</div></div><button class="btn btn-light" onclick="delItem('events','${e.id}')">Supprimer</button></div>`).join('')||'<div class="panel empty">Aucun rappel programmé.</div>';}
window.delItem=(key,id)=>{if(confirm('Supprimer cet élément ?')){db[key]=db[key].filter(x=>x.id!==id);save();render();}};
$$('[data-meal]').forEach(b=>b.onclick=()=>{db.meal[today()]='yes';save();renderDashboard();toast('Pause déjeuner confirmée. Prenez soin de vous !');});
$('#refreshBrief').onclick=()=>{renderDashboard();toast('Briefing actualisé.');};
function buildReport(type){let lines=[`CFP DE NDOULO — ${new Date().toLocaleDateString('fr-FR')}`,`RAPPORT : ${type.toUpperCase()}`,`Généré le ${new Date().toLocaleString('fr-FR')}`,''];if(type==='personnel'){lines.push(`Effectif du personnel enregistré : ${db.staff.length}`,...db.staff.map(s=>`- ${s.name} | ${s.role} | ${s.spec} | ${s.body} | ${s.grade} | ${s.qual} | ${s.phone}`));}if(type==='apprenants'){let t=0;db.enrollments.forEach(e=>{let n=e.girls+e.boys;t+=n;lines.push(`- ${e.field} / ${e.level} : ${n} (F : ${e.girls} ; H : ${e.boys})`)});lines.push(`TOTAL : ${t}`);}if(type==='daily'){lines.push('ACTIVITÉS DU JOUR',...db.journal.filter(j=>j.date===today()).map(j=>`- ${j.type} : ${j.text} | Personne : ${j.person||'-'}`),'','DOSSIERS EN COURS',...db.mails.filter(m=>!['Traité','Archivé'].includes(m.status)).map(m=>`- ${m.subject} | ${m.status} | Responsable : ${m.assignee||'-'} | Échéance : ${frDate(m.due)}`));}if(type==='pending'){lines.push(...db.mails.map(m=>`- ${m.subject} | ${m.priority} | ${m.status} | Responsable : ${m.assignee||'-'} | Échéance : ${frDate(m.due)}`));}return lines.join('\n');}
$$('[data-report]').forEach(b=>b.onclick=()=>{db.report=buildReport(b.dataset.report);$('#reportOutput').textContent=db.report;$('#reportCaption').textContent='Rapport généré — vérifiez les informations avant transmission.';$('#downloadReport').disabled=false;});
$('#downloadReport').onclick=()=>download('rapport_cfp_ndoulo.txt',db.report);
function download(name,content,type='text/plain'){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([content],{type}));a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}
$('#backup').onclick=()=>download('sauvegarde_cfp_ndoulo_'+today()+'.json',JSON.stringify(db,null,2),'application/json');
$('#restore').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.mails||!x.staff)throw Error();db=x;save();render();toast('Sauvegarde restaurée.');}catch(_){toast('Fichier de sauvegarde invalide.');}};r.readAsText(f);};


// Module financier — enveloppes alimentées automatiquement par chaque recette
const FINANCE_RUBRICS = [
  ["Matériels didactiques et pédagogiques",40],
  ["Matériels et produits d'entretien",5],
  ["Entretien et maintenance",9],
  ["Restauration (réunion et mission)",5],
  ["Communication",2],
  ["CAI – Insertion et partenariat",5],
  ["Transport",1],
  ["Activités socioéducatives des apprenants",5],
  ["Assurance santé",1],
  ["APE",1],
  ["Écologisation et sécurité",1],
  ["Confection blouse",3],
  ["Genre",1],
  ["Dépenses diverses",2],
  ["Prestation de service",10],
  ["CAP, cellule pédagogique et examen",2],
  ["Crédit téléphonique",2],
  ["Appui social",1],
  ["Cotisation Collectif des établissements et Table de concertation",1],
  ["Frais bancaires",1],
  ["Livebox (Internet)",2],
  ["Fonds résiduel / réserve de répartition",0]
];
function ensureFinanceSetup(){
  db.finance=db.finance||[];
  db.budgets=db.budgets||[];
  db.fiscalYear=db.fiscalYear||String(new Date().getFullYear());
  // Rubriques standard de l'exercice courant, créées une seule fois.
  if(!db.rubricSetupYear || db.rubricSetupYear!==db.fiscalYear){
    db.rubrics=FINANCE_RUBRICS.map(([name,rate])=>({id:uid(),name,rate,year:db.fiscalYear}));
    db.rubricSetupYear=db.fiscalYear;
    save();
  }
  db.rubrics=db.rubrics||FINANCE_RUBRICS.map(([name,rate])=>({id:uid(),name,rate,year:db.fiscalYear}));
}
const money=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA';
function financeBalances(){
  ensureFinanceSetup();
  const balances={};
  db.rubrics.forEach(r=>balances[r.id]=0);
  db.finance.forEach(x=>{
    if(x.type==='Recette' && x.allocations){
      Object.entries(x.allocations).forEach(([id,v])=>balances[id]=(balances[id]||0)+Number(v||0));
    }
    if(x.type==='Dépense' && x.status!=='Rejetée' && x.budgetId){
      balances[x.budgetId]=(balances[x.budgetId]||0)-Number(x.amount||0);
    }
  });
  return balances;
}
function renderFinance(){
  ensureFinanceSetup();
  const f=db.finance, balances=financeBalances();
  const sum=t=>f.filter(x=>x.type===t).reduce((a,x)=>a+Number(x.amount||0),0);
  const rec=sum('Recette'), dep=sum('Dépense'), verse=sum('Versement banque');
  const low=db.rubrics.filter(r=>r.rate>0 && (balances[r.id]||0)<5000);
  $('#financeStats').innerHTML=[
    ['Recettes encaissées',rec],['Versements banque',verse],
    ['Dépenses enregistrées',dep],['Recettes non versées',rec-verse]
  ].map(x=>`<div class="stat"><label>${x[0]}</label><strong style="font-size:19px">${money(x[1])}</strong><small>Selon les opérations saisies</small></div>`).join('');
  $('#budgetTable').innerHTML=db.rubrics.map(r=>{
    const available=balances[r.id]||0;
    const spent=f.filter(x=>x.type==='Dépense'&&x.budgetId===r.id&&x.status!=='Rejetée').reduce((a,x)=>a+Number(x.amount||0),0);
    const allocated=available+spent;
    const warning= r.rate>0 && available<5000 ? ' <span class="tag red">Alerte &lt; 5 000 F</span>' : '';
    return `<tr><td>${esc(r.name)}<br><small>${r.rate}%</small>${warning}</td><td>${money(allocated)}</td><td>${money(spent)}</td><td><b>${money(available)}</b></td></tr>`;
  }).join('');
  const latestBalance=db.finance.filter(x=>x.type==='Solde bancaire relevé').sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
  $('#bankSummary').innerHTML=
    `<div class="list-item"><div class="list-icon">↓</div><div class="list-content"><b>Recettes encaissées</b><p>${money(rec)}</p></div></div>
     <div class="list-item"><div class="list-icon">↗</div><div class="list-content"><b>Versements enregistrés</b><p>${money(verse)}</p></div></div>
     <div class="list-item"><div class="list-icon">₣</div><div class="list-content"><b>Solde théorique de caisse</b><p>${money(rec-verse)} · à rapprocher des pièces</p></div></div>
     <div class="list-item"><div class="list-icon">▣</div><div class="list-content"><b>Dernier solde bancaire relevé</b><p>${latestBalance?money(latestBalance.amount)+' · '+frDate(latestBalance.date):'Non renseigné'}</p></div></div>
     <div class="list-item"><div class="list-icon">!</div><div class="list-content"><b>Rubriques sous le seuil</b><p>${low.length?low.map(r=>esc(r.name)+' : '+money(balances[r.id]||0)).join('<br>'):'Aucune'}</p></div></div>`;
  $('#financeTable').innerHTML=f.filter(x=>x.type!=='Affectation automatique').slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(x=>`<tr><td>${frDate(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.budgetName||x.reason||'—')}</td><td>${money(x.amount)}</td><td><span class="tag ${['À autoriser','Justification immédiate'].includes(x.status)?'gold':''}">${esc(x.status||'Enregistrée')}</span></td><td><button onclick="reviewFinance('${x.id}')">Détail</button></td></tr>`).join('')||'<tr><td colspan="6">Aucune opération enregistrée.</td></tr>';
  const alerts=f.filter(x=>['À autoriser','Justification immédiate'].includes(x.status));
  const lowAlerts=low.map(r=>({reason:r.name,amount:balances[r.id]||0,status:'Alerte : solde inférieur à 5 000 FCFA',budgetName:'Crédit disponible',date:today(),low:true}));
  $('#financeAlerts').innerHTML=[...alerts.map(x=>`<div class="list-item"><div class="list-icon">!</div><div class="list-content"><b>${esc(x.reason||x.type)} · ${money(x.amount)}</b><p>${esc(x.status)} · ${esc(x.budgetName||'Hors rubrique')} · ${frDate(x.date)}</p></div><button class="text-btn" onclick="reviewFinance('${x.id}')">Examiner</button></div>`),...lowAlerts.map(x=>`<div class="list-item"><div class="list-icon">!</div><div class="list-content"><b>${esc(x.reason)}</b><p>${esc(x.status)} · Disponible : ${money(x.amount)}</p></div></div>`)].join('')||'<div class="empty">Aucune opération en attente.</div>';
}
$('#addBudget').textContent='Voir les rubriques';
$('#addBudget').onclick=()=>modal('Rubriques de l’exercice '+db.fiscalYear,
  `<div class="notice">Les taux de répartition sont définis pour l’exercice. Les recettes les alimentent automatiquement. « Élaboration PSD (suite) » est une ressource spécifique, hors répartition ordinaire.</div>
   <div class="table-wrap"><table><thead><tr><th>Rubrique</th><th>Taux</th></tr></thead><tbody>${(db.rubrics||[]).map(r=>`<tr><td>${esc(r.name)}</td><td>${r.rate}%</td></tr>`).join('')}</tbody></table></div>
   ${field('Année de l’exercice','fiscalYear','2026','number',db.fiscalYear)}`,
  ()=>{const y=$('#fiscalYear').value.trim();if(!/^\d{4}$/.test(y))return false;if(y!==db.fiscalYear){db.fiscalYear=y;db.rubricSetupYear='';ensureFinanceSetup();}save();render();return true;});
$('#addFinance').onclick=()=>{
  ensureFinanceSetup();
  modal('Enregistrer une opération',
  `<div class="form-grid">
    ${selectField('Type d’opération','fType',['Recette','Versement banque','Dépense','Solde bancaire relevé','Alimentation spécifique PSD'])}
    ${field('Date','fDate','','date',today())}
    ${field('Montant (FCFA)','fAmount','0','number','0')}
    ${selectField('Mode','fMode',['Espèces','Banque','Chèque','Mobile money'])}
    <label class="field span2">Rubrique (pour une dépense)<select id="fBudget"><option value="">Choisir une rubrique</option>${db.rubrics.filter(r=>r.rate>0).map(r=>`<option value="${r.id}">${esc(r.name)} — disponible : ${money(financeBalances()[r.id]||0)}</option>`).join('')}<option value="PSD">Élaboration PSD (suite) – ressource spécifique</option></select></label>
    ${field('Motif / origine','fReason','Objet de l’opération')}
    ${field('Référence reçu / bordereau','fRef','Numéro de pièce')}
    <label class="field span2">Justificatif (photo ou PDF)<input id="fProof" type="file" accept=".pdf,.jpg,.jpeg,.png"></label>
    <label class="field span2">Observation<textarea id="fNote"></textarea></label>
    <label class="field span2"><input id="fUrgent" type="checkbox" style="width:auto"> Urgence hors budget : justification immédiate au Directeur</label>
  </div>`,
  ()=>{
    const type=$('#fType').value, amount=Number($('#fAmount').value), budgetId=$('#fBudget').value;
    if(!(amount>0)){toast('Saisissez un montant supérieur à zéro.');return false;}
    const budget=db.rubrics.find(r=>r.id===budgetId), urgent=$('#fUrgent').checked;
    let status='Enregistrée', allocations=null;
    if(type==='Recette'){
      allocations={}; let allocated=0;
      db.rubrics.filter(r=>r.rate>0).forEach(r=>{
        const part=Math.floor(amount*r.rate/100);
        allocations[r.id]=part; allocated+=part;
      });
      const reserve=db.rubrics.find(r=>r.name==='Fonds résiduel / réserve de répartition');
      if(reserve) allocations[reserve.id]=amount-allocated;
    }
    if(type==='Dépense'){
      if(!budgetId&&!urgent){toast('Choisissez une rubrique ou indiquez une urgence hors budget.');return false;}
      if(budgetId==='PSD'){status='À justifier – ressource PSD';}
      else if(budget){
        const available=financeBalances()[budget.id]||0;
        if(amount>available){toast('Crédit insuffisant dans cette rubrique. Disponible : '+money(available));return false;}
        if(amount>15000)status='À autoriser';
        else if(urgent)status='Justification immédiate';
      } else if(urgent)status='Justification immédiate';
    }
    if(type==='Alimentation spécifique PSD')status='Ressource spécifique PSD';
    if(type==='Solde bancaire relevé')status='Solde relevé – à rapprocher';
    const file=$('#fProof').files[0];
    const x={id:uid(),type,date:$('#fDate').value,amount,mode:$('#fMode').value,budgetId:budget?.id||'',budgetName:budget?.name||(budgetId==='PSD'?'Élaboration PSD (suite)':''),reason:$('#fReason').value,ref:$('#fRef').value,note:$('#fNote').value,status,proofName:file?.name||'',allocations};
    db.finance.push(x);if(file)storeFile(x.id,file);save();render();
    toast(type==='Recette'?'Recette enregistrée et répartie automatiquement.':'Opération enregistrée.');return true;
  });
};
window.reviewFinance=id=>{
  let x=db.finance.find(a=>a.id===id);if(!x)return;
  modal('Détail de l’opération',
  `<div class="notice"><b>${esc(x.type)} : ${money(x.amount)}</b><br>${frDate(x.date)} · ${esc(x.budgetName||'Sans rubrique')}<br>${esc(x.reason)}<br>Statut : ${esc(x.status)}<br>Justificatif : ${esc(x.proofName||'Non joint')}<br>${esc(x.note||'')}</div>
   ${selectField('Décision / suivi','fDecision',['À autoriser','Autorisée','Justification reçue','Rejetée','Enregistrée'])}
   <label class="field">Commentaire du Directeur<textarea id="fDirectorNote">${esc(x.directorNote||'')}</textarea></label>`,
  ()=>{x.status=$('#fDecision').value;x.directorNote=$('#fDirectorNote').value;save();render();return true;});
  $('#fDecision').value=x.status;
};
$('#exportFinance').onclick=()=>{
  const rows=['Date;Type;Montant FCFA;Rubrique;Motif;Mode;Statut;Référence',
    ...db.finance.map(x=>[x.date,x.type,x.amount,x.budgetName,x.reason,x.mode,x.status,x.ref].map(v=>String(v||'').replaceAll(';',',')).join(';'))];
  download('suivi_financier_cfp_ndoulo.csv','\ufeff'+rows.join('\n'),'text/csv;charset=utf-8');
};

if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
render();
