<template>
  <div class="health-orbit" aria-hidden="true">
    <div class="orbit-ring outer"></div><div class="orbit-ring middle"></div><div class="orbit-ring inner"></div>
    <div class="orbit-core"><el-icon><FirstAidKit /></el-icon><span>CARE FOR YOU</span></div>
    <div class="orbit-chip chip-top"><span class="chip-icon"><el-icon><ChatDotRound /></el-icon></span><span><small>AI HEALTH ASSISTANT</small><strong>每个健康疑问，都被认真倾听</strong></span></div>
    <div class="orbit-chip chip-bottom"><span class="chip-icon"><el-icon><Calendar /></el-icon></span><span><small>CONNECTED CARE</small><strong>从健康咨询，到专业诊疗</strong></span></div>
    <span class="orbit-dot dot-one"></span><span class="orbit-dot dot-two"></span>
    <svg class="pulse-line" viewBox="0 0 320 64"><path d="M0 33 H72 L88 21 L105 43 L122 5 L143 60 L160 33 H212 L227 23 L239 33 H320" /></svg>
  </div>
</template>

<style scoped>
.health-orbit { width: 430px; height: 310px; position: relative; max-width: 100%; }
.orbit-ring { position: absolute; border-radius: 50%; border: 1px solid #cde7cf22; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.outer { width: 350px; height: 350px; }
.middle { width: 275px; height: 275px; border-style: dashed; border-color: #cde7cf26; }
.inner { width: 195px; height: 195px; background: #d8edcf09; }
.orbit-core { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-10deg); width: 112px; height: 124px; border-radius: 30px; background: linear-gradient(145deg, #e6f2d4, #a5c5a5); box-shadow: 14px 18px 0 #0e302825, 0 0 60px #dcf3ce18; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #2e5a43; border: 1px solid #ffffffa8; }
.orbit-core .el-icon { font-size: 56px; }
.orbit-core span { font-size: 7px; letter-spacing: 1.6px; font-weight: 700; }
.orbit-chip { position: absolute; display: flex; align-items: center; gap: 10px; padding: 13px 16px; background: #f4f7eefa; color: #294a3e; border: 1px solid #fff9; border-radius: 14px; box-shadow: 0 10px 35px #0c30202b; transform: rotate(-4deg); }
.chip-top { top: 8px; left: 2px; }
.chip-bottom { bottom: 8px; right: 0; transform: rotate(4deg); }
.chip-icon { background: #e4eedc; border-radius: 10px; display: grid; place-items: center; width: 36px; height: 36px; font-size: 19px; }
.orbit-chip small { display: block; font-size: 7px; letter-spacing: 1.4px; color: #8b9b81; margin-bottom: 5px; }
.orbit-chip strong { display: block; font-size: 11px; font-weight: 550; }
.orbit-dot { position: absolute; width: 11px; height: 11px; background: #c9d9a5; border: 3px solid #426550; border-radius: 50%; }
.dot-one { right: 34px; top: 94px; }.dot-two { left: 76px; bottom: 56px; width: 8px; height: 8px; }
.pulse-line { position: absolute; right: -6px; bottom: 88px; width: 170px; opacity: .3; }
.pulse-line path { fill: none; stroke: #cee9b4; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>
