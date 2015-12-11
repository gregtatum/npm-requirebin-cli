var CreateSandbox = require('browser-module-sandbox')
var Uglify = require('uglify-js')
var ReadFile = require('fs').readFileSync
var WriteFile = require('fs').writeFileSync
var GetCLIArgs = require('minimist')
var GithubApi = require('github-api')
var GithubAuthentication = require('ghauth')
var Promisify = require('pify')
var SaveGist = require('./save-gist')

// This gets replaced when run
var SOURCE = "{{SOURCE}}"
var PACKAGE = "{{PACKAGE}}"

try {
	main()
} catch (err) {
	console.log("There was an error trying to use requirebin cli.")
	console.log(err)
	window.close()
}

function main() {

	var div = document.createElement('div')
	document.body.appendChild( div )
	
	var githubConnection = getGithubConnection()
	
	var sandbox = CreateSandbox({
		cdn: 'https://wzrd.in',
		container: div,
		inMemory : true,
		iframeStyle: 'body, html { height: 100% width: 100% }'
	})
	
	console.log('Initializing bundler')
	setTimeout(function delayForDatabaseInitialization() {
		
		var config = getCurrentConfiguration()
		
		sandbox.on('bundleEnd', handleBundleEnd.bind(null, config, githubConnection) )
		
		console.log('Getting ready to bundle code')
		sandbox.bundle(
			config.sourceCode,
			config.packageJson.dependencies
		)
		
	}, 1000)
	
	
}

function getCurrentConfiguration() {
	
	var source = ReadFile( SOURCE, 'utf8' )
	var packageText = ReadFile( PACKAGE, 'utf8' )
	var packageJson = JSON.parse( packageText )
	
	return {
		sourceCode  : source,
		packageJson : packageJson,
		packageText : packageText,
		'public'    : true,
		description : packageJson.description || 'requirebin sketch',
	}
}

function handleBundleEnd( config, githubConnection, bundle ) {
	
	console.log('Source code is bundled')
	
	var minified = Uglify.minify(bundle.script, {fromString: true, mangle: false, compress: false})

	console.log('Source code is minified')

	var gist = {
		'description': config.description,
		'public':      config.public,
		'files': {
			'index.js': {
				'content': config.sourceCode
			},
			'minified.js': {
				'content': minified.code
			},
			'requirebin.md': {
				'content': 'made with [requirebin](http://requirebin.com)'
			},
			'package.json': {
				'content': config.packageText
			}
		}
	}
	
	var userName

	githubConnection.then(function( github ) {
		
		userName = github.user
		console.log('Github connection was made')
		
		return SaveGist( github.api, gist, config.packageJson.id )
		
	}).then(function updatePackageJson(newGist) {
		
		console.log('Gist saved')
		
		var requireBinUrl = "http://requirebin.com/?gist=" + userName + "/" + newGist.id
		var gistUrl = "https://gist.github.com/" + userName + "/" + newGist.id

		if( newGist.id != config.packageJson.id ) {
			
			config.packageJson.id = newGist.id
			config.packageJson.requireBinUrl = requireBinUrl
			config.packageJson.gistUrl = gistUrl
			
			var newJson = JSON.stringify( config.packageJson, null, '  ' )
			try {
				WriteFile( PACKAGE, newJson )
				console.log('Finished saving package.json')				
			} catch( error ) {
				console.log('Unable to save package.json')
				console.log( error )
			}
			
		}
		
		console.log("---------------------------------------------")
		console.log("RequireBin:", requireBinUrl)
		console.log("Gist:", gistUrl)
		console.log("")
		window.close()
	})

}

function getGithubConnection() {
	
	var authOptions = {
		configName : 'requirebin-cli',
		scopes     : [ 'gist' ],
		note       : 'Token for access to your gists',
		userAgent  : 'requirebin-cli',
	}
	
	return  Promisify(GithubAuthentication)( authOptions )
	.then(function( data ) {

		return {
			user : data.user,
			api : new GithubApi({
				type: 'oauth',
				token: data.token
			})
		}
	})
}