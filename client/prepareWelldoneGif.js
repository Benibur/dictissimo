'use strict'

/*
list the filenames of dir src/ressources/welldone-gif in an array
and store it in src/welldone-gif-filesName.json
*/
const fs = require('fs')
const filesName = fs.readdirSync('./client/src/ressources/welldone-gif')
fs.writeFileSync('./client/src/welldone-gif-filesName.json', JSON.stringify(filesName))
