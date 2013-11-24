define(['tools'], function (tools) {
    var Gardians = function (data) {
        this.gardians = data.gardians;
        this.numberOfGardians = this.gardians.length;
    };

    Gardians.prototype.getRandomGardian = function () {
        var index = tools.getRandomInt(0, this.numberOfGardians - 1);
        return this.gardians[index];
    };

    return Gardians;
});
