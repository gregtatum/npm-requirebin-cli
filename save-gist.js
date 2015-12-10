module.exports = function saveGist( github, gist, id ) {

	return new Promise( function( resolve, reject ) {
		
		var complete = function (err, newGist) {
			if (err) {
				if (typeof err !== 'string') err = JSON.stringify(err)
				err = Error(err)
				reject( err )
			} else {
				resolve(newGist)
			}
		}

		github.getGist(id).read(function (err) {
			if (err && err.error === 404) {
				// a gist with this id does not exist. create a new one:
				github.getGist().create(gist, function (err, data) {
					if (err) return complete(err)
					complete(null, data)
				})
				return
			}
			// check for non-404 error
			if (err) return complete('get error' + JSON.stringify(err))

			// The gist exists. Update it:
			github.getGist(id).update(gist, function (err, data) {
				if (!err) return complete(null, data) // successful update.

				// Arbitrary error while updating
				if (err.error !== 404) return complete(err)

				github.getGist(id).fork(function (err, data) {
					if (err) return complete(err) // failed to fork

					github.getGist(data.id).update(gist, function (err, data) {
						if (err) return complete(err) // failed to update fork

						return complete(null, data) // successful fork update
					})
				})
			})
		})
	})
}