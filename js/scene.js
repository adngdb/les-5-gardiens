define(['lib/three', 'lib/FirstPersonControls'], function (three, first_person_controls) {
    var Scene = function (level) {
        this.level = level;
    };

    Scene.prototype.init = function () {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 200;

        this.controls = new THREE.FirstPersonControls( this.camera );

        this.controls.movementSpeed = 200;
        this.controls.lookSpeed = 1;
        this.controls.noFly = true;
        this.controls.lookVertical = true;
        this.controls.activeLook = true;
        this.controls.mouseDragOn = true;

        this.scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
        this.scene.add( new THREE.AmbientLight( 0xffffff ) );

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setClearColor( 0x000000, 1 );

        this.resourceManager = {};

        // build unitary cube
        this.resourceManager['cube'] = new THREE.CubeGeometry( 200, 200, 200 );

        // floor mesh
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        var texture1 = THREE.ImageUtils.loadTexture( "img/ground_1-1.png" );
        var material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );
        texture1.anisotropy = maxAnisotropy;
        texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
        texture1.repeat.set( 1, 1 );
        this.resourceManager['mat_floor'] = material1;
        this.resourceManager['mesh_floor'] = new THREE.Mesh( this.resourceManager['cube'], material1 );

        // roof mesh
        var texture2 = THREE.ImageUtils.loadTexture( "img/roof_1-1.png" );
        var material2 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture2 } );
        texture2.anisotropy = maxAnisotropy;
        texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
        texture2.repeat.set( 1, 1 );
        this.resourceManager['mat_roof'] = material2;
        this.resourceManager['mesh_roof'] = new THREE.Mesh( this.resourceManager['cube'], material2 );

        // wall mesh
        var texture3 = THREE.ImageUtils.loadTexture( "img/wall_1-1.png" );
        var material3 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture3 } );
        texture3.anisotropy = maxAnisotropy;
        texture3.wrapS = texture3.wrapT = THREE.RepeatWrapping;
        texture3.repeat.set( 1, 1 );
        this.resourceManager['mat_wall'] = material3;
        this.resourceManager['mesh_wall'] = new THREE.Mesh( this.resourceManager['cube'], material3 );

        for (var i = 0; i < this.level.height; ++i) {
            for (var j = 0; j < this.level.width; ++j) {
                // floor
                //var mesh = this.resourceManager['mesh_floor'];
                var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_floor'] );
                mesh.position.x = i * 200;
                mesh.position.z = j * 200;
                mesh.position.y = -200;
                this.scene.add( mesh );

                // wall
                if (this.level.map[i][j]) {
                    // geometry = new THREE.CubeGeometry( 200, 200, 200 );
                    // material = new THREE.MeshBasicMaterial({
                    //     color: 0xff0000 + i * (255 / this.level.height) + j * (255/this.level.width) * 256,
                    //     wireframe: false
                    // });
                    //var mesh = this.resourceManager['mesh_wall'];
                    var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_wall'] );
                    mesh.position.x = i*200;
                    mesh.position.z = j*200;
                    this.scene.add( mesh );
                }

                // roof
                //var mesh = this.resourceManager['mesh_roof'];
                var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_roof'] );
                mesh.position.x = i*200;
                mesh.position.z = j*200;
                mesh.position.y = 200;
                this.scene.add( mesh );
            };
        };

        document.body.appendChild( this.renderer.domElement );

        this.animate();
    };

    Scene.prototype.animate = function () {
        requestAnimationFrame( this.animate.bind(this) );

        var SavePosX = this.camera.position.x;
        var SavePosZ = this.camera.position.z;
        this.controls.update(1.0);

        var NewIndI = Math.round(this.camera.position.x / 200.0);
        var NewIndJ = Math.round(this.camera.position.z / 200.0);

        // console.log("indice : " + NewIndI + " , " + NewIndJ);
        if (NewIndI < 0 || NewIndI >= this.level.height || NewIndJ < 0 || NewIndJ >= this.level.width || this.level.map[NewIndI][NewIndJ]) {// invalid movement : restore previous position
            this.camera.position.x = SavePosX;
            this.camera.position.z = SavePosZ;
            // console.log("reset position");

        }
        this.camera.position.y = 0;

        this.render();
    };

    Scene.prototype.render = function () {

        this.renderer.render( this.scene, this.camera );
        // console.log("camera.position.x : "+camera.position.x);
        // console.log("camera.position.y : "+camera.position.y);
        // console.log("camera.position.z : "+camera.position.z);
    };

    return Scene;
});
