define(function () {
    var Gardians = function (data) {
        this.gardians = data.gardians;
    };

    Gardians.prototype.getRandomGardian = function () {
        return this.gardians[0];
    };

    return Gardians;
});
