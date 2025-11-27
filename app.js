let state={subjects:[]}; 
const KEY='notenapp_pro';
const grid=document.getElementById('grid');
const chartCtx=document.getElementById('chart').getContext('2d');
let chart=null;

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function load(){try{const s=localStorage.getItem(KEY);if(s)state=JSON.parse(s);}catch(e){console.warn(e);}}

function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function render(){
  // Filter/Sort
  let filtered=state.subjects.slice();
  const filter=document.getElementById('filterSelect')?.value;
  const sort=document.getElementById('sortSelect')?.value;

  if(filter==='good') filtered=filtered.filter(s=>s.grades.length && s.grades.reduce((a,b)=>a+b,0)/s.grades.length>=3);
  if(filter==='bad') filtered=filtered.filter(s=>s.grades.length && s.grades.reduce((a,b)=>a+b,0)/s.grades.length<3);
  
  if(sort==='alpha') filtered.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='avg') filtered.sort((a,b)=>((b.grades.reduce((x,y)=>x+y,0)/Math.max(b.grades.length,1))-(a.grades.reduce((x,y)=>x+y,0)/Math.max(a.grades.length,1))));
  if(sort==='count') filtered.sort((a,b)=>b.grades.length - a.grades.length);

  grid.innerHTML='';
  document.getElementById('subjectCount').innerText=state.subjects.length;
  const allGrades=state.subjects.flatMap(s=>s.grades);
  document.getElementById('gradesCount').innerText=allGrades.length;
  document.getElementById('globalAvg').innerText=allGrades.length?(allGrades.reduce((a,b)=>a+b,0)/allGrades.length).toFixed(2):'–';

  filtered.forEach((s,i)=>{
    const avg=s.grades.length?(s.grades.reduce((a,b)=>a+b,0)/s.grades.length).toFixed(2):'–';
    const card=document.createElement('div'); card.className='subject';
    
    // Badge
    let badgeHtml='';
    if(s.grades.length && s.grades.reduce((a,b)=>a+b,0)/s.grades.length<=2) badgeHtml='<div class="badge">Top!</div>';

    card.innerHTML=`
      ${badgeHtml}
      <div class="subject-head">
        <div class="name-row">
          <div style="width:36px;height:36px;border-radius:8px;background:${s.color};display:grid;place-items:center;">⬤</div>
          <div><div class="subject-name">${escapeHtml(s.name)}</div><div class="subject-avg">Durchschnitt: <strong>${avg}</strong></div></div>
        </div>
        <div>
          <button class="btn ghost" onclick="deleteSubject(${state.subjects.indexOf(s)})">Fach löschen</button>
        </div>
      </div>
      <div class="grades">
        ${s.grades.map((g,gi)=>`<div class="grade-row"><input type="number" min="1" max="6" value="${g}" oninput="updateGrade(${state.subjects.indexOf(s)},${gi},this.value)"><div class="grade-actions"><button onclick="deleteGrade(${state.subjects.indexOf(s)},${gi})">✕</button></div></div>`).join('')}
      </div>
      <div class="quick-add">
        <input type="number" min="1" max="6" placeholder="Neue Note">
        <button onclick="quickAdd(${state.subjects.indexOf(s)}, this)">+</button>
      </div>
    `;
    grid.appendChild(card);
  });
  updateChart();
}

// Quick Add direkt
function quickAdd(si, btn){
  const input=btn.previousElementSibling;
  const val=parseFloat(input.value);
  if(!isFinite(val)||val<1||val>6)return alert('Note muss 1–6 sein');
  state.subjects[si].grades.push(val);
  input.value='';
  save();render();
}

// CRUD
function addSubject(){
  const name=document.getElementById('subjectName').value.trim();
  const color=document.getElementById('subjectColor').value;
  if(!name)return;
  state.subjects.push({name,color,grades:[]});
  document.getElementById('subjectName').value='';
  save();render();
}
function deleteSubject(i){if(confirm('Fach löschen?')){state.subjects.splice(i,1);save();render();}}
function updateGrade(si,gi,v){const val=parseFloat(v);if(!isFinite(val))return;state.subjects[si].grades[gi]=val;save();render();}
function deleteGrade(si,gi){state.subjects[si].grades.splice(gi,1);save();render();}

// Events
document.getElementById('addSubjectBtn').addEventListener('click',addSubject);
document.getElementById('resetBtn').addEventListener('click',()=>{if(confirm('Alles löschen?')){state={subjects:[]};save();render();}});
document.getElementById('sortSelect')?.addEventListener('change',render);
document.getElementById('filterSelect')?.addEventListener('change',render);

// Chart
const chartEl=document.getElementById('chart').getContext('2d');
let chartObj=null;
function updateChart(){
  if(chartObj) chartObj.destroy();
  chartObj=new Chart(chartEl,{type:'bar',data:{
    labels:state.subjects.map(s=>s.name),
    datasets:[{label:'Durchschnitt',data:state.subjects.map(s=>s.grades.length?s.grades.reduce((a,b)=>a+b,0)/s.grades.length:0),backgroundColor:state.subjects.map(s=>s.color)}]
  },options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,min:0,max:6}}}});
}

// PDF Export
document.getElementById('pdfBtn').addEventListener('click',async()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const content = document.querySelector('.wrap');
  await html2canvas(content).then(canvas=>{
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData,'PNG',10,10,190,0);
    doc.save('notenapp.pdf');
  });
});

load();render();