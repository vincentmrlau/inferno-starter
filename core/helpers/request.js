import _ from 'underscore'
import store from 'core/helpers/store'

/**
 * This is our overly complicated isomorphic "request"
 * @param state
 * @returns {Function}
 */
export default (hostname, token) => {
    return function(url, body, postForm = false) {
        const requestURL = createURL(hostname, url)
        const requestToken = process.env.BROWSER ? getCookie('token') : token
        const requestOptions = {
            credentials: 'include',
            headers: {}
        }
        if (body && postForm) {
            let formData = new FormData()
            _.each(body, (value, field) => formData.append(field, value))
            requestOptions.method = 'POST'
            requestOptions.body = formData
        } else if (body) {
            requestOptions.method = 'POST'
            requestOptions.body = JSON.stringify(body)
            requestOptions.headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
        console.info('requestURL:', requestURL)
        requestOptions.headers.token = requestToken

        return fetch(requestURL, requestOptions).then(handleResponse)
    }
}

/**
 * Prepend host of API server
 * @param path
 * @returns {String}
 * @private
 */
function createURL(hostname, path) {
    if (process.env.BROWSER) {
        return '/' + path.trimLeft('/')
    } else {
        return `http://${hostname}/` + path.trimLeft('/')
    }
}

/**
 * Parse response
 * @param resp
 * @returns {Promise}
 * @private
 */
function handleResponse(resp) {
    const isJSON = resp.headers && resp.headers.get('Content-Type').includes('json');
    const response = resp[isJSON ? 'json' : 'text']();

    return resp.ok ? response : response.then(err => {
        console.error('Error received from server', err)
        throw err
    });
}

function getCookie(key) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)')
    return cookieValue ? cookieValue.pop() : ''
}
