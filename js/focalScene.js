/* Perspective scene renderer for the Camera Simulator. */
(function (global) {
  'use strict';

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function mix(a, b, amount) { return a + (b - a) * amount; }

  function create(canvas) {
    var context = canvas.getContext('2d');
    var current = { focalLength: 50, cameraDistance: 3, aperture: 2.8, backgroundDistance: 8 };
    var target = Object.assign({}, current);
    var frame = 0;

    function project(x, y, z, width, height) {
      var focalPixels = width * current.focalLength / 36;
      var scale = focalPixels / Math.max(0.25, z) * 0.62;
      return {
        x: width * 0.5 + x * scale,
        y: height * 0.43 - (y - 1.62) * scale,
        scale: scale
      };
    }

    function tree(ctx, x, z, size, width, height, color) {
      var base = project(x, 0, z, width, height);
      var top = project(x, size, z, width, height);
      var crown = Math.max(2, base.scale * size * 0.34);
      ctx.fillStyle = '#4d3725';
      ctx.fillRect(base.x - Math.max(1, crown * 0.08), top.y + crown * 0.75,
        Math.max(2, crown * 0.16), Math.max(2, base.y - top.y - crown * 0.55));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(top.x, top.y + crown * 0.65, crown, 0, Math.PI * 2);
      ctx.arc(top.x - crown * 0.65, top.y + crown, crown * 0.72, 0, Math.PI * 2);
      ctx.arc(top.x + crown * 0.65, top.y + crown, crown * 0.76, 0, Math.PI * 2);
      ctx.fill();
    }

    function person(ctx, distance, width, height) {
      var feet = project(0, 0, distance, width, height);
      var face = project(0, 1.62, distance, width, height);
      var s = feet.scale;
      ctx.save();
      ctx.translate(face.x, face.y);
      ctx.lineCap = 'round';
      ctx.fillStyle = 'rgba(6,8,8,.25)';
      ctx.beginPath();
      ctx.ellipse(0, feet.y - face.y + s * 0.02, s * 0.24, s * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#27344b';
      ctx.lineWidth = Math.max(2, s * 0.13);
      ctx.beginPath();
      ctx.moveTo(-s * 0.09, s * 0.58);
      ctx.lineTo(-s * 0.12, s * 1.48);
      ctx.moveTo(s * 0.09, s * 0.58);
      ctx.lineTo(s * 0.12, s * 1.48);
      ctx.stroke();
      ctx.strokeStyle = '#bf5d38';
      ctx.lineWidth = Math.max(3, s * 0.34);
      ctx.beginPath();
      ctx.moveTo(0, s * 0.12);
      ctx.lineTo(0, s * 0.84);
      ctx.stroke();
      ctx.strokeStyle = '#9d472f';
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.beginPath();
      ctx.moveTo(-s * 0.12, s * 0.3);
      ctx.lineTo(-s * 0.34, s * 0.82);
      ctx.moveTo(s * 0.12, s * 0.3);
      ctx.lineTo(s * 0.34, s * 0.82);
      ctx.stroke();
      ctx.fillStyle = '#d5a17d';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.19, s * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#35251f';
      ctx.beginPath();
      ctx.arc(0, -s * 0.035, s * 0.21, Math.PI, Math.PI * 2);
      ctx.lineTo(s * 0.18, s * 0.1);
      ctx.quadraticCurveTo(s * 0.1, -s * 0.18, 0, -s * 0.22);
      ctx.quadraticCurveTo(-s * 0.16, -s * 0.18, -s * 0.2, s * 0.12);
      ctx.fill();
      ctx.fillStyle = '#30211c';
      ctx.beginPath();
      ctx.arc(-s * 0.065, -s * 0.005, Math.max(1.5, s * 0.012), 0, Math.PI * 2);
      ctx.arc(s * 0.065, -s * 0.005, Math.max(1.5, s * 0.012), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      var width = Math.max(320, rect.width);
      var height = Math.max(200, rect.height);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      var sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#688fab');
      sky.addColorStop(0.58, '#d6cba7');
      sky.addColorStop(1, '#4d5d35');
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      var backgroundBlur = clamp(CameraModel.backgroundBlur(current) * 14, 0, 16);
      context.save();
      context.filter = 'blur(' + backgroundBlur.toFixed(2) + 'px)';
      var mountainZ = current.cameraDistance + current.backgroundDistance + 16;
      var left = project(-16, 0, mountainZ, width, height);
      var middle = project(0, 3.8, mountainZ, width, height);
      var right = project(17, 0, mountainZ, width, height);
      context.fillStyle = '#63745a';
      context.beginPath();
      context.moveTo(0, height);
      context.lineTo(left.x, left.y);
      context.lineTo(middle.x, middle.y);
      context.lineTo(right.x, right.y);
      context.lineTo(width, height);
      context.fill();

      var backZ = current.cameraDistance + current.backgroundDistance;
      [
        [-5.4, 1.7, '#344f31'], [-3.4, 2.3, '#45613a'], [-1.8, 1.6, '#3b5834'],
        [2.3, 2.1, '#3e5d36'], [4.3, 2.6, '#304c2e'], [6.1, 1.8, '#49643a']
      ].forEach(function (item) { tree(context, item[0], backZ, item[1], width, height, item[2]); });
      context.restore();

      var ground = context.createLinearGradient(0, height * 0.55, 0, height);
      ground.addColorStop(0, 'rgba(95,115,60,.15)');
      ground.addColorStop(1, '#344124');
      context.fillStyle = ground;
      context.fillRect(0, height * 0.58, width, height * 0.42);

      person(context, current.cameraDistance, width, height);

      var vignette = context.createRadialGradient(width / 2, height * 0.45, height * 0.15,
        width / 2, height * 0.45, width * 0.7);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,.34)');
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
    }

    function animate() {
      frame = 0;
      var moving = false;
      Object.keys(target).forEach(function (key) {
        var difference = target[key] - current[key];
        current[key] = mix(current[key], target[key], 0.2);
        if (Math.abs(difference) > 0.002) moving = true;
        else current[key] = target[key];
      });
      draw();
      if (moving) frame = requestAnimationFrame(animate);
    }

    return {
      set: function (model) {
        target = Object.assign({}, target, model);
        if (!frame) frame = requestAnimationFrame(animate);
      },
      draw: draw
    };
  }

  global.FocalScene = { create: create };
})(window);
