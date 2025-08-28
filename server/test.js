const bcrypt = require('bcrypt');

(async () => {
const hash = await bcrypt.hash('ganesh', 10);
console.log('Hashed password:', hash);
})();