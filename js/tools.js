define(function () {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function shuffleArray(list) {
        var i, j, t;
        for (i = 1; i < list.length; i++) {
            j = Math.floor(Math.random()*(1+i));
            if (j != i) {
                t = list[i];
                list[i] = list[j];
                list[j] = t;
            }
        }
    }

    function isBetween(val, min, max) {
        return (val >= min && val <= max)
    }

    return {
        'getRandomInt': getRandomInt,
        'shuffleArray': shuffleArray,
        'isBetween' : isBetween
    }
});
