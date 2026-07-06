// 硬件功耗 / 散热速算器
// 公式参考：
//   - P(瓦) = V(伏) × I(安)
//   - Q(焦耳/秒) = P(瓦)  →  ΔT(℃) 经验估：被动散热每瓦 ~ 5-10℃ 温升，主动散热（风扇）每瓦 ~ 2-4℃
//   - 选型建议：消费级芯片结温上限 85-105℃，工业级 125℃

(function () {
  function $(id) { return document.getElementById(id); }
  function fmt(n, d) { d = d || 2; return Number(n).toFixed(d); }

  function compute() {
    var mode = $('mode').value;

    // 模式 1: 电压电流
    var v = parseFloat($('voltage').value);
    var i = parseFloat($('current').value);
    // 模式 2: 直填功率
    var p = parseFloat($('power').value);

    var powerW = 0;
    if (mode === 'vi') {
      if (isNaN(v) || isNaN(i)) {
        return showError('请输入电压和电流');
      }
      if (v <= 0 || i <= 0) {
        return showError('电压和电流必须 > 0');
      }
      powerW = v * i;
    } else {
      if (isNaN(p)) return showError('请输入功率');
      if (p <= 0) return showError('功率必须 > 0');
      powerW = p;
    }

    // 散热场景选择
    var scenario = $('scenario').value;
    var scenarios = {
      passive:  { label: '被动散热（无风扇）', deltaPerW: 7.5, fan: false, recommended: '铝挤散热片 ≥ 100 cm²/W' },
      fan:      { label: '主动散热（风扇）',   deltaPerW: 3.0, fan: true,  recommended: '40mm 风扇 + 散热片' },
      heatsink: { label: '大散热片（≥ 200cm²）', deltaPerW: 4.0, fan: false, recommended: '铝型材散热片' },
      liquid:   { label: '液冷 / 水冷',        deltaPerW: 0.8, fan: false, recommended: '120mm 冷排 + 水泵' },
    };
    var s = scenarios[scenario];

    var ambientT = parseFloat($('ambient').value) || 25;
    var deltaT = powerW * s.deltaPerW;
    var junctionT = ambientT + deltaT;

    var status = '✅ 正常';
    var statusColor = 'var(--success)';
    if (junctionT > 105) { status = '🔴 危险 - 需更强散热'; statusColor = '#f87171'; }
    else if (junctionT > 85) { status = '⚠️ 偏高 - 接近消费级上限'; statusColor = '#fbbf24'; }
    else if (junctionT > 70) { status = '✅ 良好'; statusColor = 'var(--success)'; }
    else { status = '✅ 优秀'; statusColor = 'var(--success)'; }

    // 估算年电费（按 24h × 365 × 0.7 元/度）
    var annualKWh = powerW * 24 * 365 / 1000;
    var annualCost = annualKWh * 0.7;

    var html = ''
      + '<div class="result-grid">'
      +   '<div><div class="label">功耗</div><div class="big">' + fmt(powerW) + ' W</div></div>'
      +   '<div><div class="label">温升估算</div><div class="big">+' + fmt(deltaT, 1) + ' ℃</div></div>'
      +   '<div><div class="label">结温估算</div><div class="big">' + fmt(junctionT, 1) + ' ℃</div></div>'
      + '</div>'
      + '<div style="margin-top: 14px; padding: 12px; background: var(--bg); border-radius: 4px;">'
      +   '<span style="color: ' + statusColor + '; font-weight: 700;">' + status + '</span>'
      +   ' · 散热场景：' + s.label + ' · 建议：' + s.recommended
      + '</div>'
      + '<div style="margin-top: 10px; font-size: 13px; color: var(--text-dim);">'
      +   '💡 年耗电约 ' + fmt(annualKWh, 0) + ' 度 · 年电费约 ¥' + fmt(annualCost, 0)
      +   '（按 0.7 元/度估算）'
      + '</div>';

    $('result').innerHTML = html;
    $('result').style.display = 'block';
    $('error').style.display = 'none';
  }

  function showError(msg) {
    $('error').textContent = '⚠️ ' + msg;
    $('error').style.display = 'block';
    $('result').style.display = 'none';
  }

  // 模式切换显隐
  function toggleMode() {
    var mode = $('mode').value;
    $('vi-fields').style.display = mode === 'vi' ? 'block' : 'none';
    $('p-fields').style.display = mode === 'p' ? 'block' : 'none';
  }

  // 暴露
  window.powerCalc = {
    compute: compute,
    toggleMode: toggleMode,
  };

  // 默认绑定
  document.addEventListener('DOMContentLoaded', function () {
    toggleMode();
  });
})();