var basePathBackend = '';
var suggestions = [];
const TOKENEXPIRED = 'TOKENEXPIRED';

function logout(reason) {
	document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;domain=;path=/";
	location.href = '/' + ((reason == TOKENEXPIRED) ? '?tokenexpired=1' : '');
}

function loadConfig(onComplete) {
	$.ajax({
		type: 'GET',
		url: basePathBackend + '/config/suggestions',
		success: function(res){
			suggestions = res ? JSON.parse(res) : [];
			console.log('config loaded');
			
			if (onComplete !== undefined) {
				onComplete();
			}
		}
	});;
}

function checkSuggestion(whatToLookFor, whatToSearchIn) {
	var matches = new RegExp(whatToLookFor, 'gm').exec(whatToSearchIn); 
	return matches && matches.length > 0;
}

function smoothScroll(elm) {
	$('html, body').animate({
		scrollTop: elm.offset().top - 60
	}, 700);
}
