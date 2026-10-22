import fs from 'node:fs';
const base=new URL('../',import.meta.url);
let js=fs.readFileSync(new URL('prototype.js',base),'utf8');
function replace(a,b){if(!js.includes(a))throw new Error('Missing target '+a.slice(0,80));js=js.replace(a,b)}
replace('function header(){const doctor=isDoctor();return', 'function header(){const doctor=isDoctor();if(doctor)return doctorHeader();return');
replace("${doctor?infoColumn():''}","${doctor?doctorPatientInfo():''}");
replace('<button class="btn ${state.selecting?', '<button class="btn" id="toggle-patient-info" aria-expanded="false" aria-controls="patient-info">${icon(\'user\')}患者信息</button><button class="btn ${state.selecting?');
replace("'<span class=\"tag warm\">2 位患者待回复</span>'", "`<span class=\"tag warm\">2 位患者待回复</span><button class=\"btn\" id=\"history-draft\">${icon('file')}知识整理记录</button>`");
replace("function render(){if(state.page!=='doctor')state.selecting=false;navigation();", "function render(){if(state.page!=='doctor')state.selecting=false;document.body.classList.toggle('doctor-view',isDoctor());navigation();");
replace('bind();const messages=', 'bind();bindDoctorShell();const messages=');
fs.writeFileSync(new URL('prototype.js',base),js);
let html=fs.readFileSync(new URL('index.html',base),'utf8');
html=html.replace('<link rel="stylesheet" href="./prototype.css">','<link rel="stylesheet" href="./prototype.css">\n  <link rel="stylesheet" href="./doctor-shell.css">');
html=html.replace('<script src="./prototype.js"></script>','<script src="./doctor-shell.js"></script>\n  <script src="./prototype.js"></script>');
fs.writeFileSync(new URL('index.html',base),html);
