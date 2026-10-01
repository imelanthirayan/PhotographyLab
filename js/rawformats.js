/* RAW, JPG and HEIF — an educational editing-latitude simulation. */
(function (global) {
  'use strict';

  var PHOTO = 'assets/images/landscape.jpg';
  var FORMATS = {
    raw: {
      label: 'RAW',
      message: 'More image information is available for editing.'
    },
    jpg: {
      label: 'JPG',
      message: 'Some information was discarded during processing and compression.'
    },
    heif: {
      label: 'HEIF',
      message: 'Efficient compression can preserve more information at smaller file sizes.'
    }
  };
  var DEFAULTS = { exposure: 0, highlights: 0, shadows: 0, warmth: 0, saturation: 0, zoom: 1 };

  function formatSigned(value, suffix) {
    if (value === 0) return '0' + (suffix || '');
    return (value > 0 ? '+' : '−') + Math.abs(value) + (suffix || '');
  }

  function build() {
    var state = {
      exposure: 0,
      highlights: 0,
      shadows: 0,
      warmth: 0,
      saturation: 0,
      zoom: 1,
      focusX: 0.68,
      focusY: 0.42
    };
    var sourceData = null;
    var framePending = false;
    var buffers = {};
    var mainCanvases = { raw: [], jpg: [], heif: [] };
    var fallbackImages = { raw: [], jpg: [], heif: [] };

    var message = UI.h('p', {
      class: 'format-message',
      role: 'status',
      'aria-live': 'polite',
      text: 'Push the edits and compare what each format retains.'
    });

    function makeCanvas(format) {
      var canvas = UI.h('canvas', {
        class: 'format-canvas',
        role: 'img',
        'aria-label': FORMATS[format].label + ' edited photograph'
      });
      mainCanvases[format].push(canvas);
      return canvas;
    }

    function formatFrame(format, compact) {
      var fallback = UI.h('img', {
        class: 'format-fallback-image',
        src: PHOTO,
        alt: '',
        'aria-hidden': 'true'
      });
      fallbackImages[format].push(fallback);
      return UI.h('div', { class: compact ? 'format-frame format-frame-compact' : 'format-frame' }, [
        fallback,
        makeCanvas(format),
        UI.h('span', { class: 'format-focus-marker', 'aria-hidden': 'true' }),
        UI.h('span', { class: 'format-label', text: FORMATS[format].label })
      ]);
    }

    var compareStage = UI.h('div', {
      class: 'format-compare',
      'aria-label': 'Side-by-side format comparison'
    }, [
      formatFrame('raw', true),
      formatFrame('jpg', true),
      formatFrame('heif', true)
    ]);

    var stage = UI.h('div', {
      class: 'format-stage',
      onPointerDown: moveFocus,
      onPointerMove: function (event) {
        if (event.buttons === 1) moveFocus(event);
      }
    }, compareStage);

    function moveFocus(event) {
      var frame = event.target.closest('.format-frame');
      var rect = frame ? frame.getBoundingClientRect() : stage.getBoundingClientRect();
      state.focusX = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
      state.focusY = Math.max(0.08, Math.min(0.92, (event.clientY - rect.top) / rect.height));
      positionMarker();
      drawMainImages();
      updateFallbacks();
    }

    function positionMarker() {
      Array.prototype.forEach.call(stage.querySelectorAll('.format-focus-marker'), function (marker) {
        marker.style.left = (state.focusX * 100).toFixed(1) + '%';
        marker.style.top = (state.focusY * 100).toFixed(1) + '%';
        marker.classList.toggle('is-visible', state.zoom > 1);
      });
    }

    var controls = {};
    var controlsWrap = UI.h('div', { class: 'format-controls' }, [
      control('exposure', 'Exposure', -3, 3, 0.1, '−3 EV', '+3 EV', function (value) {
        return formatSigned(Number(value.toFixed(1)), ' EV');
      }),
      control('highlights', 'Highlights', -100, 100, 1, '−100', '+100', formatSigned),
      control('shadows', 'Shadows', -100, 100, 1, '−100', '+100', formatSigned),
      control('warmth', 'White balance', -100, 100, 1, 'Cool', 'Warm', function (value) {
        return value === 0 ? 'Neutral' : (value < 0 ? Math.abs(value) + ' cool' : value + ' warm');
      }),
      control('saturation', 'Saturation', -100, 100, 1, '−100', '+100', formatSigned)
    ]);

    var zoomValue = UI.h('output', { class: 'format-control-value', text: '1×' });
    var zoomControl = UI.slider({
      label: 'Detail magnification',
      min: 1,
      max: 8,
      step: 1,
      value: 1,
      leftLabel: '1×',
      rightLabel: '8×',
      showLabel: false,
      format: function (value) { return value + ' times magnification'; },
      onInput: function (value) {
        state.zoom = value;
        zoomValue.textContent = value + '×';
        drawMainImages();
        updateFallbacks();
        positionMarker();
      }
    });
    controlsWrap.appendChild(UI.h('div', { class: 'format-control format-zoom-control' }, [
      UI.h('div', { class: 'format-control-head' }, [
        UI.h('span', { class: 'hint text-zinc-400', text: 'Look closer' }),
        zoomValue
      ]),
      zoomControl.el
    ]));

    function control(key, label, min, max, step, left, right, formatter) {
      var output = UI.h('output', { class: 'format-control-value', text: formatter(DEFAULTS[key]) });
      var slider = UI.slider({
        label: label,
        min: min,
        max: max,
        step: step,
        value: DEFAULTS[key],
        leftLabel: left,
        rightLabel: right,
        showLabel: false,
        format: formatter,
        onInput: function (value) {
          state[key] = value;
          output.textContent = formatter(value);
          scheduleRender();
        }
      });
      controls[key] = { slider: slider, output: output, formatter: formatter };
      return UI.h('div', { class: 'format-control' }, [
        UI.h('div', { class: 'format-control-head' }, [
          UI.h('span', { class: 'hint text-zinc-400', text: label }),
          output
        ]),
        slider.el
      ]);
    }

    var reset = UI.resetButton(function () {
      Object.keys(DEFAULTS).forEach(function (key) {
        state[key] = DEFAULTS[key];
        if (key === 'zoom') {
          zoomControl.set(DEFAULTS.zoom, true);
          zoomValue.textContent = DEFAULTS.zoom + '×';
        }
        else {
          controls[key].slider.set(DEFAULTS[key], true);
          controls[key].output.textContent = controls[key].formatter(DEFAULTS[key]);
        }
      });
      scheduleRender();
      positionMarker();
    });

    var editorMain = UI.h('div', { class: 'min-w-0' }, [
      stage,
      message,
      UI.h('p', {
        class: 'format-disclaimer',
        text: 'Tap or drag a photo to inspect another area. Educational simulation.'
      })
    ]);

    var editor = UI.h('div', { class: 'format-editor' }, [
      editorMain,
      UI.h('div', { class: 'panel format-control-panel' }, [
        controlsWrap,
        UI.h('div', { class: 'flex justify-center pt-1' }, reset)
      ])
    ]);

    var sizeSection = UI.h('section', { class: 'lab-section' }, [
      sectionHeading('Which Should I Use?', 'Size comparison is illustrative'),
      UI.h('div', { class: 'format-choice-grid' }, [
        choiceCard('RAW', 100, 'For heavy editing and maximum flexibility.'),
        choiceCard('JPG', 28, 'For easy sharing and broad compatibility.'),
        choiceCard('HEIF', 22, 'For efficient, high-quality storage on supported devices.')
      ]),
      UI.h('p', {
        class: 'mt-3 text-xs text-zinc-500',
        text: 'Actual sizes vary by camera, settings, and image.'
      })
    ]);

    var explanation = UI.h('section', { class: 'lab-section' }, [
      sectionHeading('What Changed?', 'The trade-off'),
      UI.h('div', { class: 'format-card-grid' }, [
        infoCard('RAW', 'More room to edit', [
          'Minimally processed sensor data',
          'Most editing flexibility',
          'Larger files',
          'Needs processing'
        ]),
        infoCard('JPG', 'Ready to use', [
          'Processed and compressed',
          'Small, widely compatible files',
          'Less editing flexibility'
        ]),
        infoCard('HEIF', 'Efficient compression', [
          'Efficient modern compression',
          'Can retain more than JPG',
          'Compatibility varies'
        ])
      ])
    ]);

    var view = UI.h('section', { class: 'route-view' }, [
      UI.h('div', { class: 'format-hero' }, [
        UI.h('p', { class: 'hint mb-3', text: 'Lab 09 · File formats' }),
        UI.h('h1', { class: 'text-4xl font-semibold tracking-tight sm:text-5xl', text: 'RAW vs JPG vs HEIF' }),
        UI.h('p', { class: 'mt-4 text-lg font-light text-zinc-400 sm:text-xl', text: 'One photo. Three formats. What actually changes?' }),
        UI.h('p', { class: 'mt-3 text-sm text-zinc-500', text: 'Edit the photo to find out.' })
      ]),
      editor,
      sizeSection,
      explanation
    ]);

    var image = new Image();
    image.onload = function () {
      try {
        var source = document.createElement('canvas');
        source.width = image.naturalWidth;
        source.height = image.naturalHeight;
        var context = source.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        sourceData = context.getImageData(0, 0, source.width, source.height);
        ['raw', 'jpg', 'heif'].forEach(function (format) {
          buffers[format] = document.createElement('canvas');
          buffers[format].width = source.width;
          buffers[format].height = source.height;
        });
        renderImages();
      } catch (error) {
        sourceData = null;
        updateFallbacks();
        message.textContent = 'The photo is shown in compatibility mode. Serve the site over HTTP to enable pixel-level format simulation.';
      }
      positionMarker();
    };
    image.onerror = function () {
      message.textContent = 'The source photograph could not be loaded.';
    };
    image.src = PHOTO;
    updateFallbacks();
    return view;

    function scheduleRender() {
      if (framePending) return;
      framePending = true;
      requestAnimationFrame(function () {
        framePending = false;
        if (sourceData) renderImages();
        else updateFallbacks();
      });
    }

    function renderImages() {
      if (!sourceData) return;
      ['raw', 'jpg', 'heif'].forEach(function (format) {
        var output = processImage(format);
        var buffer = buffers[format];
        buffer.getContext('2d').putImageData(output, 0, 0);
      });
      drawMainImages();
    }

    function processImage(format) {
      var input = sourceData.data;
      var output = new ImageData(sourceData.width, sourceData.height);
      var data = output.data;
      var exposure = Math.pow(2, state.exposure);
      var saturation = 1 + state.saturation / 100;
      var warmth = state.warmth / 100;
      var stress = Math.min(1,
        Math.abs(state.exposure) / 3 * 0.62 +
        Math.abs(state.highlights) / 100 * 0.32 +
        Math.abs(state.shadows) / 100 * 0.28 +
        Math.abs(state.saturation) / 100 * 0.14
      );
      var retention = format === 'raw' ? 1 : (format === 'heif' ? 0.62 : 0.3);
      var quantize = format === 'jpg' ? 1 + Math.round(stress * 31) :
        (format === 'heif' ? 1 + Math.round(stress * 11) : 1);

      for (var i = 0; i < input.length; i += 4) {
        var r = input[i] / 255;
        var g = input[i + 1] / 255;
        var b = input[i + 2] / 255;
        var luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;

        // Processed formats progressively lose recoverable values near the
        // ends of the tonal range as edits become more demanding.
        var encodedLum = luminance;
        if (format !== 'raw' && stress > 0) {
          var blackPoint = format === 'jpg' ? 0.12 : 0.055;
          var whitePoint = format === 'jpg' ? 0.88 : 0.945;
          var compressed = Math.max(0, Math.min(1, (luminance - blackPoint) / (whitePoint - blackPoint)));
          encodedLum = luminance + (compressed - luminance) * stress * (1 - retention);
          var ratio = luminance > 0.001 ? encodedLum / luminance : 0;
          r *= ratio;
          g *= ratio;
          b *= ratio;
          luminance = encodedLum;
        }

        var shadowMask = Math.pow(1 - luminance, 2.2);
        var highlightMask = Math.pow(luminance, 2.2);
        var tonal = state.shadows / 100 * shadowMask * 0.62 +
          state.highlights / 100 * highlightMask * 0.62;

        r = (r + tonal) * exposure * (1 + warmth * 0.3);
        g = (g + tonal) * exposure * (1 + Math.abs(warmth) * 0.025);
        b = (b + tonal) * exposure * (1 - warmth * 0.34);

        var editedLum = r * 0.2126 + g * 0.7152 + b * 0.0722;
        r = editedLum + (r - editedLum) * saturation;
        g = editedLum + (g - editedLum) * saturation;
        b = editedLum + (b - editedLum) * saturation;

        r = latitude(r, format, stress);
        g = latitude(g, format, stress);
        b = latitude(b, format, stress);

        if (quantize > 1) {
          var pixel = i / 4;
          var x = pixel % sourceData.width;
          var y = Math.floor(pixel / sourceData.width);
          var blockBias = format === 'jpg' && stress > 0.32
            ? ((((Math.floor(x / 8) * 13 + Math.floor(y / 8) * 7) % 5) - 2) * stress * 2.3)
            : 0;
          r = Math.round((r * 255 + blockBias) / quantize) * quantize / 255;
          g = Math.round((g * 255 + blockBias) / quantize) * quantize / 255;
          b = Math.round((b * 255 + blockBias) / quantize) * quantize / 255;
        }

        data[i] = Math.round(Math.max(0, Math.min(1, r)) * 255);
        data[i + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
        data[i + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
        data[i + 3] = 255;
      }
      return output;
    }

    function latitude(value, format, stress) {
      var clipped = Math.max(0, Math.min(1, value));
      if (format === 'jpg' || stress === 0) return clipped;
      var protectedValue = value < 0
        ? 0
        : 1 - Math.exp(-value * 0.82);
      var protection = format === 'raw' ? stress * 0.96 : stress * 0.55;
      return clipped * (1 - protection) + protectedValue * protection;
    }

    function drawMainImages() {
      if (!sourceData) return;
      ['raw', 'jpg', 'heif'].forEach(function (format) {
        var buffer = buffers[format];
        var sourceWidth = buffer.width / state.zoom;
        var sourceHeight = buffer.height / state.zoom;
        var sx = Math.max(0, Math.min(buffer.width - sourceWidth, state.focusX * buffer.width - sourceWidth / 2));
        var sy = Math.max(0, Math.min(buffer.height - sourceHeight, state.focusY * buffer.height - sourceHeight / 2));
        mainCanvases[format].forEach(function (canvas) {
          canvas.width = buffer.width;
          canvas.height = buffer.height;
          var context = canvas.getContext('2d');
          context.imageSmoothingEnabled = !(format === 'jpg' && state.zoom >= 5);
          context.imageSmoothingQuality = 'high';
          context.drawImage(buffer, sx, sy, sourceWidth, sourceHeight, 0, 0, buffer.width, buffer.height);
        });
      });
    }

    function updateFallbacks() {
      var tonalBrightness = state.highlights * 0.24 + state.shadows * 0.18;
      var brightness = Math.pow(2, state.exposure) * (100 + tonalBrightness);
      var contrast = 100 + state.highlights * 0.2 - state.shadows * 0.28;
      var saturation = Math.max(0, 100 + state.saturation);
      var warm = state.warmth;
      var stress = Math.min(1,
        Math.abs(state.exposure) / 3 * 0.62 +
        Math.abs(state.highlights) / 100 * 0.32 +
        Math.abs(state.shadows) / 100 * 0.28 +
        Math.abs(state.saturation) / 100 * 0.14
      );
      var temperature = warm >= 0
        ? ' sepia(' + (Math.abs(warm) * 0.42).toFixed(1) + '%) hue-rotate(' + (-warm * 0.12).toFixed(1) + 'deg)'
        : ' sepia(' + (Math.abs(warm) * 0.18).toFixed(1) + '%) hue-rotate(' + (warm * 0.55).toFixed(1) + 'deg)';
      var baseFilter = 'brightness(' + brightness.toFixed(1) + '%) contrast(' + contrast.toFixed(1) +
        '%) saturate(' + saturation.toFixed(1) + '%)' + temperature;
      ['raw', 'jpg', 'heif'].forEach(function (format) {
        var extra = format === 'jpg'
          ? ' contrast(' + (100 + stress * 42).toFixed(1) + '%) saturate(' + (100 - stress * 18).toFixed(1) + '%) blur(' + (stress * 1.15).toFixed(2) + 'px)'
          : (format === 'heif'
            ? ' contrast(' + (100 + stress * 16).toFixed(1) + '%) saturate(' + (100 - stress * 6).toFixed(1) + '%) blur(' + (stress * 0.38).toFixed(2) + 'px)'
            : '');
        fallbackImages[format].forEach(function (fallback) {
          fallback.style.filter = baseFilter + extra;
          fallback.style.transform = 'scale(' + state.zoom + ')';
          fallback.style.transformOrigin = (state.focusX * 100) + '% ' + (state.focusY * 100) + '%';
        });
      });
    }

  }

  function sectionHeading(title, kicker) {
    return UI.h('div', { class: 'mb-5' }, [
      kicker ? UI.h('p', { class: 'hint mb-2', text: kicker }) : null,
      UI.h('h2', { class: 'text-2xl font-semibold tracking-tight sm:text-3xl', text: title })
    ]);
  }

  function sizeBar(label, width) {
    return UI.h('div', { class: 'size-row' }, [
      UI.h('span', { class: 'size-label', text: label }),
      UI.h('div', { class: 'size-track' }, [
        UI.h('span', { class: 'size-fill', style: 'width:' + width + '%' })
      ])
    ]);
  }

  function choiceCard(format, width, text) {
    return UI.h('article', { class: 'format-choice panel' }, [
      UI.h('div', { class: 'flex items-center justify-between gap-3' }, [
        UI.h('strong', { text: format }),
        UI.h('span', { class: 'hint', text: 'Storage' })
      ]),
      UI.h('div', { class: 'size-track mt-4' }, [
        UI.h('span', { class: 'size-fill', style: 'width:' + width + '%' })
      ]),
      UI.h('p', { text: text })
    ]);
  }

  function infoCard(format, title, items) {
    return UI.h('article', { class: 'format-card panel' }, [
      UI.h('span', { class: 'hint text-accent', text: format }),
      UI.h('h3', { class: 'mt-3 text-xl font-medium tracking-tight', text: title }),
      UI.h('ul', { class: 'format-list' }, items.map(function (item) {
        return UI.h('li', { text: item });
      }))
    ]);
  }

  function useCard(format, text) {
    return UI.h('article', { class: 'use-card' }, [
      UI.h('strong', { text: format }),
      UI.h('p', { text: text })
    ]);
  }

  global.Labs = global.Labs || {};
  global.Labs.rawformats = {
    id: 'raw-jpg-heif',
    nav: 'Formats',
    title: 'RAW vs JPG vs HEIF',
    thumb: 'landscape',
    build: build
  };
})(window);
