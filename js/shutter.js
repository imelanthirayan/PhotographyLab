/* Shutter speed — motion blur vs frozen motion.
   Exposure is held constant, as a camera in shutter-priority mode would:
   the slider teaches motion only. The light cost of a shutter speed lives
   in the Exposure Triangle lab. */
(function (global) {
  'use strict';

  var DEFAULT_INDEX = 6; // 1/60

  function build() {
    var stage = Scenes.createStage('action', { subject: true });
    var blurFilter = Camera.directionalBlur('x');

    var value = UI.valueDisplay(Camera.formatShutter(Camera.SHUTTERS[DEFAULT_INDEX]), 'Shutter');

    var control = UI.slider({
      label: 'Shutter speed',
      min: 0,
      max: Camera.SHUTTERS.length - 1,
      step: 1,
      value: DEFAULT_INDEX,
      leftLabel: '1s',
      rightLabel: '1/2000',
      showLabel: false,
      format: function (index) { return Camera.formatShutter(Camera.SHUTTERS[index]); },
      onInput: render
    });

    var motionToggle = UI.h('button', {
      type: 'button',
      class: 'btn',
      'aria-pressed': 'true',
      onClick: function () {
        var playing = motionToggle.getAttribute('aria-pressed') === 'true';
        motionToggle.setAttribute('aria-pressed', playing ? 'false' : 'true');
        motionToggle.textContent = playing ? 'Play motion' : 'Pause motion';
        stage.mover.classList.toggle('paused', playing);
      }
    }, 'Pause motion');

    function render(index) {
      var shutter = Camera.SHUTTERS[index];
      var motion = Camera.motionBlur(shutter);

      value.set(Camera.formatShutter(shutter));
      blurFilter.set(motion.blur * 0.55);
      stage.subject.style.filter = blurFilter.css;

      // Long exposures smear the subject into a trail.
      stage.ghosts.forEach(function (ghost, i) {
        var offset = (i + 1) * 9 * motion.ghost * stage.ghostScale;
        ghost.style.opacity = (motion.ghost * (0.42 - i * 0.14)).toFixed(3);
        ghost.style.transform = 'translateX(' + (-offset).toFixed(1) + '%)';
        ghost.style.filter = blurFilter.css;
      });

      // The subject crosses the frame at a constant real speed; only the
      // recorded blur changes, which is what the slider is teaching.
      if (stage.sweeps) stage.mover.style.setProperty('--sweep', '3.4s');
      stage.setBlur('bg', Math.pow(motion.t, 2) * 3); // slight camera shake at slow speeds
    }

    var view = UI.labLayout({
      title: 'Shutter Speed',
      kicker: 'Lab 02',
      stage: stage.el,
      value: value.el,
      controls: control.el,
      indicator: UI.indicator('Motion Blur', 'Freeze'),
      aside: stage.sweeps ? UI.h('div', { class: 'flex justify-center' }, motionToggle) : null,
      footer: UI.resetButton(function () { control.set(DEFAULT_INDEX); })
    });

    render(DEFAULT_INDEX);
    return view;
  }

  global.Labs = global.Labs || {};
  global.Labs.shutter = { id: 'shutter', nav: 'Shutter', title: 'Shutter Speed', build: build };
})(window);
