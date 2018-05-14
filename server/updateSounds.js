const gtts     = require('node-gtts')('FR')
const path     = require('path')
const sanitize = require('sanitize-filename')
const Promise  = require('bluebird')
const beautify = require('json-beautify')
const fs       = require('fs')

/* utility in charge of finding the wav file for each word of the dictionnary */

const SOUNDS_DIR   = path.join(__dirname, '../client/src/ressources/sounds')
const DICO_PATH    = path.join(__dirname, './dico.json')
const FORCE_UPDATE = false
const dico         = require(DICO_PATH)

let updateNumber = 0

// target directory existence
if (!fs.existsSync(SOUNDS_DIR)){
  console.log('titi');
  fs.mkdirSync(SOUNDS_DIR)
}

//
Promise.map(dico,(w)=>{
  if (FORCE_UPDATE || w.soundFile === undefined || w.soundFile === ''){
    return new Promise((resolve, reject)=>{
      const filename = sanitize(w.word)+'.wav'
      const filepath = path.join(SOUNDS_DIR, filename );
      console.log("\n new sound file :", filepath)
      gtts.save(filepath, w.word, function() {
        updateNumber += 1
        w.soundFile = filename
        resolve(filename)
      })
    })
  }
},{concurrency:1})

.then( (values)=>{
  if (updateNumber > 0) {
    fs.writeFileSync(DICO_PATH, beautify(dico,null, 2, 80))
  }
})
