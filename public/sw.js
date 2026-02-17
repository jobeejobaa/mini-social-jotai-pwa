// Nom du cache : si tu changes de version, les utilisateurs récupéreront les nouveaux fichiers
var cacheName = 'mini-social-pwa-v1';

// Fichiers mis en cache dès l'installation (shell de l'app)
var filesToCache = [
  '/',
  '/index.html'
];

// À l'installation du SW : on met en cache la page d'accueil et l'index
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache);
    })
  );
  self.skipWaiting();
});

// À chaque requête réseau : on sert depuis le cache si dispo, sinon on fetch (et on met en cache pour la prochaine fois)
self.addEventListener('fetch', function (e) {
  var request = e.request;

  // Requête de navigation (changement de page) : en offline on renvoie index.html (SPA)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(function () {
        return caches.match('/index.html').then(function (r) {
          return r || caches.match('/');
        });
      })
    );
    return;
  }

  // Autres requêtes : cache d'abord, sinon réseau ; si réseau OK on met en cache pour plus tard
  e.respondWith(
    caches.match(request).then(function (response) {
      if (response) return response;
      return fetch(request).then(function (networkResponse) {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          var responseToCache = networkResponse.clone();
          caches.open(cacheName).then(function (cache) {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
