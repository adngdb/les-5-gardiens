define(function () {
    var ResourceManager = function () {
        this.resMan = {};
    };

    ResourceManager.prototype.getResMan = function () {
        return this.resMan;
    };

    ResourceManager.prototype.loadPhongMat = function (file, name, transparent=false) {
        var texture = THREE.ImageUtils.loadTexture( file );
        var material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture, transparent: transparent} );
        texture.anisotropy = this.maxAnisotropy;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.resMan[name] = material;
    };

    ResourceManager.prototype.loadSprite = function (file, name) {
        var texture = THREE.ImageUtils.loadTexture( file );
        var material = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false, color: 0xffffff } );
        texture.anisotropy = this.maxAnisotropy;
        this.resMan[name] = material;
    };

    ResourceManager.prototype.loadAll = function () {

        this.maxAnisotropy = this.resMan['renderer'].getMaxAnisotropy();

        // build unitary cube
        this.resMan['cube'] = new THREE.CubeGeometry( this.resMan['cube_size'], this.resMan['cube_size'], this.resMan['cube_size'] );
        // door geom
        this.resMan['door_geom'] = new THREE.PlaneGeometry( 100, 200 );
        // light geom
        this.resMan['light_geom'] = new THREE.PlaneGeometry( 50, 50 );
        // pnj
        this.resMan['pnj_geom'] = new THREE.PlaneGeometry( 60, 120 );
        // floor, door geom
        this.resMan['quad_geom'] = new THREE.PlaneGeometry( 200, 200 );

        var namesTex = [ "img/ground_1-1.png", "img/roof_1-1.png", "img/wall_1-1.png",
        "img/door_1-1.png", "img/light_1-1.png", "img/curtains_1-1.png", "img/door_nextlevel.png", "img/wall_deco_01.png",
        "img/wall_deco_02.png", "img/wall_deco_03.png", "img/wall_deco_04.png"];
        var namesMat = [ "mat_floor", "mat_roof", "mat_wall", "mat_door", "mat_light", "mat_curtain",
        "mat_deco0", "mat_deco1", "mat_deco2", "mat_deco3", "mat_deco4"];
        var transparentFlag = [ false, false, false, true, true, true, true, true, true, true, true ];
        for(var i=0; i<namesTex.length; ++i) {
            this.loadPhongMat(namesTex[i], namesMat[i], transparentFlag[i]);
        }
        this.resMan["mat_curtain"].side = THREE.DoubleSide;

        for(var i=0; i<4; ++i) {
            var j = i+1;
            this.loadSprite("img/cerberus_0"+j+".png", "mat_cerberus"+i);
            this.loadSprite("img/janus_0"+j+".png", "mat_janus"+i);
            this.loadSprite("img/presentateur_0"+j+".png", "mat_presentateur"+i);
            this.loadSprite("img/pythie_0"+j+".png", "mat_pythie"+i);
            this.loadSprite("img/sphynx_0"+j+".png", "mat_sphynx"+i);
        }

        var names = [ "cerberus", "janus", "presentateur", "pythie", "sphynx"];
        var arrowsNames = [ "left", "right", "top", "down", "question"];
        for(var id=0; id < names.length; ++id) {
            for(var idArrows=0; idArrows < arrowsNames.length; ++idArrows) {
                this.loadSprite("img/"+names[id]+"_arrows_"+arrowsNames[idArrows]+".png", "mat_"+names[id]+"_"+arrowsNames[idArrows]);
                this.loadPhongMat("img/"+names[id]+"_arrows_"+arrowsNames[idArrows]+".png", "mat_tex_"+names[id]+"_"+arrowsNames[idArrows], true);
            }
        }
        this.loadPhongMat("img/ground_arrow.png", "mat_tex_arrow", true);
        this.loadPhongMat("img/ground_point.png", "mat_tex_point", true);

    };

    return ResourceManager;
});
