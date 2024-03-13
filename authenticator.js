let jwt = require('jsonwebtoken');
const config = require('./config.js');

let checkToken = (req, res, next) => {
	let cookies = parseCookies (req);
	
	if (cookies && cookies.token) {
		jwt.verify(cookies.token, config.secret, (err, decoded) => {
			if (err) {
				return res.status(401).send('Forbidden');
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		return res.status(401).send('Forbidden');
	}
};

let login = (req, res) => {
	let password = req.query.password;

	if (password && (password === config.password)) {
		let token = jwt.sign({}, config.secret, { expiresIn: '24h'});
		
		// try to load settings from file automatically
		config.tryToLoadSettingsFromFile();
		
		res.json({token: token});
	} else {
		res.status(403).send('error during authentication');
	}
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

exports.checkToken = checkToken;
exports.login = login;