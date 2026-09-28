/* Aperture — depth of field.
   Exposure is held constant, as a camera in aperture-priority mode would:
   the slider teaches blur vs focus only. The light cost of an aperture
   lives in the Exposure Triangle lab. */
(function (global) {
  'use strict';

  var DEFAULT_INDEX = 3; // f/2.8

  function build() {
    var stage = Scenes.createStage('portrait', { af: false });

    var value = UI.valueDisplay(Camera.formatAperture(Camera.F_STOPS[DEFAULT_INDEX]), 'Aperture');

    var control = UI.slider({
      label: 'Aperture',
      min: 0,
      max: Camera.F_STOPS.length - 1,
      step: 1,
      value: DEFAULT_INDEX,
      leftLabel: 'f/1.4',
      rightLabel: 'f/16',
      showLabel: false,
      format: function (index) { return Camera.formatAperture(Camera.F_STOPS[index]); },
      onInput: render
    });

    function render(index) {
      var f = Camera.F_STOPS[index];
      value.set(Camera.formatAperture(f));
      stage.setBlur('bg', Camera.backgroundBlur(f));
      stage.setBlur('fg', f <= 2 ? 0.4 : 0); // a hint of softness wide open
    }

    var view = UI.labLayout({
      title: 'Aperture',
      kicker: 'Lab 01',
      stage: stage.el,
      value: value.el,
      controls: control.el,
      indicator: UI.indicator('More Blur', 'More Focus'),
      footer: UI.resetButton(function () { control.set(DEFAULT_INDEX); })
    });

    render(DEFAULT_INDEX);
    return view;
  }

  global.Labs = global.Labs || {};
  global.Labs.aperture = { id: 'aperture', nav: 'Aperture', title: 'Aperture', build: build };
})(window);
