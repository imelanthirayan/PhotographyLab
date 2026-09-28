/* App shell: navigation, hash routing and the home screen. */
(function (global) {
  'use strict';

  var ROUTES = [
    Labs.aperture, Labs.shutter, Labs.iso, Labs.whitebalance,
    Labs.exposure, Labs.focus, Labs.triangle, Labs.focal
  ];

  var main = document.getElementById('main');
  var nav = document.getElementById('nav');
  var teardown = [];

  function routeById(id) {
    return ROUTES.filter(function (route) { return route.id === id; })[0];
  }

  /* ---------- Home ---------- */
  function homeView() {
    var hero = Scenes.createStage('portrait', { badge: false, alt: 'Live depth of field preview' });

    // A slow, hands-off demonstration of what the labs do.
    var wide = true;
    var timer = setInterval(function () {
      wide = !wide;
      var f = wide ? 1.4 : 11;
      hero.setBlur('bg', Camera.backgroundBlur(f));
      heroValue.textContent = Camera.formatAperture(f);
      heroValue.classList.remove('value-pulse');
      void heroValue.offsetWidth;
      heroValue.classList.add('value-pulse');
    }, 3200);
    teardown.push(function () { clearInterval(timer); });

    var heroValue = UI.h('div', {
      class: 'value-big value-sm',
      text: 'f/1.4'
    });
    hero.setBlur('bg', Camera.backgroundBlur(1.4));

    var heroOverlay = UI.h('div', {
      class: 'pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between'
    }, [
      heroValue,
      UI.h('span', { class: 'hint', text: 'Aperture' })
    ]);
    hero.el.appendChild(heroOverlay);

    var tiles = ROUTES.map(function (route) {
      return UI.h('a', {
        class: 'tile group',
        href: '#/' + route.id,
        'data-route-link': true
      }, [
        UI.h('div', {
          class: 'tile-art',
          style: 'background-image:url("' + (route.thumbUrl || Scenes.thumbnail(route.thumb || sceneFor(route.id))) + '")'
        }),
        UI.h('div', { class: 'flex items-center justify-between px-4 py-3' }, [
          UI.h('span', { class: 'text-sm font-medium tracking-tight', text: route.title }),
          UI.h('span', { class: 'hint text-zinc-600 group-hover:text-accent', text: '→' })
        ])
      ]);
    });

    return UI.h('section', { class: 'route-view' }, [
      UI.h('div', { class: 'grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]' }, [
        UI.h('div', {}, [
          UI.h('p', { class: 'hint mb-5', text: 'Virtual camera lab' }),
          UI.h('h1', {
            class: 'text-5xl font-semibold leading-[0.95] tracking-tighter sm:text-7xl',
            text: 'Photography Lab'
          }),
          UI.h('p', {
            class: 'mt-6 max-w-md text-lg font-light leading-snug text-zinc-400',
            text: 'Learn photography by changing the settings and seeing what happens.'
          }),
          UI.h('a', {
            class: 'btn btn-primary mt-9',
            href: '#/aperture',
            'data-route-link': true
          }, 'Start Experimenting')
        ]),
        UI.h('div', { class: 'relative' }, hero.el)
      ]),
      UI.h('div', { class: 'grid grid-cols-2 gap-3 pb-6 sm:gap-4 md:grid-cols-4' }, tiles)
    ]);
  }

  /* Scene used for each home tile. */
  function sceneFor(id) {
    return {
      aperture: 'portrait', shutter: 'action', iso: 'night', wb: 'indoor',
      exposure: 'landscape', focus: 'focus', triangle: 'street'
    }[id] || 'landscape';
  }

  /* ---------- Navigation ---------- */
  function buildNav() {
    ROUTES.forEach(function (route) {
      nav.appendChild(UI.h('a', {
        class: 'nav-link',
        href: '#/' + route.id,
        'data-nav': route.id,
        text: route.nav
      }));
    });
  }

  function markActive(id) {
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-link'), function (link) {
      if (link.dataset.nav === id) {
        link.setAttribute('aria-current', 'page');
        // Keeps the current lab visible in the horizontally scrolling mobile nav.
        if (link.scrollIntoView) link.scrollIntoView({ inline: 'center', block: 'nearest' });
      } else link.removeAttribute('aria-current');
    });
  }

  /* ---------- Router ---------- */
  function render() {
    teardown.forEach(function (fn) { fn(); });
    teardown = [];

    var id = (location.hash || '#/').replace('#/', '').trim();
    var route = routeById(id);
    UI.clear(main);

    if (route) {
      main.appendChild(route.build());
      document.title = route.title + ' — Photography Lab';
    } else {
      main.appendChild(homeView());
      document.title = 'Photography Lab — Learn photography by experimenting';
    }
    markActive(route ? route.id : null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  buildNav();
  window.addEventListener('hashchange', render);
  render();
})(window);
