(function configureDigiApp(global) {
  global.__DIGIAPP_CONFIG__ = Object.assign({
    // Stable free Tailscale Funnel. This file stays outside the bundle so the
    // endpoint can be changed later without recompiling the application.
    backendBaseUrl: 'https://win-htgf0pfg08o.tail688ab8.ts.net/',
  }, global.__DIGIAPP_CONFIG__ || {});
}(window));
