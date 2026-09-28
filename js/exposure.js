/* Exposure compensation — one dial, darker or brighter. */
(function (global) {
  'use strict';

  var DEFAULT_EV = 0;

  function build() {
    var stage = Scenes.createStage('landscape');
    var value = UI.valueDisplay('EV 0', 'Exposure');

    var control = UI.slider({
      label: 'Exposure compensation in stops',
      min: -3,
      max: 3,
      step: 0.3,
      value: DEFAULT_EV,
      leftLabel: '−3',
      rightLabel: '+3',
      showLabel: false,
      format: function (ev) { return 'EV ' + Camera.formatEv(ev); },
      onInput: render
    });

    function render(ev) {
      value.set('EV ' + Camera.formatEv(ev));
      stage.setExposure(Camera.exposureStops({ ev: ev }));
      // Deep underexposure keeps a cold cast; overexposure washes out.
      stage.setWash(ev < 0 ? '#5b6b8a' : '#fff6e2', Math.min(0.22, Math.abs(ev) * 0.05));
    }

    var view = UI.labLayout({
      title: 'Exposure',
      kicker: 'Lab 05',
      stage: stage.el,
      value: value.el,
      controls: control.el,
      indicator: UI.indicator('Dark', 'Bright'),
      footer: UI.resetButton(function () { control.set(DEFAULT_EV); })
    });

    render(DEFAULT_EV);
    return view;
  }

  global.Labs = global.Labs || {};
  global.Labs.exposure = { id: 'exposure', nav: 'Exposure', title: 'Exposure', build: build };
})(window);
