define(['tools'], function (tools) {
    var Riddles = function (riddles) {
        this.riddles = riddles;

        this.givenRiddles = [];
        this.numberOfRiddles = riddles.length;
    };

    Riddles.prototype.getRandomRiddle = function () {
        if (this.givenRiddles.length == this.numberOfRiddles) {
            // All Riddles where given, start from scratch again.
            this.givenRiddles = [];
        }

        var index = tools.getRandomInt(0, this.numberOfRiddles - 1);
        while (this.givenRiddles.indexOf(index) != -1) {
            index = tools.getRandomInt(0, this.numberOfRiddles - 1);
        }
        this.givenRiddles.push(index);
        return this.riddles[index];
    }

    return Riddles;
});
