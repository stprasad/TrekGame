function checkArgumentsDefinedAndHaveValue(args)
{
    var x;
    for (x in args)
    {
        arg = args[x];
        console.assert(!(typeof arg == "undefined" || arg == null));
    }
}

function padStringToLength(str, len, padWithChar = ' ')
{
    console.assert(str.length <= len);
    console.assert(padWithChar.length == 1);

    checkArgumentsDefinedAndHaveValue(arguments);

    let padLength = len - str.length;
    let pad1 = Math.floor(padLength / 2);
    let pad2 = padLength - pad1;
    let padLeft = Math.max(pad1,pad2);

    let leftPadStr = str.padStart(padLeft + str.length, padWithChar);

    return leftPadStr.padEnd(len, padWithChar);
}

function randomInt(min, max)
{
    checkArgumentsDefinedAndHaveValue(arguments);
    return Math.round(Math.random() * (max-min) + min);
}

function randomFloat(min, max)
{
    checkArgumentsDefinedAndHaveValue(arguments);
    return (Math.random() * (max-min) + min);
}

function gameOutputScrollToBottom()
{
    let textarea = document.getElementById("gameOutputBox");
    textarea.scrollTop = textarea.scrollHeight;
}

function gameOutputAppend(str)
{
    let textarea = document.getElementById("gameOutputBox")
    textarea.value += str + '\n';
    textarea.scrollTop = textarea.scrollHeight;
}

function updateMap(mapString = game.currentSector.toString())
{
    document.getElementById("map").innerHTML = mapString;
}

function updateMapHeader(str)
{
    document.getElementById("mapHeaderSector").innerHTML = "<pre>"+str+"</pre>";
}

function updateMapFooter(str)
{
    document.getElementById("statusflags").innerHTML = "<pre>"+str+"</pre>";
}

function autosave(game)
{
    //console.log("autosave func");
    //console.log(JSON.stringify(game));

    if (game && !game.gameOver)
    {
        localStorage.setItem("autosave", JSON.stringify(game));

        let textarea = document.getElementById("gameOutputBox")
        localStorage.setItem("outputText", textarea.value);
    }
    else
    {
        localStorage.setItem("autosave", null);
        localStorage.setItem("outputText", null);
    }
}

function makeCDF(instanceProbabilities)
{
    var rval = [];
    let totalSum = 0.0;

    for (var x in instanceProbabilities)
    {
        totalSum += instanceProbabilities[x];
        rval.push(totalSum);
    }

    for (var x in rval)
    {
        rval[x] /= totalSum;
    }

    // last value should always be exactly 1
    rval[rval.length-1] = 1.0;

    return rval;
}

// generates a random value, between 0 and valueProbabilities.length-1, where each possible value's chance of
// being generated is listed in the corresponding array entry
function randomWithProbabilities(valueProbabilities)
{
    let randomVal = randomFloat(0.0, 1.0);
    let cdf = makeCDF(valueProbabilities);

    //console.log("" + cdf);
    var x;
    for (x in cdf)
    {
        if (randomVal < cdf[x])
        {
            return x;
        }
    }
    return cdf.length-1;
}

function mapFooter(length)
{
    let rval = "";

    for (var x = 0; x < length; x++)
    {
        rval += "=";
        rval += padStringToLength(""+(x+1), 3, '-');
    }

    return rval;
}

function mapHeader(length)
{
    let rval = "";

    for (var x = 0; x < length; x++)
    {
        rval += "=---";
    }

    return rval;
}