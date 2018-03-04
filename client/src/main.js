// requires


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




// get dictionnary
let dico
const xhr = new XMLHttpRequest();
xhr.open('GET', "/dico", true);
xhr.send();
xhr.onreadystatechange = processRequest;
function processRequest(e) {
  if (xhr.readyState == 4 && xhr.status == 200) {
    dico = JSON.parse(xhr.response)
    chooseNewWord()
  }
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
      weight = Math.max(2, weight)
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
    computeWordWeights({exclusions:[currentWord], specificDictationWeeks:['2018-03-05T02:00:00.000Z']})
  console.log('chooseNewWord');
  console.log(weights);
  currentWord = weighted.select(dico, weights)
  currentWrongAnswers = 0
  console.log("newWord", currentWord.word)
  playCurrent()
}

// switch history when clicked
switchHistBtn.onclick = () => {
  historyEl.classList.toggle('hidden')
  if (switchHistBtn.textContent === '-') {
    switchHistBtn.textContent = '+'
  }else {
    switchHistBtn.textContent = '-'
  }
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

// check the answer and update database and scores
function checkAnswer() {
  const answer = input1El.value

  if (answer === '') {return}

  totalAnswers += 1
  if (answer === currentWord.word) {
    // was it the right answer at first try ?
    if (currentWrongAnswers === 0 ) {
      resultEl.innerHTML = `Well done, la réponse est bien "${answer}" ! !`
      currentWord.rights.push(new Date())
      rightAnswers += 1
      addHistory(true)
    }else {
      resultEl.innerHTML = `La réponse était bien au final "${answer}" ! !<br>La prochaine fois tu l'auras du 1er coup :-)`
      currentWord.rights.push(new Date())
      rightAnswers += 1
      addHistory(false)
    }
    saveDico()
    chooseNewWord()
    input1El.value = ''

  }else {
    // playCurrent()
    if(currentWrongAnswers === 0){
      playError()
      resultEl.textContent = "Perdu, tente encore une fois !"
      currentWord.wrongs.push(new Date())
      saveDico()
    }else if (currentWrongAnswers === 1) {
      playError()
      resultEl.innerHTML = `hum, la bonne réponse était : "${currentWord.word}"<br>Essayons un nouveau mot.`
      addHistory(false)
      chooseNewWord()
      input1El.value = ''
    }
    currentWrongAnswers += 1
  }
  displayScores()
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
        console.log('post done');
    }
  }
  xhr.send(JSON.stringify(dico));
}
