/* Shared UI components. Every lab is assembled from these so the product
   keeps one slider, one value display, one button and one photo container. */
(function (global) {
  'use strict';

  function h(tag, props, children) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (key) {
      var value = props[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key === 'style') node.setAttribute('style', value);
      else if (key.indexOf('on') === 0 && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else node.setAttribute(key, value === true ? '' : value);
    });
    append(node, children);
    return node;
  }

  function append(parent, children) {
    if (children === null || children === undefined) return;
    if (Array.isArray(children)) {
      children.forEach(function (child) { append(parent, child); });
      return;
    }
    parent.appendChild(children.nodeType ? children : document.createTextNode(String(children)));
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  var uid = 0;
  function nextId(prefix) { uid += 1; return (prefix || 'ui') + '-' + uid; }

  /* ---------- Section header ---------- */
  function header(title, kicker) {
    return h('div', { class: 'pt-10 pb-6 sm:pt-14' }, [
      kicker ? h('p', { class: 'hint mb-3', text: kicker }) : null,
      h('h1', {
        class: 'text-3xl font-semibold tracking-tight sm:text-4xl',
        text: title
      })
    ]);
  }

  /* ---------- Large value read-out ---------- */
  function valueDisplay(initial, sublabel) {
    var value = h('div', { class: 'value-big', text: initial || '' });
    // Long read-outs such as "ISO 12800" step down a size so they never
    // outgrow the control panel.
    function fit(text) { value.classList.toggle('value-sm', (text || '').length > 6); }
    fit(initial);
    var sub = h('div', { class: 'hint mt-2', text: sublabel || '' });
    var wrap = h('div', { class: 'text-center', 'aria-live': 'polite' }, [value, sub]);
    var pulseTimer;
    return {
      el: wrap,
      set: function (text, subText) {
        if (value.textContent === text && subText === undefined) return;
        value.textContent = text;
        fit(text);
        if (subText !== undefined) sub.textContent = subText;
        value.classList.remove('value-pulse');
        void value.offsetWidth; // restart the animation
        value.classList.add('value-pulse');
        clearTimeout(pulseTimer);
        pulseTimer = setTimeout(function () { value.classList.remove('value-pulse'); }, 400);
      }
    };
  }

  /* ---------- Slider ---------- */
  /* opts: { label, min, max, step, value, leftLabel, rightLabel, format, onInput } */
  function slider(opts) {
    var id = nextId('slider');
    var input = h('input', {
      type: 'range',
      class: 'slider',
      id: id,
      min: opts.min,
      max: opts.max,
      step: opts.step === undefined ? 1 : opts.step,
      value: opts.value,
      'aria-label': opts.label,
      'aria-valuetext': opts.format ? opts.format(opts.value) : String(opts.value)
    });

    var row = h('div', { class: 'slider-row w-full' }, [
      h('div', { class: 'flex items-end justify-between gap-3' }, [
        h('label', { class: 'scale-label', for: id, text: opts.leftLabel || '' }),
        opts.label && opts.showLabel !== false
          ? h('span', { class: 'hint text-zinc-500', text: opts.label })
          : null,
        h('span', { class: 'scale-label', 'aria-hidden': 'true', text: opts.rightLabel || '' })
      ]),
      input
    ]);

    function paint() {
      var min = Number(input.min), max = Number(input.max);
      var pct = max === min ? 0 : ((Number(input.value) - min) / (max - min)) * 100;
      row.style.setProperty('--pct', pct.toFixed(2) + '%');
      if (opts.format) input.setAttribute('aria-valuetext', opts.format(Number(input.value)));
    }

    input.addEventListener('input', function () {
      paint();
      if (opts.onInput) opts.onInput(Number(input.value));
    });
    paint();

    return {
      el: row,
      input: input,
      get value() { return Number(input.value); },
      set: function (value, silent) {
        input.value = value;
        paint();
        if (!silent && opts.onInput) opts.onInput(Number(input.value));
      }
    };
  }

  /* ---------- Contextual indicator: "More Blur ← → More Focus" ---------- */
  function indicator(left, right) {
    return h('div', { class: 'flex items-center justify-between gap-4 text-zinc-500' }, [
      h('span', { class: 'hint', text: left }),
      h('span', { class: 'h-px flex-1 bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700' }),
      h('span', { class: 'hint', text: right })
    ]);
  }

  /* ---------- Reset ---------- */
  function resetButton(onReset, label) {
    return h('button', {
      type: 'button',
      class: 'btn',
      onClick: onReset
    }, label || 'Reset');
  }

  /* ---------- Toggle chips (presets, options) ---------- */
  /* options: [{ value, label }] */
  function chipGroup(options, onSelect, groupLabel) {
    var buttons = [];
    var group = h('div', {
      class: 'flex flex-wrap items-center justify-center gap-2',
      role: 'group',
      'aria-label': groupLabel || 'Presets'
    }, options.map(function (option) {
      var button = h('button', {
        type: 'button',
        class: 'chip',
        'aria-pressed': 'false',
        onClick: function () { select(option.value); }
      }, option.label);
      button.dataset.value = String(option.value);
      buttons.push(button);
      return button;
    }));

    function select(value, silent) {
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', button.dataset.value === String(value) ? 'true' : 'false');
      });
      if (!silent && onSelect) onSelect(value);
    }

    return { el: group, select: select, clear: function () { select(null, true); } };
  }

  /* ---------- Standard lab layout ---------- */
  /* opts: { title, kicker, stage, value, controls, indicator, aside, footer } */
  function labLayout(opts) {
    return h('section', { class: 'route-view' }, [
      header(opts.title, opts.kicker),
      h('div', { class: 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10' }, [
        h('div', { class: 'min-w-0' }, [opts.stage, opts.belowStage || null]),
        h('div', { class: 'panel flex flex-col justify-center gap-7 p-5 sm:p-6' }, [
          opts.value || null,
          opts.controls || null,
          opts.indicator || null,
          opts.aside || null,
          h('div', { class: 'flex flex-wrap justify-center gap-3 pt-1' }, opts.footer || null)
        ])
      ])
    ]);
  }

  global.UI = {
    h: h, clear: clear, append: append, nextId: nextId,
    header: header,
    valueDisplay: valueDisplay,
    slider: slider,
    indicator: indicator,
    resetButton: resetButton,
    chipGroup: chipGroup,
    labLayout: labLayout
  };
})(window);
