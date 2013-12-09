define(['tools'], function (tools) {
    var Riddles = function (riddles) {
        this.riddles = riddles;
        this.count = 0;
        this.numberOfRiddles = riddles.length;
    };

    Riddles.prototype.getRandomRiddle = function () {

        if (this.count == this.numberOfRiddles) {
            // re-shuffle all riddles if we displayed them all
            tools.shuffleArray(this.riddles);
            this.count = 0;
        }
        return this.riddles[this.count++];
    }

    return Riddles;
});
