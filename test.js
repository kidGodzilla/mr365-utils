const { isFreeMail } = require('./index.js');

console.log('isFreeMail (tttf)', isFreeMail('foo@gmail.com'), isFreeMail('foo@duck.com'), isFreeMail('foo@hotmail.com'), isFreeMail('foo@create.so'));
