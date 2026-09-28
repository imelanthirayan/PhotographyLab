/* Camera Simulator controls and depth preview. */
(function (global) {
  'use strict';

  var M = global.CameraModel;
  var PRESETS = [16, 24, 35, 50, 85, 135, 200];
  var APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];

  function formatAperture(value) { return 'f/' + (value % 1 ? value.toFixed(1) : value.toFixed(0)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function svg(tag, attrs, children) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'class') node.setAttribute('class', attrs[key]);
      else if (key === 'text') node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) { node.appendChild(child); });
    return node;
  }
  function lensLabel(value) {
    if (value < 35) return 'WIDE';
    if (value < 70) return 'STANDARD';
    if (value < 120) return 'PORTRAIT';
    return 'TELEPHOTO';
  }

  function createScene() {
    var canvas = UI.h('canvas', { class: 'focal-scene-canvas', 'aria-hidden': 'true' });
    var renderer = FocalScene.create(canvas);
    return {
      el: UI.h('div', {
        class: 'focal-photo-frame',
        role: 'img',
        'aria-label': 'Projected outdoor portrait scene'
      }, canvas),
      renderer: renderer
    };
  }

  function renderScene(scene, model) {
    scene.renderer.set({
      focalLength: model.focalLength,
      cameraDistance: model.cameraDistance,
      backgroundDistance: model.backgroundDistance,
      aperture: model.aperture
    });
    return model.focalLength / 50 * 3 / model.cameraDistance;
  }

  function build() {
    var state = {
      focalLength: 50,
      cameraDistance: 3,
      backgroundDistance: 8,
      aperture: 2.8,
      focusDistance: 3
    };
    var root = UI.h('section', { class: 'route-view' });
    var scene = createScene();
    var settings = UI.h('div', { class: 'focal-settings', 'aria-live': 'polite' });
    var fovValue = UI.h('span', { class: 'focal-metric-value' });
    var distanceValue = UI.h('span', { class: 'focal-metric-value' });
    var subjectValue = UI.h('span', { class: 'focal-metric-value' });
    var blurValue = UI.h('span', { class: 'focal-metric-value' });
    var dofCamera = svg('g', { class: 'focal-depth-camera' }, [
      svg('rect', { x: '-11', y: '-7', width: '18', height: '14', rx: '3' }),
      svg('path', { d: 'M7 -4 L14 -8 V8 L7 4 Z' }),
      svg('circle', { cx: '-3', cy: '0', r: '3' })
    ]);
    var dofSubject = svg('g', { class: 'focal-depth-subject' }, [
      svg('circle', { cx: '0', cy: '-13', r: '5' }),
      svg('path', { d: 'M0 -7 V8 M-8 -1 L0 -5 L8 -1 M0 8 L-7 20 M0 8 L7 20' })
    ]);
    var dofBackground = svg('g', { class: 'focal-depth-background' }, [
      svg('path', { d: 'M0 18 V-4' }),
      svg('circle', { cx: '0', cy: '-12', r: '11' }),
      svg('circle', { cx: '-8', cy: '-5', r: '8' }),
      svg('circle', { cx: '8', cy: '-5', r: '8' })
    ]);
    var dofRange = svg('rect', { class: 'focal-depth-range', y: '76', height: '8', rx: '4' });
    var dofFocus = svg('line', { class: 'focal-depth-focus', y1: '68', y2: '89' });
    var dofFov = svg('path', { class: 'focal-depth-fov' });
    var dofCameraLabel = svg('text', { class: 'focal-depth-label', y: '98', text: 'CAMERA' });
    var dofBackgroundLabel = svg('text', { class: 'focal-depth-label', y: '98', text: 'BACKGROUND' });
    var dofFocal = UI.h('span', { class: 'focal-depth-value focal-depth-focal' });
    var dofNear = UI.h('span', { class: 'focal-depth-value' });
    var dofFar = UI.h('span', { class: 'focal-depth-value' });
    var dofTotal = UI.h('span', { class: 'focal-depth-value focal-depth-total' });
    var viewSummary = UI.h('span', { class: 'focal-summary' });
    var focalValue = UI.h('span', { class: 'focal-control-value', text: '50mm' });
    var distanceControlValue = UI.h('span', { class: 'focal-control-value', text: '3.0m' });
    var apertureControlValue = UI.h('span', { class: 'focal-control-value', text: 'f/2.8' });

    function slider(label, min, max, step, value, left, right, format, onInput) {
      return UI.slider({ label: label, min: min, max: max, step: step, value: value,
        leftLabel: left, rightLabel: right, showLabel: false, format: format, onInput: onInput });
    }

    var focalSlider = slider('Focal Length', 16, 200, 1, 50, '16mm', '200mm',
      function (v) { return v + 'mm'; }, function (v) {
        state.focalLength = v; state.focusDistance = state.cameraDistance; render();
      });
    var distanceSlider = slider('Camera Position', 1, 20, 0.1, 3, '1m', '20m',
      function (v) { return v.toFixed(1) + 'm'; }, function (v) {
        state.cameraDistance = v; state.focusDistance = v; render();
      });
    var apertureSlider = slider('Aperture', 0, APERTURES.length - 1, 1, 2, 'f/1.4', 'f/16',
      function (v) { return formatAperture(APERTURES[v]); }, function (v) {
        state.aperture = APERTURES[v]; render();
      });

    function preset(value) { focalSlider.set(value); }
    var presets = UI.h('div', { class: 'focal-presets', role: 'group', 'aria-label': 'Focal length presets' },
      PRESETS.map(function (value) {
        return UI.h('button', { type: 'button', class: 'focal-preset', text: value,
          onClick: function () { preset(value); } });
      }));
    var reset = UI.resetButton(function () {
      state = { focalLength: 50, cameraDistance: 3, backgroundDistance: 8, aperture: 2.8, focusDistance: 3 };
      focalSlider.set(50, true); distanceSlider.set(3, true); apertureSlider.set(2, true);
      render();
    });
    var summary = UI.h('div', { class: 'focal-summary' });
    var feedback = UI.h('div', { class: 'focal-feedback' });

    function render() {
      var scale = renderScene(scene, state);
      var fov = M.fieldOfView(state.focalLength);
      var depth = M.depthOfField(state);
      focalSlider.input.setAttribute('aria-valuetext', state.focalLength + 'mm');
      distanceSlider.input.setAttribute('aria-valuetext', state.cameraDistance.toFixed(1) + 'm');
      focalValue.textContent = state.focalLength + 'mm';
      distanceControlValue.textContent = state.cameraDistance.toFixed(1) + 'm';
      apertureControlValue.textContent = formatAperture(state.aperture);
      fovValue.textContent = Math.round(fov) + '°';
      distanceValue.textContent = state.cameraDistance.toFixed(1) + 'm';
      subjectValue.textContent = Math.round(scale * 100) + '%';
      blurValue.textContent = M.backgroundBlur(state).toFixed(2) + 'mm';
      var subjectX = 210;
      var diagramScale = 10;
      var cameraGap = 34 + Math.sqrt(Math.max(0, state.cameraDistance - 1) / 19) * 138;
      var cameraX = subjectX - cameraGap;
      var backgroundX = clamp(subjectX + state.backgroundDistance * diagramScale, 235, 344);
      var nearX = clamp(cameraX + depth.near * diagramScale, cameraX + 3, 346);
      var farX = clamp(cameraX + depth.far * diagramScale, nearX + 3, 346);
      var coneHalfHeight = clamp(Math.tan(fov * Math.PI / 360) * (subjectX - cameraX) * 0.42, 5, 34);
      dofCamera.setAttribute('transform', 'translate(' + cameraX.toFixed(1) + ' 52) scale(.56)');
      dofSubject.setAttribute('transform', 'translate(' + subjectX + ' 52) scale(.56)');
      dofBackground.setAttribute('transform', 'translate(' + backgroundX.toFixed(1) + ' 52) scale(.56)');
      dofFov.setAttribute('d', 'M ' + (cameraX + 10).toFixed(1) + ' 52 L ' +
        subjectX + ' ' + (52 - coneHalfHeight).toFixed(1) + ' L ' +
        subjectX + ' ' + (52 + coneHalfHeight).toFixed(1) + ' Z');
      dofCameraLabel.setAttribute('x', clamp(cameraX - 16, 2, 310).toFixed(1));
      dofBackgroundLabel.setAttribute('x', clamp(backgroundX - 28, 260, 312).toFixed(1));
      dofRange.setAttribute('x', nearX.toFixed(1));
      dofRange.setAttribute('width', Math.max(3, farX - nearX).toFixed(1));
      dofFocus.setAttribute('x1', subjectX);
      dofFocus.setAttribute('x2', subjectX);
      dofNear.textContent = 'Near ' + depth.near.toFixed(1) + 'm';
      dofFar.textContent = depth.far >= 20 ? 'Far ∞' : 'Far ' + depth.far.toFixed(1) + 'm';
      dofTotal.textContent = depth.far >= 20 ? 'DOF ∞' : 'DOF ' + Math.max(0, depth.far - depth.near).toFixed(1) + 'm';
      dofFocal.textContent = state.focalLength + 'mm · ' + Math.round(fov) + '°';
      summary.textContent = state.focalLength + 'mm   ' + formatAperture(state.aperture) + '   ' + state.cameraDistance.toFixed(1) + 'm';
      viewSummary.textContent = summary.textContent;
      settings.querySelector('.focal-lens-label').textContent = lensLabel(state.focalLength);
      feedback.innerHTML = '<span>FIELD OF VIEW <b>' + (fov < 45 ? '↓ narrower' : '↑ wider') +
        '</b></span><span>SUBJECT SIZE <b>' + (scale > 1 ? '↑ larger' : '↓ smaller') + '</b></span>';
      presets.querySelectorAll('.focal-preset').forEach(function (button) {
        button.classList.toggle('is-active', Number(button.textContent) === state.focalLength);
      });
    }

    settings.appendChild(UI.h('div', { class: 'focal-settings-head' }, [
      UI.h('span', { class: 'hint', text: 'Focal length' }),
      UI.h('span', { class: 'focal-setting-readout' }, [focalValue, UI.h('span', { class: 'focal-lens-label', text: 'STANDARD' })])
    ]));
    settings.appendChild(focalSlider.el); settings.appendChild(presets);
    settings.appendChild(UI.h('div', { class: 'focal-control-head' }, [
      UI.h('span', { class: 'hint', text: 'Aperture' }), apertureControlValue
    ]));
    settings.appendChild(apertureSlider.el);
    settings.appendChild(UI.h('div', { class: 'focal-control-separator' }, [
      UI.h('span', { class: 'hint', text: 'Shooting position' })
    ]));
    settings.appendChild(UI.h('div', { class: 'focal-control-head' }, [
      UI.h('span', { class: 'hint', text: 'Camera position' }), distanceControlValue
    ]));
    settings.appendChild(distanceSlider.el);
    settings.appendChild(feedback);
    settings.appendChild(summary);
    settings.appendChild(UI.h('div', { class: 'focal-actions' }, reset));
    var depthPanel = UI.h('div', { class: 'focal-depth-panel' }, [
      UI.h('div', { class: 'focal-depth-head' }, [
        UI.h('span', { class: 'hint', text: 'Depth of field' }),
        UI.h('div', { class: 'focal-depth-values', 'aria-live': 'polite' }, [dofFocal, dofNear, dofTotal, dofFar])
      ]),
      svg('svg', {
        class: 'focal-depth-svg',
        viewBox: '0 12 360 86',
        role: 'img',
        'aria-label': 'Camera, subject, background and depth of field positions'
      }, [
        svg('line', { class: 'focal-depth-axis', x1: '16', y1: '80', x2: '346', y2: '80' }),
        dofFov,
        dofRange,
        dofFocus,
        dofCamera,
        dofSubject,
        dofBackground,
        dofCameraLabel,
        svg('text', { class: 'focal-depth-label', x: '190', y: '98', text: 'SUBJECT' }),
        dofBackgroundLabel
      ])
    ]);
    root.appendChild(UI.h('div', { class: 'focal-layout' }, [
      settings,
      UI.h('div', { class: 'focal-main' }, [
        UI.h('div', { class: 'focal-view-head' }, [UI.h('span', { class: 'hint', text: 'Camera view' }), viewSummary]),
        UI.h('div', { class: 'focal-metrics' }, [
          UI.h('div', { class: 'focal-metric' }, [UI.h('span', { class: 'hint', text: 'Field of view' }), fovValue]),
          UI.h('div', { class: 'focal-metric' }, [UI.h('span', { class: 'hint', text: 'Camera position' }), distanceValue]),
          UI.h('div', { class: 'focal-metric' }, [UI.h('span', { class: 'hint', text: 'Framing' }), subjectValue]),
          UI.h('div', { class: 'focal-metric' }, [UI.h('span', { class: 'hint', text: 'Background blur' }), blurValue])
        ]),
        scene.el, depthPanel
      ])
    ]));
    render();
    return root;
  }

  global.Labs = global.Labs || {};
  global.Labs.focal = {
    id: 'focal',
    nav: 'Camera Simulator',
    title: 'Camera Simulator',
    thumbUrl: 'assets/images/camera-simulator.svg',
    build: build
  };
})(window);
