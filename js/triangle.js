/* Exposure Triangle — three controls, one photograph, many scenes.

   Each scene carries its own `light` value: how much light it actually has,
   in stops, relative to the reference exposure. The opening scene sits at 0 so
   the lab starts correctly exposed; every other scene arrives under- or
   over-exposed, so the same three sliders have to be solved a different way.  */
(function (global) {
  'use strict';

  var DEFAULTS = { aperture: 5, shutter: 7, iso: 0 }; // f/5.6 · 1/125 · ISO 100

  var SCENE_PICKS = [
    { id: 'street', label: 'Dusk street', light: 0 },
    { id: 'concert', label: 'Concert', light: -3.2 },
    { id: 'night', label: 'Night', light: -2.6 },
    { id: 'portrait', label: 'Portrait', light: -0.6 },
    { id: 'waterfall', label: 'Waterfall', light: 0.8 },
    { id: 'runner', label: 'Runner', light: 1 },
    { id: 'landscape', label: 'Landscape', light: 1.2 },
    { id: 'beach', label: 'Beach', light: 1.8 }
  ];

  function meter() {
    var needle = UI.h('div', {
      class: 'meter-needle absolute -top-1 h-5 w-[3px] -translate-x-1/2 rounded-full bg-white',
      style: 'left:50%;'
    });
    var label = UI.h('div', { class: 'hint mt-3 text-center', text: 'Correct' });
    var bar = UI.h('div', { class: 'relative h-3 rounded-full', style: 'background: linear-gradient(90deg,#1d2733,#2e3a2a 42%,#f4b740 50%,#2e3a2a 58%,#332028);' }, [
      UI.h('div', { class: 'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/40' }),
      needle
    ]);
    var wrap = UI.h('div', { 'aria-live': 'polite' }, [
      bar,
      UI.h('div', { class: 'mt-2 flex justify-between' }, [
        UI.h('span', { class: 'scale-label', text: '−3' }),
        UI.h('span', { class: 'scale-label', text: '0' }),
        UI.h('span', { class: 'scale-label', text: '+3' })
      ]),
      label
    ]);
    return {
      el: wrap,
      set: function (stops) {
        var pct = Camera.clamp(50 + (stops / 3) * 50, 2, 98);
        needle.style.left = pct.toFixed(1) + '%';
        var verdict = Camera.exposureVerdict(stops);
        needle.style.background = verdict.key === 'correct' ? '#8ef0a8' : '#ff8d6b';
        label.textContent = verdict.label;
        label.style.color = verdict.key === 'correct' ? '#8ef0a8' : '#ffb59c';
      }
    };
  }

  /* Horizontal strip of photographs the triangle can be tried against. */
  function scenePicker(onPick) {
    var buttons = SCENE_PICKS.map(function (pick) {
      var button = UI.h('button', {
        type: 'button',
        class: 'scene-pick',
        'aria-pressed': 'false',
        onClick: function () { select(pick.id); }
      }, [
        UI.h('span', {
          class: 'scene-pick-art',
          'aria-hidden': 'true',
          style: 'background-image:url("' + Scenes.thumbnail(pick.id) + '")'
        }),
        UI.h('span', { class: 'scene-pick-label', text: pick.label })
      ]);
      button.dataset.scene = pick.id;
      return button;
    });

    function select(id, silent) {
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', button.dataset.scene === id ? 'true' : 'false');
      });
      if (!silent && onPick) onPick(id);
    }

    return {
      el: UI.h('div', {
        class: 'scene-strip', role: 'group', 'aria-label': 'Choose a scene'
      }, buttons),
      select: select
    };
  }

  function build() {
    var current = SCENE_PICKS[0];
    var stage = null;
    var mount = UI.h('div', { class: 'min-w-0' });
    var blurFilter = Camera.directionalBlur('x');
    var gauge = meter();

    var value = UI.valueDisplay('f/5.6', '1/125 · ISO 100');

    var aperture = UI.slider({
      label: 'Aperture', min: 0, max: Camera.F_STOPS.length - 1, step: 1, value: DEFAULTS.aperture,
      leftLabel: 'f/1.4', rightLabel: 'f/16',
      format: function (i) { return Camera.formatAperture(Camera.F_STOPS[i]); },
      onInput: function () { render('aperture'); }
    });
    var shutter = UI.slider({
      label: 'Shutter', min: 0, max: Camera.SHUTTERS.length - 1, step: 1, value: DEFAULTS.shutter,
      leftLabel: '1s', rightLabel: '1/2000',
      format: function (i) { return Camera.formatShutter(Camera.SHUTTERS[i]); },
      onInput: function () { render('shutter'); }
    });
    var iso = UI.slider({
      label: 'ISO', min: 0, max: Camera.ISOS.length - 1, step: 1, value: DEFAULTS.iso,
      leftLabel: '100', rightLabel: '12800',
      format: function (i) { return Camera.formatIso(Camera.ISOS[i]); },
      onInput: function () { render('iso'); }
    });

    /* Swaps the photograph but keeps the settings, so the meter reacts to the
       change in available light straight away. */
    function loadScene(id) {
      current = SCENE_PICKS.filter(function (p) { return p.id === id; })[0] || SCENE_PICKS[0];
      UI.clear(mount);
      stage = Scenes.createStage(current.id, { subject: true });
      mount.appendChild(stage.el);
      render('aperture');
      if (compare) compare.refresh(); // the "before" belongs to the new photo
    }

    function render(changed) {
      if (!stage) return;
      var f = Camera.F_STOPS[aperture.value];
      var t = Camera.SHUTTERS[shutter.value];
      var sensitivity = Camera.ISOS[iso.value];

      var parts = {
        aperture: Camera.formatAperture(f),
        shutter: Camera.formatShutter(t),
        iso: Camera.formatIso(sensitivity)
      };
      var primary = changed === 'shutter' ? 'shutter' : (changed === 'iso' ? 'iso' : 'aperture');
      var rest = ['aperture', 'shutter', 'iso'].filter(function (k) { return k !== primary; });
      value.set(parts[primary], parts[rest[0]] + ' · ' + parts[rest[1]]);

      var stops = Camera.exposureStops({
        aperture: f, shutter: t, iso: sensitivity, sceneOffset: current.light
      });
      stage.setExposure(stops);
      gauge.set(stops);

      var motion = Camera.motionBlur(t);
      blurFilter.set(motion.blur * 0.55);
      if (stage.subject) stage.subject.style.filter = blurFilter.css;
      stage.ghosts.forEach(function (ghost, i) {
        ghost.style.opacity = (motion.ghost * (0.42 - i * 0.14)).toFixed(3);
        ghost.style.transform = 'translateX(' + (-(i + 1) * 9 * motion.ghost * stage.ghostScale).toFixed(1) + '%)';
        ghost.style.filter = blurFilter.css;
      });

      var grain = stage.setGrain(sensitivity);
      stage.setBlur('bg', Camera.backgroundBlur(f) * stage.dofScale + grain.softness * 1.4);
    }

    var compare = Scenes.compare(
      function () { return stage; },
      function () { renderWith(DEFAULTS.aperture, DEFAULTS.shutter, DEFAULTS.iso); },
      function () { render('aperture'); });

    /* Paints the stage for an arbitrary settings triple without touching the
       sliders — used to snapshot the "before" at this scene's defaults. */
    function renderWith(a, s, i) {
      var held = [aperture.value, shutter.value, iso.value];
      aperture.input.value = a; shutter.input.value = s; iso.input.value = i;
      render('aperture');
      aperture.input.value = held[0]; shutter.input.value = held[1]; iso.input.value = held[2];
    }

    var picker = scenePicker(loadScene);
    var controls = UI.h('div', { class: 'flex flex-col gap-6' }, [aperture.el, shutter.el, iso.el]);

    var view = UI.labLayout({
      title: 'Exposure Triangle',
      kicker: 'Lab 07',
      stage: mount,
      belowStage: picker.el,
      value: value.el,
      controls: controls,
      indicator: gauge.el,
      footer: [
        UI.resetButton(function () {
          aperture.set(DEFAULTS.aperture, true);
          shutter.set(DEFAULTS.shutter, true);
          iso.set(DEFAULTS.iso, true);
          render('aperture');
        }),
        compare.button
      ]
    });

    picker.select(current.id, true);
    loadScene(current.id);
    return view;
  }

  global.Labs = global.Labs || {};
  global.Labs.triangle = { id: 'triangle', nav: 'Triangle', title: 'Exposure Triangle', build: build };
})(window);
