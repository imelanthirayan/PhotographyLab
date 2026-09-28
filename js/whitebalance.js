/* White balance — colour temperature. */
(function (global) {
  'use strict';

  var DEFAULT_K = 5200;
  var PRESETS = [
    { value: 2800, label: 'Tungsten' },
    { value: 4000, label: 'Fluorescent' },
    { value: 5200, label: 'Daylight' },
    { value: 6200, label: 'Cloudy' },
    { value: 7200, label: 'Shade' }
  ];

  function build() {
    var stage = Scenes.createStage('indoor');
    var value = UI.valueDisplay(DEFAULT_K + 'K', 'White Balance');

    var presets = UI.chipGroup(PRESETS, function (kelvin) {
      control.set(kelvin);
    }, 'White balance presets');

    var control = UI.slider({
      label: 'Colour temperature in kelvin',
      min: 2500,
      max: 7500,
      step: 50,
      value: DEFAULT_K,
      leftLabel: '2500K',
      rightLabel: '7500K',
      showLabel: false,
      format: function (kelvin) { return kelvin + ' kelvin'; },
      onInput: function (kelvin) {
        render(kelvin);
        var match = PRESETS.filter(function (p) { return p.value === kelvin; })[0];
        presets.select(match ? match.value : null, true);
      }
    });

    function render(kelvin) {
      value.set(Math.round(kelvin) + 'K');
      stage.setTint(kelvin);
    }

    var view = UI.labLayout({
      title: 'White Balance',
      kicker: 'Lab 04',
      stage: stage.el,
      value: value.el,
      controls: control.el,
      indicator: UI.indicator('Cool', 'Warm'),
      aside: presets.el,
      footer: UI.resetButton(function () { control.set(DEFAULT_K); })
    });

    render(DEFAULT_K);
    presets.select(DEFAULT_K, true);
    return view;
  }

  global.Labs = global.Labs || {};
  global.Labs.whitebalance = { id: 'wb', nav: 'WB', title: 'White Balance', build: build };
})(window);
