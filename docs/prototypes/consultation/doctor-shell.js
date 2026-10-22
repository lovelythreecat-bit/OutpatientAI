/* Prototype-only rendering of the existing AdminLayout.vue doctor shell. */
function doctorHeader() {
  const section = state.page === 'review' ? '确认知识内容' : state.page === 'success' ? '知识整理记录' : '患者咨询';
  const menus = [['home', '工作台'], ['chat', '患者咨询'], ['calendar', '我的预约'], ['user', '患者档案']];
  return `<aside class="doctor-sidebar" id="doctor-sidebar" aria-label="医生工作台导航">
    <div class="doctor-logo"><span class="brand-symbol">${icon('medical')}</span><span class="doctor-logo-text">智慧医疗<small>医生工作台</small></span></div>
    <div class="doctor-menu-caption">WORKSPACE / 工作空间</div>
    <nav class="doctor-nav">${menus.map(([i, label]) => label === '患者咨询' ? `<a href="#doctor" class="active" aria-current="page" title="患者咨询">${icon(i)}<span>${label}</span></a>` : `<button data-shell-demo="${label}" title="${label}">${icon(i)}<span>${label}</span></button>`).join('')}</nav>
    <div class="doctor-sidebar-note">${icon('medical')}<strong>让医疗更有温度</strong><span>连接专业，关怀每一刻。</span></div>
  </aside>
  <button class="doctor-menu-scrim" id="doctor-menu-scrim" aria-label="关闭全部功能" hidden></button>
  <header class="doctor-topbar">
    <div class="doctor-header-left"><button class="doctor-collapse icon-btn" id="doctor-collapse" aria-label="收起侧边栏" aria-controls="doctor-sidebar" aria-expanded="true">${icon('list')}</button><span class="doctor-workspace-label">医生工作台</span><nav class="doctor-breadcrumb" aria-label="当前位置"><a href="#doctor">患者咨询</a>${section !== '患者咨询' ? `<span>/</span><span>${section}</span>` : ''}</nav></div>
    <div class="account"><span class="avatar small">张</span><span>张明医生</span><span class="desktop-only">${icon('chevron')}</span></div>
  </header>
  <nav class="doctor-mobile-nav" aria-label="常用功能"><button data-shell-demo="工作台">${icon('home')}<span>工作台</span></button><a href="#doctor" class="active">${icon('chat')}<span>患者咨询</span></a><button data-shell-demo="我的预约">${icon('calendar')}<span>我的预约</span></button><button data-shell-demo="个人中心">${icon('user')}<span>我的</span></button><button id="doctor-mobile-menu" aria-label="打开全部功能" aria-controls="doctor-sidebar" aria-expanded="false">${icon('list')}<span>全部</span></button></nav>`;
}

function doctorPatientInfo() {
  const name = ['林晓', '陈悦', '周先生'][state.patient];
  return `<aside class="patient-info-drawer" id="patient-info" aria-labelledby="patient-info-title" hidden>
    <div class="patient-info-heading"><h2 id="patient-info-title">患者信息</h2><button class="icon-btn" id="close-patient-info" aria-label="收起患者信息">${icon('close')}</button></div>
    <div class="patient-profile"><span class="avatar patient">${name[0]}</span><div><strong>${name}</strong><p>${['女 · 28 岁', '女 · 36 岁', '男 · 52 岁'][state.patient]}</p></div></div>
    <dl><dt>首次咨询</dt><dd>2026 年 10 月 18 日</dd><dt>本次主诉</dt><dd>${['熬夜后头痛', '胃部不适', '日常健康咨询'][state.patient]}</dd><dt>最近联系</dt><dd>今天 · 10:38</dd></dl>
    <p class="patient-info-note">信息来自本次咨询，供沟通参考。</p>
    <div class="patient-info-tip">${icon('shield')}患者信息仅供本次诊疗沟通使用。</div>
  </aside>`;
}

function bindDoctorShell() {
  document.body.classList.toggle('doctor-view', isDoctor());
  document.body.classList.toggle('doctor-nav-collapsed', isDoctor() && !!state.navCollapsed);
  document.body.classList.remove('doctor-menu-open');
  if (!isDoctor()) return;
  const collapse = document.querySelector('#doctor-collapse');
  const scrim = document.querySelector('#doctor-menu-scrim');
  const mobileMenu = document.querySelector('#doctor-mobile-menu');
  function setMenu(open) {
    document.body.classList.toggle('doctor-menu-open', open);
    scrim.hidden = !open;
    mobileMenu.setAttribute('aria-expanded', String(open));
    collapse.setAttribute('aria-expanded', String(open));
    if (open) document.querySelector('.doctor-nav .active').focus();
    else collapse.focus();
  }
  function updateCollapseLabel() {
    const mobile = matchMedia('(max-width: 767px)').matches;
    collapse.setAttribute('aria-label', mobile ? '打开全部功能' : state.navCollapsed ? '展开侧边栏' : '收起侧边栏');
    collapse.setAttribute('aria-expanded', String(mobile ? false : !state.navCollapsed));
  }
  updateCollapseLabel();
  window.onresize = updateCollapseLabel;
  collapse.onclick = () => {
    if (matchMedia('(max-width: 767px)').matches) setMenu(!document.body.classList.contains('doctor-menu-open'));
    else { state.navCollapsed = !state.navCollapsed; document.body.classList.toggle('doctor-nav-collapsed', state.navCollapsed); updateCollapseLabel(); }
  };
  mobileMenu.onclick = () => setMenu(true);
  scrim.onclick = () => setMenu(false);
  document.querySelectorAll('[data-shell-demo]').forEach(button => button.onclick = () => toast(`${button.dataset.shellDemo}沿用现有页面，本原型仅演示咨询流程`));
  const trigger = document.querySelector('#toggle-patient-info');
  const drawer = document.querySelector('#patient-info');
  function closePatient() { if (drawer) { drawer.hidden = true; trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); } }
  if (trigger) trigger.onclick = () => { drawer.hidden = !drawer.hidden; trigger.setAttribute('aria-expanded', String(!drawer.hidden)); if (!drawer.hidden) document.querySelector('#close-patient-info').focus(); };
  const close = document.querySelector('#close-patient-info');
  if (close) close.onclick = closePatient;
  document.onkeydown = event => {
    if (event.key === 'Escape') { if (document.body.classList.contains('doctor-menu-open')) setMenu(false); else if (drawer && !drawer.hidden) closePatient(); }
    if (event.key === 'Tab' && document.body.classList.contains('doctor-menu-open')) {
      const controls = [...document.querySelectorAll('.doctor-nav a,.doctor-nav button')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
}
