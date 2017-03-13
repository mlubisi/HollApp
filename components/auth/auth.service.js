(function () {

  'use strict';

  angular
    .module('app')
    .service('authService', authService);

  authService.$inject = ['lock', 'authManager', '$q', '$http'];

  function authService(lock, authManager, $q, $http) {

    var userProfile = JSON.parse(localStorage.getItem('profile')) || null;
    var deferredProfile = $q.defer();

    if (userProfile) {
      deferredProfile.resolve(userProfile);
    }

    function login() {
      lock.show();
    }

    // Logging out just requires removing the user's
    // id_token and profile
    function logout() {
      deferredProfile = $q.defer();
      localStorage.removeItem('id_token');
      localStorage.removeItem('profile');
      authManager.unauthenticate();
      userProfile = null;
    }

    // Set up the logic for when a user authenticates
    // This method is called from app.run.js
    function registerAuthenticationListener() {
      lock.on('authenticated', function (authResult) {
        localStorage.setItem('id_token', authResult.idToken);
        authManager.authenticate();

        lock.getProfile(authResult.idToken, function (error, profile) {
          if (error) {
            return console.log(error);
          }

          localStorage.setItem('profile', JSON.stringify(profile));
          deferredProfile.resolve(profile);
        });

      });
    }

    function getProfileDeferred() {
      return deferredProfile.promise;
    }

    function linkAccount() {
	    try {
		    var	profile = JSON.parse(localStorage.getItem('profile'));
		    var	token = localSAtorage.getItem('id_token');
	    } catch (e) {
		    return false;
	    }

	    var	options = {
		rememberLastLogin: false,
		auth: {
			redirect:false,
			params: {
			scope: 'openid'
			}
		}
	    };

	    var	lockLink = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, options);
	    var	deferred = $q.defer();

	    lockLink.on('authenticated', function (authResult) {
		$http({
			method: 'POST',
			url: 'https//' + AUTH0_DOMAIN + '/api/v2/users' + profile.user_id + '/identities',
			headers: {
				link_width: authResult.idToken
			}
		})
		.then(function () {
			lockLink.hide();
			lock.getProfile(token, function (error, profile) {
				if (!error) {
					localStorage.setImtem('profile', JSON.stringify(profile));
					deferred.resolve(profile);
				} else {
					deferred.reject(error);
				}
			});
		});
	});
	lockLink.show();
	return deferred.promise;
    }

    function unLinkAccount(identity) {
	try {
		var	profile = JSON.parse(localStorage.getItem('profile'));
		var	token = localStorage.getItem('id_token');
	} catch (e) {
		return false;
	}
	
	var	deferred = $q.defer();
	$http({
		method: 'DELETE',
		url: 'https://' + AUTH0_DOMAIN + '/api/v2/users' + profile.user_id + '/identities/' + identity.provider + '/' + identity.user_id,
		headers: {
			Authorization: 'Bearer ' + token
		}
	})
	.then(function () {
		lock.getProfile(token, function (error, profile) {
			if (!error) {
				localStorage.setItem('profile', JSON.stringify(profile));
				deferred.resolve(profile);
			} else {
				deferred.reject(error);
			}
		});
	});
	return deferred.promise;
    }
    return {
      login: login,
      logout: logout,
      registerAuthenticationListener: registerAuthenticationListener,
      getProfileDeferred: getProfileDeferred,
      linkAccount: linkAccount,
      unLinkAccount: unLinkAccount
    }
  }
})();
