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
		},
		error: function(err) {
			if (err.status == 401) {
				logout(TOKENEXPIRED);
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

function showTemporaryMessage(type, txt, onComplete, parentElement) {
	var id = 'message-' + Math.ceil(Math.random() * 10000000000);
	
	$(parentElement ? parentElement : 'body .messagearea').append(
		$('#messagetemplate').clone()
			.attr('id', id)
			.addClass('alert-' + type)
			.html(txt)
	);
	
	$('#' + id)
		.show()
		.delay(2500)
		.slideUp(400, onComplete);
}