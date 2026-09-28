/* ISO — brightness against sensor noise. */
(function (global) {
  'use strict';

  var DEFAULT_INDEX = 2; // ISO 400

  function build() {
    var stage = Scenes.createStage('night');
    var value = UI.valueDisplay(Camera.formatIso(Camera.ISOS[DEFAULT_INDEX]), 'Sensitivity');

    var crop = UI.h('div', {
      class: 'relative mt-4 hidden overflow-hidden rounded-xl border border-white/10',
      style: 'aspect-ratio: 16/5;'
    }, [
      UI.h('div', { class: 'absolute inset-0', id: 'crop-image', 'aria-hidden': 'true' }),
      UI.h('div', { class: 'grain-layer', id: 'crop-grain', 'aria-hidden': 'true' }),
      UI.h('span', { class: 'stage-badge', text: '100% Crop' })
    ]);
    var cropImage = crop.querySelector('#crop-image');
    var cropGrain = crop.querySelector('#crop-grain');

    var cropToggle = UI.h('button', {
      type: 'button',
      class: 'chip',
      'aria-pressed': 'false',
      onClick: function () {
        var on = cropToggle.getAttribute('aria-pressed') === 'true';
        cropToggle.setAttribute('aria-pressed', on ? 'false' : 'true');
        crop.classList.toggle('hidden', on);
        if (!on) render(control.value);
      }
    }, '100% Crop');

    var control = UI.slider({
      label: 'ISO sensitivity',
      min: 0,
      max: Camera.ISOS.length - 1,
      step: 1,
      value: DEFAULT_INDEX,
      leftLabel: 'ISO 100',
      rightLabel: 'ISO 12800',
      showLabel: false,
      format: function (index) { return Camera.formatIso(Camera.ISOS[index]); },
      onInput: render
    });

    function render(index) {
      var iso = Camera.ISOS[index];
      value.set(Camera.formatIso(iso));

      var grain = stage.setGrain(iso);
      stage.setExposure(Camera.exposureStops({ iso: iso, sceneOffset: stage.sceneOffset }));
      // High ISO also costs fine detail and lifts the blacks.
      stage.setBlur('bg', grain.softness * 1.6);
      stage.setBlur('fg', grain.softness * 1.1);
      stage.setWash('#6d7a90', grain.softness * 0.16);

      if (!crop.classList.contains('hidden')) {
        cropImage.style.backgroundImage = stage.bg.style.backgroundImage;
        cropImage.style.backgroundSize = '320%';
        cropImage.style.backgroundPosition = '72% 40%';
        cropImage.style.filter = stage.inner.style.filter;
        cropGrain.style.backgroundImage = 'url("' + Camera.grainTile(grain.amount) + '")';
        cropGrain.style.backgroundSize = (grain.scale * 2.6) + 'px ' + (grain.scale * 2.6) + 'px';
        cropGrain.style.opacity = grain.opacity.toFixed(3);
      }
    }

    var view = UI.labLayout({
      title: 'ISO',
      kicker: 'Lab 03',
      stage: stage.el,
      belowStage: crop,
      value: value.el,
      controls: control.el,
      indicator: UI.indicator('Clean', 'Grainy'),
      aside: UI.h('div', { class: 'flex justify-center' }, cropToggle),
      footer: UI.resetButton(function () { control.set(DEFAULT_INDEX); })
    });

    render(DEFAULT_INDEX);
    return view;
  }

  global.Labs = global.Labs || {};
  global.Labs.iso = { id: 'iso', nav: 'ISO', title: 'ISO', build: build };
})(window);
