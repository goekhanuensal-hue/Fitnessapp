(function(global){
'use strict';
try{sessionStorage.removeItem('fitness-health-pending-v1')}catch{}
if(new URLSearchParams(location.hash.replace(/^#/, '')).get('health')==='1')history.replaceState(null,'',location.pathname+location.search);
const prefix='fitness-steps-v1-';
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function read(){try{const r=JSON.parse(localStorage.getItem(prefix+today()));return r&&Number.isSafeInteger(r.steps)&&r.steps>=0?r:null}catch{return null}}
function percentage(steps){return Math.min(100,Math.max(0,steps/100))}
function color(percent){return percent<=25?'#ef5350':percent<=50?'#ff9f43':percent<=75?'#a3df75':'#27c976'}
function complete(){const r=read();return !!r&&r.steps>=8000}
function manualCardio(plan){return localStorage.getItem(prefix+'cardio-'+today()+'-'+plan)==='true'}
function setManualCardio(plan,value){localStorage.setItem(prefix+'cardio-'+today()+'-'+plan,String(value))}
function save(steps){if(!Number.isSafeInteger(steps)||steps<0||steps>200000)throw new Error('Bitte eine ganze Schrittzahl zwischen 0 und 200.000 eingeben.');localStorage.setItem(prefix+today(),JSON.stringify({steps,updatedAt:new Date().toISOString(),source:'manual'}))}
function panel(onChange){
const r=read(),steps=r?r.steps:0,pct=percentage(steps),section=document.createElement('section');
section.className='steps-panel';section.setAttribute('aria-label','Schritte und Cardio heute');
section.innerHTML=`<div class="steps-heading"><span>Schritte heute</span><span>${r?steps.toLocaleString('de-DE'):'—'} / 10.000</span></div><div class="steps-track" role="progressbar" aria-label="Heutiges Schritteziel" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-valuetext="${r?steps.toLocaleString('de-DE')+' Schritte, '+Math.floor(pct)+' Prozent':'Noch keine Schrittzahl eingetragen'}"><div class="steps-fill" style="width:${pct}%;background:${color(pct)}"></div><span class="steps-marker" aria-hidden="true"></span></div><p>${Math.floor(pct)} % des Tagesziels · Cardio-Haken ab 80 % (8.000 Schritten).</p><p class="steps-status ${complete()?'complete':''}" role="status">${complete()?'✓ Cardio durch Alltagsschritte erledigt – nach deiner Schritte-Regel.':r?'Noch '+(8000-steps).toLocaleString('de-DE')+(8000-steps===1?' Schritt':' Schritte')+' bis zum automatischen Cardio-Haken.':'Trage deine heutige Schrittzahl ein, um den Fortschritt zu sehen.'}</p><label for="todaySteps">Heutige Schritte eintragen</label><form class="steps-form"><input id="todaySteps" name="steps" type="number" inputmode="numeric" min="0" max="200000" step="1" required placeholder="z. B. 6500" aria-describedby="stepsHelp" value="${r?steps:''}"><button class="info" type="submit">Speichern</button></form><p id="stepsHelp">Trage hier deine heutige Schrittzahl ein. Sie gilt für alle Pläne und bleibt in diesem Browser gespeichert.</p><p class="steps-updated">${r?'Zuletzt aktualisiert: '+new Date(r.updatedAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+' Uhr.':'Jeder neue Tag startet ohne Schrittzahl.'}</p>`;
section.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const input=section.querySelector('input');if(!input.reportValidity())return;try{save(Number(input.value));onChange();const status=document.querySelector('.steps-status');status.tabIndex=-1;status.focus({preventScroll:true})}catch(error){input.setCustomValidity(error.message);input.reportValidity()}});
section.querySelector('input').addEventListener('input',e=>e.target.setCustomValidity(''));
return section;
}
global.FitnessSteps={today,read,percentage,color,complete,manualCardio,setManualCardio,save,panel};
})(typeof window==='undefined'?globalThis:window);
