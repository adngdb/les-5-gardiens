define(function () {
    var ResourceManager = function () {
        this.resMan = {};
    };

    ResourceManager.prototype.getResMan = function () {
        return this.resMan;
    };

    ResourceManager.prototype.loadAll = function () {

        // build unitary cube
        this.resMan['cube'] = new THREE.CubeGeometry( this.resMan['cube_size'], this.resMan['cube_size'], this.resMan['cube_size'] );

        // floor mesh
        var maxAnisotropy = this.resMan['renderer'].getMaxAnisotropy();
        var texture = THREE.ImageUtils.loadTexture( "img/ground_1-1.png" );
        var material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } );
        texture.anisotropy = maxAnisotropy;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.resMan['mat_floor'] = material;
        //this.resMan['mesh_floor'] = new THREE.Mesh( this.resMan['cube'], material1 );

        // roof mesh
        texture = THREE.ImageUtils.loadTexture( "img/roof_1-1.png" );
        material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } );
        texture.anisotropy = maxAnisotropy;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.resMan['mat_roof'] = material;
        //this.resMan['mesh_roof'] = new THREE.Mesh( this.resMan['cube'], material );

        // wall mesh
        texture = THREE.ImageUtils.loadTexture( "img/wall_1-1.png" );
        material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } );
        texture.anisotropy = maxAnisotropy;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.resMan['mat_wall'] = material;
        //this.resMan['mesh_wall'] = new THREE.Mesh( this.resMan['cube'], material );

        // door
        texture = THREE.ImageUtils.loadTexture( "img/door_1-1.png" );
        material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } );
        texture.anisotropy = maxAnisotropy;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.resMan['mat_door'] = material;
        //this.resMan['mesh_wall'] = new THREE.Mesh( this.resMan['cube'], material );

        // door geom
        this.resMan['door_geom'] = new THREE.PlaneGeometry( 100, 200 );

        // door material
        texture = THREE.ImageUtils.loadTexture( "img/door_1-1.png" );
        material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture, transparent: true } );
        texture.anisotropy = maxAnisotropy;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.resMan['mat_door'] = material;

        // light geom
        this.resMan['light_geom'] = new THREE.PlaneGeometry( 50, 50 );

        // light material
         // var lightTexture = THREE.ImageUtils.loadTexture( 'img/light_1-1.png' );
         // var lightMaterial = new THREE.SpriteMaterial( { map: lightTexture, useScreenCoordinates: false, color: 0xffffff } );
         // this.resMan['mat_light2'] = lightMaterial;

        texture = THREE.ImageUtils.loadTexture( "img/light_1-1.png" );
        material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture, transparent: true } );
        texture.anisotropy = maxAnisotropy;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.resMan['mat_light'] = material;

        // pnj
        this.resMan['pnj_geom'] = new THREE.PlaneGeometry( 60, 120 );

        texture = THREE.ImageUtils.loadTexture( "img/cerberus_01.png" );
        material = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false, color: 0xffffff } );
        texture.anisotropy = maxAnisotropy;
        this.resMan['mat_cerberus1'] = material;

        texture = THREE.ImageUtils.loadTexture( "img/cerberus_01.png" );
        material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture, transparent: true } );
        texture.anisotropy = maxAnisotropy;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.resMan['mat_cerberus11'] = material;

        texture = THREE.ImageUtils.loadTexture( "img/cerberus_02.png" );
        material = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false, color: 0xffffff } );
        texture.anisotropy = maxAnisotropy;
        this.resMan['mat_cerberus2'] = material;

        texture = THREE.ImageUtils.loadTexture( "img/cerberus_03.png" );
        material = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false, color: 0xffffff } );
        texture.anisotropy = maxAnisotropy;
        this.resMan['mat_cerberus3'] = material;

        texture = THREE.ImageUtils.loadTexture( "img/cerberus_04.png" );
        material = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false, color: 0xffffff } );
        texture.anisotropy = maxAnisotropy;
        this.resMan['mat_cerberus4'] = material;
    };

    return ResourceManager;
});
