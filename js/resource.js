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
        var texture2 = THREE.ImageUtils.loadTexture( "img/roof_1-1.png" );
        var material2 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture2 } );
        texture2.anisotropy = maxAnisotropy;
        texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
        texture2.repeat.set( 1, 1 );
        this.resMan['mat_roof'] = material2;
        //this.resMan['mesh_roof'] = new THREE.Mesh( this.resMan['cube'], material2 );

        // wall mesh
        var texture3 = THREE.ImageUtils.loadTexture( "img/wall_1-1.png" );
        var material3 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture3 } );
        texture3.anisotropy = maxAnisotropy;
        texture3.wrapS = texture3.wrapT = THREE.RepeatWrapping;
        texture3.repeat.set( 1, 1 );
        this.resMan['mat_wall'] = material3;
        //this.resMan['mesh_wall'] = new THREE.Mesh( this.resMan['cube'], material3 );

        // door
        var texture4 = THREE.ImageUtils.loadTexture( "img/door_1-1.png" );
        var material4 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture4 } );
        texture4.anisotropy = maxAnisotropy;
        texture4.wrapS = texture4.wrapT = THREE.RepeatWrapping;
        texture4.repeat.set( 1, 1 );
        this.resMan['mat_door'] = material4;
        //this.resMan['mesh_wall'] = new THREE.Mesh( this.resMan['cube'], material4 );

        // door geom
        this.resMan['door_geom'] = new THREE.PlaneGeometry( 50, 50 );

        // door material

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
        texture = THREE.ImageUtils.loadTexture( "img/cerberus_01.png" );
        material = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false, color: 0xffffff } );
        //texture.anisotropy = maxAnisotropy;
        this.resMan['mat_cerberus1'] = material;
    };

    return ResourceManager;
});
