#!/usr/bin/env node

var GithubAuthentication = require('ghauth')
var Promisify = require('pify')
var GetCLIArgs = require('minimist')
var Execute = require('npm-execspawn')

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
	var source = args._[0]
	var packageJson = args._[1]
	var help = args.h
	
	if( help || !source || !packageJson ) {
		showHelp()
		return
	}
	
	var command = "hihat '"+ __dirname +"/bundle-upload.js' --exec --quit --node -- "+
		"-t [ envify --SOURCE "+source+" --PACKAGE "+packageJson+" ]"

	console.log("Loading up electron to perform its magic")
	
	var hihat = Execute( command )
	hihat.stdout.pipe(process.stdout)
	hihat.stderr.pipe(process.stderr)

})
.catch(function(err) {
	console.log(err)
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



