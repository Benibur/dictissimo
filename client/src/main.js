// get the possible reward gif files
const rewardFileNames = require('./welldone-gif-filesName.json')


// prepare html content
require("./style.styl")
const htmlbody = require("./my-jade.jade")()
const Combokeys = require("combokeys")
document.body.innerHTML = htmlbody


// get html elements references
const input1El       = document.getElementById('input1')
const resultEl       = document.getElementById('result')
const playBtn        = document.getElementById('playBtn')
const switchHistBtn  = document.getElementById('switchHistBtn')
const rightAnswersEl = document.getElementById('rightAnswers')
const totalAnswersEl = document.getElementById('totalAnswers')
const historyEl      = document.getElementById('history')
const rewardGifEl    = document.getElementById('rewardGif')


// get dictionnary
let dico
const xhr = new XMLHttpRequest();
xhr.open('GET', "/dico", true);
xhr.send();
xhr.onreadystatechange = processRequest;
function processRequest(e) {
  if (xhr.readyState == 4 && xhr.status == 200) {
    dico = normaliseDico(JSON.parse(xhr.response))
    chooseNewWord()
    playCurrent()
  }
}


// normalise dictionnary Content (in case the dictionnary was created by hand, some fields may have to be normalised)
function normaliseDico(dico) {
  for (let word of dico) {
    if (word.word_ok === undefined) {
      word.word_ok = ''
    }
    if (word.rule === undefined) {
      word.rule = ''
    }
    if (word.hint === undefined) {
      word.hint = ''
    }
  }
  return dico
}

// compute words weights
let weights = []
function computeWordWeights(options={exclusions:[], specificDictationWeeks:[]}) {
  weights = []
  for (let w of dico) {
    const rights = w.rights.length
    const wrongs = w.wrongs.length
    let weight
    if (wrongs+rights === 0) {
      weight = 100
    }else {
      weight = Math.round(wrongs/(rights+wrongs)*100)
      weight = Math.max(15, weight)
    }
    if (options.exclusions.includes(w)) {
      weight = 0
    }
    // exclude words out of optionnal specificDictationWeeks
    if (options.specificDictationWeeks.length>0) {
      if (!w.weekDictation || (w.weekDictation && !options.specificDictationWeeks.includes(w.weekDictation))) {
        weight = 0
      }
    }
    weights.push(weight)
  }
}


// choose a random word
const weighted = require('weighted')
let currentWord,
    currentWrongAnswers
function chooseNewWord() {
  computeWordWeights({exclusions:[currentWord], specificDictationWeeks:['2018-03-19T02:00:00.000Z']})
  // console.log('chooseNewWord');
  // console.log(weights);
  _printWeights()
  currentWord = weighted.select(dico, weights)
  currentWrongAnswers = 0
  console.log("\ newWord", currentWord.word)
  // playCurrent()
}



// Helper function to check the evolution of the dico and test the relevance of weights
function _printWeights() {
  console.log('_printWeights()');
  const displayList = []
  for (var i = 0; i < weights.length; i++) {
    const weight = weights[i]
    const word = dico[i]
    if (weight>0) {
      displayList.push([weight,word.word])
    }
  }
  displayList.sort( (el1,el2) => el1[0]<el2[0] )
  for (item of displayList) {
    console.log(item[0], item[1]);
  }
}

// switch history when clicked
switchHistBtn.onclick = () => {
  historyEl.classList.toggle('hidden')
  if (switchHistBtn.textContent === '-') {
    switchHistBtn.textContent = '+'
  }else {
    switchHistBtn.textContent = '-'
  }
  input1El.focus()
}


// replay word sound button
playBtn.onclick = () => {
  playCurrent()
  input1El.focus()
}
function playCurrent() {
  const audio = new Audio(`/sounds/${currentWord.soundFile}`)
  audio.play()
}
function playError() {
  const audio = new Audio(`/beeps/error-tone.wav`)
  audio.play()
  audio.onended = ()=>{

  }
}
function playRightAnswer() {
  const audio = new Audio(`/beeps/welldone-tone.wav`)
  audio.volume = 0.4
  audio.play()
}


// listen to shortcuts
const combokeys = new Combokeys(document.documentElement)
combokeys.bind('ctrl+enter', function() {
  playCurrent()
  resultEl.textContent = `Alors alors ??? :-)`
})
combokeys.bind('enter', function() {
  checkAnswer()
})


// initiate scores
let rightAnswers = 0
let totalAnswers = 0
displayScores()
function displayScores() {
  rightAnswersEl.textContent = rightAnswers
  totalAnswersEl.textContent = totalAnswers
}


// Check the answer and update database and scores
function checkAnswer() {
  const answer = input1El.value

  if (answer === '') {return}

  totalAnswers += 1
  if (answer === currentWord.word || answer === currentWord.word_ok) {
    // was it the right answer at first try ?
    playRightAnswer()
    if (currentWrongAnswers === 0 ) {
      resultEl.innerHTML = `Well done, la réponse est bien "${answer}" ! !`
      displayRandomGifReward()
      currentWord.rights.push(new Date())
      rightAnswers += 1
      addHistory(true)
    }else {
      resultEl.innerHTML = `La réponse était bien au final "<span class="correction">${answer}</span>" ! !<br>La prochaine fois tu l'auras du 1er coup :-)`
      currentWord.rights.push(new Date())
      rightAnswers += 1
      addHistory(false)
    }
    saveDico()
    chooseNewWord()
    setTimeout(playCurrent, 1000)
    input1El.value = ''

  }else {
    playError()
    if(currentWrongAnswers === 0){
      resultEl.textContent = "Perdu, tente encore une fois !"
      currentWord.wrongs.push(new Date())
      saveDico()
      currentWrongAnswers += 1
    }else if (currentWrongAnswers === 1) {
      var feedback = `hum, la bonne réponse était : "<span class="correction">${currentWord.word}</span>"`
      if (currentWord.rule !== '') {
        feedback += `<br>=> Règle : ${currentWord.rule}`
      }
      if (currentWord.hint !== '') {
        feedback += `<br>=> Astuce : ${currentWord.hint}`
      }
      feedback += `<br><br>Essayons un nouveau mot.`
      resultEl.innerHTML = feedback
      addHistory(false)
      chooseNewWord()
      playCurrent()
      input1El.value = ''
    }
  }
  displayScores()
}


function displayRandomGifReward(){
  const selectedFile = weighted.select(rewardFileNames,(new Array(rewardFileNames.length)).fill(1,0))
  rewardGifEl.src = '/welldone-gif/' + selectedFile
  console.log('on a voulu afficher', selectedFile );
  setTimeout(()=>{
    rewardGifEl.src = ''
  },5000)
}

function addHistory(wasRight) {
  const newLi = document.createElement('LI')
  newLi.textContent = currentWord.word
  if (wasRight) {
    newLi.classList.add('right-answer')
  }else {
    newLi.classList.add('wrong-answer')
  }
  if (historyEl.firstChild) {
    historyEl.insertBefore(newLi,historyEl.firstChild)
  }else {
    historyEl.appendChild(newLi)
  }
}


function saveDico() {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', "/dico", true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function() {//Call a function when the state changes.
    if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
        // console.log('Save dico done');
    }
  }
  xhr.send(JSON.stringify(dico));
}
