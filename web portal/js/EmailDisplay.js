function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length === 2) {
        // Decode the cookie value to handle URL encoding
        let cookieValue = decodeURIComponent(parts.pop().split(";").shift());
        
        // Remove the prefix "s:" and everything after ".com"
        let email = cookieValue.replace(/^s:/, '').split('.com')[0] + '.com';
        
        return email;
    }
    return null;
}

window.onload = function() {
    let userEmail = getCookie('user_email');
    if (userEmail) {
        document.querySelector('#sidebar p.text-white.font-semibold').textContent = userEmail;
    } else {
        console.log('User email cookie not found.');
    }
}
