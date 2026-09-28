/* Focus — tap the photograph to choose what stays sharp, the way a camera
   or a phone focuses. The tapped point sets the plane of focus; how far
   that point is into the scene decides which layer blurs.

   Keyboard users move the focus point with the arrow keys. */
(function (global) {
  'use strict';

  var DEFAULT_POINT = { x: 44, y: 76 }; // the near subject
  var STEP = 4; // arrow-key movement, in percent of the frame

  function distanceLabel(t) {
    if (t > 0.97) return '∞';
    var metres = 0.6 * Math.pow(26 / 0.6, t);
    return metres < 10 ? metres.toFixed(1) + ' m' : Math.round(metres) + ' m';
  }

  function build() {
    var stage = Scenes.createStage('focus', { af: true, depthSlices: 12 });
    var value = UI.valueDisplay(distanceLabel(0), 'Focus distance');
    var point = { x: DEFAULT_POINT.x, y: DEFAULT_POINT.y };

    // The photo becomes the control, so it takes focus and describes itself.
    stage.el.setAttribute('role', 'application');
    stage.el.setAttribute('tabindex', '0');
    stage.el.setAttribute('aria-label',
      'Focus point. Click the photograph to focus, or use the arrow keys.');
    stage.el.classList.add('stage-tappable');

    function render() {
      var t = stage.depthAt(point.y);
      value.set(distanceLabel(t));

      // Everything at the tapped depth stays sharp; blur grows either side.
      stage.setFocusDepth(t, 20);

      // A distant focus point implies a smaller subject, so the box tightens.
      stage.focusBox(point.x.toFixed(1), point.y.toFixed(1), Camera.lerp(24, 13, t).toFixed(1));
    }

    function moveTo(xPct, yPct) {
      point.x = Camera.clamp(xPct, 4, 96);
      point.y = Camera.clamp(yPct, 4, 96);
      render();
    }

    /* ---- Pointer: tap or drag anywhere on the photograph ---- */
    function pointToPercent(event) {
      var rect = stage.el.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100
      };
    }

    var dragging = false;
    stage.el.addEventListener('pointerdown', function (event) {
      dragging = true;
      stage.el.setPointerCapture(event.pointerId);
      stage.el.focus({ preventScroll: true });
      var p = pointToPercent(event);
      moveTo(p.x, p.y);
      event.preventDefault(); // keeps a drag from selecting the page
    });
    stage.el.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      var p = pointToPercent(event);
      moveTo(p.x, p.y);
    });
    function endDrag() { dragging = false; }
    stage.el.addEventListener('pointerup', endDrag);
    stage.el.addEventListener('pointercancel', endDrag);

    /* ---- Keyboard ---- */
    var KEYS = {
      ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP], ArrowDown: [0, STEP]
    };
    stage.el.addEventListener('keydown', function (event) {
      var delta = KEYS[event.key];
      if (!delta) return;
      moveTo(point.x + delta[0], point.y + delta[1]);
      event.preventDefault(); // stops the page scrolling under the photo
    });

    var view = UI.labLayout({
      title: 'Focus',
      kicker: 'Lab 06',
      stage: stage.el,
      value: value.el,
      controls: UI.h('p', { class: 'hint text-center', text: 'Tap the photo to focus' }),
      indicator: UI.indicator('Near', 'Far'),
      footer: UI.resetButton(function () {
        moveTo(DEFAULT_POINT.x, DEFAULT_POINT.y);
      })
    });

    render();
    return view;
  }

  global.Labs = global.Labs || {};
  global.Labs.focus = { id: 'focus', nav: 'Focus', title: 'Focus', build: build };
})(window);
