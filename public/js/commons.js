var basePathBackend = '';

function logout() {
	document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;domain=sintra;path=/";
}

function loadConfig() {
	$.ajax({
		type: 'GET',
		url: basePathBackend + '/config/fileNamePatternsToSuggestions',
		success: function(res){
			fileNamePatternsToSuggestions = JSON.parse(res);
			console.log('config loaded');
		}
	});;
}