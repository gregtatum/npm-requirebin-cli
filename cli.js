#!/usr/bin/env node

var GithubAuthentication = require('ghauth')
var Promisify = require('pify')
var GetCLIArgs = require('minimist')
var Execute = require('child_process').exec

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
	var package = args._[1]
	var help = args.h
	
	if( help || !source || !package ) {
		showHelp()
		return
	}
	
	var command = "hihat '"+ __dirname +"/bundle-upload.js' --exec --node -- "+
		"-t [ envify --SOURCE "+source+" --PACKAGE "+package+" ]"
	
	var hihat = Execute( command )
	hihat.stdout.pipe(process.stdout)

})
.catch(function(err) {
	console.log(err)
})

function showHelp() {
	console.log([
		"Usage:",
		"  requirebin [source.js] [package.json]",
		"",
		"Options:",
		"  -h        show help message",
	].join('\n'))
}



