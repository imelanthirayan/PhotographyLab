/* Camera model: setting scales, a rough exposure calculation and the
   visual effects (brightness, colour temperature, grain, directional blur).
   Accuracy is deliberately approximate — the goal is a convincing, readable
   visual response rather than a physical simulation. */
(function (global) {
  'use strict';

  var F_STOPS = [1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16];
  var SHUTTERS = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 60, 1 / 125,
                  1 / 250, 1 / 500, 1 / 1000, 1 / 2000];
  var ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800];

  // Settings that together make a "correctly exposed" frame in this lab.
  var REF = { aperture: 5.6, shutter: 1 / 125, iso: 100 };

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function log2(x) { return Math.log(x) / Math.LN2; }

  function formatAperture(f) { return 'f/' + (f % 1 === 0 ? f : f.toFixed(1)); }
  function formatShutter(t) {
    if (t >= 1) return t + 's';
    return '1/' + Math.round(1 / t);
  }
  function formatIso(iso) { return 'ISO ' + iso; }
  function formatEv(ev) { return (ev > 0 ? '+' : ev < 0 ? '−' : '') + Math.abs(ev).toFixed(1).replace(/\.0$/, ''); }

  /* Exposure in stops relative to the reference settings. */
  function exposureStops(settings) {
    var aperture = settings.aperture === undefined ? REF.aperture : settings.aperture;
    var shutter = settings.shutter === undefined ? REF.shutter : settings.shutter;
    var iso = settings.iso === undefined ? REF.iso : settings.iso;
    var ev = settings.ev || 0;
    var scene = settings.sceneOffset || 0; // darker scenes start under-exposed
    return log2(shutter / REF.shutter)
      + 2 * log2(REF.aperture / aperture)
      + log2(iso / REF.iso)
      + ev + scene;
  }

  /* Stops -> CSS filter. Compressed so extremes stay readable. */
  function exposureFilter(stops) {
    var s = clamp(stops, -6, 6);
    var brightness = clamp(Math.pow(2, s * 0.3), 0.3, 1.8);
    var contrast = clamp(1 - Math.abs(s) * 0.035, 0.78, 1);
    var saturate = clamp(1 - Math.max(0, s) * 0.06 - Math.max(0, -s) * 0.05, 0.7, 1.05);
    return 'brightness(' + brightness.toFixed(3) + ') contrast(' + contrast.toFixed(3) +
           ') saturate(' + saturate.toFixed(3) + ')';
  }

  function exposureVerdict(stops) {
    if (stops < -0.7) return { key: 'under', label: 'Underexposed' };
    if (stops > 0.7) return { key: 'over', label: 'Overexposed' };
    return { key: 'correct', label: 'Correct' };
  }

  /* Colour temperature: per the lab's slider, low K reads cool and high K warm. */
  function temperatureTint(kelvin) {
    var t = clamp((kelvin - 2500) / 5000, 0, 1); // 0 = cool, 1 = warm
    var neutral = 0.5;
    if (t <= neutral) {
      var k = 1 - t / neutral;
      return { color: 'rgb(86, 148, 255)', strength: k * 0.85 };
    }
    var w = (t - neutral) / (1 - neutral);
    return { color: 'rgb(255, 156, 58)', strength: w * 0.85 };
  }

  function temperatureFilter(kelvin) {
    var t = clamp((kelvin - 2500) / 5000, 0, 1);
    var hue = lerp(-10, 8, t);
    var saturate = 1 + Math.abs(t - 0.5) * 0.35;
    return 'hue-rotate(' + hue.toFixed(1) + 'deg) saturate(' + saturate.toFixed(2) + ')';
  }

  /* ---------- Grain ---------- */
  var grainCache = {};
  /* Generates a tileable monochrome noise tile. Higher amount = coarser,
     louder grain, which reads much more like sensor noise than a CSS filter. */
  function grainTile(amount) {
    var key = Math.round(amount * 20);
    if (grainCache[key]) return grainCache[key];

    var size = 96;
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    var image = ctx.createImageData(size, size);
    var data = image.data;
    var spread = 40 + amount * 150;
    var chroma = amount * 55;

    for (var i = 0; i < data.length; i += 4) {
      var luma = 128 + (Math.random() - 0.5) * spread;
      data[i] = clamp(luma + (Math.random() - 0.5) * chroma, 0, 255);
      data[i + 1] = clamp(luma + (Math.random() - 0.5) * chroma * 0.6, 0, 255);
      data[i + 2] = clamp(luma + (Math.random() - 0.5) * chroma, 0, 255);
      data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);

    // A second, softer pass gives the clumpy look of real high-ISO noise.
    if (amount > 0.25) {
      ctx.globalAlpha = Math.min(0.5, amount * 0.5);
      for (var n = 0; n < 220 * amount; n += 1) {
        var v = Math.random() * 255;
        ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
        ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    var url = canvas.toDataURL('image/png');
    grainCache[key] = url;
    return url;
  }

  /* ISO -> grain settings. */
  function grainForIso(iso) {
    var stops = log2(iso / 100) / log2(12800 / 100); // 0..1
    return {
      amount: stops,
      opacity: clamp(stops * 0.8, 0, 0.8),
      scale: Math.round(lerp(150, 64, stops)), // tile size in px
      softness: lerp(0, 0.7, Math.max(0, stops - 0.45) / 0.55) // detail loss
    };
  }

  /* ---------- Directional blur (motion) ---------- */
  var filterHost = null;
  function ensureFilterHost() {
    if (filterHost) return filterHost;
    var svg = document.querySelector('svg.svg-defs');
    filterHost = svg.querySelector('defs');
    return filterHost;
  }

  /* Creates a private SVG blur filter so several elements can be blurred
     by different amounts along one axis (CSS blur() is always symmetric). */
  function directionalBlur(axis) {
    var host = ensureFilterHost();
    var id = UI.nextId('dirblur');
    var svgNS = 'http://www.w3.org/2000/svg';
    var filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('x', '-30%');
    filter.setAttribute('y', '-30%');
    filter.setAttribute('width', '160%');
    filter.setAttribute('height', '160%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    var blur = document.createElementNS(svgNS, 'feGaussianBlur');
    blur.setAttribute('edgeMode', 'duplicate');
    blur.setAttribute('stdDeviation', '0 0');
    filter.appendChild(blur);
    host.appendChild(filter);

    return {
      css: 'url(#' + id + ')',
      set: function (px) {
        var value = axis === 'y' ? '0 ' + px.toFixed(2) : px.toFixed(2) + ' 0';
        blur.setAttribute('stdDeviation', value);
      },
      destroy: function () { if (filter.parentNode) filter.parentNode.removeChild(filter); }
    };
  }

  /* ---------- Depth of field ---------- */
  /* Wide apertures throw the background far out of focus; small apertures
     bring it back. Returns blur radius in px for a ~1000px wide frame. */
  function backgroundBlur(aperture) {
    var t = clamp((log2(16) - log2(aperture)) / (log2(16) - log2(1.4)), 0, 1);
    return Math.pow(t, 1.9) * 24;
  }
  function midBlur(aperture) { return backgroundBlur(aperture) * 0.38; }

  /* Shutter -> motion blur in px, plus a ghosting factor for long exposures. */
  function motionBlur(shutter) {
    var t = clamp((log2(shutter) - log2(1 / 2000)) / (log2(1) - log2(1 / 2000)), 0, 1);
    return { blur: Math.pow(t, 2.8) * 34, ghost: clamp((t - 0.6) / 0.4, 0, 1), t: t };
  }

  global.Camera = {
    F_STOPS: F_STOPS, SHUTTERS: SHUTTERS, ISOS: ISOS, REF: REF,
    clamp: clamp, lerp: lerp, log2: log2,
    formatAperture: formatAperture, formatShutter: formatShutter,
    formatIso: formatIso, formatEv: formatEv,
    exposureStops: exposureStops, exposureFilter: exposureFilter, exposureVerdict: exposureVerdict,
    temperatureTint: temperatureTint, temperatureFilter: temperatureFilter,
    grainTile: grainTile, grainForIso: grainForIso,
    directionalBlur: directionalBlur,
    backgroundBlur: backgroundBlur, midBlur: midBlur, motionBlur: motionBlur
  };
})(window);
