# Sample photographs

These CC0 / public-domain photographs ship with the site and are used by every
lab. See `ATTRIBUTION.md` for credits.

```text
portrait.jpg    foreground subject with a distant background (Aperture)
action.jpg      obvious movement: cyclist, runner, car (Shutter)
street.jpg      dusk street: movement, depth and shadows (Triangle)
night.jpg       dark scene with texture and shadow detail (ISO)
indoor.jpg      neutral indoor scene with recognisable colours (White Balance)
landscape.jpg   wide scene with near and far detail (Exposure)
focus.jpg       near subject and far subject (Focus)
waterfall.jpg   flowing water (Triangle scene picker)
concert.jpg     very dark stage with a performer (Triangle scene picker)
beach.jpg       bright daylight, near-to-far depth (Triangle scene picker)
runner.jpg      daylight movement across the frame (Triangle scene picker)
```

## Replacing a photograph

1. Drop a landscape photo (16:10, ~1280×800 or larger) in with the same filename.
2. Adjust that scene's `fgMask` in the `SCENES` registry in `js/scenes.js` so the
   mask covers the subject that should stay sharp — everything outside it is
   treated as background and receives the blur.

Setting `USE_PHOTOS = false` at the top of `js/scenes.js` falls back to the
built-in vector artwork, which needs no image files at all.
