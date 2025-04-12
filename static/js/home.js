const defList = document.getElementById("definitions");
const wordEl = document.getElementById("word-container");

const basePoints = 100;

var helpCount = 0;
var tries = 0;
var points = 0;

var currentWord;

window.onresize = windowCheck;
windowCheck();

gameCycle();

function windowCheck() {
    if (window.innerHeight > window.innerWidth) {
        document.getElementById("container").style.display = "none";
        document.getElementById("rotate").style.display = "block";
    } else {
        document.getElementById("container").style.display = "block";
        document.getElementById("rotate").style.display = "none";
    }
}

async function gameCycle() {
    let valid = await newWord();

    while (!valid) {
        valid = await newWord();
    }
}

async function newWord() {
    let request = new Request("/randomword");
    let data = await fetch(request);
    currentWord = await data.text();

    let dictRequest;
    try {
        dictRequest = new Request(`https://api.dictionaryapi.dev/api/v2/entries/en/${currentWord.replaceAll(" ", "-")}`);
        data = await fetch(dictRequest);
    } catch {
        try {
            dictRequest = new Request(`https://api.dictionaryapi.dev/api/v2/entries/en/${currentWord}`);
            data = await fetch(dictRequest);
        } catch {
            // Failed to get word
            return false;
        }
    }
    
    data = await data.json();

    wordEl.innerHTML = "";

    let definitions, synonyms;

    try {
        definitions = data[0].meanings[0].definitions;
        synonyms = data[0].meanings[0].synonyms;
    } catch {
        return false;
    }

    for (let i = 0; i < currentWord.length; i++) wordEl.innerHTML += `<td><input type="text" data-pos="${i}"></input></td>`

    for (let child of wordEl.children) {

        child.oninput = async function(event) {

            let pos = parseInt(child.children[0].dataset.pos);

            if (event.inputType != "deleteContentBackward") {
                if (!child.children[0].readOnly) child.children[0].value = child.children[0].value[child.children[0].value.length - 1];

                if (pos < currentWord.length - 1) {

                    for (let i = 1; i < currentWord.length - pos; i++) {
    
                        if (!wordEl.children[pos + i].children[0].readOnly) {
                            let inputEl = wordEl.children[pos + i].children[0];
                            setTimeout(() => {
                                inputEl.focus();
                            }, 0);
                            break;
                        };
    
                    };
    
                };

                await tryGuess();

                return;
            }

            for (let i = 1; i <= pos; i++) {

                if (!wordEl.children[pos - i].children[0].readOnly) {
                    wordEl.children[pos - i].children[0].focus();
                    break;
                };

            };
        }
    }

    defList.innerHTML = `<span class="text" style="font-size: 2vw;">Definition(s)</span>`;

    try {
        for (let def of definitions) {
            defList.innerHTML += `<li class="text definition">${def.definition}</li>`;
        }
    } catch {
        defList.innerHTML += `<li class="text definition">${data[0].meanings[0].definition}</li>`;
    }

    if (synonyms.length > 0) defList.innerHTML += `<span class="text" style="font-size: 2vw;">Synonym(s)</span>`;

    for (let synonym of synonyms) {
        defList.innerHTML += `<li class="text definition">${synonym}</li>`;
    }

    revealLetter(false);
    revealLetter(false);

    for (let i = 0; i < currentWord.length; i++) {

        if (!wordEl.children[i].children[0].readOnly) {
            wordEl.children[i].children[0].focus();
            break;
        };

    };

    return true;
}

function revealLetter(sub = true) {
    let full = true;

    let count = 0;
    
    for (let child of wordEl.children) {
        if (!child.children[0].readOnly) {
            full = false;
            count++;
        }
    }

    if (full) {
        helpCount = 0;
        gameCycle();
        return;
    }

    if (sub) helpCount++;

    while (true) {
        let index = Math.floor(Math.random() * currentWord.length);
        if (wordEl.children[index].children[0].readOnly) continue;
        wordEl.children[index].children[0].value = currentWord[index];
        wordEl.children[index].children[0].readOnly = true;
        wordEl.children[index].style.borderColor = "green";
        break;
    }

    if (count == 1) {
        helpCount = 0;
        gameCycle();
    } else {
        tryGuess();
    }
}

async function tryGuess() {
    let guess = "";

    for (ch of wordEl.children) {
        guess += ch.children[0].value;
        if (ch.children[0].value == "") return;
    }

    if (guess != currentWord) {
        tries++;
        for (ch of wordEl.children) {
            ch.className = "wrong";
        }
        setTimeout(() => {
            for (ch of wordEl.children) {
                ch.className = "";
            }
        }, 650);
        return;
    }

    for (ch of wordEl.children) {
        ch.style.borderColor = "green";
    }

    let tempPoints = basePoints - (helpCount * 10);
    tempPoints -= tries * 5;

    if (tempPoints < 0 || helpCount == currentWord.length) tempPoints = 0;

    points += tempPoints;

    helpCount = 0;
    tries = 0;

    document.getElementById("points").innerText = `${points} points`;

    await gameCycle();
}