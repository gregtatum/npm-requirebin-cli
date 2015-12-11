#!/usr/bin/env node

var GithubAuthentication = require('ghauth')
var Promisify = require('pify')
var GetCLIArgs = require('minimist')
var Execute = require('npm-execspawn')
var ReadFile = require('fs').readFileSync
var WriteFile = require('fs').writeFileSync
var Path = require('path')

console.log('')


var authOptions = {
	configName : 'requirebin-cli',
	scopes     : [ 'gist' ],
	note       : 'Token for access to your gists',
	userAgent  : 'requirebin-cli',
}

return  Promisify(GithubAuthentication)( authOptions )
.then(function( githubAuth ) {
	
	console.log("You are authenticated to post gists as " + githubAuth.user)
	
	var args = GetCLIArgs( process.argv.slice(2) )
	var source = Path.resolve( args._[0] )
	var packageJson = Path.resolve( args._[1] )
	var help = args.h
	
	if( help || !source || !packageJson ) {
		showHelp()
		return
	}
	
	var sourceScriptPath = __dirname +"/bundle-upload.js"
	var targetScriptPath = __dirname +"/bundle-upload-args.js"
	
	// Manually replace the values in the script for hihat.
	// This is a total hack
	var script = ReadFile( sourceScriptPath, 'utf8' )	
	script = script.replace('"{{SOURCE}}"', JSON.stringify(source))
	script = script.replace('"{{PACKAGE}}"', JSON.stringify(packageJson))
	
	try {
		WriteFile( targetScriptPath, script )
	} catch(err) {
		console.log("Unable to write intermediary script file")
		throw err
	}
	
	var command = "hihat '"+ targetScriptPath +"' --exec --quit --node"

	var hihat = Execute( command )
	hihat.stdout.pipe(process.stdout)
	hihat.stderr.pipe(process.stderr)

})
.catch(function(err) {
	console.log(err)
	if( typeof err === 'object') {
		console.log(err.stack)
	}
})

function showHelp() {
	var packageJson = require('./package.json')
	
	console.log([
		"",
		"Usage:",
		"  requirebin [source.js] [package.json]",
		"",
		"Options:",
		"  -h        show help message",
		"",
		"Version:",
		"  "+ packageJson.name +" v" + packageJson.version,
		
	].join('\n'))
}