var basePathBackend = '';
var suggestions;

function logout() {
	document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;domain=sintra;path=/";
}

function loadConfig() {
	$.ajax({
		type: 'GET',
		url: basePathBackend + '/config/suggestions',
		success: function(res){
			suggestions = JSON.parse(res);
			console.log('config loaded');
		}
	});;
}