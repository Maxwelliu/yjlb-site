// AI Prompt 模板生成器
// 思路：场景 × 角色 × 输出格式 × 风格 四维度拼接
// 输出 = 主 prompt + 自检 checklist + 反例 + 输入占位

(function () {
  function $(id) { return document.getElementById(id); }

  // ============ 模板库 ============
  var SCENARIOS = {
    wechat: {
      label: '写公众号文章',
      base: '我要写一篇关于「{topic}」的公众号文章，目标读者是{DUMMY_READER}，希望达到{DUMMY_GOAL}。',
      extra: '文章结构建议：开头讲个故事/抛出反常识观点 → 中间分 3-5 个小节展开 → 结尾给可操作建议。',
      placeholder: '例：嵌入式 + 大模型本地化部署',
    },
    code: {
      label: '改 / 写代码',
      base: '我有一段{lang}代码，想实现{goal}。当前代码如下：\n\n\`\`\`{lang}\n{CODE}\n\`\`\`\n\n遇到的问题是{PROBLEM}。',
      extra: '请先解释问题根因（不要直接给答案），再给修复后的完整代码，最后说明这次修改的取舍。',
      placeholder: '例：把串口接收改成 DMA + 环形缓冲区',
    },
    paper: {
      label: '读论文 / 文档',
      base: '我正在读一篇关于「{topic}」的{paper_type}，原始链接/文本：\n\n{TEXT_OR_LINK}\n\n请帮我{PURPOSE}。',
      extra: '输出请包含：①核心论点（一句话） ②关键论据（3 条） ③我应该记住的 1 句话 ④可以质疑的 1 个点。',
      placeholder: '例：RAG 综述 / 大模型推理优化论文',
    },
    select: {
      label: '硬件 / 方案选型',
      base: '我要选{object}，应用场景是{scene}。预算 {BUDGET}，量产规模 {VOLUME}。',
      extra: '请给我 3 个候选方案（性价比 / 主流 / 备胎），每个列：型号、价格区间、关键参数、坑点、推荐理由。最后给一句话建议。',
      placeholder: '例：选一款 ESP32 模组做智能家居网关',
    },
    workflow: {
      label: '写自动化工作流',
      base: '我要搭一个自动化工作流，需求是{GOAL}。输入数据来自{SRC}，处理后输出到{DST}。',
      extra: '请用 n8n / Python / GitHub Actions 任一种实现，给完整代码或节点配置 + 部署步骤。',
      placeholder: '例：每天早上扫 GitHub trending 写入飞书',
    },
  };

  var ROLES = {
    mentor: {
      label: '导师（启发式）',
      suffix: '\n\n回答风格：你是我的导师。先问 1-2 个问题引导我思考，再给方向性建议。不要直接给完整答案。',
    },
    assistant: {
      label: '助理（直接给答案）',
      suffix: '\n\n回答风格：你是我的得力助理。直接给完整可用的答案，不要绕弯子，结尾给 1 条补充提醒。',
    },
    reviewer: {
      label: '评审（挑刺）',
      suffix: '\n\n回答风格：你是严苛的评审。先肯定 1 个优点，然后列 3 条具体改进建议，每条都要有可操作步骤。',
    },
    debater: {
      label: '辩论对手',
      suffix: '\n\n回答风格：你扮演一个持反对意见的专家。先给主流观点，再给 3 个反方理由，最后说在什么情况下反方会赢。',
    },
    translator: {
      label: '翻译官（术语解释）',
      suffix: '\n\n回答风格：你把专业术语翻译成大白话。每个专业词第一次出现时配一句「通俗解释」，最后给 3 个能记住的类比。',
    },
  };

  var FORMATS = {
    md: '用 Markdown 格式输出',
    table: '用表格输出（列：维度 / 候选 1 / 候选 2 / 候选 3）',
    list: '用编号列表输出',
    plain: '用纯文本段落输出（不用 Markdown 语法）',
    chinese: '用中文输出，每段不超过 3 行',
  };

  var STYLES = {
    casual: '接地气，口语化，像跟朋友聊天',
    professional: '专业严谨，引用数据/来源',
    concise: '简洁干练，每句话都有信息量，不超过 {N} 字',
    detailed: '详细展开，每个点给背景+举例+反例',
  };

  // ============ 生成逻辑 ============
  function generate() {
    var sc = $('scenario').value;
    var ro = $('role').value;
    var fm = $('format').value;
    var st = $('style').value;
    var topic = $('topic').value.trim();

    if (!topic) {
      alert('请先填一下「主题/目标」');
      $('topic').focus();
      return;
    }

    var s = SCENARIOS[sc];
    var r = ROLES[ro];

    // 主 prompt
    var main = '【任务】\n' + s.base + '\n\n【风格要求】\n- 输出格式：' + FORMATS[fm] + '\n- 整体风格：' + STYLES[st];

    if (s.extra) main += '\n\n【特别要求】\n' + s.extra;
    if (r.suffix) main += r.suffix;

    // 占位符提示
    var placeholders = [];
    var re = /\{([A-Z_]+)\}/g;
    var m;
    while ((m = re.exec(s.base)) !== null) {
      if (m[1] !== 'topic') placeholders.push(m[1]);
    }
    var placeholderHint = '';
    if (placeholders.length > 0) {
      placeholderHint = '\n\n【需要你补充】\n';
      placeholders.forEach(function (p) {
        placeholderHint += '- {' + p + '}: ' + guessMeaning(p) + '\n';
      });
    }

    // 自检 checklist
    var checklist = '\n\n【回答后自检 checklist】\n' +
      '- [ ] 回答是否覆盖了我提的每个点？\n' +
      '- [ ] 是否有可操作的下一步？（不是「建议你考虑」而是「你做 X」）\n' +
      '- [ ] 长度是否合适？（太短可能是敷衍，太长可能是凑字）\n' +
      '- [ ] 有没有反常识/不同视角？\n' +
      '- [ ] 关键概念有没有解释或举例？';

    // 反例
    var counterExamples = '\n\n【常见错误（避免）】\n' +
      '❌ 上来就背书：「这是一个很好的问题...」\n' +
      '❌ 笼统建议：「建议进一步深入研究」 — 不告诉怎么做\n' +
      '❌ 假设前提不确认：直接基于未确认的事实往下推\n' +
      '❌ 重复用户说的话：把用户的问题原样抄一遍再回答';

    var full = main + placeholderHint + checklist + counterExamples;

    $('output').value = full;
    $('output-section').style.display = 'block';

    // 保存到历史
    saveHistory({
      ts: Date.now(),
      scenario: s.label,
      role: r.label,
      topic: topic.substring(0, 50),
      preview: full.substring(0, 80),
    });

    renderHistory();
  }

  function guessMeaning(p) {
    var map = {
      'DUMMY_READER': '目标读者画像（背景/水平/关心什么）',
      'DUMMY_GOAL': '想达到的具体效果',
      'CODE': '你的代码',
      'lang': '编程语言',
      'goal': '要实现的目标',
      'PROBLEM': '当前遇到的问题/报错',
      'paper_type': '论文/文档类型',
      'TEXT_OR_LINK': '原文链接或粘贴正文',
      'PURPOSE': '具体要做什么（总结/翻译/挑刺）',
      'object': '要选的东西',
      'scene': '应用场景',
      'BUDGET': '预算范围',
      'VOLUME': '量产/采购规模',
      'GOAL': '工作流目标',
      'SRC': '数据来源',
      'DST': '输出位置',
      'N': '字数限制（数字）',
    };
    return map[p] || p;
  }

  // ============ 历史记录（localStorage） ============
  var STORAGE_KEY = 'prompt-gen-history';

  function saveHistory(entry) {
    var list = loadHistory();
    list.unshift(entry);
    if (list.length > 20) list = list.slice(0, 20);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* quota or disabled - 静默 */ }
  }

  function loadHistory() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function clearHistory() {
    if (!confirm('确定清空所有历史记录？')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }

  function renderHistory() {
    var list = loadHistory();
    var html = '';
    if (list.length === 0) {
      html = '<p style="color: var(--text-dim); font-size: 14px;">还没有历史记录。生成 prompt 后会自动保存到这里（仅本地，不上传）。</p>';
    } else {
      list.forEach(function (entry, i) {
        var d = new Date(entry.ts);
        var ds = d.getMonth() + 1 + '/' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        html += '<div class="hist-item" data-idx="' + i + '">' +
                  '<div class="hist-meta">' +
                    '<span class="tag accent">' + entry.scenario + '</span>' +
                    '<span class="tag">' + entry.role + '</span>' +
                    '<span style="color: var(--text-dim); font-size: 12px;">' + ds + '</span>' +
                  '</div>' +
                  '<div class="hist-topic">' + escapeHtml(entry.topic) + '</div>' +
                  '<div class="hist-preview">' + escapeHtml(entry.preview) + '...</div>' +
                '</div>';
      });
      html += '<button onclick="promptGen.clearHistory()" style="margin-top: 14px; background: transparent; color: var(--text-dim); border: 1px solid var(--border); padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">清空历史</button>';
    }
    $('history').innerHTML = html;

    // 绑定点击事件
    var items = $('history').querySelectorAll('.hist-item');
    items.forEach(function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'));
        var list = loadHistory();
        var entry = list[idx];
        if (entry) {
          // 把历史参数回填
          // 注意：这里只回填 topic，scenario/role 因为 value 不同无法精确回填
          // 简化处理：把整个 preview 放回输出框给用户参考
          alert('历史提示：\n' + entry.scenario + ' / ' + entry.role + '\n主题：' + entry.topic + '\n\n（完整 prompt 请重新生成参数）');
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c];
    });
  }

  // ============ 复制 ============
  function copyOutput() {
    var text = $('output').value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
      var btn = $('btn-copy');
      var orig = btn.textContent;
      btn.textContent = '✅ 已复制';
      btn.style.background = '#16a34a';
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.background = '';
      }, 1800);
    }, function () {
      // fallback
      $('output').select();
      document.execCommand('copy');
    });
  }

  // ============ 暴露 ============
  window.promptGen = {
    generate: generate,
    copyOutput: copyOutput,
    clearHistory: clearHistory,
  };

  document.addEventListener('DOMContentLoaded', function () {
    renderHistory();
  });
})();