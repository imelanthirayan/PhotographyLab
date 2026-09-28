/* Camera Simulator maths. Reference: 35mm full-frame still camera. */
(function (global) {
  'use strict';

  var SENSOR_WIDTH = 36;

  function fieldOfView(focalLength) {
    return 2 * Math.atan(SENSOR_WIDTH / (2 * focalLength)) * 180 / Math.PI;
  }

  function backgroundBlur(model) {
    var focal = model.focalLength;
    var subject = Math.max(0.3, model.cameraDistance) * 1000;
    var background = subject + Math.max(0.2, model.backgroundDistance) * 1000;
    var subjectImage = focal * subject / (subject - focal);
    var backgroundImage = focal * background / (background - focal);
    var apertureDiameter = focal / model.aperture;
    return apertureDiameter * Math.abs(subjectImage - backgroundImage) / backgroundImage;
  }

  function depthOfField(model) {
    var f = model.focalLength;
    var n = model.aperture;
    var focus = Math.max(0.3, model.focusDistance);
    var coc = 0.03;
    var hyperfocal = (f * f) / (n * coc) / 1000 + f / 1000;
    var near = (hyperfocal * focus) / (hyperfocal + focus - f / 1000);
    var far = hyperfocal > focus ? (hyperfocal * focus) / (hyperfocal - focus + f / 1000) : 20;
    return { near: Math.max(0.2, near), far: Math.min(20, far) };
  }

  global.CameraModel = {
    fieldOfView: fieldOfView,
    backgroundBlur: backgroundBlur,
    depthOfField: depthOfField
  };
})(window);
