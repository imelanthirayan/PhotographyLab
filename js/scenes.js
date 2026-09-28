/* Scenes & photo stage.
   -------------------------------------------------------------------------
   Every experiment renders through createStage(). A scene either uses a real
   photograph from assets/images/ (just drop the file in — nothing else to
   change) or falls back to layered vector artwork that ships with the site.

   Layers are always: bg (far), mid (optional), fg (subject). With a real
   photograph the fg layer is the same image masked to the subject area, so
   the background can be blurred while the subject stays sharp. */
(function (global) {
  'use strict';

  /* Set to true once you have added real photographs to assets/images/.
     Each scene then loads its `photo` file and falls back to the built-in
     artwork if that file is missing. Left false by default so the site makes
     no failed requests out of the box. */
  var USE_PHOTOS = true;

  function svgURI(markup) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup.replace(/\s{2,}/g, ' ').trim());
  }
  function frame(inner, w, h) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (w || 1600) + ' ' + (h || 1000) +
           '" preserveAspectRatio="xMidYMid slice">' + inner + '</svg>';
  }

  /* Deterministic pseudo random so artwork is stable between renders. */
  function rand(seed) {
    var value = Math.sin(seed * 127.1) * 43758.5453;
    return value - Math.floor(value);
  }

  /* ---------- Artwork ---------- */

  function bokehBackground(hue) {
    var lights = '';
    for (var i = 0; i < 26; i += 1) {
      var x = rand(i + 1) * 1600;
      var y = 120 + rand(i + 9) * 720;
      var r = 22 + rand(i + 21) * 78;
      var o = 0.16 + rand(i + 33) * 0.5;
      var c = i % 3 === 0 ? '#ffd79a' : (i % 3 === 1 ? '#ffb765' : '#8fd3ff');
      lights += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + r.toFixed(0) +
        '" fill="' + c + '" opacity="' + o.toFixed(2) + '"/>' +
        '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (r * 0.96).toFixed(0) +
        '" fill="none" stroke="' + c + '" stroke-width="3" opacity="' + (o * 0.7).toFixed(2) + '"/>';
    }
    return frame(
      '<defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">' +
      '<stop offset="0" stop-color="' + (hue || '#2a1f18') + '"/>' +
      '<stop offset="0.55" stop-color="#150f0c"/><stop offset="1" stop-color="#090707"/>' +
      '</linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#bg)"/>' +
      '<rect x="980" y="60" width="520" height="620" rx="16" fill="#3b2a1b" opacity="0.5"/>' +
      lights +
      '<rect y="820" width="1600" height="180" fill="#0b0808" opacity="0.8"/>'
    );
  }

  function personForeground() {
    return frame(
      '<defs>' +
      '<linearGradient id="skin" x1="0.25" y1="0" x2="0.9" y2="1">' +
      '<stop offset="0" stop-color="#e2b089"/><stop offset="0.55" stop-color="#c08a62"/>' +
      '<stop offset="1" stop-color="#6b4630"/></linearGradient>' +
      '<linearGradient id="cloth" x1="0.1" y1="0" x2="0.9" y2="1">' +
      '<stop offset="0" stop-color="#46536a"/><stop offset="1" stop-color="#151a24"/></linearGradient>' +
      '<linearGradient id="hair" x1="0.2" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#3c2a20"/><stop offset="1" stop-color="#100b09"/></linearGradient>' +
      '<linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#ffd9a6" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#ffd9a6" stop-opacity="0.75"/></linearGradient>' +
      '</defs>' +
      '<g transform="translate(790 1015)">' +
      '<path d="M-430 -6 C -415 -230 -270 -318 -168 -348 C -60 -300 60 -300 168 -348 C 270 -318 415 -230 430 -6 Z" fill="url(#cloth)"/>' +
      '<path d="M-150 -352 C -96 -296 96 -296 150 -352 L 118 -468 L -118 -468 Z" fill="url(#skin)"/>' +
      '<path d="M-150 -352 C -96 -296 96 -296 150 -352 L 130 -410 C 60 -352 -60 -352 -130 -410 Z" fill="#000" opacity="0.28"/>' +
      '<ellipse cx="-186" cy="-612" rx="26" ry="42" fill="#c08a62"/>' +
      '<ellipse cx="186" cy="-612" rx="26" ry="42" fill="#c08a62"/>' +
      '<ellipse cx="0" cy="-600" rx="172" ry="206" fill="url(#skin)"/>' +
      '<path d="M-172 -636 C -168 -842 172 -842 172 -636 C 150 -752 -150 -752 -172 -636 Z" fill="url(#hair)"/>' +
      '<path d="M-172 -640 C -206 -520 -190 -452 -168 -430 C -200 -546 -190 -608 -172 -640 Z" fill="url(#hair)"/>' +
      '<path d="M172 -640 C 206 -520 190 -452 168 -430 C 200 -546 190 -608 172 -640 Z" fill="url(#hair)"/>' +
      '<path d="M-104 -672 C -78 -690 -44 -688 -28 -674" stroke="#2c1d15" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.8"/>' +
      '<path d="M104 -672 C 78 -690 44 -688 28 -674" stroke="#2c1d15" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.8"/>' +
      '<ellipse cx="-66" cy="-632" rx="21" ry="12" fill="#221512"/>' +
      '<ellipse cx="66" cy="-632" rx="21" ry="12" fill="#221512"/>' +
      '<path d="M0 -612 C -10 -570 -18 -560 -6 -552" stroke="#8d5c42" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.65"/>' +
      '<path d="M-38 -524 C -12 -506 12 -506 38 -524" stroke="#7c4b34" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M150 -700 C 196 -612 206 -470 186 -392" stroke="url(#rim)" stroke-width="16" fill="none" opacity="0.5" stroke-linecap="round"/>' +
      '</g>'
    );
  }

  function streetBackground() {
    var windows = '';
    for (var i = 0; i < 46; i += 1) {
      var x = 40 + (i % 12) * 130 + rand(i) * 20;
      var y = 90 + Math.floor(i / 12) * 130;
      windows += '<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="58" height="82" rx="5" fill="#ffca7a" opacity="' +
        (0.12 + rand(i + 5) * 0.4).toFixed(2) + '"/>';
    }
    return frame(
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#20304a"/><stop offset="1" stop-color="#5a5162"/></linearGradient>' +
      '<linearGradient id="road" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#4a4650"/><stop offset="1" stop-color="#22212a"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#sky)"/>' +
      '<g opacity="0.85"><rect x="0" y="60" width="1600" height="620" fill="#2b2f3d"/>' + windows + '</g>' +
      '<rect y="640" width="1600" height="360" fill="url(#road)"/>' +
      '<g fill="#d8d3c4" opacity="0.5">' +
      '<rect x="60" y="850" width="180" height="12" rx="6"/><rect x="360" y="850" width="180" height="12" rx="6"/>' +
      '<rect x="660" y="850" width="180" height="12" rx="6"/><rect x="960" y="850" width="180" height="12" rx="6"/>' +
      '<rect x="1260" y="850" width="180" height="12" rx="6"/></g>' +
      '<g fill="#7fe0b0" opacity="0.35"><circle cx="1400" cy="200" r="70"/></g>'
    );
  }

  function cyclistSubject() {
    return frame(
      '<g transform="translate(60 40)">' +
      '<circle cx="120" cy="330" r="104" fill="none" stroke="#14161b" stroke-width="16"/>' +
      '<circle cx="470" cy="330" r="104" fill="none" stroke="#14161b" stroke-width="16"/>' +
      '<path d="M120 330 L300 330 L390 190 L470 330 L300 330 L250 190 L390 190" fill="none" stroke="#f4b740" stroke-width="16" stroke-linejoin="round"/>' +
      '<path d="M250 190 L215 150" stroke="#f4b740" stroke-width="14" stroke-linecap="round"/>' +
      '<circle cx="300" cy="330" r="26" fill="none" stroke="#e0e3e8" stroke-width="10"/>' +
      '<path d="M300 330 L268 262 L300 196" stroke="#22314a" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M300 330 L344 288 L318 200" stroke="#2c3f5e" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M300 330 L330 250" stroke="#e0e3e8" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M330 250 L300 150 L360 96" stroke="#3f7fd6" stroke-width="42" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M310 165 L215 150" stroke="#3f7fd6" stroke-width="26" stroke-linecap="round"/>' +
      '<circle cx="382" cy="72" r="40" fill="#e8b98f"/>' +
      '<path d="M344 60 C352 18 416 14 424 58 Z" fill="#d9483f"/>' +
      '</g>', 640, 500
    );
  }

  function waterfallBackground() {
    var rocks = '';
    for (var i = 0; i < 16; i += 1) {
      var side = i % 2 === 0 ? 1 : -1;
      var x = side > 0 ? 40 + rand(i) * 380 : 1180 + rand(i) * 380;
      var y = rand(i + 4) * 900;
      rocks += '<ellipse cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" rx="' +
        (90 + rand(i + 8) * 120).toFixed(0) + '" ry="' + (50 + rand(i + 12) * 70).toFixed(0) +
        '" fill="#000" opacity="' + (0.08 + rand(i + 16) * 0.16).toFixed(2) + '"/>';
    }
    return frame(
      '<defs><linearGradient id="rock" x1="0.1" y1="0" x2="0.9" y2="1">' +
      '<stop offset="0" stop-color="#6b7164"/><stop offset="1" stop-color="#232821"/></linearGradient>' +
      '<linearGradient id="moss" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#5c8140"/><stop offset="1" stop-color="#26381d"/></linearGradient>' +
      '<linearGradient id="gap" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#cfe2d8"/><stop offset="1" stop-color="#7d9488"/></linearGradient>' +
      '<linearGradient id="pool" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#7f9b9b"/><stop offset="1" stop-color="#2b3a3c"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#gap)"/>' +
      '<path d="M0 0 H560 V620 Q430 760 340 1000 H0 Z" fill="url(#rock)"/>' +
      '<path d="M1600 0 H1040 V580 Q1180 760 1270 1000 H1600 Z" fill="url(#rock)"/>' +
      '<g>' + rocks + '</g>' +
      '<path d="M0 0 H470 V280 Q330 380 250 470 L0 430 Z" fill="url(#moss)" opacity="0.8"/>' +
      '<path d="M1600 30 H1130 V300 Q1270 400 1350 470 L1600 420 Z" fill="url(#moss)" opacity="0.75"/>' +
      '<path d="M0 1000 Q800 830 1600 1000 Z" fill="url(#pool)"/>' +
      '<ellipse cx="800" cy="930" rx="420" ry="80" fill="#dfeaea" opacity="0.28"/>'
    );
  }

  function waterSubject() {
    var strands = '';
    for (var i = 0; i < 30; i += 1) {
      var x = 20 + i * 18 + rand(i) * 7;
      strands += '<path d="M' + x.toFixed(0) + ' -20 C ' + (x + 14).toFixed(0) + ' 300 ' +
        (x - 16).toFixed(0) + ' 620 ' + (x + 8).toFixed(0) + ' 1020" stroke="#f2fbff" stroke-width="' +
        (4 + rand(i + 3) * 12).toFixed(1) + '" fill="none" opacity="' + (0.3 + rand(i + 7) * 0.55).toFixed(2) + '"/>';
    }
    return frame(
      '<defs>' +
      '<linearGradient id="fall" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#cfe8f5" stop-opacity="0"/>' +
      '<stop offset="0.3" stop-color="#dcf0fa" stop-opacity="0.55"/>' +
      '<stop offset="0.7" stop-color="#dcf0fa" stop-opacity="0.55"/>' +
      '<stop offset="1" stop-color="#cfe8f5" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="0.22" stop-color="#fff" stop-opacity="1"/>' +
      '<stop offset="0.78" stop-color="#fff" stop-opacity="1"/>' +
      '<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<mask id="softEdges"><rect width="580" height="1000" fill="url(#fade)"/></mask>' +
      '</defs>' +
      '<g mask="url(#softEdges)">' +
      '<rect width="580" height="1000" fill="url(#fall)"/>' + strands +
      '<ellipse cx="290" cy="980" rx="250" ry="70" fill="#eef8ff" opacity="0.45"/>' +
      '</g>', 580, 1000
    );
  }

  function alleyNight() {
    var bricks = '';
    for (var row = 0; row < 14; row += 1) {
      for (var col = 0; col < 16; col += 1) {
        var x = col * 104 + (row % 2 ? 52 : 0) - 52;
        var y = row * 72;
        bricks += '<rect x="' + x + '" y="' + y + '" width="98" height="66" rx="4" fill="#4a3730" opacity="' +
          (0.35 + rand(row * 16 + col) * 0.45).toFixed(2) + '"/>';
      }
    }
    return frame(
      '<rect width="1600" height="1000" fill="#120f0e"/>' +
      '<g>' + bricks + '</g>' +
      '<rect width="1600" height="1000" fill="#000" opacity="0.45"/>' +
      '<radialGradient id="lamp" cx="0.78" cy="0.18" r="0.55">' +
      '<stop offset="0" stop-color="#ffd8a0" stop-opacity="0.95"/>' +
      '<stop offset="0.45" stop-color="#ffb457" stop-opacity="0.25"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<rect width="1600" height="1000" fill="url(#lamp)"/>' +
      '<rect x="0" y="780" width="1600" height="220" fill="#080707" opacity="0.85"/>'
    );
  }

  function alleySubject() {
    return frame(
      '<g transform="translate(150 260)">' +
      '<rect x="0" y="60" width="380" height="620" rx="12" fill="#2a2320"/>' +
      '<rect x="22" y="86" width="336" height="568" rx="8" fill="#3a2f28"/>' +
      '<g stroke="#6b5a4c" stroke-width="3" opacity="0.65">' +
      '<path d="M22 216 H358"/><path d="M22 346 H358"/><path d="M22 476 H358"/></g>' +
      '<circle cx="306" cy="390" r="16" fill="#d8c08a"/>' +
      '<rect x="46" y="-40" width="290" height="86" rx="8" fill="#8a2f28"/>' +
      '<rect x="64" y="-18" width="254" height="44" rx="6" fill="#f0d9a8" opacity="0.85"/>' +
      '</g>' +
      '<g transform="translate(640 620)">' +
      '<rect x="0" y="0" width="230" height="260" rx="10" fill="#2f2a26"/>' +
      '<rect x="18" y="-26" width="194" height="34" rx="8" fill="#433b34"/>' +
      '</g>'
    );
  }

  function indoorScene() {
    return frame(
      '<defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#d9d3c8"/><stop offset="1" stop-color="#a49c90"/></linearGradient>' +
      '<linearGradient id="table" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#9c6a3f"/><stop offset="1" stop-color="#5d3c22"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#wall)"/>' +
      '<rect x="120" y="60" width="420" height="520" rx="10" fill="#f4f2ee"/>' +
      '<rect x="150" y="90" width="360" height="460" rx="6" fill="#cfd9e2"/>' +
      '<rect y="640" width="1600" height="360" fill="url(#table)"/>' +
      '<ellipse cx="800" cy="650" rx="760" ry="42" fill="#b07b48" opacity="0.5"/>' +
      '<g>' +
      '<rect x="640" y="430" width="230" height="210" rx="18" fill="#d8443a"/>' +
      '<path d="M870 470 q80 40 0 110" stroke="#d8443a" stroke-width="30" fill="none"/>' +
      '<rect x="960" y="360" width="200" height="280" rx="10" fill="#f7f6f2"/>' +
      '<rect x="1200" y="470" width="150" height="170" rx="10" fill="#2f6f4f"/>' +
      '<path d="M1275 470 C 1200 380 1320 330 1290 250 C 1360 320 1400 420 1330 470 Z" fill="#3f9464"/>' +
      '<rect x="330" y="520" width="200" height="120" rx="12" fill="#2f5fa8"/>' +
      '<circle cx="1470" cy="600" r="46" fill="#e8c23f"/>' +
      '</g>' +
      '<rect width="1600" height="1000" fill="#000" opacity="0.06"/>'
    );
  }

  function mountainScene() {
    return frame(
      '<defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#1d3f6e"/><stop offset="0.55" stop-color="#6aa0c6"/>' +
      '<stop offset="1" stop-color="#e9c48d"/></linearGradient>' +
      '<linearGradient id="far" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#6f7f99"/><stop offset="1" stop-color="#3d4a60"/></linearGradient>' +
      '<linearGradient id="near" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3a4a3c"/><stop offset="1" stop-color="#16201b"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#sky2)"/>' +
      '<circle cx="1230" cy="250" r="70" fill="#ffe9bd" opacity="0.95"/>' +
      '<path d="M0 560 L260 300 L430 470 L620 240 L900 560 Z" fill="url(#far)"/>' +
      '<path d="M620 240 L700 330 L640 360 L560 320 Z" fill="#eef3f7" opacity="0.9"/>' +
      '<path d="M700 560 L1020 280 L1300 520 L1600 300 L1600 620 L700 620 Z" fill="url(#far)" opacity="0.85"/>' +
      '<path d="M0 620 L1600 620 L1600 1000 L0 1000 Z" fill="url(#near)"/>' +
      '<path d="M0 640 C 400 700 700 600 1100 680 C 1300 720 1450 700 1600 660 L1600 1000 L0 1000 Z" fill="#22301f"/>'
    );
  }

  function landscapeForeground() {
    return frame(
      '<g transform="translate(0 1000)">' +
      '<path d="M0 0 C 120 -160 260 -120 380 -220 C 460 -290 540 -200 640 -250 L 700 0 Z" fill="#101a12"/>' +
      '<path d="M1600 0 C 1480 -180 1340 -140 1220 -240 C 1140 -300 1060 -210 960 -260 L 900 0 Z" fill="#0e1710"/>' +
      '<g stroke="#16221a" stroke-width="16" stroke-linecap="round">' +
      '<path d="M120 0 L150 -180"/><path d="M1460 0 L1430 -200"/></g>' +
      '</g>'
    );
  }

  function focusBackground() {
    return frame(
      '<defs><linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#8fb4cf"/><stop offset="1" stop-color="#d9d6b6"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#fsky)"/>' +
      '<rect y="700" width="1600" height="300" fill="#6c7a45"/>' +
      '<g transform="translate(1120 700)">' +
      '<rect x="-26" y="-190" width="52" height="200" rx="10" fill="#5a4129"/>' +
      '<circle cx="0" cy="-260" r="150" fill="#3f6b33"/>' +
      '<circle cx="-110" cy="-190" r="100" fill="#4d7c3c"/>' +
      '<circle cx="105" cy="-200" r="110" fill="#365c2c"/>' +
      '</g>' +
      '<g transform="translate(380 700)">' +
      '<rect x="-20" y="-150" width="40" height="160" rx="8" fill="#5a4129"/>' +
      '<circle cx="0" cy="-210" r="118" fill="#446f35"/>' +
      '</g>' +
      '<ellipse cx="800" cy="960" rx="900" ry="90" fill="#5b6a3c"/>'
    );
  }

  function flowerForeground() {
    var petals = '';
    for (var i = 0; i < 8; i += 1) {
      petals += '<ellipse cx="0" cy="-120" rx="62" ry="118" fill="#e46a8c" transform="rotate(' + (i * 45) + ')"/>';
    }
    return frame(
      '<g transform="translate(400 1010)">' +
      '<path d="M-26 0 C -40 -260 30 -360 10 -520 L 52 -520 C 70 -360 12 -250 30 0 Z" fill="#3d6b2f"/>' +
      '<path d="M20 -300 C -90 -330 -150 -420 -170 -470 C -60 -470 10 -400 20 -300 Z" fill="#4b8038"/>' +
      '<g transform="translate(30 -560)">' + petals +
      '<circle r="56" fill="#f6c545"/><circle r="34" fill="#d99a24"/></g>' +
      '</g>'
    );
  }

  /* ---------- Scene registry ----------
     Drop a real photograph at the `photo` path and it is used automatically. */
  var SCENES = {
    portrait: {
      photo: 'assets/images/portrait.jpg',
      badge: 'Portrait',
      dofScale: 1, // tight subject, distant background: real bokeh
      fgMask: 'radial-gradient(ellipse 32% 62% at 63% 58%, #000 55%, rgba(0,0,0,0) 84%)',
      art: { bg: function () { return bokehBackground('#2a1f18'); }, fg: personForeground }
    },
    action: {
      photo: 'assets/images/action.jpg',
      badge: 'Action',
      fgMask: 'radial-gradient(ellipse 26% 58% at 45% 44%, #000 62%, rgba(0,0,0,0) 90%)',
      art: { bg: streetBackground, fg: null },
      subject: { art: cyclistSubject, style: 'left:4%; top:38%; width:44%; aspect-ratio:640/500;' }
    },
    waterfall: {
      photo: 'assets/images/waterfall.jpg',
      badge: 'Waterfall',
      dofScale: 0.5,
      sceneOffset: 0.8, // bright daylight, so a slow shutter needs a small aperture
      fgMask: 'radial-gradient(ellipse 42% 46% at 51% 58%, #000 64%, rgba(0,0,0,0) 92%)',
      art: { bg: waterfallBackground, fg: null },
      subject: { art: waterSubject, style: 'left:31%; top:-2%; width:38%; height:104%;' }
    },
    street: {
      photo: 'assets/images/street.jpg',
      badge: 'Street',
      sceneOffset: -1.2, // dusk, so the triangle starts with less light to work with
      fgMask: 'linear-gradient(0deg, #000 26%, rgba(0,0,0,0) 60%), radial-gradient(ellipse 20% 32% at 36% 50%, #000 52%, rgba(0,0,0,0) 88%)',
      dofScale: 0.45, // a deep street stays mostly sharp; blur is a hint, not a wall
      // Fallback art only (USE_PHOTOS = false): a night alley with the cyclist
      // riding through it gives the triangle the movement it needs.
      art: { bg: alleyNight, fg: null },
      subject: { art: cyclistSubject, style: 'left:4%; top:42%; width:42%; aspect-ratio:640/500;' }
    },
    night: {
      photo: 'assets/images/night.jpg',
      badge: 'Night',
      dofScale: 0.6,
      sceneOffset: -2.4,
      fgMask: 'radial-gradient(ellipse 40% 55% at 50% 52%, #000 55%, rgba(0,0,0,0) 88%)',
      art: { bg: alleyNight, fg: alleySubject }
    },
    indoor: {
      photo: 'assets/images/indoor.jpg',
      badge: 'Indoor',
      fgMask: 'radial-gradient(ellipse 38% 52% at 42% 55%, #000 60%, rgba(0,0,0,0) 88%)',
      art: { bg: indoorScene, fg: null }
    },
    landscape: {
      photo: 'assets/images/landscape.jpg',
      badge: 'Landscape',
      dofScale: 0.2, // near-infinite depth of field: stays sharp
      fgMask: 'linear-gradient(0deg, #000 16%, rgba(0,0,0,0) 44%)',
      art: { bg: mountainScene, fg: landscapeForeground }
    },
    focus: {
      photo: 'assets/images/focus.jpg',
      badge: 'Focus',
      fgMask: 'linear-gradient(0deg, #000 34%, rgba(0,0,0,0) 66%)',
      // Where the ground plane recedes: tapping at nearY is the closest
      // subject, at farY (and above) the horizon. Drives tap-to-focus.
      depth: { nearY: 74, farY: 32 },
      art: { bg: focusBackground, fg: flowerForeground }
    },

    /* ---- Triangle scene picker only ---- */
    concert: {
      photo: 'assets/images/concert.jpg',
      badge: 'Concert',
      dofScale: 0.8,
      fgMask: 'radial-gradient(ellipse 22% 48% at 47% 62%, #000 60%, rgba(0,0,0,0) 90%)',
      art: { bg: alleyNight, fg: null },
      subject: { art: cyclistSubject, style: 'left:10%; top:40%; width:42%; aspect-ratio:640/500;' }
    },
    beach: {
      photo: 'assets/images/beach.jpg',
      badge: 'Beach',
      dofScale: 0.22, // wide scene: only the nearest posts go soft
      fgMask: 'linear-gradient(0deg, #000 30%, rgba(0,0,0,0) 62%), radial-gradient(ellipse 12% 60% at 21% 52%, #000 58%, rgba(0,0,0,0) 88%), radial-gradient(ellipse 12% 60% at 43% 52%, #000 58%, rgba(0,0,0,0) 88%)',
      art: { bg: mountainScene, fg: landscapeForeground }
    },
    runner: {
      photo: 'assets/images/runner.jpg',
      badge: 'Runner',
      dofScale: 0.7,
      fgMask: 'radial-gradient(ellipse 34% 52% at 45% 62%, #000 60%, rgba(0,0,0,0) 90%)',
      art: { bg: streetBackground, fg: null },
      subject: { art: cyclistSubject, style: 'left:6%; top:40%; width:44%; aspect-ratio:640/500;' }
    }
  };

  /* ---------- Stage ---------- */

  function layerElement(className) {
    return UI.h('div', { class: 'layer ' + className, 'aria-hidden': 'true' });
  }

  /* A stack of depth slices for a scene whose ground plane recedes with height.

     Two layers can only ever make the near OR the far subject sharp, so a tap
     at mid-distance leaves the whole frame soft. Instead the frame is cut into
     horizontal bands and each is blurred by how far its depth sits from the
     plane of focus — the way a real lens falls off either side of focus.

     Each slice is opaque from its own top edge all the way down, so a later
     (nearer) slice paints over the ones behind it and coverage is always
     complete; the feather is what blends neighbouring bands. */
  function buildDepthSlices(count) {
    var slices = [];
    var step = 100 / count;
    var feather = step * 0.9;
    for (var i = 0; i < count; i += 1) {
      var start = i * step;
      var el = layerElement('layer-slice');
      el.style.maskImage = el.style.webkitMaskImage = i === 0 ? 'none' :
        'linear-gradient(180deg, rgba(0,0,0,0) ' + Math.max(0, start - feather).toFixed(1) +
        '%, #000 ' + start.toFixed(1) + '%, #000 100%)';
      slices.push({ el: el, centre: (start + step / 2) * 1.04 - 2 });
    }
    return slices;
  }

  /* opts: { badge, subject: bool, af: bool, depthSlices: int, className } */
  function createStage(sceneId, opts) {
    opts = opts || {};
    var scene = SCENES[sceneId] || SCENES.landscape;

    var bg = layerElement('layer-bg');
    var fg = layerElement('layer-fg');

    var slices = opts.depthSlices ? buildDepthSlices(opts.depthSlices) : [];
    var sliceEls = slices.map(function (s) { return s.el; });

    var inner = UI.h('div', { class: 'stage-inner' }, [bg, fg].concat(sliceEls));
    var wash = UI.h('div', { class: 'wash-layer', 'aria-hidden': 'true' });
    var tint = UI.h('div', { class: 'tint-layer', 'aria-hidden': 'true' });
    var grain = UI.h('div', { class: 'grain-layer', 'aria-hidden': 'true' });

    var stage = UI.h('figure', {
      class: 'stage ' + (opts.className || ''),
      role: 'img',
      'aria-label': opts.alt || (scene.badge + ' photograph reacting to the camera settings')
    }, [inner, wash, tint, grain, UI.h('div', { class: 'vignette', 'aria-hidden': 'true' })]);

    if (opts.badge !== false) {
      stage.appendChild(UI.h('figcaption', { class: 'stage-badge', text: opts.badge || scene.badge }));
    }

    // Optional moving subject (shutter lab, exposure triangle).
    var subject = null, mover = null, ghosts = [], ghostScale = 1;
    var photoSubject = USE_PHOTOS && !!scene.photo;
    if (opts.subject && photoSubject) {
      // With a photograph the subject is cut out of the frame itself and smeared
      // in place, so the trail reads as a real slow-shutter exposure.
      ghostScale = 0.3;
      mover = UI.h('div', {
        class: 'subject-mover no-motion photo-subject', 'aria-hidden': 'true'
      });
      for (var pg = 0; pg < 2; pg += 1) {
        var pghost = photoSubjectLayer(scene, 'subject-art ghost');
        mover.appendChild(pghost);
        ghosts.push(pghost);
      }
      subject = photoSubjectLayer(scene, 'subject-art');
      mover.appendChild(subject);
      inner.appendChild(mover);
      fg.dataset.hidden = '1'; // the mover now carries the sharp subject
      fg.style.opacity = '0';
    } else if (opts.subject && scene.subject) {
      mover = UI.h('div', { class: 'subject-mover', 'aria-hidden': 'true', style: scene.subject.style });
      var art = 'url("' + svgURI(scene.subject.art()) + '")';
      for (var g = 0; g < 2; g += 1) {
        var ghost = UI.h('div', { class: 'subject-art ghost' });
        ghost.style.backgroundImage = art;
        mover.appendChild(ghost);
        ghosts.push(ghost);
      }
      subject = UI.h('div', { class: 'subject-art' });
      subject.style.backgroundImage = art;
      mover.appendChild(subject);
      inner.appendChild(mover);
    }

    // Optional autofocus box.
    var af = null;
    if (opts.af) {
      af = UI.h('div', { class: 'af-box', 'aria-hidden': 'true', style: 'left:50%; top:60%;' });
      stage.appendChild(af);
    }

    if (slices.length) {
      // The slice stack replaces the two-plane model entirely.
      fg.style.opacity = '0';
      fg.dataset.hidden = '1';
    }

    applySources(scene, bg, fg, sliceEls);

    var api = {
      el: stage,
      scene: scene,
      sceneOffset: scene.sceneOffset || 0,
      dofScale: scene.dofScale === undefined ? 1 : scene.dofScale,
      /* Depth at a point in the frame: 0 = nearest, 1 = horizon. */
      depthAt: function (yPct) {
        var d = scene.depth || { nearY: 100, farY: 0 };
        return Camera.clamp((d.nearY - yPct) / (d.nearY - d.farY), 0, 1);
      },
      /* Focus the stack on a depth (0 = nearest, 1 = horizon). Blur grows with
         distance from that plane, so whatever sits at the focus depth is sharp
         no matter where in the frame the user tapped. */
      setFocusDepth: function (depth, strength) {
        var max = strength === undefined ? 20 : strength;
        slices.forEach(function (s) {
          var delta = Math.abs(api.depthAt(s.centre) - depth);
          // Far side of focus falls off faster, as depth of field really does.
          var px = Math.pow(delta, 0.75) * max;
          s.el.style.filter = px < 0.25 ? 'none' : 'blur(' + px.toFixed(2) + 'px)';
        });
      },
      inner: inner,
      bg: bg,
      fg: fg,
      subject: subject,
      mover: mover,
      ghosts: ghosts,
      ghostScale: ghostScale,
      sweeps: !!(mover && !photoSubject),
      af: af,
      grainEl: grain,
      exposure: '',
      color: '',
      setExposure: function (stops) {
        api.exposure = Camera.exposureFilter(stops);
        paint();
      },
      setColorFilter: function (filterString) {
        api.color = filterString || '';
        paint();
      },
      setTint: function (kelvin) {
        var t = Camera.temperatureTint(kelvin);
        tint.style.backgroundColor = t.color;
        tint.style.opacity = t.strength.toFixed(3);
        api.setColorFilter(Camera.temperatureFilter(kelvin));
      },
      setWash: function (color, opacity) {
        wash.style.backgroundColor = color;
        wash.style.opacity = String(opacity);
      },
      setGrain: function (iso) {
        var g = Camera.grainForIso(iso);
        grain.style.backgroundImage = 'url("' + Camera.grainTile(g.amount) + '")';
        grain.style.backgroundSize = g.scale + 'px ' + g.scale + 'px';
        grain.style.opacity = g.opacity.toFixed(3);
        return g;
      },
      setBlur: function (target, px) {
        var el = target === 'fg' ? fg : (target === 'subject' ? subject : bg);
        if (el) el.style.filter = px > 0.01 ? 'blur(' + px.toFixed(2) + 'px)' : 'none';
      },
      setFilter: function (target, value) {
        var el = target === 'fg' ? fg : (target === 'subject' ? subject : bg);
        if (el) el.style.filter = value || 'none';
      },
      focusBox: function (leftPct, topPct, widthPct) {
        if (!af) return;
        af.style.left = leftPct + '%';
        af.style.top = topPct + '%';
        if (widthPct) af.style.width = widthPct + '%';
        af.classList.remove('locked');
        void af.offsetWidth;
        af.classList.add('locked');
      }
    };

    function paint() {
      inner.style.filter = (api.exposure + ' ' + api.color).trim();
    }

    return api;
  }

  /* A copy of the photograph masked down to just the subject. */
  function photoSubjectLayer(scene, className) {
    var el = UI.h('div', { class: className });
    el.style.backgroundImage = 'url("' + scene.photo + '")';
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.setProperty('--fg-mask', scene.fgMask);
    el.classList.add('layer-masked');
    return el;
  }

  /* Uses the real photograph when present, otherwise the built-in artwork. */
  function applySources(scene, bg, fg, sliceEls) {
    var fallbackBg = scene.art && scene.art.bg ? svgURI(scene.art.bg()) : '';
    var fallbackFg = scene.art && scene.art.fg ? svgURI(scene.art.fg()) : '';

    bg.style.backgroundImage = 'url("' + fallbackBg + '")';
    fg.style.backgroundImage = fallbackFg ? 'url("' + fallbackFg + '")' : 'none';
    if (!fallbackFg) fg.style.opacity = '0';
    setSliceImages(sliceEls, 'url("' + fallbackBg + '")');

    if (!USE_PHOTOS || !scene.photo) return;
    var probe = new Image();
    probe.onload = function () {
      var url = 'url("' + scene.photo + '")';
      bg.style.backgroundImage = url;
      fg.style.backgroundImage = url;
      // In subject mode the moving layer already carries the sharp subject, so
      // this one must stay hidden or it would draw a crisp copy on top of the
      // motion blur. The photo loads asynchronously, hence the explicit check.
      fg.style.opacity = fg.dataset.hidden === '1' ? '0' : '1';
      // A photograph is one flat image, so the subject is cut out with a mask.
      fg.style.setProperty('--fg-mask', scene.fgMask);
      fg.classList.add('layer-masked');
      setSliceImages(sliceEls, url);
      scene.usingPhoto = true;
    };
    probe.onerror = function () { scene.usingPhoto = false; };
    probe.src = scene.photo;
  }

  function setSliceImages(sliceEls, url) {
    if (!sliceEls) return;
    sliceEls.forEach(function (el) { el.style.backgroundImage = url; });
  }

  /* Thumbnail artwork for the home page tiles. */
  function thumbnail(sceneId) {
    var scene = SCENES[sceneId] || SCENES.landscape;
    if (USE_PHOTOS && scene.photo) return scene.photo;
    return svgURI(scene.art.bg());
  }

  /* ---------- Before / after comparison ----------

     Every effect in this app is expressed as inline style on the stage's own
     elements, so a deep clone taken while the reference settings are applied
     is a complete frozen "before". The live stage keeps playing the role of
     "after", which means the comparison stays correct as the user keeps
     moving sliders — nothing has to be re-rendered twice.

     applyReference / applyCurrent are the lab's own render calls. Both run in
     the same tick, so the browser only ever paints the final state and the
     snapshot costs no visible flicker. */
  function compare(stageRef, applyReference, applyCurrent) {
    var split = 50;
    var active = false;
    var layer = null;
    var handle = null;
    var mounted = null; // the stage element the overlay was attached to
    var retried = false; // one-shot re-snapshot once a late photo arrives

    /* The Triangle swaps its stage when the scene changes, so the stage may be
       supplied as a getter rather than a fixed object. */
    function hostEl() {
      var s = typeof stageRef === 'function' ? stageRef() : stageRef;
      return s && s.el;
    }

    var button = UI.h('button', {
      type: 'button', class: 'btn', 'aria-pressed': 'false',
      onClick: function () { setActive(!active); }
    }, 'Compare');

    function snapshot(host) {
      applyReference();
      var clone = host.cloneNode(true);
      applyCurrent();

      clone.className = 'stage compare-clone';
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('role');
      clone.removeAttribute('tabindex');
      clone.removeAttribute('aria-label');
      // Anything that would read as a second copy of the live UI.
      Array.prototype.forEach.call(
        clone.querySelectorAll('.stage-badge, .af-box, .compare-layer, .compare-handle, .compare-tag'),
        function (node) { node.parentNode.removeChild(node); }
      );
      return clone;
    }

    function build() {
      var host = hostEl();
      if (!host) return;
      mounted = host;

      layer = UI.h('div', { class: 'compare-layer', 'aria-hidden': 'true' }, [
        snapshot(host),
        UI.h('span', { class: 'compare-tag compare-tag-before', text: 'Before' })
      ]);
      handle = UI.h('div', {
        class: 'compare-handle',
        role: 'slider',
        tabindex: '0',
        'aria-label': 'Before and after split position',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-orientation': 'horizontal'
      }, UI.h('span', { class: 'compare-grip', 'aria-hidden': 'true' }));

      handle.addEventListener('pointerdown', onDown);
      handle.addEventListener('keydown', onKey);

      host.appendChild(layer);
      host.appendChild(UI.h('span', { class: 'compare-tag compare-tag-after', text: 'After' }));
      host.appendChild(handle);
      host.classList.add('comparing');
      paint();
      awaitPhoto();
    }

    /* A stage created moments ago may still be showing its SVG placeholder,
       which would freeze into the snapshot. Re-take it once the photo lands. */
    function awaitPhoto() {
      var s = typeof stageRef === 'function' ? stageRef() : stageRef;
      if (retried || !USE_PHOTOS || !s || !s.scene.photo || s.scene.usingPhoto) return;
      retried = true;
      var probe = new Image();
      probe.onload = function () {
        if (!active) return;
        var keep = split;
        teardown();
        build();
        setSplit(keep);
      };
      probe.src = s.scene.photo;
    }

    function teardown() {
      if (mounted) {
        Array.prototype.forEach.call(
          mounted.querySelectorAll('.compare-layer, .compare-handle, .compare-tag'),
          function (node) { node.parentNode.removeChild(node); }
        );
        mounted.classList.remove('comparing', 'compare-at-edge');
      }
      layer = handle = mounted = null;
    }

    function paint() {
      if (!layer) return;
      // Reveal the frozen copy from the left edge up to the split.
      layer.style.clipPath = 'inset(0 ' + (100 - split).toFixed(2) + '% 0 0)';
      handle.style.left = split.toFixed(2) + '%';
      handle.setAttribute('aria-valuenow', Math.round(split));
      handle.setAttribute('aria-valuetext', Math.round(split) + '% before');
      mounted.classList.toggle('compare-at-edge', split < 6 || split > 94);
    }

    function setSplit(pct) {
      split = Camera.clamp(pct, 0, 100);
      paint();
    }

    function fromEvent(event) {
      var rect = mounted.getBoundingClientRect();
      return ((event.clientX - rect.left) / rect.width) * 100;
    }

    function onDown(event) {
      event.preventDefault();
      event.stopPropagation(); // the stage underneath may be a control itself
      handle.setPointerCapture(event.pointerId);
      handle.classList.add('dragging');
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    }
    function onMove(event) { setSplit(fromEvent(event)); }
    function onUp(event) {
      handle.classList.remove('dragging');
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    }

    function onKey(event) {
      var step = event.shiftKey ? 10 : 2;
      var map = { ArrowLeft: -step, ArrowRight: step, Home: -100, End: 100 };
      if (!(event.key in map)) return;
      event.preventDefault();
      event.stopPropagation();
      setSplit(event.key === 'Home' ? 0 : event.key === 'End' ? 100 : split + map[event.key]);
    }

    function setActive(next) {
      if (next === active) return;
      active = next;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.textContent = active ? 'Exit compare' : 'Compare';
      if (active) { split = 50; build(); } else teardown();
    }

    return {
      button: button,
      get active() { return active; },
      /* Re-take the "before" — after a scene swap, or once a photo has loaded. */
      refresh: function () {
        if (!active) return;
        var keep = split;
        retried = false;
        teardown();
        build();
        setSplit(keep);
      },
      close: function () { setActive(false); }
    };
  }

  global.Scenes = {
    usePhotos: USE_PHOTOS,
    SCENES: SCENES,
    createStage: createStage,
    compare: compare,
    thumbnail: thumbnail,
    svgURI: svgURI
  };
})(window);
